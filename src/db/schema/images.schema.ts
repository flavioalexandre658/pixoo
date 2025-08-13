import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  bigint,
} from "drizzle-orm/pg-core";
import { users } from "./auth.schema";

export const generatedImages = pgTable("generated_images", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  taskId: text("task_id").notNull().unique(),
  prompt: text("prompt").notNull(),
  model: text("model").notNull(),
  aspectRatio: text("aspect_ratio").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"), // pending, ready, error
  creditsUsed: integer("credits_used").notNull().default(0),
  reservationId: text("reservation_id"), // ID da reserva de créditos
  generationTimeMs: integer("generation_time_ms"), // tempo em milissegundos
  seed: bigint("seed", { mode: "number" }),
  steps: integer("steps"),
  guidance: decimal("guidance", { precision: 3, scale: 1 }),
  isPublic: boolean("is_public").notNull().default(false),
  likes: integer("likes").notNull().default(0),
  category: text("category").default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type GeneratedImage = typeof generatedImages.$inferSelect;
export type NewGeneratedImage = typeof generatedImages.$inferInsert;
