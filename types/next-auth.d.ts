import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdvertiser: boolean;
      isAdmin: boolean;
      isActive: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    id: string;
    isAdvertiser: boolean;
    isAdmin: boolean;
    isActive: boolean;
  }
}
