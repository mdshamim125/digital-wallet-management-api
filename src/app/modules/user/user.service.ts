import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { Wallet } from "../wallet/wallet.model";
import { AgentStatus, IAuthProvider, IUser } from "./user.interface";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
// import mongoose from "mongoose";
import httpStatus from "http-status-codes";

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

export const UserServices = {
  createUser,
};
