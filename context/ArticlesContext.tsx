import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";

export interface Article {
  id: number;
  title: string;
  author: string;
  content: string;
  tipAmount: number;
  isPurchased: boolean;
  topicId: number;
  updatedAt: string;
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
  const [articles, setArticles] = useState<Article[]>([]);

  const addArticle = useCallback((article: Article) => {
    setArticles((prev) => [...prev, article]);
  }, []);

  const updateArticle = useCallback((article: Article) => {
    setArticles((prev) => prev.map((a) => (a.id === article.id ? article : a)));
  }, []);

  const deleteArticle = useCallback((id: number) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ページ初回読み込み時にリモートのDBから記事一覧を取得
  useEffect(() => {
    async function fetchArticles() {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      } else {
        console.error("記事情報の取得に失敗しました");
      }
    }
    fetchArticles();
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
