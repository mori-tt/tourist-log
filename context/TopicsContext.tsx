"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";

export interface Topic {
  id: number;
  title: string;
  content: string;
  adFee: number;
  monthlyPVThreshold: number;
  advertiserId: string;
}

interface TopicsContextType {
  topics: Topic[];
  addTopic: (topic: Topic) => void;
  deleteTopic: (id: number) => void;
  setTopics: (topics: Topic[]) => void;
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export function TopicsProvider({ children }: { children: ReactNode }) {
  const [topics, setTopics] = useState<Topic[]>([]);

  const addTopic = useCallback((topic: Topic) => {
    setTopics((prev) => [...prev, topic]);
  }, []);

  const deleteTopic = useCallback((id: number) => {
    setTopics((prev) => prev.filter((topic) => topic.id !== id));
  }, []);

  // DB または API 経由で全トピックを取得し、Context を更新する (例: 初回読み込み時)
  useEffect(() => {
    async function fetchTopics() {
      const res = await fetch("/api/topics");
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      } else {
        console.error("トピック取得に失敗しました");
      }
    }
    fetchTopics();
  }, []);

  return (
    <TopicsContext.Provider
      value={{ topics, addTopic, deleteTopic, setTopics }}
    >
      {children}
    </TopicsContext.Provider>
  );
}

export function useTopics() {
  const context = useContext(TopicsContext);
  if (context === undefined) {
    throw new Error("useTopics must be used within a TopicsProvider");
  }
  return context;
}
