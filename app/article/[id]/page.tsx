"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useArticles } from "@/context/ArticlesContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTopics } from "@/context/TopicsContext";
import { useForm } from "react-hook-form";
import MarkdownWithZoomableImages from "@/components/MarkdownWithZoomableImages";
import { ArticleFormData } from "@/types/article";
import SafeImage from "@/components/SafeImage";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Trash,
  User,
  Calendar,
  DollarSign,
  Tag,
  TrendingUp,
  Check,
  Info,
} from "lucide-react";

// 取引履歴の型定義
interface Transaction {
  id: number;
  type: "purchase" | "tip" | string;
  amount: number;
  timestamp: string;
  transactionHash: string;
}

export default function ArticleDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const articleId = Number(params.id);
  const { articles } = useArticles();
  const { topics } = useTopics();
  const { setValue } = useForm<ArticleFormData>();

  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(10);
  const [walletPrivateKey, setWalletPrivateKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseWalletPrivateKey, setPurchaseWalletPrivateKey] = useState("");
  const [isPurchaseSubmitting, setIsPurchaseSubmitting] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");

  const article = articles.find((a) => a.id === articleId);

  const [authorName, setAuthorName] = useState<string>("");
  const [totalReceivedXym, setTotalReceivedXym] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // XYM取引履歴を取得する関数
  const fetchTransactionHistory = React.useCallback(async () => {
    if (!article) return;

    try {
      // API実装が完成するまでのダミーデータ
      const dummyTransactions: Transaction[] = [
        {
          id: 1,
          type: "purchase",
          amount: article.xymPrice || 0,
          timestamp: new Date().toISOString(),
          transactionHash:
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        },
        {
          id: 2,
          type: "tip",
          amount: 5,
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1日前
          transactionHash:
            "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        },
      ];

      setTransactions(dummyTransactions);

      // 合計XYMを計算
      const totalXym = dummyTransactions.reduce(
        (sum: number, tx: Transaction) => {
          return sum + (tx.amount || 0);
        },
        0
      );

      setTotalReceivedXym(totalXym);

      /* 本来のAPI呼び出し（APIが完成したら有効化）
      const response = await fetch(`/api/transactions/history/${article.id}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        
        // 合計XYMを計算
        const totalXym = data.transactions.reduce((sum: number, tx: Transaction) => {
          return sum + (tx.amount || 0);
        }, 0);
        
        setTotalReceivedXym(totalXym);
      }
      */
    } catch (error) {
      console.error("XYM取引履歴の取得に失敗しました:", error);
    }
  }, [article]);

  useEffect(() => {
    if (article) {
      setValue("title", article.title);
      setValue("content", article.content);
      setValue("topicId", article.topicId);
      setValue("xymPrice", article.xymPrice);

      // ユーザーが記事の投稿者である場合、XYM取引履歴を取得
      if (session?.user?.id === article.userId) {
        fetchTransactionHistory();
      }

      // 画像URLの検証
      if (article.images) {
        const validImages = article.images.filter(
          (img) =>
            img.url && typeof img.url === "string" && img.url.trim() !== ""
        );

        if (validImages.length !== article.images.length) {
          console.warn(
            `${
              article.images.length - validImages.length
            }個の無効な画像URLがフィルタリングされました`
          );
        }
      }
    }
  }, [article, setValue, session, fetchTransactionHistory]);

  useEffect(() => {
    const fetchAuthorName = async () => {
      if (!article || !article.userId) {
        setAuthorName(
          article?.author ? article.author.split("@")[0] : "不明なユーザー"
        );
        return;
      }

      try {
        const res = await fetch(`/api/user/${article.userId}`);
        if (res.ok) {
          const userData = await res.json();
          setAuthorName(
            userData.name || article.author?.split("@")[0] || "不明なユーザー"
          );
        } else {
          setAuthorName(
            article.author ? article.author.split("@")[0] : "不明なユーザー"
          );
        }
      } catch (error) {
        console.error("著者名の取得に失敗しました:", error);
        setAuthorName(
          article.author ? article.author.split("@")[0] : "不明なユーザー"
        );
      }
    };

    fetchAuthorName();
  }, [article]);

  useEffect(() => {
    if (article?.images && article.images.length > 0) {
      console.log(
        "Image URLs:",
        article.images.map((img) => img.url)
      );
    }
  }, [article]);

  const handleTip = async () => {
    setTipDialogOpen(true);
  };

  const handleTipSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/transactions/tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderWalletPrivateKey: walletPrivateKey,
          recipientAddress: article?.user?.walletAddress,
          tipAmount,
          topicId: article?.topicId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "投げ銭の送信に失敗しました");
      }

      // トランザクションの状態を確認
      const transactionHash = data.blockchain.transactionInfo.hash;
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!confirmed && attempts < maxAttempts) {
        const statusResponse = await fetch(
          `/api/transactions/status/${transactionHash}`
        );
        const statusData = await statusResponse.json();

        if (statusData.status === "confirmed") {
          confirmed = true;
          setSuccess(
            `投げ銭が正常に送信されました！トランザクションハッシュ: ${transactionHash}`
          );
          setTipDialogOpen(false);
        } else if (statusData.status === "error") {
          throw new Error("トランザクションの確認中にエラーが発生しました");
        }

        if (!confirmed) {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // 5秒待機
          attempts++;
        }
      }

      if (!confirmed) {
        setError(
          "トランザクションの確認がタイムアウトしました。Symbol Explorerで確認してください。"
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("投げ銭の送信中にエラーが発生しました");
      }
    } finally {
      setIsSubmitting(false);
    }
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

  // 記事購入ダイアログを開く
  const handlePurchase = () => {
    setPurchaseDialogOpen(true);
  };

  // 記事購入処理を実行
  const submitPurchase = async () => {
    if (!article || !session) return;

    try {
      setIsPurchaseSubmitting(true);
      setPurchaseError("");

      // 記事購入トランザクションの実行
      const response = await fetch("/api/transactions/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          advertiserWalletPrivateKey: purchaseWalletPrivateKey,
          articleId: article.id,
          purchaseAmount: article.xymPrice,
          advertiserId: session.user.id, // 購入者IDを送信
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPurchaseDialogOpen(false);
        alert(
          "記事の購入が完了しました！トランザクションハッシュ: " +
            result.blockchain.transactionInfo.hash
        );
        // 購入成功後、ページをリロードして購入状態を反映させる
        router.refresh();
      } else {
        const errorData = await response.json();
        setPurchaseError(errorData.error || "記事購入処理に失敗しました。");
      }
    } catch (error) {
      console.error("記事購入処理エラー:", error);
      setPurchaseError("記事購入処理に失敗しました。");
    } finally {
      setIsPurchaseSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 記事が見つからない場合
  if (!article) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="bg-card shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-4">記事が見つかりません</h2>
            <p className="text-muted-foreground mb-8">
              お探しの記事は削除されたか、存在しない可能性があります。
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                ホームに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 記事の内容を取得する関数
  const getArticleContent = () => {
    // 未ログインの場合
    if (!session) {
      // 購入済み記事は表示しない
      if (article.isPurchased) {
        return "この記事はログイン後に購入することで閲覧できます。";
      }
      return article.content;
    }

    // アクセス権の確認: 自分の記事、購入済み記事を購入した人、管理者は閲覧可能
    if (
      article.userId === session.user.id ||
      article.purchasedBy === session.user.id ||
      session.user.isAdmin
    ) {
      return article.content;
    }

    // それ以外で購入済み記事は購入後に閲覧可能
    if (article.isPurchased) {
      return "この記事は購入後にご覧いただけます。";
    }

    return article.content;
  };

  // 記事の関連トピック取得
  const relatedTopic = topics.find((t) => t.id === article.topicId);

  // 購入要件のメッセージ表示
  const hasAccess =
    session &&
    (article.userId === session.user.id ||
      article.purchasedBy === session.user.id ||
      session.user.isAdmin);

  // 自分のトピックの記事かどうかをチェック（広告主用）
  const isTopicOwner =
    session?.user?.isAdvertiser &&
    relatedTopic &&
    relatedTopic.advertiserId === session.user.id;

  // 記事購入ボタンを表示すべきかの条件
  const shouldShowPurchaseButton =
    session &&
    article.isPurchased &&
    !hasAccess &&
    // 自分の記事ではない場合
    (session.user.id !== article.userId ||
      // または広告主で自分のトピックの記事の場合
      (session.user?.isAdvertiser &&
        relatedTopic &&
        relatedTopic.advertiserId === session.user.id));

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>ホームに戻る</span>
        </Link>
      </div>

      <Card className="bg-card shadow-sm rounded-xl overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 sm:p-8 border-b">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <User className="h-4 w-4 mr-1" />
              <span>{authorName}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                {new Date(article.updatedAt).toLocaleDateString("ja-JP")}
              </span>
            </div>
            {relatedTopic && (
              <Link
                href={`/topics/${relatedTopic.id}`}
                className="flex items-center text-primary hover:underline"
              >
                <Tag className="h-4 w-4 mr-1" />
                <span>{relatedTopic.title}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* 購入要件のメッセージ表示 */}
          {article.isPurchased && !hasAccess && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <DollarSign className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium mb-1">この記事は購入が必要です</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    この記事の全文を読むには {article.xymPrice} XYM
                    で購入してください。
                  </p>
                  {session ? (
                    <Button
                      onClick={handlePurchase}
                      className="flex items-center"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {article.xymPrice} XYMで記事を購入
                    </Button>
                  ) : (
                    <Link href="/login">
                      <Button variant="outline">ログインして購入</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 購入済みメッセージ表示 */}
          {article.isPurchased && article.purchasedBy === session?.user?.id && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium mb-1">購入済み記事</h3>
                  <p className="text-sm text-muted-foreground">
                    あなたはこの記事を購入済みです。全文をお読みいただけます。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 記事コンテンツ */}
          <div className="prose prose-sm sm:prose max-w-none">
            {/* 記事の画像を表示 */}
            {article.images && article.images.length > 0 && (
              <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
                {article.images.map((image, index) => (
                  <SafeImage
                    key={index}
                    src={image.url}
                    alt={`記事の画像 ${index + 1}`}
                    width={800}
                    height={600}
                    className="rounded-lg shadow-md w-full h-auto object-cover"
                  />
                ))}
              </div>
            )}

            <MarkdownWithZoomableImages content={getArticleContent()} />
          </div>

          {/* 記事価格を全ユーザーに表示 */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center text-amber-800">
              <DollarSign className="h-5 w-5 flex-shrink-0 mr-2" />
              <p className="font-medium">記事価格: {article.xymPrice} XYM</p>
            </div>
          </div>

          {/* 記事のアクション */}
          <div className="flex flex-wrap gap-4 mt-8">
            {/* 投げ銭ボタン - 広告主のみ表示、かつ自分の記事ではなく、購入済みでない場合に表示 */}
            {session?.user?.isAdvertiser &&
              session.user.id !== article.userId &&
              !article.isPurchased && (
                <Button
                  onClick={handleTip}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="h-4 w-4" />
                  投げ銭
                </Button>
              )}

            {/* 記事購入ボタン - 購入していない記事の場合で自分の記事ではない場合、または自分のトピックの記事の場合に表示 */}
            {shouldShowPurchaseButton && (
              <Button
                onClick={handlePurchase}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <DollarSign className="h-4 w-4" />
                記事を購入 ({article.xymPrice} XYM)
              </Button>
            )}

            {/* 記事の状態を表示 - 自分の記事かどうか */}
            {session?.user?.id === article.userId && (
              <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-md px-3 py-2">
                <Info className="h-4 w-4" />
                <span>あなたが投稿した記事です</span>
              </div>
            )}

            {/* 記事の状態を表示 - 自分の記事が購入されたかどうか */}
            {session?.user?.id === article.userId &&
              article.isPurchased &&
              article.purchasedBy && (
                <div className="flex items-center gap-2 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded-md px-3 py-2">
                  <Check className="h-4 w-4" />
                  <span>この記事は購入されています</span>
                </div>
              )}

            {/* PVによる広告料の表示 - 広告主向け情報 */}
            {session?.user?.isAdvertiser && (
              <div className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-md px-3 py-2">
                <TrendingUp className="h-4 w-4" />
                <span>PV: {article.views || 0}</span>
                <span className="mx-1">|</span>
                <span>
                  支払い予定広告料: {Math.floor((article.views || 0) * 0.01)}{" "}
                  XYM
                </span>
              </div>
            )}

            {/* 広告主で自分のトピックの記事の場合に表示 */}
            {isTopicOwner && (
              <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-3 py-2">
                <Info className="h-4 w-4" />
                <span>あなたのトピックに基づく記事です</span>
              </div>
            )}

            {/* 記事所有者に広告収益情報を表示 */}
            {session?.user?.id === article.userId && (
              <>
                <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-3 py-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>PV: {article.views || 0}</span>
                  <span className="mx-1">|</span>
                  <span>
                    広告収益: {Math.floor((article.views || 0) * 0.01)} XYM
                  </span>
                </div>

                {/* XYM収入の合計を表示 */}
                <div className="flex items-center gap-2 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded-md px-3 py-2">
                  <DollarSign className="h-4 w-4" />
                  <span>合計受取XYM: {totalReceivedXym} XYM</span>
                </div>
              </>
            )}

            {/* 投稿者にだけ編集削除を表示 */}
            {session?.user?.id === article.userId && (
              <>
                <Link href={`/article/${articleId}/edit`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    編集
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash className="h-4 w-4" />
                  削除
                </Button>
              </>
            )}

            {/* 管理者に削除ボタンを表示 */}
            {session?.user?.isAdmin && session?.user?.id !== article.userId && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                削除（管理者）
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 著者情報カード */}
      <Card className="bg-card shadow-sm rounded-xl overflow-hidden mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <User className="h-5 w-5 mr-2" />
            著者について
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-lg">{authorName}</h3>
              <p className="text-sm text-muted-foreground">
                地方の魅力を発信するクリエイター
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* トランザクション履歴カード - 記事所有者にのみ表示 */}
      {session?.user?.id === article.userId && transactions.length > 0 && (
        <Card className="bg-card shadow-sm rounded-xl overflow-hidden mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              XYM取引履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((tx, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {tx.type === "tip"
                        ? "投げ銭"
                        : tx.type === "purchase"
                        ? "記事購入"
                        : "その他"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      +{tx.amount} XYM
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {tx.transactionHash}
                    </p>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="font-medium">合計受取XYM</p>
                  <p className="font-bold text-green-600">
                    {totalReceivedXym} XYM
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 投げ銭ダイアログ */}
      <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>投げ銭する</DialogTitle>
            <DialogDescription>
              記事の作者に投げ銭をして支援しましょう。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="tipAmount" className="text-right">
                金額 (XYM)
              </label>
              <Input
                id="tipAmount"
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="privateKey" className="text-right">
                秘密鍵
              </label>
              <Input
                id="privateKey"
                type="password"
                value={walletPrivateKey}
                onChange={(e) => setWalletPrivateKey(e.target.value)}
                className="col-span-3"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
          </div>
          <DialogFooter>
            <Button
              onClick={handleTipSubmit}
              disabled={isSubmitting || !walletPrivateKey || tipAmount <= 0}
            >
              {isSubmitting ? "送信中..." : "投げ銭を送る"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 記事購入ダイアログ */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>記事を購入する</DialogTitle>
            <DialogDescription>
              {article.xymPrice} XYMを支払って記事を購入します。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-muted p-3 rounded-lg flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{article.title}</p>
                <p className="text-sm text-muted-foreground">
                  価格: {article.xymPrice} XYM
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="purchasePrivateKey" className="text-right">
                秘密鍵
              </label>
              <Input
                id="purchasePrivateKey"
                type="password"
                value={purchaseWalletPrivateKey}
                onChange={(e) => setPurchaseWalletPrivateKey(e.target.value)}
                className="col-span-3"
              />
            </div>
            {purchaseError && (
              <p className="text-red-500 text-sm">{purchaseError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={submitPurchase}
              disabled={isPurchaseSubmitting || !purchaseWalletPrivateKey}
            >
              {isPurchaseSubmitting ? "処理中..." : "購入する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
