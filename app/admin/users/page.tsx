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
    <div className="container mx-auto py-4 sm:py-8 px-0 sm:px-4">
      <Card className="mb-4 sm:mb-8 border-0 sm:border">
        <CardHeader className="pb-2 sm:pb-6 px-3 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl flex items-center flex-wrap">
            <Shield className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            ユーザー管理
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {/* 検索入力欄 */}
          <div className="mb-4 sm:mb-6 px-2">
            <Input
              placeholder="ユーザー検索（名前またはメール）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md"
            />
          </div>

          {/* デスクトップ用テーブル表示 - モバイルでは非表示 */}
          <div className="hidden md:block w-full overflow-x-auto pb-2">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <Table className="min-w-full divide-y divide-gray-200">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2 px-4 text-sm">
                        ユーザー
                      </TableHead>
                      <TableHead className="py-2 px-4 text-sm">
                        メールアドレス
                      </TableHead>
                      <TableHead className="py-2 px-4 text-sm">
                        ウォレットアドレス
                      </TableHead>
                      <TableHead className="py-2 px-4 text-sm whitespace-nowrap">
                        広告主
                      </TableHead>
                      <TableHead className="py-2 px-4 text-sm whitespace-nowrap">
                        管理者
                      </TableHead>
                      <TableHead className="py-2 px-4 text-sm">
                        登録日
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium py-2 px-4">
                          {user.name}
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          {user.email}
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          {user.walletAddress ? (
                            <div className="truncate max-w-[200px] font-mono text-xs">
                              {user.walletAddress}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              未設定
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 px-4">
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
                            <SelectTrigger className="w-24 px-3 h-10">
                              <SelectValue placeholder="広告主" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">はい</SelectItem>
                              <SelectItem value="false">いいえ</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          <Select
                            defaultValue={user.isAdmin ? "true" : "false"}
                            onValueChange={(value) =>
                              changeUserRole(
                                user.id,
                                "isAdmin",
                                value === "true"
                              )
                            }
                          >
                            <SelectTrigger className="w-24 px-3 h-10">
                              <SelectValue placeholder="管理者" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">はい</SelectItem>
                              <SelectItem value="false">いいえ</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-sm">
                          {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* モバイル用カード表示 - デスクトップでは非表示 */}
          <div className="md:hidden space-y-4 px-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white border rounded-lg p-4 shadow-sm"
              >
                <div className="mb-3">
                  <div className="font-semibold text-base">{user.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </div>
                </div>

                {user.walletAddress ? (
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      ウォレットアドレス:
                    </div>
                    <div className="bg-muted rounded p-2 font-mono text-xs truncate">
                      {user.walletAddress}
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 text-xs text-muted-foreground">
                    ウォレットアドレス: 未設定
                  </div>
                )}

                <div className="text-xs text-muted-foreground mb-1">
                  登録日: {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div>
                    <div className="text-xs mb-1">広告主:</div>
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
                      <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue placeholder="広告主" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">はい</SelectItem>
                        <SelectItem value="false">いいえ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-xs mb-1">管理者:</div>
                    <Select
                      defaultValue={user.isAdmin ? "true" : "false"}
                      onValueChange={(value) =>
                        changeUserRole(user.id, "isAdmin", value === "true")
                      }
                    >
                      <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue placeholder="管理者" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">はい</SelectItem>
                        <SelectItem value="false">いいえ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              ユーザーが見つかりません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
