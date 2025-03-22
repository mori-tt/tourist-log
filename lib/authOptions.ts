import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  callbacks: {
    // 初回サインイン時に user オブジェクトからトークンに必要な情報を加える
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdvertiser = user.isAdvertiser;
        token.isAdmin = user.isAdmin;
        token.isActive = user.isActive;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    // 毎回、JWTトークンから session.user を再生成する
    async session({ session, token }) {
      // 必須プロパティを持つ初期値を設定する
      if (!session.user)
        session.user = {
          id: "",
          name: "",
          email: "",
          isActive: false,
          isAdvertiser: false,
          isAdmin: false,
        };

      // トークンの情報をセッションに直接設定する
      if (token) {
        session.user.id = token.id as string;
        session.user.isAdvertiser = token.isAdvertiser as boolean;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.isActive = token.isActive as boolean;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }

      // DBからの再取得は必要な場合のみに制限（パフォーマンス向上のため）
      try {
        if (session.user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
              id: true,
              isAdvertiser: true,
              isAdmin: true,
              isActive: true,
              name: true,
              email: true,
            },
          });
          if (dbUser) {
            session.user = {
              id: dbUser.id,
              isAdvertiser: dbUser.isAdvertiser,
              isAdmin: dbUser.isAdmin,
              isActive: dbUser.isActive,
              name: dbUser.name,
              email: dbUser.email,
            };
          }
        }
      } catch (error) {
        console.error("Session callback error:", error);
        // エラーが発生してもトークン情報は既にセッションに設定されているので続行可能
      }

      return session;
    },
  },
  pages: {
    newUser: "/auth/complete-signup",
  },
};
