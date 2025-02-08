"use client";

import { useRouter, useParams } from "next/navigation";
import { useArticles } from "@/context/ArticlesContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ArticleDetailPage() {
  const params = useParams();
  const { articles, updateArticle } = useArticles();
  const articleId = Number(params.id);
  const article = articles.find((a) => a.id === articleId);
  const TIP_INCREMENT = 100;

  if (!article) {
    return <p>記事が見つかりません。</p>;
  }

  const handleTip = async () => {
    const newTipAmount = article.tipAmount + TIP_INCREMENT;
    updateArticle({
      ...article,
      tipAmount: newTipAmount,
      // 購買条件は実装に応じて調整してください
      isPurchased: newTipAmount >= 500,
    });

    // 以下は実際のユーザーのウォレット情報の取得に置き換えてください
    const userWalletPrivateKey = "ユーザーの秘密鍵";
    const recipientAddress = "受取先アドレス";

    try {
      const res = await fetch("/api/transactions/tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userWalletPrivateKey,
          recipientAddress,
          tipAmount: TIP_INCREMENT,
          articleId: article.id,
        }),
      });
      const result = await res.json();
      console.log("投げ銭トランザクション結果:", result);
    } catch (error) {
      console.error("投げ銭トランザクションエラー:", error);
    }
  };

  return (
    <Card className="m-8 p-8">
      <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
      <p>著者: {article.author}</p>
      <p>{article.content}</p>
      <p>現在の投げ銭: {article.tipAmount} 円</p>
      {article.isPurchased && (
        <p className="text-green-600 font-bold">この記事は買取済みです。</p>
      )}
      <Button onClick={handleTip} className="mt-4">
        投げ銭する ({TIP_INCREMENT}円)
      </Button>
    </Card>
  );
}
