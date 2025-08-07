export interface UserCreditsBalance {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransactionRecord {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'refund' | 'bonus';
  amount: number;
  description: string;
  relatedImageId?: string;
  metadata?: string;
  balanceAfter: number;
  createdAt: Date;
}

export interface ModelCostConfig {
  id: string;
  modelId: string;
  modelName: string;
  credits: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditUsageRequest {
  userId: string;
  modelId: string;
  imageId?: string;
  description?: string;
}

export interface CreditEarnRequest {
  userId: string;
  amount: number;
  description: string;
  type: 'earned' | 'bonus' | 'refund';
  relatedImageId?: string;
}

export interface UserCreditsSummary {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  recentTransactions: CreditTransactionRecord[];
}