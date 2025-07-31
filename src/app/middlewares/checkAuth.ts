import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { verifyToken } from "../utils/jwt";
import { User } from "../modules/user/user.model";
import httpStatus from "http-status-codes";
import { AgentStatus, UserStatus } from "../modules/user/user.interface";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization;

      if (!accessToken) {
        throw new AppError(httpStatus.FORBIDDEN, "No Token Received");
      }

      const verifiedToken = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

      if (!verifiedToken) {
        throw new AppError(httpStatus.FORBIDDEN, "Invalid Token");
      }

      if (!verifiedToken.email) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email not found in token");
      }

      const isUserExist = await User.findOne({ email: verifiedToken.email });

      if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
      }

      if (isUserExist.userStatus === UserStatus.BLOCKED) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `User is ${isUserExist.userStatus}`
        );
      }

      if (
        isUserExist.agentStatus === AgentStatus.SUSPENDED &&
        verifiedToken.role === "agent"
      ) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `User is ${isUserExist.agentStatus}`
        );
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(403, "You are not permitted to view this route!!!");
      }
      req.user = verifiedToken;
      next();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log("jwt error", error);
      next(error);
    }
  };
