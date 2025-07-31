import z from "zod";
import { AgentStatus, Role, UserStatus } from "./user.interface";

export const createUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string" })
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),
  email: z
    .string({ invalid_type_error: "Email must be string" })
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 7 characters long." })
    .max(100, { message: "Email cannot exceed 55 characters." }),
  password: z
    .string({ invalid_type_error: "Password must be a string" })
    .min(5, { message: "Password must be at least 5 digits long." })
    .regex(/^\d+$/, {
      message: "Password must contain only numbers.",
    }),
  phone: z
    .string({ invalid_type_error: "Phone Number must be string" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  address: z
    .string({ invalid_type_error: "Address must be string" })
    .max(100, { message: "Address cannot exceed 100 characters." })
    .optional(),
});

export const updateUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string" })
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .optional(),
  password: z
    .string({ invalid_type_error: "Password must be a string" })
    .min(8, { message: "Password must be at least 8 digits long." })
    .regex(/^\d+$/, {
      message: "Password must contain only numbers.",
    })
    .optional(),
  phone: z
    .string({ invalid_type_error: "Phone Number must be string" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  role: z.enum(Object.values(Role) as [string]).optional(),
  userStatus: z.enum(Object.values(UserStatus) as [string]).optional(),
  agentStatus: z.enum(Object.values(AgentStatus) as [string]).optional(),
  address: z
    .string({ invalid_type_error: "Address must be string" })
    .max(100, { message: "Address cannot exceed 100 characters." })
    .optional(),
});
