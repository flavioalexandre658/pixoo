export interface ISubscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date | null;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSubscription {
  userId: string;
  planId: string;
  status: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialStart?: Date;
  trialEnd?: Date;
}

export interface IUpdateSubscription {
  status?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
}

export interface ISubscriptionWithPlan extends ISubscription {
  plan: {
    id: string;
    name: string;
    price: string;
    currency: string;
    interval: string;
  };
}
