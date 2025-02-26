"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";

interface Transaction {
  id: number;
  articleId?: number;
  tipAmount?: number;
  adFee?: number;
  transactionHash: string;
  type: "tip" | "advertisement";
}

export default function TipManagementPage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/transactions/tip");
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions);
        }
      } catch (error) {
        console.error("Fetching transactions error:", error);
      } finally {
        setLoading(false);
      }
    }
    if (session && (session.user.isAdmin || session.user.isAdvertiser)) {
      fetchTransactions();
    }
  }, [session]);

  if (status === "loading") return <p>Loading...</p>;
  if (!session || (!session.user.isAdmin && !session.user.isAdvertiser)) {
    return <p>アクセス権がありません。</p>;
  }

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl mb-4">投げ銭管理</h1>
      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p>取引はありません。</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th>タイプ</th>
              <th>記事ID</th>
              <th>金額</th>
              <th>トランザクションハッシュ</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.type === "tip" ? "投げ銭" : "広告料"}</td>
                <td>{tx.articleId || "-"}</td>
                <td>{tx.tipAmount || tx.adFee} XYM</td>
                <td>{tx.transactionHash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
