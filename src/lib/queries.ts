/**
 * Server-only data access layer for the web dashboard.
 * All functions run on the server side only (used in Server Components / Route Handlers).
 */
import { getRawDb } from "./database";

// ─── Dashboard Stats ────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  salesCount: number;
  avgBasket: number;
  lowStockCount: number;
  totalReturns: number;
  topByRevenue: Array<{ name: string; revenue: number }>;
  topByQuantity: Array<{ name: string; totalQty: number }>;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  dailyCost: Array<{ date: string; cost: number }>;
  wholesaleRevenue: number;
  regularRevenue: number;
}

export function getDashboardStats(
  dateFrom: string,
  dateTo: string
): DashboardStats {
  const db = getRawDb();

  const salesData = db
    .prepare(
      `SELECT COALESCE(SUM(s.total), 0) as totalRevenue, COUNT(s.id) as salesCount
     FROM sales s WHERE s.created_at >= ? AND s.created_at <= ?`
    )
    .get(dateFrom, dateTo) as { totalRevenue: number; salesCount: number };

  const costData = db
    .prepare(
      `SELECT COALESCE(SUM(si.buy_price * si.quantity), 0) as totalCost
     FROM sale_items si JOIN sales s ON si.sale_id = s.id
     WHERE s.created_at >= ? AND s.created_at <= ? AND si.is_custom = 0`
    )
    .get(dateFrom, dateTo) as { totalCost: number };

  const returnsData = db
    .prepare(
      `SELECT COALESCE(SUM(r.unit_price * r.quantity), 0) as totalReturns
     FROM returns r WHERE r.created_at >= ? AND r.created_at <= ?`
    )
    .get(dateFrom, dateTo) as { totalReturns: number };

  // Cost of returned items — subtract from totalCost so gross profit isn't understated
  const returnedCostData = db
    .prepare(
      `SELECT COALESCE(SUM(r.quantity * si.buy_price), 0) as returnedCost
     FROM returns r
     JOIN sale_items si ON r.sale_id = si.sale_id AND r.product_id = si.product_id
     WHERE r.created_at >= ? AND r.created_at <= ?`
    )
    .get(dateFrom, dateTo) as { returnedCost: number };

  const topByRevenue = db
    .prepare(
      `SELECT si.name, SUM(COALESCE(NULLIF(si.total_price, 0), si.unit_price * si.quantity)) as revenue
     FROM sale_items si JOIN sales s ON si.sale_id = s.id
     WHERE s.created_at >= ? AND s.created_at <= ? AND si.is_custom = 0
     GROUP BY si.name ORDER BY revenue DESC LIMIT 5`
    )
    .all(dateFrom, dateTo) as Array<{ name: string; revenue: number }>;

  const topByQuantity = db
    .prepare(
      `SELECT si.name, SUM(si.quantity) as totalQty
     FROM sale_items si JOIN sales s ON si.sale_id = s.id
     WHERE s.created_at >= ? AND s.created_at <= ? AND si.is_custom = 0
     GROUP BY si.name ORDER BY totalQty DESC LIMIT 5`
    )
    .all(dateFrom, dateTo) as Array<{ name: string; totalQty: number }>;

  const dailyRevenue = db
    .prepare(
      `SELECT
        d.date,
        d.revenue - COALESCE(dr.returnTotal, 0) as revenue
      FROM (
        SELECT DATE(s.created_at) as date, SUM(s.total) as revenue
        FROM sales s
        WHERE s.created_at >= ? AND s.created_at <= ?
        GROUP BY DATE(s.created_at)
      ) d
      LEFT JOIN (
        SELECT DATE(r.created_at) as date, SUM(r.unit_price * r.quantity) as returnTotal
        FROM returns r
        WHERE r.created_at >= ? AND r.created_at <= ?
        GROUP BY DATE(r.created_at)
      ) dr ON d.date = dr.date
      ORDER BY d.date`
    )
    .all(dateFrom, dateTo, dateFrom, dateTo) as Array<{ date: string; revenue: number }>;

  const dailyCost = db
    .prepare(
      `SELECT DATE(s.created_at) as date, SUM(si.buy_price * si.quantity) as cost
     FROM sale_items si JOIN sales s ON si.sale_id = s.id
     WHERE s.created_at >= ? AND s.created_at <= ? AND si.is_custom = 0
     GROUP BY DATE(s.created_at) ORDER BY date`
    )
    .all(dateFrom, dateTo) as Array<{ date: string; cost: number }>;

  const wholesaleStats = db
    .prepare(
      `SELECT
      SUM(CASE WHEN si.is_wholesale = 1 THEN COALESCE(NULLIF(si.total_price, 0), si.unit_price * si.quantity) ELSE 0 END) as wholesaleRevenue,
      SUM(CASE WHEN si.is_wholesale = 0 AND si.is_custom = 0 THEN COALESCE(NULLIF(si.total_price, 0), si.unit_price * si.quantity) ELSE 0 END) as regularRevenue
     FROM sale_items si JOIN sales s ON si.sale_id = s.id
     WHERE s.created_at >= ? AND s.created_at <= ?`
    )
    .get(dateFrom, dateTo) as {
    wholesaleRevenue: number;
    regularRevenue: number;
  };

  const lowStockCount = db
    .prepare(
      `SELECT COUNT(*) as count FROM products WHERE stock <= low_stock_threshold`
    )
    .get() as { count: number };

  const revenue = salesData.totalRevenue - returnsData.totalReturns;
  const netCost = costData.totalCost - returnedCostData.returnedCost;

  return {
    totalRevenue: revenue,
    totalCost: netCost,
    grossProfit: revenue - netCost,
    salesCount: salesData.salesCount,
    avgBasket:
      salesData.salesCount > 0
        ? Math.floor(revenue / salesData.salesCount)
        : 0,
    lowStockCount: lowStockCount.count,
    totalReturns: returnsData.totalReturns,
    topByRevenue,
    topByQuantity,
    dailyRevenue,
    dailyCost,
    wholesaleRevenue: wholesaleStats.wholesaleRevenue || 0,
    regularRevenue: wholesaleStats.regularRevenue || 0,
  };
}

// ─── Sales ──────────────────────────────────────────────────────────────

export interface SaleRow {
  id: number;
  uuid: string;
  total: number;
  createdAt: string;
  itemCount: number;
}

export function getSales(
  dateFrom?: string,
  dateTo?: string,
  limit = 100
): SaleRow[] {
  const db = getRawDb();
  let query = `SELECT s.id, s.uuid, s.total, s.created_at as createdAt,
    (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as itemCount
    FROM sales s`;
  const params: string[] = [];

  if (dateFrom && dateTo) {
    query += ` WHERE s.created_at >= ? AND s.created_at <= ?`;
    params.push(dateFrom, dateTo);
  }
  query += ` ORDER BY s.created_at DESC LIMIT ?`;
  params.push(String(limit));

  return db.prepare(query).all(...params) as SaleRow[];
}

// ─── Products ───────────────────────────────────────────────────────────

export interface ProductRow {
  id: number;
  uuid: string;
  name: string;
  barcode: string | null;
  category: string | null;
  buyPrice: number;
  salePrice: number;
  wholesalePrice: number | null;
  wholesaleMin: number | null;
  stock: number;
  lowStockThreshold: number;
}

export function getProducts(search?: string): ProductRow[] {
  const db = getRawDb();
  let query = `SELECT id, uuid, name, barcode, category, buy_price as buyPrice,
    sale_price as salePrice, wholesale_price as wholesalePrice,
    wholesale_min as wholesaleMin, stock, low_stock_threshold as lowStockThreshold
    FROM products`;
  const params: string[] = [];

  if (search) {
    query += ` WHERE (name LIKE ? OR barcode LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ` ORDER BY name`;

  return db.prepare(query).all(...params) as ProductRow[];
}

// ─── Debt Clients ───────────────────────────────────────────────────────

export interface DebtClientRow {
  id: number;
  uuid: string;
  name: string;
  balance: number;
  createdAt: string;
  transactionCount: number;
}

export function getDebtClients(): DebtClientRow[] {
  const db = getRawDb();
  return db
    .prepare(
      `SELECT dc.id, dc.uuid, dc.name, dc.balance, dc.created_at as createdAt,
      (SELECT COUNT(*) FROM debt_transactions dt WHERE dt.client_id = dc.id) as transactionCount
      FROM debt_clients dc ORDER BY dc.updated_at DESC`
    )
    .all() as DebtClientRow[];
}

export function getDebtClient(id: number): DebtClientRow | undefined {
  const db = getRawDb();
  return db
    .prepare(
      `SELECT dc.id, dc.uuid, dc.name, dc.balance, dc.created_at as createdAt,
      (SELECT COUNT(*) FROM debt_transactions dt WHERE dt.client_id = dc.id) as transactionCount
      FROM debt_clients dc WHERE dc.id = ?`
    )
    .get(id) as DebtClientRow | undefined;
}

export interface DebtTransactionRow {
  id: number;
  clientId: number;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

export function getDebtTransactions(clientId: number): DebtTransactionRow[] {
  const db = getRawDb();
  return db
    .prepare(
      `SELECT id, client_id as clientId, type, amount, description, created_at as createdAt
      FROM debt_transactions WHERE client_id = ? ORDER BY created_at DESC`
    )
    .all(clientId) as DebtTransactionRow[];
}
