import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ─── Products ───────────────────────────────────────────────────────────
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").notNull().unique(),
  barcode: text("barcode"),
  name: text("name").notNull(),
  category: text("category"),
  buyPrice: integer("buy_price").notNull().default(0),
  salePrice: integer("sale_price").notNull().default(0),
  wholesalePrice: integer("wholesale_price"),
  wholesaleMin: integer("wholesale_min"),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  syncedAt: text("synced_at"),
});

// ─── Sales ──────────────────────────────────────────────────────────────
export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").notNull().unique(),
  sessionId: integer("session_id"),
  total: integer("total").notNull().default(0),
  givenAmount: integer("given_amount"),
  change: integer("change"),
  createdAt: text("created_at").notNull(),
  syncedAt: text("synced_at"),
});

export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id"),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0),
  totalPrice: integer("total_price").notNull().default(0),
  buyPrice: integer("buy_price").notNull().default(0),
  isWholesale: integer("is_wholesale").notNull().default(0),
  isCustom: integer("is_custom").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// ─── Returns ────────────────────────────────────────────────────────────
export const returns = sqliteTable("returns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").notNull().unique(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id),
  productId: integer("product_id"),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0),
  createdAt: text("created_at").notNull(),
  syncedAt: text("synced_at"),
});

// ─── Debt Clients ───────────────────────────────────────────────────────
export const debtClients = sqliteTable("debt_clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  balance: integer("balance").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  syncedAt: text("synced_at"),
});

export const debtTransactions = sqliteTable("debt_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").notNull().unique(),
  clientId: integer("client_id")
    .notNull()
    .references(() => debtClients.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'purchase' | 'payment' | 'add' | 'initial'
  amount: integer("amount").notNull().default(0),
  description: text("description"),
  createdAt: text("created_at").notNull(),
  syncedAt: text("synced_at"),
});

// ─── TypeScript types ───────────────────────────────────────────────────
export type Product = typeof products.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type Return = typeof returns.$inferSelect;
export type DebtClient = typeof debtClients.$inferSelect;
export type DebtTransaction = typeof debtTransactions.$inferSelect;
