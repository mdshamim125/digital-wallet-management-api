import { Schema, model } from "mongoose";
import { IWallet, WalletStatus } from "./wallet.interface"; // Adjust path as needed

const walletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One wallet per user
    },
    balance: {
      type: Number,
      required: true,
      default: 50,
    },
    status: {
      type: String,
      enum: Object.values(WalletStatus),
      default: WalletStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Wallet = model<IWallet>("Wallet", walletSchema);
