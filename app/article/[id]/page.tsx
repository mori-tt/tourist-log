"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useArticles } from "@/context/ArticlesContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useTopics } from "@/context/TopicsContext";
import { useForm } from "react-hook-form";

// ファイルの先頭に型定義を追加する
interface ArticleFormData {
  title: string;
  content: string;
  topicId: string;
  purchaseAmount: number;
}

export default function ArticleDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const articleId = Number(params.id);
  const { articles } = useArticles();
  const { topics } = useTopics();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ArticleFormData>();

  const article = articles.find((a) => a.id === articleId);

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }
  if (!article) return <p>記事が見つかりません。</p>;

  // 管理者は記事詳細を閲覧できるが、投げ銭は一般ユーザーと広告主に許可する
  const isAdmin = session.user?.isAdmin;
  const isAdvertiser = session.user?.isAdvertiser;
  const isGeneral = !isAdmin && !isAdvertiser;
  const isAuthor = session.user.email === article.author;
  // 投げ銭可能：投稿者以外で、一般ユーザーまたは広告主の場合
  const canTip = !isAuthor && (isGeneral || isAdvertiser);

  // topic情報（必要なら記事に紐づくトピック情報を表示するため）
  const topic = topics.find((t) => t.id === article.topicId);

  const handleTip = async () => {
    // 投げ銭の金額取得や送金処理等を実装してください
    alert("投げ銭機能を実行します");
  };

  const handleDelete = async () => {
    if (confirm("本当にこの記事を削除しますか？")) {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("記事が削除されました");
        router.push("/articles");
      } else {
        alert("記事の削除に失敗しました");
      }
    }
  };

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
      <p>著者: {article.author}</p>
      <p>トピック: {topic?.title}</p>
      <p>{article.content}</p>
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          更新日時: {article.updatedAt.split("T")[0]}
        </p>
        <p className="text-sm text-gray-500">作者: {article.author}</p>
        <p className="text-sm text-gray-500">買取金額: {article.tipAmount}円</p>
      </div>
      {canTip && (
        <div className="mt-4">
          <input
            type="number"
            placeholder="投げ銭額"
            className="border p-2 w-32"
          />
          <Button onClick={handleTip} className="ml-2">
            投げ銭する
          </Button>
        </div>
      )}
      {isAdmin && (
        <div className="mt-4">
          <Button variant="destructive" onClick={handleDelete}>
            削除
          </Button>
        </div>
      )}
      {isGeneral && (
        <div className="mt-4">
          <Link
            href={`/article/${article.id}/edit`}
            className="text-blue-500 underline"
          >
            編集
          </Link>
        </div>
      )}

      <div className="mt-4">
        <Link href="/">
          <Button variant="outline">戻る</Button>
        </Link>
      </div>
    </Card>
  );
}
