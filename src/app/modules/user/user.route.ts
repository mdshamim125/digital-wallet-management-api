import { Router } from "express";
import { UserControllers } from "./user.controller";

const router = Router();

router.post(
  "/register",
  //   validateRequest(createUserZodSchema),
  UserControllers.createUser
);

export const UserRoutes = router;
