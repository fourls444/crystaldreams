import { pgTable, uuid, text, numeric, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// 1. Products Table Definition
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default("หมอน Crystal Dreams"),
  price: numeric("price").notNull().default("1890"),
  stock: integer("stock").notNull().default(0),
  image_url: text("image_url"),
  description: text("description"),
  detail: text("detail"),
  image_urls: text("image_urls").array(),
  is_visible: boolean("is_visible").notNull().default(true),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 2. Orders Table Definition
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  product_id: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull().default(1),
  total_amount: numeric("total_amount").notNull(),
  customer_name: text("customer_name"),
  customer_tel: text("customer_tel"),
  customer_address: text("customer_address"),
  status: text("status").notNull().default("pending"),
  slip_url: text("slip_url"),
  slip_verified: boolean("slip_verified").default(false),
  verified_by: text("verified_by"),
  payment_method: text("payment_method").notNull().default("promptpay"),
  items: jsonb("items"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 3. Settings Table Definition
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
