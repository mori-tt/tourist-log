export interface Article {
  id: number;
  title: string;
  author: string;
  content: string;
  tipAmount: number;
  xymPrice: number;
  isPurchased: boolean;
  purchasedBy?: string;
  topicId: number;
  updatedAt: string;
  images: { url: string }[];
  topic?: {
    id: number;
    title: string;
  };
  userId: string;
  user?: {
    id: string;
    walletAddress?: string;
    name?: string;
  };
  views?: number;
  createdAt: string;
}

export interface ArticleFormData {
  title: string;
  content: string;
  topicId: number;
  xymPrice: number;
}
