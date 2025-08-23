import { pgTable, text, timestamp, uuid, inet, jsonb, boolean } from "drizzle-orm/pg-core";

export const securityLogs = pgTable("security_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(), // 'account_creation', 'rate_limit_exceeded', 'suspicious_activity', 'fingerprint_reuse'
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  ipAddress: inet("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  fingerprint: text("fingerprint"),
  userId: text("user_id"), // Se aplicável
  email: text("email"), // Se aplicável
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Dados adicionais em JSON
  isResolved: boolean("is_resolved").default(false).notNull(),
  resolvedBy: text("resolved_by"), // ID do admin que resolveu
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const abuseReports = pgTable("abuse_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportType: text("report_type").notNull(), // 'multiple_accounts', 'credit_farming', 'suspicious_pattern'
  ipAddress: inet("ip_address").notNull(),
  fingerprint: text("fingerprint"),
  affectedUserIds: jsonb("affected_user_ids"), // Array de user IDs relacionados
  evidenceData: jsonb("evidence_data").notNull(), // Evidências do abuso
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  status: text("status").default('pending').notNull(), // 'pending', 'investigating', 'confirmed', 'false_positive', 'resolved'
  actionTaken: text("action_taken"), // Ação tomada pelo sistema
  notes: text("notes"), // Notas do admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SecurityLog = typeof securityLogs.$inferSelect;
export type NewSecurityLog = typeof securityLogs.$inferInsert;
export type AbuseReport = typeof abuseReports.$inferSelect;
export type NewAbuseReport = typeof abuseReports.$inferInsert;