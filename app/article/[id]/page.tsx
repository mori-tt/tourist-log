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
  Check,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// 取引履歴の型定義
interface Transaction {
  id: number;
  type: string;
  xymAmount: number;
  transactionHash: string;
  createdAt: string;
  userId?: string;
  articleId?: number;
  topicId: number;
  user?: {
    id: string;
    name: string;
  };
  article?: {
    id: number;
    title: string;
    user?: {
      id: string;
      name: string;
    };
  };
  isReceived?: boolean;
  metadata?: string;
}

export default function ArticleDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const articleId = Number(params.id);
  const { articles } = useArticles();
  const { topics } = useTopics();
  const { setValue } = useForm<ArticleFormData>();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [purchaserName, setPurchaserName] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [currentUserHasPurchased, setCurrentUserHasPurchased] =
    useState<boolean>(false);
  const [advertisers, setAdvertisers] = useState<{ [key: string]: string }>({});

  // ユーザー名を取得する関数
  const fetchUserName = async (userId: number | string) => {
    if (!userId) return "不明なユーザー";
    try {
      const res = await fetch(`/api/user/${userId}`);
      if (res.ok) {
        const userData = await res.json();
        return userData.name || "名前未設定";
      }
    } catch (error) {
      console.error("ユーザー名の取得に失敗しました:", error);
    }
    return "不明なユーザー";
  };

  // XYM取引履歴を取得する関数
  const fetchTransactionHistory = React.useCallback(async () => {
    if (!article) return;

    try {
      const response = await fetch(`/api/transactions/history/${article.id}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);

        // 記事の著者ID
        const authorUserId = article.userId;

        console.log("著者ID:", authorUserId);

        // 著者が受けるべき収入のトランザクションを抽出
        const authorTransactions = data.transactions.filter(
          (tx: Transaction) => {
            // 著者宛の収入とみなすケース
            if (tx.isReceived === true) {
              console.log(
                "受取トランザクション検出:",
                tx.id,
                tx.type,
                tx.xymAmount
              );
              return true;
            }

            // 著者の記事購入によるもの
            if (tx.type === "purchase" && tx.articleId === article.id) {
              console.log("記事購入トランザクション検出:", tx.id, tx.xymAmount);
              return true;
            }

            // 著者への投げ銭
            if (tx.type === "tip" && tx.articleId === article.id) {
              console.log("投げ銭トランザクション検出:", tx.id, tx.xymAmount);
              return true;
            }

            // 投げ銭受取専用トランザクション
            if (tx.type === "receive_tip") {
              console.log(
                "投げ銭受取トランザクション検出:",
                tx.id,
                tx.xymAmount
              );
              return true;
            }

            // メタデータから著者情報を確認
            if (tx.metadata && typeof tx.metadata === "string") {
              try {
                const meta = JSON.parse(tx.metadata);
                if (
                  meta.authorId === authorUserId ||
                  meta.receiverId === authorUserId
                ) {
                  console.log(
                    "メタデータ一致トランザクション検出:",
                    tx.id,
                    tx.xymAmount,
                    meta
                  );
                  return true;
                }
              } catch {
                // パース失敗は無視
              }
            }

            return false;
          }
        );

        console.log(
          "著者収入トランザクション合計:",
          authorTransactions.length,
          "件"
        );

        // 合計を計算
        const totalXym = authorTransactions.reduce(
          (sum: number, tx: Transaction) => sum + (tx.xymAmount || 0),
          0
        );

        console.log("合計XYM:", totalXym);

        setTotalReceivedXym(totalXym);

        // 購入者の名前を取得
        const purchaseTx = data.transactions.find(
          (tx: Transaction) => tx.type === "purchase"
        );

        if (purchaseTx) {
          if (purchaseTx.userId) {
            const name = await fetchUserName(purchaseTx.userId);
            setPurchaserName(name);

            // 現在のユーザーが購入者かどうかをチェック
            if (session?.user?.id === purchaseTx.userId) {
              setCurrentUserHasPurchased(true);
            }
          } else {
            setPurchaserName("不明なユーザー");
          }

          // 購入日時を設定
          setPurchaseDate(
            new Date(purchaseTx.createdAt).toLocaleString("ja-JP")
          );
        }
      }
    } catch (error) {
      console.error("XYM取引履歴の取得に失敗しました:", error);
    }
  }, [article, session?.user?.id]);

  // 広告主情報を取得する関数
  const fetchAdvertisers = React.useCallback(async () => {
    if (!article || !article.topicId) return;

    try {
      const topic = topics.find((t) => t.id === article.topicId);
      if (topic && topic.advertiserId) {
        const advertiserName = await fetchUserName(topic.advertiserId);
        setAdvertisers((prev) => ({
          ...prev,
          [topic.advertiserId]: advertiserName,
        }));
      }
    } catch (error) {
      console.error("広告主情報の取得に失敗しました:", error);
    }
  }, [article, topics]);

  useEffect(() => {
    if (article) {
      setValue("title", article.title);
      setValue("content", article.content);
      setValue("topicId", article.topicId);
      setValue("xymPrice", article.xymPrice);

      // 記事の購入者が現在のユーザーかチェック
      if (session?.user?.id && article.purchasedBy === session.user.id) {
        setCurrentUserHasPurchased(true);
      }

      // XYM取引履歴を取得するケース
      // 1. ユーザーが記事の投稿者である場合
      // 2. 管理者である場合
      // 3. 記事の購入者である場合
      // 4. 広告主である場合
      if (
        session?.user?.id === article.userId ||
        session?.user?.isAdmin ||
        (session?.user?.id === article.purchasedBy && article.isPurchased) ||
        session?.user?.isAdvertiser
      ) {
        fetchTransactionHistory();
      }

      // 購入者の名前を取得
      if (article.isPurchased && article.purchasedBy) {
        fetchUserName(article.purchasedBy).then((name) => {
          setPurchaserName(name);
        });
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

      // 初期ロード時に広告主情報を取得
      fetchAdvertisers();
    }
  }, [article, setValue, session, fetchTransactionHistory, fetchAdvertisers]);

  // transactions状態が更新されたときに購入日時を設定する別のuseEffect
  useEffect(() => {
    if (transactions.length > 0 && article?.isPurchased) {
      const purchaseTx = transactions.find((tx) => tx.type === "purchase");
      if (purchaseTx) {
        setPurchaseDate(new Date(purchaseTx.createdAt).toLocaleString("ja-JP"));
      }
    }
  }, [transactions, article?.isPurchased]);

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
          articleId: article?.id,
          senderId: session?.user?.id,
          recipientId: article?.userId,
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
    if (confirm("本当にこの記事を削除しますか？この操作は元に戻せません。")) {
      try {
        setIsDeleting(true);
        const res = await fetch(`/api/articles/${articleId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          toast({
            title: "削除完了",
            description: "記事が正常に削除されました",
            variant: "default",
          });
          router.push("/articles");
        } else {
          const errorData = await res.json();
          toast({
            title: "削除失敗",
            description:
              errorData.error || "記事の削除中にエラーが発生しました",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("記事削除エラー:", error);
        toast({
          title: "削除失敗",
          description:
            "ネットワークエラーが発生しました。もう一度お試しください。",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
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

  // 記事の関連トピック取得
  const relatedTopic = article
    ? topics.find((t) => t.id === article.topicId)
    : undefined;

  // 自分のトピックの記事かどうかをチェック（広告主用）
  const isTopicOwner =
    article &&
    session?.user?.isAdvertiser &&
    relatedTopic &&
    relatedTopic.advertiserId === session.user.id;

  // 購入済み記事へのアクセス権をチェックする関数
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkArticleAccess = React.useCallback(() => {
    if (!article || !article.isPurchased) {
      // 購入されていない記事は誰でも閲覧可能
      return true;
    }

    // ログインしていない場合はアクセス不可
    if (status !== "authenticated" || !session) {
      return false;
    }

    // 以下の条件でアクセス可能
    // 1. 記事の投稿者である
    // 2. 管理者である
    // 3. 記事の購入者である
    // 4. 広告主である（広告主は全記事閲覧可能）
    return (
      session.user.id === article.userId ||
      session.user.isAdmin ||
      session.user.id === article.purchasedBy ||
      session.user.isAdvertiser
    );
  }, [article, session, status]);

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href={`/topics/${article.topicId}`}
          className="inline-flex items-center px-3 py-2 rounded-md bg-muted text-sm hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          トピックへ戻る
        </Link>
        <Link
          href="/"
          className="inline-flex items-center px-3 py-2 rounded-md bg-muted text-sm hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          ホームへ戻る
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
          {/* 記事コンテンツ */}
          <div className="prose prose-sm sm:prose max-w-none">
            {/* 記事の画像を表示 - 購入済み記事の場合は権限を確認 */}
            {article.images &&
              article.images.length > 0 &&
              (!article.isPurchased ||
                (session &&
                  (article.userId === session.user.id ||
                    article.purchasedBy === session.user.id ||
                    session.user.isAdmin ||
                    isTopicOwner))) && (
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

            <MarkdownWithZoomableImages content={article.content} />
          </div>

          {/* 記事価格を全ユーザーに表示 */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex flex-col text-amber-800">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 flex-shrink-0 mr-2" />
                <p className="font-medium">記事価格: {article.xymPrice} XYM</p>
              </div>
              {/* 購入ステータスの表示部分 */}
              {article.isPurchased && (
                <div className="mt-2 flex items-center text-sm ml-7">
                  <span className="text-green-700 font-medium">購入済み</span>
                  <span className="text-muted-foreground ml-1">
                    （
                    {(() => {
                      // 明示的な購入者情報がある場合はそれを表示
                      if (purchaserName && purchaserName !== "不明なユーザー") {
                        return `${purchaserName}さん`;
                      }

                      // 購入者不明の場合はトピック情報から広告主を特定
                      if (article.topicId) {
                        const topic = topics.find(
                          (t) => t.id === article.topicId
                        );
                        if (topic) {
                          // 広告主IDが設定されているか確認
                          if (topic.advertiserId) {
                            // 広告主の名前を表示
                            const advertiserName =
                              advertisers[topic.advertiserId];
                            if (
                              advertiserName &&
                              advertiserName !== "不明なユーザー"
                            ) {
                              return `${advertiserName}`;
                            }
                            // 広告主名が取得できない場合はトピック名を表示
                            return `トピック「${topic.title}」の広告主`;
                          }
                        }
                      }

                      // それでもわからない場合は「トピック購入者」と表示
                      return `トピック${article.topicId}の購入者`;
                    })()}
                    ）{purchaseDate && ` ${purchaseDate}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 記事のアクション */}
          <div className="flex flex-wrap gap-4 mt-8">
            {/* 投げ銭ボタン - 広告主のみ表示（管理者は除外）、かつ自分の記事ではなく、購入済みでない場合に表示 */}
            {session?.user?.isAdvertiser &&
              !session.user.isAdmin &&
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

            {/* 記事購入ボタン - トピックを立てた広告主のトピックの記事の場合に表示 */}
            {isTopicOwner && !article.isPurchased && (
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
                {/* XYM収入の合計を表示 */}
                <div className="flex items-center gap-2 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded-md px-3 py-2">
                  <DollarSign className="h-4 w-4" />
                  <span>合計受取XYM: {totalReceivedXym} XYM</span>
                </div>
              </>
            )}

            {/* 管理者に購入状態を表示 */}
            {session?.user?.isAdmin && article.isPurchased && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                購入済み
                {(() => {
                  // 購入者名があれば表示
                  if (purchaserName && purchaserName !== "不明なユーザー") {
                    return `（${purchaserName}さん）`;
                  }

                  // 購入者不明の場合はトピック情報から広告主を特定
                  if (article.topicId) {
                    const topic = topics.find((t) => t.id === article.topicId);
                    if (topic) {
                      // 広告主IDが設定されているか確認
                      if (topic.advertiserId) {
                        // 広告主の名前を表示
                        const advertiserName = advertisers[topic.advertiserId];
                        if (
                          advertiserName &&
                          advertiserName !== "不明なユーザー"
                        ) {
                          return `（${advertiserName}）`;
                        }
                        // 広告主名が取得できない場合はトピック名を表示
                        return `（トピック「${topic.title}」の広告主）`;
                      }
                    }
                  }

                  // それでもわからない場合は「トピック購入者」と表示
                  return `（トピック${article.topicId}の購入者）`;
                })()}
                {purchaseDate && ` ${purchaseDate}`}
              </span>
            )}

            {/* 投稿者にだけ編集削除を表示 - ただし購入済み記事は編集削除不可 */}
            {session?.user?.id === article.userId && !article.isPurchased && (
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
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                      削除中...
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4" />
                      削除
                    </>
                  )}
                </Button>
              </>
            )}

            {/* 広告主向けステータス表示（購入済みの場合） */}
            {session?.user?.isAdvertiser &&
              (currentUserHasPurchased ||
                article.purchasedBy === session.user.id) && (
                <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-md px-3 py-2">
                  <Check className="h-4 w-4" />
                  <span>この記事はあなたが購入済みです</span>
                  {purchaseDate && (
                    <span className="ml-1">({purchaseDate})</span>
                  )}
                </div>
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

      {/* トランザクション履歴カード - 記事所有者および管理者に表示 */}
      {(session?.user?.id === article.userId ||
        session?.user?.isAdmin ||
        (session?.user?.isAdvertiser &&
          (article.purchasedBy === session.user.id || isTopicOwner))) &&
        transactions.length > 0 && (
          <Card className="bg-card shadow-sm rounded-xl overflow-hidden mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                XYM取引履歴
                {session?.user?.isAdmin && (
                  <Badge variant="outline" className="ml-2">
                    管理者用表示
                  </Badge>
                )}
                {session?.user?.isAdvertiser && isTopicOwner && (
                  <Badge variant="outline" className="ml-2">
                    トピックオーナー用表示
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 管理者のみに表示する記事ステータスの概要 */}
                {session?.user?.isAdmin && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-medium mb-2">記事ステータス概要</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">記事ID:</p>
                        <p className="font-medium">{article.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">作成者ID:</p>
                        <p className="font-medium">{article.userId}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">作成者名:</p>
                        <p className="font-medium">{authorName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">購入状態:</p>
                        <p className="font-medium">
                          {article.isPurchased
                            ? currentUserHasPurchased ||
                              article.purchasedBy === session?.user?.id
                              ? "購入済み (あなた)"
                              : article.purchasedBy
                              ? `購入済み (${purchaserName}さん)`
                              : "購入済み"
                            : "未購入"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">購入日時:</p>
                        <p className="font-medium">
                          {purchaseDate || "未購入"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">価格:</p>
                        <p className="font-medium">{article.xymPrice} XYM</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">推定収益:</p>
                        <p className="font-medium">
                          {Math.floor((article.views || 0) * 0.01)} XYM
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* トランザクション一覧 */}
                <h3 className="font-medium mb-2">トランザクション一覧</h3>
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
                          : tx.type === "receive_tip"
                          ? "投げ銭受取"
                          : "その他"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>

                      {/* 送金者の表示（常に表示） */}
                      <p className="text-xs text-blue-600 font-semibold">
                        <span className="font-bold">XYM送信者:</span>{" "}
                        <span className="underline">
                          {(() => {
                            // トピックオーナー自身の場合（自分が広告主でトピックオーナーの場合）
                            if (
                              isTopicOwner &&
                              (tx.type === "purchase" || tx.type === "tip")
                            ) {
                              // 自分自身が送信者の場合、ユーザー名を表示
                              const myName = session?.user?.name || "広告主";
                              return myName;
                            }

                            // 記事購入者と投げ銭の送信者は、まずトピックの広告主情報から特定を試みる
                            if (
                              (tx.type === "purchase" || tx.type === "tip") &&
                              article?.topicId
                            ) {
                              const topic = topics.find(
                                (t) => t.id === article.topicId
                              );
                              if (topic && topic.advertiserId) {
                                const advertiserName =
                                  advertisers[topic.advertiserId];
                                if (
                                  advertiserName &&
                                  advertiserName !== "不明なユーザー"
                                ) {
                                  return advertiserName;
                                }
                              }
                            }

                            // 送信者情報がある場合
                            if (tx.userId && tx.user?.name) {
                              return tx.user.name;
                            }

                            // 購入者の場合
                            if (
                              tx.type === "purchase" &&
                              purchaserName &&
                              purchaserName !== "不明なユーザー"
                            ) {
                              return purchaserName;
                            }

                            // メタデータから送信者情報を取得
                            if (
                              tx.metadata &&
                              typeof tx.metadata === "string"
                            ) {
                              try {
                                const meta = JSON.parse(tx.metadata);
                                if (meta.senderName) {
                                  return meta.senderName;
                                }
                              } catch {
                                // パース失敗は無視
                              }
                            }

                            // トピックから広告主情報を再度チェック（冗長だが念のため）
                            if (article?.topicId) {
                              // トピック情報から広告主を特定
                              const topic = topics.find(
                                (t) => t.id === article.topicId
                              );
                              if (topic && topic.title) {
                                return `${topic.title}の広告主`;
                              }
                            }

                            return "不明なユーザー";
                          })()}
                        </span>
                      </p>

                      {/* 受取者の表示（常に表示） */}
                      <p className="text-xs text-green-600 font-semibold">
                        <span className="font-bold">XYM受取者:</span>{" "}
                        <span className="underline">
                          {(() => {
                            // 受取者情報が明示的にある場合
                            if (tx.article?.user?.name) {
                              return tx.article.user.name;
                            }

                            // 記事の著者が受取者の場合
                            if (
                              (tx.type === "purchase" ||
                                tx.type === "tip" ||
                                tx.type === "receive_tip") &&
                              authorName
                            ) {
                              return authorName;
                            }

                            // メタデータから受取者情報を取得
                            if (
                              tx.metadata &&
                              typeof tx.metadata === "string"
                            ) {
                              try {
                                const meta = JSON.parse(tx.metadata);
                                if (meta.recipientName) {
                                  return meta.recipientName;
                                }
                              } catch {
                                // パース失敗は無視
                              }
                            }

                            return "不明";
                          })()}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          tx.isReceived ||
                          (session?.user?.id === article.userId &&
                            (tx.type === "purchase" || tx.type === "tip"))
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.isReceived ||
                        (session?.user?.id === article.userId &&
                          (tx.type === "purchase" || tx.type === "tip"))
                          ? "+"
                          : "-"}
                        {tx.xymAmount} XYM
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {tx.transactionHash}
                      </p>
                    </div>
                  </div>
                ))}

                {/* 合計金額 */}
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">合計XYM</p>
                    {/* 広告主/トピックオーナー向けと著者向けで表示を分ける */}
                    {session?.user?.id === article.userId ||
                    session?.user?.isAdmin ? (
                      <p className="font-bold text-green-600">
                        {totalReceivedXym} XYM
                      </p>
                    ) : (
                      <p className="font-bold text-red-600">
                        {/* 広告主視点では支払った金額なのでマイナス表示 */}-
                        {totalReceivedXym} XYM
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* 記事投稿者向けXYM収支情報カード */}
      {session?.user?.id === article.userId && (
        <Card className="bg-card shadow-sm rounded-xl overflow-hidden mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              あなたのXYM収支情報
              <Badge variant="outline" className="ml-2">
                投稿者専用
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 全体的な収支サマリー */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm text-blue-700 font-medium mb-1">
                    記事購入収入
                  </h4>
                  <p className="text-xl font-bold text-blue-800">
                    {transactions
                      .filter((tx) => tx.type === "purchase")
                      .reduce((sum, tx) => sum + tx.xymAmount, 0)}{" "}
                    XYM
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm text-green-700 font-medium mb-1">
                    投げ銭収入
                  </h4>
                  <p className="text-xl font-bold text-green-800">
                    {transactions
                      .filter((tx) => tx.type === "tip")
                      .reduce((sum, tx) => sum + tx.xymAmount, 0)}{" "}
                    XYM
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="text-sm text-amber-700 font-medium mb-1">
                    合計収入
                  </h4>
                  <p className="text-xl font-bold text-amber-800">
                    {totalReceivedXym + Math.floor((article.views || 0) * 0.01)}{" "}
                    XYM
                  </p>
                </div>
              </div>

              {/* ユーザー全体の収益情報 */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">全記事のXYM収益</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  あなたが投稿した全ての記事からの収益情報です。
                </p>
                <Link href="/profile/transactions">
                  <Button className="w-full">収益情報を確認する</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 広告主向けXYM収支情報カード */}
      {session?.user?.isAdvertiser && isTopicOwner && (
        <Card className="bg-card shadow-sm rounded-xl overflow-hidden mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              あなたのXYM収支情報
              <Badge
                variant="outline"
                className="ml-2 bg-blue-50 text-blue-700"
              >
                広告主専用
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 広告主向け収支サマリー */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-sm text-red-700 font-medium mb-1">
                    記事購入支出
                  </h4>
                  <p className="text-xl font-bold text-red-800">
                    {
                      -transactions
                        .filter((tx) => tx.type === "purchase")
                        .reduce((sum, tx) => sum + tx.xymAmount, 0)
                    }{" "}
                    XYM
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-sm text-orange-700 font-medium mb-1">
                    投げ銭支出
                  </h4>
                  <p className="text-xl font-bold text-orange-800">
                    {
                      -transactions
                        .filter((tx) => tx.type === "tip")
                        .reduce((sum, tx) => sum + tx.xymAmount, 0)
                    }{" "}
                    XYM
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="text-sm text-amber-700 font-medium mb-1">
                    合計支出
                  </h4>
                  <p className="text-xl font-bold text-amber-800">
                    {-totalReceivedXym} XYM
                  </p>
                </div>
              </div>

              {/* トピック情報 */}
              {relatedTopic && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">関連トピック情報</h3>
                  <p className="text-sm mb-2">
                    <span className="font-semibold">トピック名:</span>{" "}
                    {relatedTopic.title}
                  </p>
                  <p className="text-sm mb-3">
                    <span className="font-semibold">記事数:</span>{" "}
                    {
                      articles.filter((a) => a.topicId === relatedTopic.id)
                        .length
                    }
                  </p>
                  <Link href={`/topics/${relatedTopic.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      トピック詳細へ
                    </Button>
                  </Link>
                </div>
              )}

              {/* 広告主全体の支出情報リンク */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">全トピックのXYM支出</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  あなたが広告主として立てた全てのトピックの支出情報です。
                </p>
                <Link href="/profile/transactions">
                  <Button className="w-full">支出情報を確認する</Button>
                </Link>
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
