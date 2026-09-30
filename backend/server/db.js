import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedOrders, seedProducts, DEFAULT_SETTINGS, DEFAULT_ABOUT, DEFAULT_JOURNAL, DEFAULT_FAQ } from './seed-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(backendRoot, process.env.DATA_DIR || 'data');
const DB_PATH = process.env.DB_PATH ? path.resolve(backendRoot, process.env.DB_PATH) : path.join(DATA_DIR, 'pishneefo.db');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);

// WAL ทำให้อ่านพร้อมเขียนได้ ไม่ล็อกกันเวลามีหลาย request
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ─────────────────────────── schema ───────────────────────────
   ตารางสินค้า/เนื้อหาเก็บเป็นคอลัมน์ปกติเพื่อให้ query และ index ได้
   ส่วน order_lines เก็บเป็น JSON เพราะเป็น "ภาพนิ่ง ณ เวลาที่สั่ง"
   ที่ต้องไม่เปลี่ยนตามสินค้าปัจจุบัน และไม่เคยถูก query แยกชิ้น
   ─────────────────────────────────────────────────────────────── */

db.exec(`
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id               TEXT PRIMARY KEY,
  slug             TEXT UNIQUE,
  name             TEXT NOT NULL,
  price            INTEGER NOT NULL,
  original_price   INTEGER,
  category         TEXT NOT NULL,
  material         TEXT NOT NULL,
  image            TEXT NOT NULL DEFAULT '',
  gallery          TEXT NOT NULL DEFAULT '[]',
  short_description TEXT NOT NULL DEFAULT '',
  description      TEXT NOT NULL DEFAULT '',
  sku              TEXT,
  stock            INTEGER NOT NULL DEFAULT 0,
  badge            TEXT,
  is_featured      INTEGER NOT NULL DEFAULT 0,
  active           INTEGER NOT NULL DEFAULT 1,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS orders (
  id             TEXT PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  status         TEXT NOT NULL,
  customer       TEXT NOT NULL,   -- JSON
  lines          TEXT NOT NULL,   -- JSON: ภาพนิ่งของสินค้า ณ เวลาที่สั่ง
  subtotal       INTEGER NOT NULL,
  shipping       INTEGER NOT NULL,
  total          INTEGER NOT NULL,
  pay_currency   TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  internal_note  TEXT NOT NULL DEFAULT '',
  is_demo        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS journal (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT '',
  summary    TEXT NOT NULL DEFAULT '',
  content    TEXT NOT NULL DEFAULT '',
  image      TEXT NOT NULL DEFAULT '',
  read_time  TEXT NOT NULL DEFAULT '',
  published  INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faq (
  id         TEXT PRIMARY KEY,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,   -- scrypt, hex
  salt          TEXT NOT NULL,   -- hex
  created_at    TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,  -- เก็บเป็น sha256 ของ token จริง ไม่เก็บตัว token
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip        TEXT PRIMARY KEY,
  failures  INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT
);
`);

/* ─────────────────────────── helpers ─────────────────────────── */

export function getMeta(key, fallback = null) {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : fallback;
}

export function setMeta(key, value) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, JSON.stringify(value));
}

/** แปลงแถวจาก DB เป็นรูปทรงที่ฝั่ง client ใช้ (camelCase) */
export const rowToProduct = (r) => ({
  id: r.id,
  slug: r.slug ?? '',
  name: r.name,
  price: r.price,
  originalPrice: r.original_price ?? undefined,
  category: r.category,
  material: r.material,
  image: r.image,
  gallery: JSON.parse(r.gallery),
  shortDescription: r.short_description,
  description: r.description,
  sku: r.sku ?? '',
  stock: r.stock,
  badge: r.badge ?? '',
  isFeatured: !!r.is_featured,
  active: !!r.active,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const rowToOrder = (r) => ({
  id: r.id,
  code: r.code,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  status: r.status,
  customer: JSON.parse(r.customer),
  lines: JSON.parse(r.lines),
  subtotal: r.subtotal,
  shipping: r.shipping,
  total: r.total,
  payCurrency: r.pay_currency,
  paymentMethod: r.payment_method,
  internalNote: r.internal_note,
});

export const rowToArticle = (r) => ({
  id: r.id,
  title: r.title,
  category: r.category,
  summary: r.summary,
  content: r.content,
  image: r.image,
  readTime: r.read_time,
  published: !!r.published,
});

export const rowToFaq = (r) => ({ id: r.id, question: r.question, answer: r.answer });

/* ─────────────────────────── seed ─────────────────────────── */

const insertProduct = db.prepare(`
  INSERT INTO products (id, slug, name, price, original_price, category, material, image, gallery,
                        short_description, description, sku, stock, badge, is_featured, active,
                        sort_order, created_at, updated_at)
  VALUES (@id, @slug, @name, @price, @original_price, @category, @material, @image, @gallery,
          @short_description, @description, @sku, @stock, @badge, @is_featured, @active,
          @sort_order, @created_at, @updated_at)
`);

const insertOrder = db.prepare(`
  INSERT INTO orders (id, code, created_at, updated_at, status, customer, lines,
                      subtotal, shipping, total, pay_currency, payment_method, internal_note, is_demo)
  VALUES (@id, @code, @created_at, @updated_at, @status, @customer, @lines,
          @subtotal, @shipping, @total, @pay_currency, @payment_method, @internal_note, @is_demo)
`);

export function productToRow(p, index = 0) {
  const now = new Date().toISOString();
  return {
    id: p.id,
    slug: p.slug || null,
    name: p.name,
    price: Math.round(p.price),
    original_price: p.originalPrice ? Math.round(p.originalPrice) : null,
    category: p.category,
    material: p.material,
    image: p.image ?? '',
    gallery: JSON.stringify(p.gallery ?? []),
    short_description: p.shortDescription ?? '',
    description: p.description ?? '',
    sku: p.sku ?? null,
    stock: Math.max(0, Math.round(p.stock ?? 0)),
    badge: p.badge || null,
    is_featured: p.isFeatured ? 1 : 0,
    active: p.active === false ? 0 : 1,
    sort_order: index,
    created_at: p.createdAt ?? now,
    updated_at: p.updatedAt ?? now,
  };
}

export function orderToRow(o, isDemo = 0) {
  return {
    id: o.id,
    code: o.code,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    status: o.status,
    customer: JSON.stringify(o.customer),
    lines: JSON.stringify(o.lines),
    subtotal: Math.round(o.subtotal),
    shipping: Math.round(o.shipping),
    total: Math.round(o.total),
    pay_currency: o.payCurrency,
    payment_method: o.paymentMethod,
    internal_note: o.internalNote ?? '',
    is_demo: isDemo,
  };
}

/** ใส่ข้อมูลตั้งต้นครั้งแรกที่รัน — ไม่แตะอะไรถ้ามีข้อมูลอยู่แล้ว */
export function seedIfEmpty({ withDemoOrders = true } = {}) {
  const empty = db.prepare('SELECT COUNT(*) AS n FROM products').get().n === 0;
  if (!empty) return false;

  const run = db.transaction(() => {
    seedProducts().forEach((p, i) => insertProduct.run(productToRow(p, i)));

    if (withDemoOrders) {
      seedOrders().forEach((o) => insertOrder.run(orderToRow(o, 1)));
    }

    const insertArticle = db.prepare(
      `INSERT INTO journal (id, title, category, summary, content, image, read_time, published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    );
    DEFAULT_JOURNAL.forEach((a, i) =>
      insertArticle.run(a.id, a.title, a.category, a.summary, a.content, a.image, a.readTime, i));

    const insertFaq = db.prepare('INSERT INTO faq (id, question, answer, sort_order) VALUES (?, ?, ?, ?)');
    DEFAULT_FAQ.forEach((f, i) => insertFaq.run(f.id, f.question, f.answer, i));

    setMeta('settings', DEFAULT_SETTINGS);
    setMeta('about', DEFAULT_ABOUT);
    setMeta('schema_version', 1);
  });

  run();
  return true;
}

/** ลบ session ที่หมดอายุแล้ว เรียกตอนบูตและเป็นระยะ */
export function pruneSessions() {
  const result = db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  return result.changes;
}
