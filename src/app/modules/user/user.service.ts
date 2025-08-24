/* eslint-disable @typescript-eslint/no-explicit-any */

import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import {
  AgentStatus,
  IAuthProvider,
  IUser,
  UpdateUserPayload,
  UserStatus,
} from "./user.interface";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { WalletStatus } from "../wallet/wallet.interface";
import { JwtPayload } from "jsonwebtoken";
import { Transaction } from "../transaction/transaction.model";
import { Wallet } from "../wallet/wallet.model";
import mongoose from "mongoose";

const createUser = async (payload: Partial<IUser>) => {
  const session = await User.startSession();

  try {
    session.startTransaction();

    const { email, password, role, ...rest } = payload;

    const isUserExist = await User.findOne({ email }).session(session);
    if (isUserExist) {
      throw new AppError(httpStatus.BAD_REQUEST, "User already exists");
    }

    const hashedPassword = await bcryptjs.hash(
      password as string,
      Number(envVars.BCRYPT_SALT_ROUND)
    );

    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: email as string,
    };

    const user = await User.create(
      [
        {
          email,
          password: hashedPassword,
          role: role ?? "user",
          agentStatus:
            role === "user" ? AgentStatus.SUSPENDED : AgentStatus.APPROVED,
          auths: [authProvider],
          ...rest,
        },
      ],
      { session }
    );

    await Wallet.create(
      [
        {
          user: user[0]._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return user[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const updateStatus = async (id: string, payload: JwtPayload) => {
  if (!id || !payload) {
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required parameters");
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role === "user" && !payload.status) {
    if (
      payload.userStatus !== UserStatus.ACTIVE &&
      payload.userStatus !== UserStatus.BLOCKED
    ) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid user status");
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { userStatus: payload.userStatus },
      { new: true }
    );
    return updatedUser;
  }

  if (user.role === "agent" && !payload.status) {
    if (
      payload.agentStatus !== AgentStatus.APPROVED &&
      payload.agentStatus !== AgentStatus.SUSPENDED
    ) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid agent status");
    }

    const updatedAgent = await User.findByIdAndUpdate(
      id,
      { agentStatus: payload.agentStatus },
      { new: true }
    );
    return updatedAgent;
  }

  // Assume 'wallet' role or other
  if (
    payload.status !== WalletStatus.ACTIVE &&
    payload.status !== WalletStatus.BLOCKED
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid wallet status");
  }

  const updatedWallet = await Wallet.findOneAndUpdate(
    { user: id },
    { status: payload.status },
    { new: true }
  );
  return updatedWallet;
};

const getAllUsers = async () => {
  const users = await User.find().select("-password -auths");
  if (!users || users.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No users found");
  }
  return users;
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const getSingleUser = async (email: string) => {
  const user = await User.findOne({ email })
    .select("_id name role email")
    .lean(); // returns plain JS object, not mongoose document

  if (user) {
    return {
      data: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    };
  }
};

const updateMe = async (
  payload: UpdateUserPayload,
  decodedToken: JwtPayload
) => {
  const user = await User.findOne({ email: decodedToken.email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // console.log(payload);
  // If password is being changed
  if (payload.password) {
    if (!payload.oldPassword) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Old password is required to change password"
      );
    }

    const isOldPasswordMatch = await bcryptjs.compare(
      payload.oldPassword,
      user.password
    );
    if (!isOldPasswordMatch) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Old Password does not match"
      );
    }

    // Hash the new password
    user.password = await bcryptjs.hash(
      payload.password,
      Number(envVars.BCRYPT_SALT_ROUND)
    );
  }

  // Update other fields
  Object.keys(payload).forEach((key) => {
    if (key !== "password" && key !== "oldPassword") {
      (user as any)[key] = (payload as any)[key];
    }
  });

  await user.save();
  return user;
};

const getUserDashboard = async (userId: string) => {
  const objectId = new mongoose.Types.ObjectId(userId);

  // Get wallet
  const wallet = await Wallet.findOne({ user: objectId });
  // console.log("Wallet:", wallet);

  // Get recent transactions
  const transactions = await Transaction.find({
    $or: [{ from: objectId }, { to: objectId }],
  })
    .sort({ createdAt: -1 })
    .limit(10);

  // console.log("transactions:", transactions);

  const quickActions = [
    { label: "Deposit Money", action: "/user/deposit" },
    { label: "Send Money", action: "/user/send-money" },
    { label: "Withdraw", action: "/user/withdraw" },
  ];

  return {
    walletBalance: wallet ? wallet.balance : 0,
    quickActions,
    recentTransactions: transactions,
  };
};

export const UserServices = {
  createUser,
  updateStatus,
  getAllUsers,
  getMe,
  getSingleUser,
  updateMe,
  getUserDashboard,
};
