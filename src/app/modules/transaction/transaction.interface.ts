import { Types } from "mongoose";

export enum TransactionType {
  ADD_MONEY = "add_money",
  WITHDRAW = "withdraw",
  SEND_MONEY = "send_money",
  CASH_IN = "cash_in",
  CASH_OUT = "cash_out",
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface ITransaction {
  from?: Types.ObjectId;
  to?: Types.ObjectId;
  amount: number;
  fee?: number;
  type: TransactionType;
  status: TransactionStatus;
}
