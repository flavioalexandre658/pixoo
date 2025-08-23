import { pgTable, text, timestamp, uuid, boolean, inet } from "drizzle-orm/pg-core";
import { users } from "./auth.schema";

export const deviceFingerprints = pgTable("device_fingerprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  fingerprint: text("fingerprint").notNull().unique(), // Hash único do dispositivo
  ipAddress: inet("ip_address").notNull(), // IP do dispositivo
  userAgent: text("user_agent").notNull(), // User agent do navegador
  screenResolution: text("screen_resolution"), // Resolução da tela
  timezone: text("timezone"), // Fuso horário
  language: text("language"), // Idioma do navegador
  platform: text("platform"), // Plataforma (Windows, Mac, etc.)
  hasReceivedCredits: boolean("has_received_credits").default(false).notNull(), // Se já recebeu créditos
  firstUserId: uuid("first_user_id").references(() => users.id), // Primeiro usuário que usou este dispositivo
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deviceFingerprintUsers = pgTable("device_fingerprint_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceFingerprintId: uuid("device_fingerprint_id").references(() => deviceFingerprints.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DeviceFingerprint = typeof deviceFingerprints.$inferSelect;
export type NewDeviceFingerprint = typeof deviceFingerprints.$inferInsert;
export type DeviceFingerprintUser = typeof deviceFingerprintUsers.$inferSelect;
export type NewDeviceFingerprintUser = typeof deviceFingerprintUsers.$inferInsert;