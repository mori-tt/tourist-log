import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

// セッション型の拡張
declare module "next-auth" {
  interface Session {
    user: {
      isAdmin?: boolean;
      isAdvertiser?: boolean;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      session.user = session.user ?? {};
      session.user.isAdmin = token.email === process.env.ADMIN_EMAIL;
      const advertiserEmails = process.env.ADVERTISER_EMAILS
        ? process.env.ADVERTISER_EMAILS.split(",")
        : [];
      session.user.isAdvertiser = advertiserEmails.includes(token.email || "");
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
