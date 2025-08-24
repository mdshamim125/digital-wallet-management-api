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

router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);
router.patch(
  "/update-me",
  validateRequest(updateUserZodSchema),
  checkAuth(...Object.values(Role)),
  UserControllers.updateMe
);

router.get(
  "/user-overview",
  checkAuth(Role.USER),
  UserControllers.getUserDashboard
);
router.get(
  "/agent-overview",
  checkAuth(Role.AGENT),
  UserControllers.getAgentDashboard
);

// // Admin-specific routes
// router.get(
//   "/admin-overview",
//   checkAuth(Role.ADMIN),
//   UserControllers.getAminDashboard
// );
router.get(
  "/all-users",
  checkAuth(...Object.values(Role)),
  UserControllers.getAllUsers
);
router.get(
  "/:email",
  checkAuth(...Object.values(Role)),
  UserControllers.getSingleUser
);

router.patch(
  "/status-update/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(Role.ADMIN),
  UserControllers.updateStatus
);

export const UserRoutes = router;
