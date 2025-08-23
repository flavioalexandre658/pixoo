import { pgTable, text, timestamp, uuid, integer, inet, boolean } from "drizzle-orm/pg-core";

export const accountCreationAttempts = pgTable("account_creation_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ipAddress: inet("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  fingerprint: text("fingerprint"), // Opcional, pode não estar disponível
  email: text("email"), // Email tentado (para detectar spam)
  success: boolean("success").default(false).notNull(), // Se a criação foi bem-sucedida
  attemptCount: integer("attempt_count").default(1).notNull(), // Número de tentativas
  lastAttemptAt: timestamp("last_attempt_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ipRateLimits = pgTable("ip_rate_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  ipAddress: inet("ip_address").notNull().unique(),
  accountCreationCount: integer("account_creation_count").default(0).notNull(),
  lastAccountCreation: timestamp("last_account_creation"),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  blockedUntil: timestamp("blocked_until"),
  blockReason: text("block_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AccountCreationAttempt = typeof accountCreationAttempts.$inferSelect;
export type NewAccountCreationAttempt = typeof accountCreationAttempts.$inferInsert;
export type IpRateLimit = typeof ipRateLimits.$inferSelect;
export type NewIpRateLimit = typeof ipRateLimits.$inferInsert;