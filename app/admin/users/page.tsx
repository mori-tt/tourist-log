"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield } from "lucide-react";

// ユーザー型定義
interface UserData {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  isAdvertiser: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // 管理者以外はアクセス不可
    if (status !== "loading" && (!session || !session.user?.isAdmin)) {
      router.push("/");
      return;
    }

    // ユーザーデータの取得
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) {
          throw new Error("ユーザーデータの取得に失敗しました");
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("エラー:", err);
        setError("ユーザーデータの読み込み中にエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.isAdmin) {
      fetchUsers();
    }
  }, [session, status, router]);

  // ユーザーの役割を変更する関数
  const changeUserRole = async (
    userId: string,
    role: string,
    value: boolean
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [role]: value }),
      });

      if (!response.ok) {
        throw new Error("ユーザー役割の更新に失敗しました");
      }

      // 成功したら、ユーザーリストを更新
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return { ...user, [role]: value };
          }
          return user;
        })
      );
    } catch (err) {
      console.error("エラー:", err);
      alert("ユーザー役割の更新中にエラーが発生しました");
    }
  };

  // 検索フィルター
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="text-red-500 mb-4">エラーが発生しました</div>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          再読み込み
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Shield className="mr-2 h-6 w-6 text-primary" />
            ユーザー管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="ユーザー検索（名前またはメール）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ユーザー</TableHead>
                  <TableHead className="hidden md:table-cell">
                    メールアドレス
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    ウォレットアドレス
                  </TableHead>
                  <TableHead>広告主</TableHead>
                  <TableHead>管理者</TableHead>
                  <TableHead className="hidden md:table-cell">登録日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{user.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden">
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.walletAddress ? (
                        <div className="truncate max-w-[200px]">
                          {user.walletAddress}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          未設定
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.isAdvertiser ? "true" : "false"}
                        onValueChange={(value) =>
                          changeUserRole(
                            user.id,
                            "isAdvertiser",
                            value === "true"
                          )
                        }
                      >
                        <SelectTrigger className="w-20 sm:w-24">
                          <SelectValue placeholder="広告主" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">はい</SelectItem>
                          <SelectItem value="false">いいえ</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.isAdmin ? "true" : "false"}
                        onValueChange={(value) =>
                          changeUserRole(user.id, "isAdmin", value === "true")
                        }
                      >
                        <SelectTrigger className="w-20 sm:w-24">
                          <SelectValue placeholder="管理者" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">はい</SelectItem>
                          <SelectItem value="false">いいえ</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              ユーザーが見つかりません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
