"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

export interface Topic {
  id: number;
  title: string;
  content: string;
  adFee: number;
  monthlyPVThreshold: number;
  advertiserId: string;
}

export interface TopicsContextType {
  topics: Topic[];
  addTopic: (topic: Topic) => void;
  deleteTopic: (id: number) => void;
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export function TopicsProvider({ children }: { children: ReactNode }) {
  const [topics, setTopics] = useState<Topic[]>([
    {
      id: 1,
      title: "初めてのトピック",
      content: "これはダミーのトピックです。",
      adFee: 1000,
      monthlyPVThreshold: 5000,
      advertiserId: "advertiser@example.com",
    },
  ]);

  const addTopic = useCallback((topic: Topic) => {
    setTopics((prev) => [...prev, topic]);
  }, []);

  const deleteTopic = useCallback((id: number) => {
    setTopics((prev) => prev.filter((topic) => topic.id !== id));
  }, []);

  return (
    <TopicsContext.Provider value={{ topics, addTopic, deleteTopic }}>
      {children}
    </TopicsContext.Provider>
  );
}

export function useTopics() {
  const context = useContext(TopicsContext);
  if (!context) {
    throw new Error("useTopics must be used within a TopicsProvider");
  }
  return context;
}
