import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const DB_PATH =
  process.env.STAYEFI_DB_PATH ||
  path.join(process.cwd(), "data", "stayefi-web.db");

let _sqlite: Database.Database | null = null;

function getSqlite() {
  if (!_sqlite) {
    // Ensure directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    _sqlite = new Database(DB_PATH);
    _sqlite.pragma("journal_mode = WAL");
    _sqlite.pragma("foreign_keys = ON");
    initTables(_sqlite);
  }
  return _sqlite;
}

function initTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid        TEXT NOT NULL UNIQUE,
      barcode     TEXT,
      name        TEXT NOT NULL,
      category    TEXT,
      buy_price   INTEGER NOT NULL DEFAULT 0,
      sale_price  INTEGER NOT NULL DEFAULT 0,
      wholesale_price INTEGER,
      wholesale_min   INTEGER,
      stock           INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      synced_at   TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid        TEXT NOT NULL UNIQUE,
      session_id  INTEGER,
      total       INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL,
      synced_at   TEXT
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id     INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id  INTEGER,
      name        TEXT NOT NULL,
      quantity    INTEGER NOT NULL DEFAULT 1,
      unit_price  INTEGER NOT NULL DEFAULT 0,
      buy_price   INTEGER NOT NULL DEFAULT 0,
      is_wholesale INTEGER NOT NULL DEFAULT 0,
      is_custom   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS returns (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid        TEXT NOT NULL UNIQUE,
      sale_id     INTEGER NOT NULL REFERENCES sales(id),
      product_id  INTEGER,
      name        TEXT NOT NULL,
      quantity    INTEGER NOT NULL DEFAULT 1,
      unit_price  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL,
      synced_at   TEXT
    );

    CREATE TABLE IF NOT EXISTS debt_clients (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      balance     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      synced_at   TEXT
    );

    CREATE TABLE IF NOT EXISTS debt_transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid        TEXT NOT NULL UNIQUE,
      client_id   INTEGER NOT NULL REFERENCES debt_clients(id) ON DELETE CASCADE,
      type        TEXT NOT NULL CHECK(type IN ('purchase','payment','add','initial')),
      amount      INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at  TEXT NOT NULL,
      synced_at   TEXT
    );
  `);
}

export function getDatabase() {
  const sqlite = getSqlite();
  return drizzle(sqlite, { schema });
}

export function getRawDb() {
  return getSqlite();
}
