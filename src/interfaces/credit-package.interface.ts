export interface CreditPackageInterface {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  priceInCents: number;
  currency: string;
  isActive: string;
  isPopular: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditPackagePurchaseInterface {
  id: string;
  userId: string;
  packageId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  credits: number;
  priceInCents: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}