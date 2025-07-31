/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { TransactionServices } from "./transaction.service";

const getAllTransactions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const transactions = await TransactionServices.getAllTransactions();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Transactions fetched successfully",
      data: transactions,
    });
  }
);

const cashIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, amount } = req.body;
    const agentId = req.user.userId; // assuming you extract agent info from token
    const result = await TransactionServices.cashIn(agentId, id, amount);
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
    const result = await TransactionServices.cashOut(agentId, id, amount);
    res
      .status(200)
      .json({ success: true, message: "Cash-out successful", data: result });
  }
);

const withdrawMoneyByUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: agentId, amount } = req.body;
    const userId = req.user.userId;
    const result = await TransactionServices.withdrawMoneyByUser(
      userId,
      agentId,
      amount
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Withdrawal successful",
      data: result,
    });
  }
);

const sendMoney = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: to, amount } = req.body;
    const from = req.user.userId;
    const result = await TransactionServices.sendMoney(from, to, amount);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Money sent successfully",
      data: result,
    });
  }
);

const addMoneyByUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: from, amount } = req.body;
    const userId = req.user.userId;
    const result = await TransactionServices.addMoneyByUser(
      userId,
      from,
      amount
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Money added successfully",
      data: result,
    });
  }
);

const getTransactionHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const transactions = await TransactionServices.getTransactionHistory(
      userId
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Transaction history fetched successfully",
      data: transactions,
    });
  }
);

export const TransactionControllers = {
  cashIn,
  cashOut,
  getAllTransactions,
  withdrawMoneyByUser,
  sendMoney,
  getTransactionHistory,
  addMoneyByUser,
};
