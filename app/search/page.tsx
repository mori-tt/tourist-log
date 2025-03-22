"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTopics } from "@/context/TopicsContext";
import { useArticles } from "@/context/ArticlesContext";
import { Search, Tag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Article as BaseArticle } from "@/types/article";

// 型定義
interface Topic {
  id: number;
  title: string;
  content: string;
}

// 検索結果用の記事型を拡張
interface SearchArticle extends Partial<BaseArticle> {
  id: number;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt: string;
  topicId?: number;
}

// 検索パラメータを使用するコンポーネント
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  const { topics } = useTopics();
  const { articles } = useArticles();

  // 検索結果
  const [topicResults, setTopicResults] = useState<Topic[]>([]);
  const [articleResults, setArticleResults] = useState<SearchArticle[]>([]);

  // 検索を実行
  useEffect(() => {
    if (!query) return;

    // トピックを検索
    const matchedTopics = topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query.toLowerCase()) ||
        topic.content.toLowerCase().includes(query.toLowerCase())
    );
    setTopicResults(matchedTopics);

    // 記事を検索
    const matchedArticles = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.content.toLowerCase().includes(query.toLowerCase())
    );
    setArticleResults(matchedArticles);
  }, [query, topics, articles]);

  // 検索処理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">検索結果</h1>

        {/* 検索フォーム */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="トピックや記事を検索..."
                className="pl-10 pr-4 py-3 w-full rounded-lg border focus:ring-2 focus:ring-primary/50"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
            <Button type="submit" className="px-6">
              検索
            </Button>
          </div>
        </form>

        {/* 検索クエリ表示 */}
        {query && (
          <p className="text-lg mb-6">
            <span className="font-medium">「{query}」</span> の検索結果:
            トピック {topicResults.length}件、 記事 {articleResults.length}件
          </p>
        )}

        {/* 検索結果がない場合 */}
        {query && topicResults.length === 0 && articleResults.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">検索結果がありません</h2>
            <p className="text-gray-600 mb-6">
              別のキーワードで検索してみてください。
            </p>
          </div>
        )}
      </div>

      {/* トピック検索結果 */}
      {topicResults.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Tag className="mr-2" size={20} />
            トピック
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topicResults.map((topic) => (
              <Link
                href={`/topics/${topic.id}`}
                key={topic.id}
                className="block p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-lg mb-2 text-primary">
                  {topic.title}
                </h3>
                <p className="text-gray-600 line-clamp-2 text-sm">
                  {topic.content.substring(0, 100)}...
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 記事検索結果 */}
      {articleResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Search className="mr-2" size={20} />
            記事
          </h2>
          <div className="space-y-4">
            {articleResults.map((article) => (
              <Link
                href={`/article/${article.id}`}
                key={article.id}
                className="block p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-lg mb-1 text-primary">
                  {article.title}
                </h3>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span>
                    {article.createdAt
                      ? new Date(article.createdAt).toLocaleDateString("ja-JP")
                      : "日付なし"}
                  </span>
                  {article.topicId && (
                    <>
                      <span className="mx-2">•</span>
                      <span>
                        {topics.find((t) => t.id === article.topicId)?.title ||
                          "不明なトピック"}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-gray-600 line-clamp-2">
                  {article.content.substring(0, 150)}...
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// フォールバックコンポーネント
function SearchFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">検索結果</h1>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg w-full mb-8"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// メインページコンポーネント
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  );
}
