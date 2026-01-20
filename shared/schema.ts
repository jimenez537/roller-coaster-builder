import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const coasters = pgTable("coasters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  trackPoints: jsonb("track_points").notNull(),
  loopSegments: jsonb("loop_segments").notNull().default([]),
  isLooped: boolean("is_looped").notNull().default(false),
  hasChainLift: boolean("has_chain_lift").notNull().default(true),
  showWoodSupports: boolean("show_wood_supports").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCoasterSchema = createInsertSchema(coasters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCoaster = z.infer<typeof insertCoasterSchema>;
export type Coaster = typeof coasters.$inferSelect;
