import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin?: boolean;
      isAdvertiser?: boolean;
      isActive?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    isActive: boolean;
    isAdmin?: boolean;
    isAdvertiser?: boolean;
  }
}
