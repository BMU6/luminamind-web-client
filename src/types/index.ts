import type { RefObject } from "react";
export type DbEntry = {
  _id: string;
  createdAt: string;
  updatedAt?: string;
};

export type AttributeNames =
  | "mood"
  | "energy"
  | "sleep"
  | "concentration"
  | "irritability";

export type User = DbEntry & {
  email: string;
  roles: string[];
  connectedUsers?: string[];
  id?: string;
};

export type LoginData = { email: string; password: string };

export type RegisterData = {
  email: string;
  password: string;
  confirmPassword: string;
  role: "patient" | "doctor";
};

export type AuthContextType = {
  signedIn: boolean;
  loading: boolean; // true while the stored session is being checked
  user: User | null;
  handleSignIn: ({ email, password }: LoginData) => Promise<void>;
  handleSignOut: () => Promise<void>;
  handleRegister: (formState: RegisterData) => Promise<void>;
};

export type ModalRef = RefObject<HTMLDialogElement | null>;
// NEW: Maps the real-time chat payload structure coming over the network wire
export type ChatMessage = {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
};

// NEW: Maps the localized channels directory listing elements type signature
export type Contact = {
  _id: string;
  email: string;
  roles: string[];
  id?: string;
};
