import { Router } from "express";
import { UserControllers } from "./user.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(createUserZodSchema),
  UserControllers.createUser
);

// Admin-specific routes
router.get("/all-users", checkAuth(Role.ADMIN), UserControllers.getAllUsers);

router.patch(
  "/status-update/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(Role.ADMIN),
  UserControllers.updateStatus
);

export const UserRoutes = router;
