import { Types } from "mongoose";

export enum TransactionType {
  ADD_MONEY = "add_money", // Wallet top-up via system/agent
  WITHDRAW = "withdraw", // Wallet withdrawal
  SEND_MONEY = "send_money", // User → User
  CASH_IN = "cash_in", // Agent → User
  CASH_OUT = "cash_out", // User → Agent

  BANK_TOP_UP = "bank_top_up", // From bank to wallet
  BANK_WITHDRAW = "bank_withdraw", // From wallet to bank
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface ITransaction {
  from?: Types.ObjectId; // wallet or agent (nullable in bank_top_up)
  to?: Types.ObjectId; // wallet or agent (nullable in bank_withdraw)
  amount: number;
  // fee?: number;
  type: TransactionType;
  status: TransactionStatus;
  timestamp?: Date;
  bankAccount?: string; // e.g., IBAN / Bank Number for BANK_TOP_UP / BANK_WITHDRAW
}
