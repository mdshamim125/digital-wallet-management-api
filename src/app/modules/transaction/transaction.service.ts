/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errorHelpers/AppError";
import { Wallet } from "../wallet/wallet.model";
import httpStatus from "http-status-codes";
import { WalletStatus } from "../wallet/wallet.interface";
import { Transaction } from "../transaction/transaction.model";
import {
  TransactionStatus,
  TransactionType,
} from "../transaction/transaction.interface";
import { User } from "../user/user.model";
import { AgentStatus, UserStatus } from "../user/user.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";

const cashIn = async (agentId: string, userId: string, amount: number) => {
  if (!agentId || !userId || amount === undefined) {
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required parameters");
  }

  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");
  }

  if (agentId === userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent cannot cash in to themselves"
    );
  }

  const agent = await User.findById(agentId);
  if (!agent || agent.role !== "agent") {
    throw new AppError(httpStatus.NOT_FOUND, "Agent not found or invalid role");
  }

  if (agent.agentStatus !== AgentStatus.APPROVED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent is not approved for cash-in"
    );
  }

  const user = await User.findById(userId);
  if (!user || user.role !== "user") {
    throw new AppError(httpStatus.NOT_FOUND, "User not found or invalid role");
  }

  if (user.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "User is not active for cash-in");
  }

  const agentWallet = await Wallet.findOne({ user: agentId });
  const userWallet = await Wallet.findOne({ user: userId });

  if (!agentWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");
  }

  if (agentWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "Agent wallet is not active");
  }

  if (!userWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");
  }

  if (userWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "User wallet is not active");
  }

  if (agentWallet.balance < amount) {
    throw new AppError(httpStatus.BAD_REQUEST, "Insufficient agent balance");
  }

  // Update balances
  agentWallet.balance -= amount;
  userWallet.balance += amount;

  await Promise.all([agentWallet.save(), userWallet.save()]);

  // Create transaction record
  const transaction = await Transaction.create({
    from: agentId,
    to: userId,
    amount,
    type: TransactionType.CASH_IN,
    status: TransactionStatus.COMPLETED,
  });

  return transaction;
};

const cashOut = async (agentId: string, userId: string, amount: number) => {
  if (amount <= 0) throw new AppError(httpStatus.BAD_REQUEST, "Invalid amount");
  if (!agentId || !userId)
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required parameters");
  if (agentId === userId)
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent cannot cash out to themselves"
    );

  const user = await User.findById(userId);
  const agent = await User.findById(agentId);

  if (!user || user.role !== "user") {
    throw new AppError(httpStatus.NOT_FOUND, "User not found or invalid role");
  }
  if (user.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "User is not active for cash-out");
  }

  if (!agent || agent.role !== "agent") {
    throw new AppError(httpStatus.NOT_FOUND, "Agent not found or invalid role");
  }
  if (agent.agentStatus !== AgentStatus.APPROVED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent is not approved for cash-out"
    );
  }

  const userWallet = await Wallet.findOne({ user: userId });
  const agentWallet = await Wallet.findOne({ user: agentId });

  if (!userWallet || userWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User wallet not found or inactive"
    );
  }
  if (!agentWallet || agentWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Agent wallet not found or inactive"
    );
  }

  // Calculate service charge: 20 Taka per 1000
  const fee = (amount / 1000) * 20;
  const totalDeduction = amount + fee;

  if (userWallet.balance < totalDeduction) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Insufficient balance for cash-out and service charge"
    );
  }

  // Deduct from user's wallet
  userWallet.balance -= totalDeduction;
  await userWallet.save();

  // Credit to agent's wallet
  agentWallet.balance += amount;
  await agentWallet.save();

  // Record the transaction
  const transaction = await Transaction.create({
    from: userId,
    to: agentId,
    amount,
    fee,
    type: TransactionType.CASH_OUT,
    status: TransactionStatus.COMPLETED,
    timestamp: new Date(),
  });

  return transaction;
};
//admin
export const getAllTransactions = async (query: Record<string, string>) => {
  // Initialize the query builder
  const qb = new QueryBuilder(Transaction.find(), query);

  // Build the query: filter, search, sort, paginate
  qb.filter()
    .search(["from", "to", "type", "status", "amount", "fee"])
    .sort()
    .paginate();

  // Execute the query
  const transactions = await qb.build();

  // Get pagination meta
  const meta = await qb.getMeta();

  // // Throw error if no transactions
  // if (!transactions || transactions.length === 0) {
  //   throw new AppError("No transactions found", 404);
  // }

  return { data: transactions, meta };
};

const withdrawMoneyByUser = async (
  userId: string,
  agentId: string,
  amount: number
) => {
  // console.log(userId, agentId, amount);
  if (!userId || !agentId || amount === undefined) {
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required parameters");
  }

  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");
  }

  const user = await User.findById(userId);
  if (!user || user.role !== "user") {
    throw new AppError(httpStatus.NOT_FOUND, "User not found or invalid role");
  }

  if (user.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "User is not active for withdrawal"
    );
  }

  const agent = await User.findById(agentId);
  if (!agent || agent.role !== "agent") {
    throw new AppError(httpStatus.NOT_FOUND, "Agent not found or invalid role");
  }

  if (agent.agentStatus !== AgentStatus.APPROVED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent is not approved for withdrawal"
    );
  }

  const userWallet = await Wallet.findOne({ user: userId });
  const agentWallet = await Wallet.findOne({ user: agentId });

  if (!userWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");
  }

  if (userWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "User wallet is not active");
  }

  if (!agentWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");
  }

  if (agentWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "Agent wallet is not active");
  }

  if (userWallet.balance < amount) {
    throw new AppError(httpStatus.BAD_REQUEST, "Insufficient user balance");
  }

  // Update balances
  const fee = (amount / 1000) * 20; // 20 Taka per 1000
  const totalDeduction = amount + fee;
  if (userWallet.balance < totalDeduction) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Insufficient balance for withdrawal and service charge"
    );
  }
  userWallet.balance -= totalDeduction;
  agentWallet.balance += amount;

  await Promise.all([userWallet.save(), agentWallet.save()]);

  // Create transaction record
  const transaction = await Transaction.create({
    from: userId,
    to: agentId,
    amount,
    fee,
    type: TransactionType.WITHDRAW,
    status: TransactionStatus.COMPLETED,
  });

  return transaction;
};

const addMoneyByUser = async (
  userId: string,
  agentId: string,
  amount: number
) => {
  if (!userId || !agentId || amount === undefined) {
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required parameters");
  }
  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");
  }
  if (userId === agentId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "User cannot add money to themselves"
    );
  }
  const user = await User.findById(userId);
  if (!user || user.role !== "user") {
    throw new AppError(httpStatus.NOT_FOUND, "User not found or invalid role");
  }
  if (user.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "User is not active for adding money"
    );
  }
  const agent = await User.findById(agentId);
  if (!agent || agent.role !== "agent") {
    throw new AppError(httpStatus.NOT_FOUND, "Agent not found or invalid role");
  }
  if (agent.agentStatus !== AgentStatus.APPROVED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent is not approved for adding money"
    );
  }
  const userWallet = await Wallet.findOne({ user: userId });
  const agentWallet = await Wallet.findOne({ user: agentId });
  if (!userWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");
  }
  if (userWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "User wallet is not active");
  }
  if (!agentWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");
  }
  if (agentWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(httpStatus.FORBIDDEN, "Agent wallet is not active");
  }
  if (agentWallet.balance < amount) {
    throw new AppError(httpStatus.BAD_REQUEST, "Insufficient agent balance");
  }
  // Update balances
  agentWallet.balance -= amount;
  userWallet.balance += amount;
  await Promise.all([agentWallet.save(), userWallet.save()]);
  // Create transaction record
  const transaction = await Transaction.create({
    from: agentId,
    to: userId,
    amount,
    type: TransactionType.ADD_MONEY,
    status: TransactionStatus.COMPLETED,
  });
  return transaction;
};

const sendMoney = async (from: string, to: string, amount: number) => {
  if (!from || !to || amount === undefined) {
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required parameters");
  }

  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");
  }

  if (from === to) {
    throw new AppError(httpStatus.FORBIDDEN, "Cannot send money to self");
  }

  const sender = await User.findById(from);
  const receiver = await User.findById(to);

  if (!sender || sender.role !== "user") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Sender not found or invalid role"
    );
  }

  if (sender.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Sender is not active for sending money"
    );
  }

  if (!receiver || receiver.role !== "user") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Receiver not found or invalid role"
    );
  }

  if (receiver.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Receiver is not active for receiving money"
    );
  }

  const senderWallet = await Wallet.findOne({ user: from });
  const receiverWallet = await Wallet.findOne({ user: to });

  if (!senderWallet || senderWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Sender wallet not found or inactive"
    );
  }

  if (!receiverWallet || receiverWallet.status !== WalletStatus.ACTIVE) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Receiver wallet not found or inactive"
    );
  }

  if (senderWallet.balance < amount) {
    throw new AppError(httpStatus.BAD_REQUEST, "Insufficient sender balance");
  }

  // Update balances
  senderWallet.balance -= amount;
  receiverWallet.balance += amount;

  await Promise.all([senderWallet.save(), receiverWallet.save()]);

  // Create transaction record
  const transaction = await Transaction.create({
    from,
    to,
    amount,
    type: TransactionType.SEND_MONEY,
    status: TransactionStatus.COMPLETED,
  });

  return transaction;
};

// const getTransactionHistory = async (id: string) => {
//   if (!id) {
//     throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
//   }

//   const user = await User.findById(id);
//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, "User not found");
//   }
//   if (user.role !== "user" && user.role !== "agent") {
//     throw new AppError(
//       httpStatus.FORBIDDEN,
//       "Only users and agents have transaction history"
//     );
//   }

//   const transactions = await Transaction.find({
//     $or: [{ from: id }, { to: id }],
//   }).sort({ createdAt: -1 });

//   if (!transactions || transactions.length === 0) {
//     throw new AppError(
//       httpStatus.NOT_FOUND,
//       "No transactions found for this user"
//     );
//   }

//   return transactions;
// };

const getTransactionHistory = async ( id: string,
  role: string,
  query: Record<string, any>) => {
  if (!id) {
    throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  if (user.role !== "user" && user.role !== "agent") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only users and agents have transaction history"
    );
  }

  // base query
  const baseQuery = Transaction.find({
    $or: [{ from: id }, { to: id }],
  }).sort({ createdAt: -1 });

  // apply only pagination
  const qb = new QueryBuilder(baseQuery, query).paginate();
  const transactions = await qb.build();
  const meta = await qb.getMeta();

  return { meta, transactions };
};


export const TransactionServices = {
  cashIn,
  cashOut,
  getAllTransactions,
  withdrawMoneyByUser,
  sendMoney,
  getTransactionHistory,
  addMoneyByUser,
};
