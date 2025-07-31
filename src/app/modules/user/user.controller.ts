/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { UserServices } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.createUser(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Created Successfully",
      data: user,
    });
  }
);

const updateStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // const { target, action } = req.body;

    const result = await UserServices.updateStatus(id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `status updated successfully`,
      data: result,
    });
  }
);

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await UserServices.getAllUsers();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Users fetched successfully",
      data: users,
    });
  }
);

const getWallets = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const wallets = await UserServices.getWallets();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallets fetched successfully",
      data: wallets,
    });
  }
);

const cashIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, amount } = req.body;
    const agentId = req.user.userId; // assuming you extract agent info from token
    const result = await UserServices.cashIn(agentId, id, amount);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Cash-in successful,",
      data: result,
    });
  }
);

const cashOut = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, amount } = req.body;
    const agentId = req.user.userId;
    const result = await UserServices.cashOut(agentId, id, amount);
    res
      .status(200)
      .json({ success: true, message: "Cash-out successful", data: result });
  }
);

export const UserControllers = {
  createUser,
  updateStatus,
  getAllUsers,
  getWallets,
  cashIn,
  cashOut,
};
