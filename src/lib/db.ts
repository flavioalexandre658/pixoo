import { db } from "../../db";
import { users, plans, subscriptions } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { ICreateUser, IUpdateUser } from "../interfaces/user.interface";
import type { ICreatePlan, IUpdatePlan } from "../interfaces/plan.interface";
import type {
  ICreateSubscription,
  IUpdateSubscription,
} from "../interfaces/subscription.interface";
import { randomUUID } from "crypto";

// User operations
export const userOperations = {
  async create(data: ICreateUser) {
    const userWithId = {
      ...data,
      id: randomUUID(),
    };
    const [user] = await db.insert(users).values(userWithId).returning();
    return user;
  },

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async update(id: string, data: IUpdateUser) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
  },
};

// Plan operations
export const planOperations = {
  async create(data: ICreatePlan) {
    const planWithId = {
      ...data,
      id: randomUUID(),
    };
    const [plan] = await db.insert(plans).values(planWithId).returning();
    return plan;
  },

  async findById(id: string) {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  },

  async findActive() {
    return await db.select().from(plans).where(eq(plans.isActive, true));
  },

  async update(id: string, data: IUpdatePlan) {
    const [plan] = await db
      .update(plans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return plan;
  },

  async delete(id: string) {
    await db.delete(plans).where(eq(plans.id, id));
  },
};

// Subscription operations
export const subscriptionOperations = {
  async create(data: ICreateSubscription) {
    const subscriptionWithId = {
      ...data,
      id: randomUUID(),
    };
    const [subscription] = await db
      .insert(subscriptions)
      .values(subscriptionWithId)
      .returning();
    return subscription;
  },

  async findById(id: string) {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  },

  async findByUserId(userId: string) {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
  },

  async findActiveByUserId(userId: string) {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      );
    return subscription;
  },

  async update(id: string, data: IUpdateSubscription) {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  },

  async delete(id: string) {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
  },
};
