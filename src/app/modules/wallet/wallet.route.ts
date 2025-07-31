import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { WalletControllers } from "./wallet.controller";
const router = Router();

router.get("/get-wallets", checkAuth(Role.ADMIN), WalletControllers.getWallets);

export const WalletRoutes = router;
