import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  is_premium: boolean("is_premium").default(false),
  stories_generated: integer("stories_generated").default(0),
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
  user_id: text("user_id").notNull().references(() => users.id),
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

export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: text("user_id").notNull().references(() => users.id),
  input_text: text("input_text").notNull(),
  output_story: text("output_story").notNull(),
  narration_mode: text("narration_mode").notNull().default('balanced'),
  content_type: text("content_type").default('general'),
  source: text("source").default('text'),
  story_id: text("story_id"),
  used_fallback: boolean("used_fallback").default(false),
  audio_url: text("audio_url"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users, {
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  is_premium: z.boolean().optional(),
  stories_generated: z.number().optional(),
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

export const insertStorySchema = createInsertSchema(stories).pick({
  user_id: true,
  input_text: true,
  output_story: true,
  narration_mode: true,
  content_type: true,
  source: true,
  story_id: true,
  used_fallback: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Story = typeof stories.$inferSelect;
