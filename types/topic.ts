export interface Topic {
  id: number;
  title: string;
  content: string;
  adFee: number;
  monthlyPVThreshold: number;
  advertiserId: string;
  createdAt: Date;
  updatedAt: Date;
}
