import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth.schema";
import { generatedImages } from "./images.schema";

// Tabela para armazenar o saldo atual de créditos do usuário
export const userCredits = pgTable("user_credits", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0), // Saldo atual de créditos
  totalEarned: integer("total_earned").notNull().default(0), // Total de créditos ganhos
  totalSpent: integer("total_spent").notNull().default(0), // Total de créditos gastos
  freeCreditsBalance: integer("free_credits_balance").notNull().default(5), // Saldo de créditos gratuitos diários
  lastFreeCreditsRenewal: timestamp("last_free_credits_renewal").defaultNow().notNull(), // Data da última renovação de créditos gratuitos
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela para reservas de créditos temporárias
export const creditReservations = pgTable("credit_reservations", {
  id: text("id").primaryKey(), // Este é o reservationId
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  modelId: varchar("model_id", { length: 50 }).notNull(),
  amount: integer("amount").notNull(), // Quantidade de créditos reservados
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'confirmed', 'cancelled'
  taskId: text("task_id"), // ID da tarefa de geração (quando disponível)
  expiresAt: timestamp("expires_at").notNull(), // Reserva expira em 30 minutos
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela para histórico de transações de créditos
export const creditTransactions = pgTable("credit_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'earned', 'spent', 'refund', 'bonus'
  amount: integer("amount").notNull(), // Quantidade de créditos (positivo para ganho, negativo para gasto)
  description: text("description").notNull(), // Descrição da transação
  relatedImageId: text("related_image_id").references(() => generatedImages.id), // Referência para imagem gerada (se aplicável)
  reservationId: text("reservation_id").references(() => creditReservations.id), // Referência para reserva (se aplicável)
  metadata: text("metadata"), // JSON com dados adicionais (modelo usado, etc.)
  balanceAfter: integer("balance_after").notNull(), // Saldo após a transação
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela para configuração de custos por modelo
export const modelCosts = pgTable("model_costs", {
  id: text("id").primaryKey(),
  modelId: varchar("model_id", { length: 50 }).notNull().unique(),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  credits: integer("credits").notNull(), // Custo em créditos
  isActive: varchar("is_active", { length: 10 }).notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserCredits = typeof userCredits.$inferSelect;
export type NewUserCredits = typeof userCredits.$inferInsert;

export type CreditReservation = typeof creditReservations.$inferSelect;
export type NewCreditReservation = typeof creditReservations.$inferInsert;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;

export type ModelCost = typeof modelCosts.$inferSelect;
export type NewModelCost = typeof modelCosts.$inferInsert;