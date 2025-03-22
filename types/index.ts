import {
  User as PrismaUser,
  Article as PrismaArticle,
  Topic as PrismaTopic,
  Transaction as PrismaTransaction,
  TransactionType as PrismaTransactionType,
} from "@prisma/client";

export type TransactionType = PrismaTransactionType;

export interface User extends PrismaUser {
  symbolAddress?: string;
  role?: string;
}

export interface Article extends PrismaArticle {
  user?: User;
  premium?: boolean;
  price?: number;
}

export interface Topic extends Omit<PrismaTopic, "monthlyPVThreshold"> {
  monthlyPVThreshold: number;
}

export interface Transaction
  extends Omit<PrismaTransaction, "isReceived" | "metadata"> {
  user?: User;
  article?: Article;
  topic?: Topic;
  isReceived: boolean;
  txHash?: string;
  message?: string;
  authorUser?: User;
  purchaserUser?: User;
  advertiserUser?: User;
  metadata:
    | string
    | null
    | {
        recipientId?: string;
        senderId?: string;
        articleId?: string;
        authorId?: string;
        purchaserName?: string;
        authorName?: string;
        advertiserName?: string;
        advertiserId?: string;
        articleTitle?: string;
        message?: string;
      };
}
