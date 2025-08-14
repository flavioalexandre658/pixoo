export interface IPlan {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  priceInCents: number;
  currency: string;
  interval: string;
  intervalCount: number;
  credits: number;
  features?: string | null;
  isActive: boolean | null;
  isPopular: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePlan {
  code: string;
  name: string;
  description?: string;
  priceInCents: number;
  currency?: string;
  interval: string;
  intervalCount?: number;
  credits?: number;
  features?: string;
  isActive?: boolean;
  isPopular?: boolean;
}

export interface IUpdatePlan {
  code?: string;
  name?: string;
  description?: string;
  priceInCents?: number;
  currency?: string;
  interval?: string;
  intervalCount?: number;
  credits?: number;
  features?: string;
  isActive?: boolean;
  isPopular?: boolean;
}
