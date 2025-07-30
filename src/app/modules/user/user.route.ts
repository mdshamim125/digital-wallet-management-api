import { Router } from "express";
import { UserControllers } from "./user.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";

const router = Router();

router.post(
  "/register",
  //   validateRequest(createUserZodSchema),
  UserControllers.createUser
);

// // User-specific routes
// router.post("/add-money", checkAuth(Role.USER), UserControllers.topUpWallet);
// router.post(
//   "/withdraw",
//   checkAuth(Role.USER),
//   UserControllers.withdrawFromWallet
// );
// router.post("/send-money", checkAuth(Role.USER), UserControllers.sendMoney);
// router.get(
//   "/transactions",
//   checkAuth(Role.USER),
//   UserControllers.getTransactionHistory
// );

// // Agent-specific routes
// router.post(
//   "/agent/cash-in",
//   checkAuth(Role.AGENT),
//   UserControllers.agentCashIn
// );
// router.post(
//   "/agent/cash-out",
//   checkAuth(Role.AGENT),
//   UserControllers.agentCashOut
// );
// // router.get(
// //   "/agent/commissions",
// //   checkAuth(Role.AGENT),
// //   UserControllers.getAgentCommissionHistory
// // );

// // Admin-specific routes
// router.get("/admin/users", checkAuth(Role.ADMIN), UserControllers.getAllUsers);
// router.get(
//   "/admin/wallets",
//   checkAuth(Role.ADMIN),
//   UserControllers.getAllWallets
// );
// router.get(
//   "/admin/transactions",
//   checkAuth(Role.ADMIN),
//   UserControllers.getAllTransactions
// );

router.get("/get-users", checkAuth(Role.ADMIN), UserControllers.getAllUsers);

router.get("/get-wallets", checkAuth(Role.ADMIN), UserControllers.getWallets);

router.patch(
  "/status-update/:id",
  checkAuth(Role.ADMIN),
  UserControllers.updateStatus
);

export const UserRoutes = router;
