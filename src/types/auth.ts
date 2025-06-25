import { User as FirebaseUser } from "firebase/auth";

export type UserRole = "admin" | "cashier" | "user" | "manager";

export interface UserData {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName: string | null;
}

export interface ExtendedUser extends FirebaseUser {
  role?: UserRole;
}
