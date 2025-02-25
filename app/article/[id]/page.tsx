"use client";
import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useArticles } from "@/context/ArticlesContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useTopics } from "@/context/TopicsContext";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkImageAttributes from "remark-image-attributes";
import { ArticleFormData } from "@/context/ArticlesContext";
import SafeImage from "@/components/SafeImage";

export default function ArticleDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const articleId = Number(params.id);
  const { articles } = useArticles();
  const { topics } = useTopics();
  const { setValue } = useForm<ArticleFormData>();

  const article = articles.find((a) => a.id === articleId);

  useEffect(() => {
    if (article) {
      setValue("title", article.title);
      setValue("content", article.content);
      setValue("topicId", article.topicId);
      setValue("purchaseAmount", article.purchaseAmount);
    }
  }, [article, setValue]);

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

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    signIn();
    return null;
  }
  if (!article) return <p>記事が見つかりません。</p>;

  const isAdmin = session.user?.isAdmin;
  const isAdvertiser = session.user?.isAdvertiser;
  const isGeneral = !isAdmin && !isAdvertiser;
  const isAuthor = session.user.email === article.author;
  const canTip = !isAuthor && (isGeneral || isAdvertiser);

  const topicTitle =
    article.topic?.title ||
    topics.find((t) => t.id === article.topicId)?.title ||
    "トピックなし";

  return (
    <Card className="m-8 p-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold mb-4">
          {article.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>著者: {article.author}</p>
        <p>トピック: {topicTitle}</p>
        <div className="my-4">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkImageAttributes]}>
            {article.content}
          </ReactMarkdown>
        </div>
        {article.images && article.images.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {article.images.map((img: { url: string }, index: number) => (
              <div key={index} className="relative h-48">
                <SafeImage
                  src={img.url}
                  alt={`Article Image ${index}`}
                  fill
                  className="object-cover border rounded"
                />
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            更新日時: {article.updatedAt.split("T")[0]}
          </p>
          <p className="text-sm text-gray-500">作者: {article.author}</p>
          <p className="text-sm text-gray-500">
            買取金額: {article.purchaseAmount}円
          </p>
        </div>
        {canTip && (
          <div className="mt-4">
            <Button onClick={handleTip}>投げ銭する</Button>
          </div>
        )}
        {isAuthor && (
          <div className="mt-4 flex gap-4">
            <Link href={`/article/${article.id}/edit`}>
              <Button>編集</Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>
              削除
            </Button>
          </div>
        )}
        <div className="mt-4">
          <Button onClick={() => router.back()} className="mt-4">
            戻る
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
