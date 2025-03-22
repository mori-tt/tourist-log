import React from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingCart,
  Gift,
  CreditCard,
} from "lucide-react";

interface TransactionTypeIconProps {
  type: string;
  className?: string;
  size?: number;
}

const TransactionTypeIcon: React.FC<TransactionTypeIconProps> = ({
  type,
  className,
  size = 16,
}) => {
  switch (type) {
    case "purchase":
      return <ShoppingCart className={className} size={size} />;
    case "tip":
      return <Gift className={className} size={size} />;
    case "receive_tip":
      return <Gift className={className} size={size} />;
    case "ad_payment":
      return <ArrowUpCircle className={className} size={size} />;
    case "ad_revenue":
      return <ArrowDownCircle className={className} size={size} />;
    case "advertisement":
      return <CreditCard className={className} size={size} />;
    default:
      return <CreditCard className={className} size={size} />;
  }
};

export default TransactionTypeIcon;
