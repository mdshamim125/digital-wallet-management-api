import { Schema, model } from "mongoose";
import {
  ITransaction,
  TransactionStatus,
  TransactionType,
} from "./transaction.interface";

const transactionSchema = new Schema<ITransaction>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: false,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: false,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be a positive number"],
    },
    // fee: {
    //   type: Number,
    //   default: 0,
    // },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    bankAccount: {
      type: String,
      required: function (this: ITransaction) {
        return (
          this.type === TransactionType.BANK_TOP_UP ||
          this.type === TransactionType.BANK_WITHDRAW
        );
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema
);
