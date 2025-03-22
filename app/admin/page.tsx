"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, CreditCard, Home } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">管理者専用ページです</h1>
          <Button onClick={() => router.push("/")}>ホームに戻る</Button>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "ユーザー管理",
      description: "ユーザーの閲覧・編集・削除",
      icon: <Users className="h-6 w-6" />,
      href: "/admin/users",
    },
    {
      title: "ユーザーの全XYM取引履歴",
      description: "全てのXYM取引履歴を確認",
      icon: <CreditCard className="h-6 w-6" />,
      href: "/admin/transactions",
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mr-4"
        >
          <Home className="h-4 w-4 mr-2" />
          ホーム
        </Button>
        <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full hover:border-primary hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg mr-3">
                    {item.icon}
                  </div>
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
