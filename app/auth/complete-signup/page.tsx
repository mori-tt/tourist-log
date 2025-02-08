import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import CompleteSignupForm from "./CompleteSignupForm";

interface CustomUser {
  isActive: boolean;
  // 必要に応じて他のプロパティを追加してください
}

export default async function CompleteSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const plainSearchParams = Object.fromEntries(
    Object.entries(resolvedSearchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  );
  const sp = new URLSearchParams(plainSearchParams);

  let role = sp.get("role") || "";
  if (!role) {
    const callbackUrl = sp.get("callbackUrl") || "";
    if (callbackUrl) {
      try {
        const parsedUrl = new URL(callbackUrl);
        role = parsedUrl.searchParams.get("role") ?? "";
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("callbackUrl の解析に失敗しました", error.message);
        } else {
          console.error("callbackUrl の解析に失敗しました", error);
        }
      }
    }
  }
  role = role || "user";

  const session = await getServerSession(authOptions);
  // セッションで isActive が true ならリダイレクトする
  if (session && session.user && (session.user as CustomUser).isActive) {
    redirect(role === "advertiser" ? "/advertiser" : "/");
  }

  return <CompleteSignupForm role={role} />;
}
