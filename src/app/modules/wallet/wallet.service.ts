import AppError from "../../errorHelpers/AppError";
import { Wallet } from "./wallet.model";
import httpStatus from "http-status-codes";

const getWallets = async () => {
  const wallets = await Wallet.find().select("-password");
  if (!wallets || wallets.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No wallets found");
  }
  return wallets;
};

export const WalletServices = {
  getWallets,
};
