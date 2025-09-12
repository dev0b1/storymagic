import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const user_profiles = pgTable("user_profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  is_premium: boolean("is_premium").default(false),
  documents_processed: integer("documents_processed").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  subscription_status: text("subscription_status").default('free'),
  subscription_id: text("subscription_id"),
  subscription_end_date: timestamp("subscription_end_date"),
  lemonsqueezy_customer_id: text("lemonsqueezy_customer_id"),
  lemonsqueezy_subscription_id: text("lemonsqueezy_subscription_id")
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: text("user_id").notNull().references(() => user_profiles.id),
  lemonsqueezy_subscription_id: text("lemonsqueezy_subscription_id").notNull(),
  lemonsqueezy_order_id: text("lemonsqueezy_order_id"),
  lemonsqueezy_product_id: text("lemonsqueezy_product_id"),
  lemonsqueezy_variant_id: text("lemonsqueezy_variant_id"),
  status: text("status").notNull().default('inactive'),
  plan_type: text("plan_type").notNull(),
  current_period_start: timestamp("current_period_start", { withTimezone: true }).notNull(),
  current_period_end: timestamp("current_period_end", { withTimezone: true }).notNull(),
  amount: integer("amount").notNull(), // Amount in cents (USD)
  currency: text("currency").default('USD'),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: text("user_id").notNull().references(() => user_profiles.id),
  title: text("title").notNull(),
  file_name: text("file_name").notNull(),
  file_url: text("file_url").notNull(),
  file_size: integer("file_size"),
  content_type: text("content_type").default('pdf'),
  extracted_text: text("extracted_text"),
  summary: text("summary"),
  processing_status: text("processing_status").default('pending'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  document_id: uuid("document_id").notNull().references(() => documents.id),
  user_id: text("user_id").notNull().references(() => user_profiles.id),
  front: text("front").notNull(),
  back: text("back").notNull(),
  hint: text("hint"),
  difficulty: text("difficulty").default('medium'),
  category: text("category"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const study_sessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: text("user_id").notNull().references(() => user_profiles.id),
  document_id: uuid("document_id").references(() => documents.id),
  session_type: text("session_type").default('flashcards'),
  cards_studied: integer("cards_studied").default(0),
  correct_answers: integer("correct_answers").default(0),
  session_duration: integer("session_duration").default(0), // in seconds
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(user_profiles, {
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  is_premium: z.boolean().optional(),
  documents_processed: z.number().optional(),
  subscription_status: z.enum(['free', 'active', 'inactive', 'cancelled']).optional(),
  subscription_id: z.string().optional(),
  subscription_end_date: z.date().optional(),
  lemonsqueezy_customer_id: z.string().optional(),
  lemonsqueezy_subscription_id: z.string().optional()
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  user_id: true,
  lemonsqueezy_subscription_id: true,
  lemonsqueezy_order_id: true,
  lemonsqueezy_product_id: true,
  lemonsqueezy_variant_id: true,
  status: true,
  plan_type: true,
  current_period_start: true,
  current_period_end: true,
  amount: true,
  currency: true
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  user_id: true,
  title: true,
  file_name: true,
  file_url: true,
  file_size: true,
  content_type: true,
  extracted_text: true,
  summary: true,
  processing_status: true,
});

export const insertFlashcardSchema = createInsertSchema(flashcards).pick({
  document_id: true,
  user_id: true,
  front: true,
  back: true,
  hint: true,
  difficulty: true,
  category: true,
});

export const insertStudySessionSchema = createInsertSchema(study_sessions).pick({
  user_id: true,
  document_id: true,
  session_type: true,
  cards_studied: true,
  correct_answers: true,
  session_duration: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type UserProfile = typeof user_profiles.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type StudySession = typeof study_sessions.$inferSelect;
