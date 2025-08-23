import { Types } from "mongoose";

export enum Role {
  ADMIN = "admin",
  AGENT = "agent",
  USER = "user",
}

export interface IAuthProvider {
  provider: "google" | "credentials"; // "Google", "Credential"
  providerId: string;
}

export enum UserStatus {
  ACTIVE = "active",
  BLOCKED = "blocked",
}

export enum AgentStatus {
  APPROVED = "approved",
  SUSPENDED = "suspended",
}

export interface UpdateUserPayload extends Partial<IUser> {
  oldPassword?: string;
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  picture?: string;
  address?: string;
  role: Role;
  userStatus?: UserStatus;
  agentStatus?: AgentStatus;
  auths: IAuthProvider[];
  wallet?: Types.ObjectId;
}
