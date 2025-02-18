import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
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
  loading: boolean;
  addTopic: (topic: Topic) => void;
  deleteTopic: (id: number) => void;
  updateTopic: (updatedTopic: Topic) => void;
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export function TopicsProvider({ children }: { children: ReactNode }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch("/api/topics");
        if (res.ok) {
          const data = await res.json();
          setTopics(data);
        } else {
          console.error("トピックの取得に失敗しました");
        }
      } catch (error) {
        console.error("fetchTopicsエラー:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  const addTopic = (newTopic: Topic) => {
    setTopics((prevTopics) => [...prevTopics, newTopic]);
  };

  const deleteTopic = (id: number) => {
    // API呼び出し後に topics を更新するなどの処理を実装
    setTopics(topics.filter((topic) => topic.id !== id));
  };

  const updateTopic = (updatedTopic: Topic) => {
    setTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.id === updatedTopic.id ? updatedTopic : topic
      )
    );
  };

  return (
    <TopicsContext.Provider
      value={{ topics, loading, addTopic, deleteTopic, updateTopic }}
    >
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
