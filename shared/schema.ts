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
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  name: true,
  is_premium: true,
  stories_generated: true,
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
export type User = typeof users.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
