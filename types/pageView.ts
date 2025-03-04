export interface PageViewData {
  id: number;
  topicId: number;
  year: number;
  month: number;
  pageViews: number;
  isConfirmed: boolean;
  isPaid: boolean;
  confirmedAt: string;
  paidAt: string | null;
  topic: {
    title: string;
    adFee: number;
    monthlyPVThreshold: number;
    advertiser: {
      id: number;
      name: string;
      email: string;
    };
  };
}
