"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

export interface Article {
  id: number;
  title: string;
  author: string;
  content: string;
  tipAmount: number;
  isPurchased: boolean;
  topicId: number;
}

export interface ArticlesContextType {
  articles: Article[];
  addArticle: (article: Article) => void;
  updateArticle: (article: Article) => void;
  deleteArticle: (id: number) => void;
}

const ArticlesContext = createContext<ArticlesContextType | undefined>(
  undefined
);

export function ArticlesProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([
    {
      id: 1,
      title: "初めての記事",
      author: "管理者",
      content: "これはダミーの記事です。",
      tipAmount: 0,
      isPurchased: false,
      topicId: 0,
    },
  ]);

  const addArticle = useCallback((article: Article) => {
    setArticles((prev) => [...prev, article]);
  }, []);

  const updateArticle = useCallback((article: Article) => {
    setArticles((prev) => prev.map((a) => (a.id === article.id ? article : a)));
  }, []);

  const deleteArticle = useCallback((id: number) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <ArticlesContext.Provider
      value={{ articles, addArticle, updateArticle, deleteArticle }}
    >
      {children}
    </ArticlesContext.Provider>
  );
}

export function useArticles(): ArticlesContextType {
  const context = useContext(ArticlesContext);
  if (!context) {
    throw new Error("useArticles must be used within an ArticlesProvider");
  }
  return context;
}
