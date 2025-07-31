/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { WalletServices } from "./wallet.service";

const getWallets = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const wallets = await WalletServices.getWallets();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallets fetched successfully",
      data: wallets,
    });
  }
);

export const WalletControllers = {
  getWallets,
};
