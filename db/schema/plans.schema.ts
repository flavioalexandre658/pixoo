import {
  pgTable,
  varchar,
  decimal,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const plans = pgTable("plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  interval: varchar("interval", { length: 20 }).notNull(), // monthly, yearly, etc
  intervalCount: integer("interval_count").notNull().default(1),
  features: varchar("features", { length: 1000 }), // JSON string of features
  maxUsers: integer("max_users"),
  maxProjects: integer("max_projects"),
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
