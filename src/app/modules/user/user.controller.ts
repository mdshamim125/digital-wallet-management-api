/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { UserServices } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";

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

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await UserServices.getMe(decodedToken.userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Your profile Retrieved Successfully",
      data: result.data,
    });
  }
);

const getSingleUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.email;
    const result = await UserServices.getSingleUser(id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Retrieved Successfully",
      data: result?.data || null,
    });
  }
);

const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const verifiedToken = req.user;

    const payload = req.body;
    const user = await UserServices.updateMe(
      payload,
      verifiedToken as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User Updated Successfully",
      data: user,
    });
  }
);

export const UserControllers = {
  createUser,
  updateStatus,
  getAllUsers,
  getMe,
  getSingleUser,
  updateMe,
};
