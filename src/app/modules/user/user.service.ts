import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { Wallet } from "../wallet/wallet.model";
import {
  AgentStatus,
  IAuthProvider,
  IUser,
  UserStatus,
} from "./user.interface";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
// import mongoose from "mongoose";
import httpStatus from "http-status-codes";
import { WalletStatus } from "../wallet/wallet.interface";
import { JwtPayload } from "jsonwebtoken";
import { Transaction } from "../transaction/transaction.model";
import {
  TransactionStatus,
  TransactionType,
} from "../transaction/transaction.interface";

const createUser = async (payload: Partial<IUser>) => {
  const session = await User.startSession();

  try {
    session.startTransaction();

    const { email, password, ...rest } = payload;

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
          agentStatus: AgentStatus.SUSPENDED,
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
  const users = await User.find().select("-password");
  if (!users || users.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No users found");
  }
  return users;
};

const getWallets = async () => {
  const wallets = await Wallet.find().select("-password");
  if (!wallets || wallets.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No wallets found");
  }
  return wallets;
};

const cashIn = async (agentId: string, userId: string, amount: number) => {
  if (!agentId || !userId || amount === undefined) {
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required parameters");
  }

  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");
  }

  if (agentId === userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent cannot cash in to themselves"
    );
  }

  const agent = await User.findById(agentId);
  if (!agent || agent.role !== "agent") {
    throw new AppError(httpStatus.NOT_FOUND, "Agent not found or invalid role");
  }

  if (agent.agentStatus !== AgentStatus.APPROVED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent is not approved for cash-in"
    );
  }

  const user = await User.findById(userId);
  if (!user || user.role !== "user") {
    throw new AppError(httpStatus.NOT_FOUND, "User not found or invalid role");
  }

  if (user.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "User is not active for cash-in");
  }

  const agentWallet = await Wallet.findOne({ user: agentId });
  const userWallet = await Wallet.findOne({ user: userId });

  if (!agentWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");
  }

  if (agentWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "Agent wallet is not active");
  }

  if (!userWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");
  }

  if (userWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "User wallet is not active");
  }

  if (agentWallet.balance < amount) {
    throw new AppError(httpStatus.BAD_REQUEST, "Insufficient agent balance");
  }

  // Update balances
  agentWallet.balance -= amount;
  userWallet.balance += amount;

  await Promise.all([agentWallet.save(), userWallet.save()]);

  // Create transaction record
  const transaction = await Transaction.create({
    from: agentId,
    to: userId,
    amount,
    type: TransactionType.CASH_IN,
    status: TransactionStatus.COMPLETED,
  });

  return transaction;
};

const cashOut = async (agentId: string, userId: string, amount: number) => {
  if (amount <= 0) throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
  if (!agentId || !userId)
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required parameters");
  if (agentId === userId)
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent cannot cash out to themselves"
    );

  const user = await User.findById(userId);
  const agent = await User.findById(agentId);

  if (!user || user.role !== "user") {
    throw new AppError(httpStatus.NOT_FOUND, "User not found or invalid role");
  }
  if (user.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "User is not active for cash-out");
  }

  if (!agent || agent.role !== "agent") {
    throw new AppError(httpStatus.NOT_FOUND, "Agent not found or invalid role");
  }
  if (agent.agentStatus !== AgentStatus.APPROVED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent is not approved for cash-out"
    );
  }

  const userWallet = await Wallet.findOne({ user: userId });
  const agentWallet = await Wallet.findOne({ user: agentId });

  if (!userWallet || userWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User wallet not found or inactive"
    );
  }
  if (!agentWallet || agentWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Agent wallet not found or inactive"
    );
  }

  // Calculate service charge: 20 Taka per 1000
  const fee = (amount / 1000) * 20;
  const totalDeduction = amount + fee;

  if (userWallet.balance < totalDeduction) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Insufficient balance for cash-out and service charge"
    );
  }

  // Deduct from user's wallet
  userWallet.balance -= totalDeduction;
  await userWallet.save();

  // Credit to agent's wallet
  agentWallet.balance += amount;
  await agentWallet.save();

  // Record the transaction
  const transaction = await Transaction.create({
    from: userId,
    to: agentId,
    amount,
    type: TransactionType.CASH_OUT,
    status: TransactionStatus.COMPLETED,
    timestamp: new Date(),
  });

  return transaction;
};

export const UserServices = {
  createUser,
  updateStatus,
  getAllUsers,
  getWallets,
  cashIn,
  cashOut,
};
