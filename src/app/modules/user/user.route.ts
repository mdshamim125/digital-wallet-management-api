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

// Admin-specific routes
router.get("/get-users", checkAuth(Role.ADMIN), UserControllers.getAllUsers);
router.get("/get-wallets", checkAuth(Role.ADMIN), UserControllers.getWallets);

router.patch(
  "/status-update/:id",
  checkAuth(Role.ADMIN),
  UserControllers.updateStatus
);

export const UserRoutes = router;
