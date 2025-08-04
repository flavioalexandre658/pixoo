export interface IPlan {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  currency: string;
  interval: string;
  intervalCount: number;
  features?: string | null;
  maxUsers?: number | null;
  maxProjects?: number | null;
  isActive: boolean;
  isPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePlan {
  name: string;
  description?: string;
  price: string;
  currency?: string;
  interval: string;
  intervalCount?: number;
  features?: string;
  maxUsers?: number;
  maxProjects?: number;
  isActive?: boolean;
  isPopular?: boolean;
}

export interface IUpdatePlan {
  name?: string;
  description?: string;
  price?: string;
  currency?: string;
  interval?: string;
  intervalCount?: number;
  features?: string;
  maxUsers?: number;
  maxProjects?: number;
  isActive?: boolean;
  isPopular?: boolean;
}
