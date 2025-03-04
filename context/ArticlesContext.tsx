import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { Article } from "../types/article";

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
  const [articles, setArticles] = useState<Article[]>([]);

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        // GET 時、画像リレーションが含まれている前提
        setArticles(data);
      }
    } catch (error) {
      console.error("記事の取得に失敗しました", error);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const addArticle = useCallback((article: Article) => {
    setArticles((prev) => [...prev, article]);
  }, []);

  const updateArticle = useCallback((updatedArticle: Article) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === updatedArticle.id ? updatedArticle : article
      )
    );
  }, []);

  const deleteArticle = useCallback((id: number) => {
    setArticles((prev) => prev.filter((article) => article.id !== id));
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
