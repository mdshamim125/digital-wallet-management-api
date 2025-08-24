import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { TransactionControllers } from "./transaction.controller";

const router = Router();

// // User-specific routes
router.post(
  "/add-money",
  checkAuth(Role.USER),
  TransactionControllers.addMoneyByUser
);
router.post(
  "/withdraw",
  checkAuth(Role.USER),
  TransactionControllers.withdrawMoneyByUser
);
router.post(
  "/send-money",
  checkAuth(Role.USER),
  TransactionControllers.sendMoney
);

router.get(
  "/transactions",
  checkAuth(Role.USER, Role.AGENT),
  TransactionControllers.getTransactionHistory
);

// router.get(
//   "/by-user",
//   checkAuth(Role.USER),
//   TransactionControllers.getTransactionByUser
// );

// Agent-specific routes
router.post("/cash-in", checkAuth(Role.AGENT), TransactionControllers.cashIn);
router.post("/cash-out", checkAuth(Role.AGENT), TransactionControllers.cashOut);

//Admin-specific routes
router.get(
  "/all-transactions",
  checkAuth(Role.ADMIN),
  TransactionControllers.getAllTransactions
);

export const TransactionRoutes = router;
