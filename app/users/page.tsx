"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isActive: boolean;
  isAdvertiser: boolean;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session || !session.user?.isAdmin) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) {
          throw new Error("ユーザーの取得に失敗しました");
        }
        const data = await res.json();
        setUsers(data.users);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("予期しないエラーが発生しました");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [session]);

  if (status === "loading" || loading) {
    return <p>Loading...</p>;
  }

  if (!session || !session.user?.isAdmin) {
    signIn();
    return null;
  }

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl mb-4">ユーザー一覧</h1>
      {error && <p className="text-red-500">{error}</p>}
      {users.length === 0 ? (
        <p>ユーザーが見つかりません。</p>
      ) : (
        <>
          {/* 大画面用：テーブルレイアウト */}
          <div className="hidden lg:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    ユーザー名
                  </th>
                  {session?.user?.isAdmin && (
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      メールアドレス
                    </th>
                  )}
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Admin
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Active
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Advertiser
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2">{u.id}</td>
                    <td className="px-4 py-2">{u.name}</td>
                    {session?.user?.isAdmin && (
                      <td className="px-4 py-2">{u.email}</td>
                    )}
                    <td className="px-4 py-2">{u.isAdmin ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">{u.isActive ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">
                      {u.isAdvertiser ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          if (confirm("ユーザーを削除してもよろしいですか？")) {
                            const res = await fetch(`/api/users/${u.id}`, {
                              method: "DELETE",
                            });
                            if (res.ok) {
                              setUsers(
                                users.filter((user) => user.id !== u.id)
                              );
                            } else {
                              alert("削除に失敗しました");
                            }
                          }
                        }}
                      >
                        削除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* スマホ用：カードレイアウト */}
          <div className="block lg:hidden space-y-4">
            {users.map((u) => (
              <div key={u.id} className="border p-4 rounded shadow-sm">
                <p>
                  <span className="font-bold">ID:</span> {u.id}
                </p>
                <p>
                  <span className="font-bold">ユーザー名:</span> {u.name}
                </p>
                {session?.user?.isAdmin && (
                  <p>
                    <span className="font-bold">メールアドレス:</span> {u.email}
                  </p>
                )}
                <p>
                  <span className="font-bold">Admin:</span>{" "}
                  {u.isAdmin ? "Yes" : "No"}
                </p>
                <p>
                  <span className="font-bold">Active:</span>{" "}
                  {u.isActive ? "Yes" : "No"}
                </p>
                <p>
                  <span className="font-bold">Advertiser:</span>{" "}
                  {u.isAdvertiser ? "Yes" : "No"}
                </p>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm("ユーザーを削除してもよろしいですか？")) {
                      const res = await fetch(`/api/users/${u.id}`, {
                        method: "DELETE",
                      });
                      if (res.ok) {
                        setUsers(users.filter((user) => user.id !== u.id));
                      } else {
                        alert("削除に失敗しました");
                      }
                    }
                  }}
                >
                  削除
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="mt-4">
        <Link href="/">
          <Button variant="outline">戻る</Button>
        </Link>
      </div>
    </Card>
  );
}
