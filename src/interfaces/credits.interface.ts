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
  reservationId?: string;
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

// Tipos mais específicos para validação
export interface CreditReservationRequest {
  userId: string;
  modelId: string;
  description?: string;
}

export interface CreditConfirmationRequest {
  userId: string;
  reservationId: string;
  modelId: string;
  imageId?: string;
  description?: string;
}

export interface CreditRefundRequest {
  userId: string;
  amount: number;
  description: string;
  relatedImageId?: string;
  originalTransactionId?: string;
  reservationId?: string;
}

// Tipos para respostas da API
export interface CreditReservationResponse {
  reservationId: string;
  cost: number;
  expiresAt: Date;
}

export interface CreditOperationResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Enum para status de reserva
export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

// Enum para tipos de transação
export enum TransactionType {
  EARNED = 'earned',
  SPENT = 'spent',
  REFUND = 'refund',
  BONUS = 'bonus'
}

export interface UserCreditsSummary {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  recentTransactions: CreditTransactionRecord[];
}