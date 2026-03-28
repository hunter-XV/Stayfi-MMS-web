import { NextRequest, NextResponse } from "next/server";
import { getRawDb } from "@/lib/database";

// ─── Auth ────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const apiKey = process.env.SYNC_API_KEY;
  if (!apiKey) return false; // key must be set
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${apiKey}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface SyncPayload {
  type: "full" | "incremental";
  data: {
    products?: Record<string, unknown>[];
    sales?: Record<string, unknown>[];
    saleItems?: Record<string, unknown>[];
    returns?: Record<string, unknown>[];
    debtClients?: Record<string, unknown>[];
    debtTransactions?: Record<string, unknown>[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function upsertRows(
  db: ReturnType<typeof getRawDb>,
  table: string,
  rows: Record<string, unknown>[]
): number {
  if (!rows || rows.length === 0) return 0;

  // Build columns from first row
  const cols = Object.keys(rows[0]);
  const placeholders = cols.map(() => "?").join(", ");
  const colList = cols.join(", ");

  const stmt = db.prepare(
    `INSERT OR REPLACE INTO ${table} (${colList}) VALUES (${placeholders})`
  );

  const upsertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) {
      stmt.run(cols.map((c) => item[c]));
    }
  });

  upsertMany(rows);
  return rows.length;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SyncPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.data || typeof payload.data !== "object") {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const db = getRawDb();
  let totalCount = 0;

  try {
    if (payload.type === "full") {
      // Wipe all tables before a full sync
      db.exec(`
        DELETE FROM debt_transactions;
        DELETE FROM returns;
        DELETE FROM sale_items;
        DELETE FROM sales;
        DELETE FROM debt_clients;
        DELETE FROM products;
      `);
    }

    const { data } = payload;

    if (data.products)
      totalCount += upsertRows(db, "products", data.products);
    if (data.sales)
      totalCount += upsertRows(db, "sales", data.sales);
    if (data.saleItems)
      totalCount += upsertRows(db, "sale_items", data.saleItems);
    if (data.returns)
      totalCount += upsertRows(db, "returns", data.returns);
    if (data.debtClients)
      totalCount += upsertRows(db, "debt_clients", data.debtClients);
    if (data.debtTransactions)
      totalCount += upsertRows(db, "debt_transactions", data.debtTransactions);

    return NextResponse.json({ success: true, count: totalCount });
  } catch (err) {
    console.error("[sync] error:", err);
    return NextResponse.json(
      { error: "Sync failed", detail: String(err) },
      { status: 500 }
    );
  }
}

// ─── GET — health check ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
