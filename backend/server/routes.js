import crypto from 'node:crypto';
import express from 'express';
import {
  db, getMeta, setMeta, rowToProduct, rowToOrder, rowToArticle, rowToFaq,
  productToRow, orderToRow, seedIfEmpty,
} from './db.js';
import {
  SESSION_COOKIE, changePassword, cookieOptions, createAccount, destroySession,
  hasAccount, login, requireAuth, resolveSession,
} from './auth.js';
import { seedOrders } from './seed-data.js';

export const router = express.Router();

/* ─────────────────────────── ตัวช่วย validate ───────────────────────────
   กฎเหล็ก: อย่าเชื่อข้อมูลจาก client ต่อให้ฝั่งหน้าเว็บจะตรวจมาแล้วก็ตาม
   ─────────────────────────────────────────────────────────────────────── */

const str = (v, max = 2000) => String(v ?? '').slice(0, max);
const money = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const bool = (v) => !!v;
const CATEGORIES = ['Tropical', 'Shells', 'Waves', 'Sea Life', 'Anklets', 'Letters', 'Symbols'];
const MATERIALS = ['Gold', 'Silver', 'Mixed Metal'];
const STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];

function validateProduct(body) {
  const errors = [];
  const name = str(body.name, 200).trim();
  if (!name) errors.push('ต้องใส่ชื่อสินค้า');

  const price = money(body.price);
  if (price === null || price <= 0) errors.push('ราคาต้องเป็นตัวเลขมากกว่า 0');

  const originalPrice = body.originalPrice === undefined || body.originalPrice === null || body.originalPrice === ''
    ? null
    : money(body.originalPrice);
  if (body.originalPrice && originalPrice === null) errors.push('ราคาเดิมไม่ถูกต้อง');
  if (originalPrice !== null && price !== null && originalPrice <= price) errors.push('ราคาเดิมต้องสูงกว่าราคาขาย');

  const stock = money(body.stock ?? 0);
  if (stock === null) errors.push('สต็อกต้องเป็นจำนวนเต็มไม่ติดลบ');

  const category = CATEGORIES.includes(body.category) ? body.category : null;
  if (!category) errors.push('หมวดหมู่ไม่ถูกต้อง');

  const material = MATERIALS.includes(body.material) ? body.material : null;
  if (!material) errors.push('วัสดุไม่ถูกต้อง');

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      slug: str(body.slug, 200).trim() || slugify(name),
      price, originalPrice, stock, category, material,
      image: str(body.image, 1000).trim(),
      gallery: Array.isArray(body.gallery) ? body.gallery.map((g) => str(g, 1000).trim()).filter(Boolean).slice(0, 12) : [],
      shortDescription: str(body.shortDescription, 500),
      description: str(body.description, 5000),
      sku: str(body.sku, 60).trim(),
      badge: str(body.badge, 60).trim(),
      isFeatured: bool(body.isFeatured),
      active: body.active === undefined ? true : bool(body.active),
    },
  };
}

function slugify(text) {
  return String(text).toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/** ทำให้ slug ไม่ชนกัน (คอลัมน์เป็น UNIQUE) */
function uniqueSlug(base, excludeId = null) {
  let slug = base || 'charm';
  let n = 2;
  const check = db.prepare('SELECT id FROM products WHERE slug = ?');
  while (true) {
    const row = check.get(slug);
    if (!row || row.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

/* ═══════════════════════════ auth ═══════════════════════════ */

router.get('/auth/status', (req, res) => {
  const user = resolveSession(req.cookies?.[SESSION_COOKIE]);
  res.json({ hasAccount: hasAccount(), user: user ? { username: user.username, lastLoginAt: user.lastLoginAt } : null });
});

router.post('/auth/setup', wrap(async (req, res) => {
  const result = await createAccount(req.body?.username, req.body?.password);
  if (!result.ok) return res.status(400).json({ error: result.error });

  // สร้างบัญชีเสร็จให้เข้าใช้งานต่อได้เลย
  const loginResult = await login(req.body.username, req.body.password, req.ip, req.get('user-agent'));
  res.cookie(SESSION_COOKIE, loginResult.token.token, cookieOptions(loginResult.token.expiresAt));
  res.json({ user: loginResult.user });
}));

router.post('/auth/login', wrap(async (req, res) => {
  const result = await login(req.body?.username, req.body?.password, req.ip, req.get('user-agent'));
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  res.cookie(SESSION_COOKIE, result.token.token, cookieOptions(result.token.expiresAt));
  res.json({ user: result.user });
}));

router.post('/auth/logout', (req, res) => {
  destroySession(req.cookies?.[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE, cookieOptions());
  res.json({ ok: true });
});

router.post('/auth/password', requireAuth, wrap(async (req, res) => {
  const result = await changePassword(req.user.id, req.body?.current, req.body?.next);
  if (!result.ok) return res.status(400).json({ error: result.error });
  // เซสชันเดิมถูกล้างทั้งหมดแล้ว ออกใบใหม่ให้เครื่องนี้เพื่อไม่ให้หลุดออกกลางคัน
  const { createSession } = await import('./auth.js');
  const token = createSession(req.user.id, req.get('user-agent'));
  res.cookie(SESSION_COOKIE, token.token, cookieOptions(token.expiresAt));
  res.json({ ok: true });
}));

/* ═══════════════════ ข้อมูลสาธารณะสำหรับหน้าร้าน ═══════════════════ */

router.get('/storefront', (_req, res) => {
  res.json({
    products: db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort_order, name').all().map(rowToProduct),
    journal: db.prepare('SELECT * FROM journal WHERE published = 1 ORDER BY sort_order').all().map(rowToArticle),
    faq: db.prepare('SELECT * FROM faq ORDER BY sort_order').all().map(rowToFaq),
    about: getMeta('about'),
    settings: publicSettings(),
  });
});

/** หน้าร้านไม่จำเป็นต้องรู้ทุกอย่างในตั้งค่า ส่งไปเฉพาะที่ใช้แสดงผล */
function publicSettings() {
  const s = getMeta('settings') ?? {};
  return {
    storeName: s.storeName, tagline: s.tagline, email: s.email, phone: s.phone,
    address: s.address, announcement: s.announcement,
    shippingFee: s.shippingFee, freeShippingThreshold: s.freeShippingThreshold,
    rates: s.rates,
  };
}

/**
 * รับคำสั่งซื้อจากหน้าร้าน — เปิดสาธารณะโดยตั้งใจ
 *
 * จุดสำคัญ: **ราคาคำนวณใหม่ทั้งหมดจากฐานข้อมูล ไม่เชื่อตัวเลขที่ client ส่งมา**
 * ถ้าเชื่อ ลูกค้าจะแก้ราคาใน DevTools แล้วซื้อของ 500,000 ด้วยเงิน 1 บาทได้
 * และตัดสต็อกใน transaction เดียวกัน เพื่อไม่ให้ขายเกินตอนมีคนสั่งพร้อมกัน
 */
router.post('/orders', wrap((req, res) => {
  const body = req.body ?? {};
  const c = body.customer ?? {};
  const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city'];
  const missing = required.filter((f) => !str(c[f]).trim());
  if (missing.length) return res.status(400).json({ error: `ข้อมูลผู้รับไม่ครบ: ${missing.join(', ')}` });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str(c.email))) return res.status(400).json({ error: 'อีเมลไม่ถูกต้อง' });

  const incoming = Array.isArray(body.lines) ? body.lines : [];
  if (!incoming.length) return res.status(400).json({ error: 'ไม่มีรายการสินค้าในคำสั่งซื้อ' });

  const settings = getMeta('settings');
  const getProduct = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1');

  const create = db.transaction(() => {
    const lines = [];

    for (const raw of incoming.slice(0, 50)) {
      const quantity = Math.max(1, Math.min(99, Math.round(Number(raw.quantity) || 1)));

      if (raw.type === 'custom-bracelet') {
        const b = raw.bracelet ?? {};
        const linkCount = Math.max(1, Math.min(40, Math.round(Number(b.linkCount) || 18)));
        const basePrice = money(settings.braceletBasePrice ?? 390000) ?? 390000;

        let charmsCost = 0;
        const links = [];
        for (let i = 0; i < linkCount; i++) {
          const link = (b.links ?? []).find((l) => Number(l.position) === i + 1);
          if (!link?.productId) { links.push({ position: i + 1, charmName: null }); continue; }
          const charm = getProduct.get(String(link.productId));
          if (!charm) { links.push({ position: i + 1, charmName: null }); continue; }
          charmsCost += charm.price;           // ← ราคาจาก DB ไม่ใช่จาก client
          links.push({ position: i + 1, charmName: charm.name, charmSku: charm.sku, image: charm.image });
        }

        lines.push({
          id: crypto.randomUUID(), type: 'custom-bracelet', name: 'Custom Italian Charm Bracelet',
          image: links.find((l) => l.image)?.image, quantity, unitPrice: basePrice + charmsCost,
          bracelet: {
            finishId: str(b.finishId, 40), finishLabel: str(b.finishLabel, 80),
            linkCount, basePrice, links,
          },
        });
      } else {
        const product = getProduct.get(String(raw.productId ?? ''));
        if (!product) throw httpError(400, `ไม่พบสินค้ารหัส ${str(raw.productId, 60)} หรือสินค้าถูกปิดการขาย`);
        if (product.stock < quantity) throw httpError(409, `"${product.name}" เหลือเพียง ${product.stock} ชิ้น`);

        db.prepare('UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?')
          .run(quantity, new Date().toISOString(), product.id);

        lines.push({
          id: crypto.randomUUID(), type: 'charm', name: product.name, sku: product.sku,
          image: product.image, quantity, unitPrice: product.price,   // ← ราคาจาก DB
        });
      }
    }

    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    const now = new Date().toISOString();

    const seq = (db.prepare("SELECT COUNT(*) AS n FROM orders").get().n ?? 0) + 1001;
    const order = {
      id: crypto.randomUUID(),
      code: `P2049-${String(seq).padStart(6, '0')}`,
      createdAt: now, updatedAt: now, status: 'pending',
      customer: {
        firstName: str(c.firstName, 80), lastName: str(c.lastName, 80),
        email: str(c.email, 160), phone: str(c.phone, 40),
        address: str(c.address, 300), city: str(c.city, 120),
        note: str(c.note, 500) || undefined,
      },
      lines, subtotal, shipping, total: subtotal + shipping,
      payCurrency: (settings.rates ?? []).some((r) => r.code === body.payCurrency) ? body.payCurrency : 'VND',
      paymentMethod: str(body.paymentMethod, 80) || 'Cash on delivery (COD)',
      internalNote: '',
    };

    db.prepare(`
      INSERT INTO orders (id, code, created_at, updated_at, status, customer, lines,
                          subtotal, shipping, total, pay_currency, payment_method, internal_note, is_demo)
      VALUES (@id, @code, @created_at, @updated_at, @status, @customer, @lines,
              @subtotal, @shipping, @total, @pay_currency, @payment_method, @internal_note, @is_demo)
    `).run(orderToRow(order, 0));

    return order;
  });

  const order = create();
  res.status(201).json({ code: order.code, total: order.total, status: order.status });
}));

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/* ═══════════════════ ต่อจากนี้ต้องเข้าสู่ระบบทั้งหมด ═══════════════════ */

router.use(requireAuth);

/** ภาพรวมทั้งก้อนสำหรับหน้า admin — ร้านขนาดนี้ส่งทีเดียวจบเร็วกว่ายิงหลายรอบ */
router.get('/db', (_req, res) => {
  res.json({
    products: db.prepare('SELECT * FROM products ORDER BY sort_order, name').all().map(rowToProduct),
    orders: db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all().map(rowToOrder),
    journal: db.prepare('SELECT * FROM journal ORDER BY sort_order').all().map(rowToArticle),
    faq: db.prepare('SELECT * FROM faq ORDER BY sort_order').all().map(rowToFaq),
    about: getMeta('about'),
    settings: getMeta('settings'),
    demoDataPresent: db.prepare('SELECT COUNT(*) AS n FROM orders WHERE is_demo = 1').get().n > 0,
  });
});

/* ───────────── สินค้า ───────────── */

router.post('/products', (req, res) => {
  const parsed = validateProduct(req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.errors.join(' · ') });

  const now = new Date().toISOString();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS n FROM products').get().n;
  const product = {
    ...parsed.value,
    id: `charm-${crypto.randomUUID()}`,
    slug: uniqueSlug(parsed.value.slug),
    createdAt: now, updatedAt: now,
  };

  db.prepare(`
    INSERT INTO products (id, slug, name, price, original_price, category, material, image, gallery,
                          short_description, description, sku, stock, badge, is_featured, active,
                          sort_order, created_at, updated_at)
    VALUES (@id, @slug, @name, @price, @original_price, @category, @material, @image, @gallery,
            @short_description, @description, @sku, @stock, @badge, @is_featured, @active,
            @sort_order, @created_at, @updated_at)
  `).run(productToRow(product, maxOrder + 1));

  res.status(201).json(rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(product.id)));
});

router.put('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบสินค้า' });

  const parsed = validateProduct(req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.errors.join(' · ') });

  const v = parsed.value;
  db.prepare(`
    UPDATE products SET slug = ?, name = ?, price = ?, original_price = ?, category = ?, material = ?,
      image = ?, gallery = ?, short_description = ?, description = ?, sku = ?, stock = ?, badge = ?,
      is_featured = ?, active = ?, updated_at = ?
    WHERE id = ?
  `).run(
    uniqueSlug(v.slug, req.params.id), v.name, v.price, v.originalPrice, v.category, v.material,
    v.image, JSON.stringify(v.gallery), v.shortDescription, v.description, v.sku || null, v.stock,
    v.badge || null, v.isFeatured ? 1 : 0, v.active ? 1 : 0, new Date().toISOString(), req.params.id,
  );

  res.json(rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

/** แก้เฉพาะบางฟิลด์ — ใช้กับช่องสต็อกในตารางและสวิตช์เปิด/ปิด */
router.patch('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบสินค้า' });

  const updates = [];
  const values = [];
  if (req.body?.stock !== undefined) {
    const stock = money(req.body.stock);
    if (stock === null) return res.status(400).json({ error: 'สต็อกต้องเป็นจำนวนเต็มไม่ติดลบ' });
    updates.push('stock = ?'); values.push(stock);
  }
  if (req.body?.active !== undefined) { updates.push('active = ?'); values.push(bool(req.body.active) ? 1 : 0); }
  if (!updates.length) return res.status(400).json({ error: 'ไม่มีฟิลด์ที่จะแก้ไข' });

  updates.push('updated_at = ?'); values.push(new Date().toISOString(), req.params.id);
  db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  res.json(rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

router.delete('/products/:id', (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'ไม่พบสินค้า' });
  res.json({ ok: true });
});

/* ───────────── คำสั่งซื้อ ───────────── */

router.patch('/orders/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });

  const updates = [];
  const values = [];
  if (req.body?.status !== undefined) {
    if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
    updates.push('status = ?'); values.push(req.body.status);
  }
  if (req.body?.internalNote !== undefined) { updates.push('internal_note = ?'); values.push(str(req.body.internalNote, 2000)); }
  if (!updates.length) return res.status(400).json({ error: 'ไม่มีฟิลด์ที่จะแก้ไข' });

  updates.push('updated_at = ?'); values.push(new Date().toISOString(), req.params.id);
  db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  res.json(rowToOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)));
});

/* ───────────── บทความ ───────────── */

router.post('/journal', (req, res) => {
  const title = str(req.body?.title, 200).trim();
  if (!title) return res.status(400).json({ error: 'ต้องใส่หัวข้อบทความ' });
  const id = `article-${crypto.randomUUID()}`;
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS n FROM journal').get().n;
  db.prepare(`INSERT INTO journal (id, title, category, summary, content, image, read_time, published, sort_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, title, str(req.body?.category, 80), str(req.body?.summary, 500), str(req.body?.content, 20000),
      str(req.body?.image, 1000), str(req.body?.readTime, 40), bool(req.body?.published) ? 1 : 0, maxOrder + 1);
  res.status(201).json(rowToArticle(db.prepare('SELECT * FROM journal WHERE id = ?').get(id)));
});

router.put('/journal/:id', (req, res) => {
  const title = str(req.body?.title, 200).trim();
  if (!title) return res.status(400).json({ error: 'ต้องใส่หัวข้อบทความ' });
  const result = db.prepare(`UPDATE journal SET title = ?, category = ?, summary = ?, content = ?,
                             image = ?, read_time = ?, published = ? WHERE id = ?`)
    .run(title, str(req.body?.category, 80), str(req.body?.summary, 500), str(req.body?.content, 20000),
      str(req.body?.image, 1000), str(req.body?.readTime, 40), bool(req.body?.published) ? 1 : 0, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'ไม่พบบทความ' });
  res.json(rowToArticle(db.prepare('SELECT * FROM journal WHERE id = ?').get(req.params.id)));
});

router.delete('/journal/:id', (req, res) => {
  const result = db.prepare('DELETE FROM journal WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'ไม่พบบทความ' });
  res.json({ ok: true });
});

router.post('/journal/reorder', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;
  if (!ids) return res.status(400).json({ error: 'ต้องส่งลำดับ ids มาเป็น array' });
  const update = db.prepare('UPDATE journal SET sort_order = ? WHERE id = ?');
  db.transaction(() => ids.forEach((id, i) => update.run(i, String(id))))();
  res.json({ ok: true });
});

/* ───────────── FAQ ───────────── */

router.post('/faq', (req, res) => {
  const question = str(req.body?.question, 300).trim();
  if (!question) return res.status(400).json({ error: 'ต้องใส่คำถาม' });
  const id = `faq-${crypto.randomUUID()}`;
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS n FROM faq').get().n;
  db.prepare('INSERT INTO faq (id, question, answer, sort_order) VALUES (?, ?, ?, ?)')
    .run(id, question, str(req.body?.answer, 5000), maxOrder + 1);
  res.status(201).json(rowToFaq(db.prepare('SELECT * FROM faq WHERE id = ?').get(id)));
});

router.put('/faq/:id', (req, res) => {
  const question = str(req.body?.question, 300).trim();
  if (!question) return res.status(400).json({ error: 'ต้องใส่คำถาม' });
  const result = db.prepare('UPDATE faq SET question = ?, answer = ? WHERE id = ?')
    .run(question, str(req.body?.answer, 5000), req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'ไม่พบคำถาม' });
  res.json(rowToFaq(db.prepare('SELECT * FROM faq WHERE id = ?').get(req.params.id)));
});

router.delete('/faq/:id', (req, res) => {
  const result = db.prepare('DELETE FROM faq WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'ไม่พบคำถาม' });
  res.json({ ok: true });
});

/* ───────────── เนื้อหา About / ตั้งค่า ───────────── */

router.put('/about', (req, res) => {
  const about = {
    kicker: str(req.body?.kicker, 200),
    title: str(req.body?.title, 300),
    storyTitle: str(req.body?.storyTitle, 300),
    storyText: str(req.body?.storyText, 5000),
  };
  setMeta('about', about);
  res.json(about);
});

router.put('/settings', (req, res) => {
  const body = req.body ?? {};
  const current = getMeta('settings');

  const shippingFee = money(body.shippingFee);
  const threshold = money(body.freeShippingThreshold);
  const lowStock = money(body.lowStockThreshold);
  if (shippingFee === null || threshold === null || lowStock === null) {
    return res.status(400).json({ error: 'ค่าจัดส่ง ยอดขั้นต่ำ และเกณฑ์สต็อก ต้องเป็นตัวเลขไม่ติดลบ' });
  }

  const rates = Array.isArray(body.rates) ? body.rates : current.rates;
  for (const rate of rates) {
    const value = Number(rate.rateFromVND);
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ error: `อัตราแลกเปลี่ยนของ ${str(rate.code, 10)} ต้องมากกว่า 0` });
    }
  }
  if (!rates.some((r) => r.code === 'VND' && Number(r.rateFromVND) === 1)) {
    return res.status(400).json({ error: 'อัตราของ VND ต้องเป็น 1 เสมอ (เป็นสกุลอ้างอิง)' });
  }

  const settings = {
    ...current,
    storeName: str(body.storeName, 120),
    tagline: str(body.tagline, 300),
    email: str(body.email, 160),
    phone: str(body.phone, 40),
    address: str(body.address, 300),
    announcement: str(body.announcement, 300),
    shippingFee, freeShippingThreshold: threshold, lowStockThreshold: lowStock,
    rates: rates.map((r) => ({
      code: str(r.code, 10), label: str(r.label, 60), symbol: str(r.symbol, 6),
      rateFromVND: Number(r.rateFromVND),
      decimals: Math.max(0, Math.min(4, Math.round(Number(r.decimals) || 0))),
    })),
  };

  setMeta('settings', settings);
  res.json(settings);
});

/* ───────────── สำรอง / กู้คืน / รีเซ็ต ───────────── */

router.get('/export', (_req, res) => {
  res.json({
    exportedAt: new Date().toISOString(),
    version: 1,
    products: db.prepare('SELECT * FROM products ORDER BY sort_order').all().map(rowToProduct),
    orders: db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all().map(rowToOrder),
    journal: db.prepare('SELECT * FROM journal ORDER BY sort_order').all().map(rowToArticle),
    faq: db.prepare('SELECT * FROM faq ORDER BY sort_order').all().map(rowToFaq),
    about: getMeta('about'),
    settings: getMeta('settings'),
  });
});

router.post('/import', (req, res) => {
  const body = req.body ?? {};
  for (const field of ['products', 'orders', 'journal', 'faq']) {
    if (!Array.isArray(body[field])) return res.status(400).json({ error: `ไฟล์ขาดส่วน "${field}" หรือรูปแบบไม่ถูกต้อง` });
  }
  if (!body.settings || typeof body.settings !== 'object') return res.status(400).json({ error: 'ไฟล์ขาดส่วน "settings"' });

  // ไม่แตะตาราง users และ sessions เด็ดขาด — ไฟล์ที่นำเข้าต้องเปลี่ยนรหัสผ่านเราไม่ได้
  const apply = db.transaction(() => {
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM journal').run();
    db.prepare('DELETE FROM faq').run();

    const insertProduct = db.prepare(`
      INSERT INTO products (id, slug, name, price, original_price, category, material, image, gallery,
                            short_description, description, sku, stock, badge, is_featured, active,
                            sort_order, created_at, updated_at)
      VALUES (@id, @slug, @name, @price, @original_price, @category, @material, @image, @gallery,
              @short_description, @description, @sku, @stock, @badge, @is_featured, @active,
              @sort_order, @created_at, @updated_at)`);
    body.products.forEach((p, i) => insertProduct.run(productToRow({ ...p, id: p.id || `charm-${crypto.randomUUID()}` }, i)));

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, code, created_at, updated_at, status, customer, lines,
                          subtotal, shipping, total, pay_currency, payment_method, internal_note, is_demo)
      VALUES (@id, @code, @created_at, @updated_at, @status, @customer, @lines,
              @subtotal, @shipping, @total, @pay_currency, @payment_method, @internal_note, @is_demo)`);
    body.orders.forEach((o) => insertOrder.run(orderToRow(o, 0)));

    const insertArticle = db.prepare(`INSERT INTO journal (id, title, category, summary, content, image, read_time, published, sort_order)
                                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    body.journal.forEach((a, i) => insertArticle.run(a.id, a.title, a.category ?? '', a.summary ?? '',
      a.content ?? '', a.image ?? '', a.readTime ?? '', a.published === false ? 0 : 1, i));

    const insertFaq = db.prepare('INSERT INTO faq (id, question, answer, sort_order) VALUES (?, ?, ?, ?)');
    body.faq.forEach((f, i) => insertFaq.run(f.id, f.question, f.answer ?? '', i));

    if (body.about) setMeta('about', body.about);
    setMeta('settings', body.settings);
  });

  apply();
  res.json({ ok: true });
});

router.post('/data/clear-demo', (_req, res) => {
  const result = db.prepare('DELETE FROM orders WHERE is_demo = 1').run();
  res.json({ ok: true, removed: result.changes });
});

router.post('/data/reset', (_req, res) => {
  const reset = db.transaction(() => {
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM journal').run();
    db.prepare('DELETE FROM faq').run();
    db.prepare("DELETE FROM meta WHERE key IN ('settings', 'about')").run();
  });
  reset();
  seedIfEmpty({ withDemoOrders: true });   // ไม่แตะบัญชีผู้ใช้
  res.json({ ok: true });
});

/** เติมคำสั่งซื้อตัวอย่างกลับเข้ามา (เผื่ออยากดู dashboard อีกครั้งหลังล้างไปแล้ว) */
router.post('/data/demo-orders', (_req, res) => {
  const insertOrder = db.prepare(`
    INSERT OR IGNORE INTO orders (id, code, created_at, updated_at, status, customer, lines,
                                  subtotal, shipping, total, pay_currency, payment_method, internal_note, is_demo)
    VALUES (@id, @code, @created_at, @updated_at, @status, @customer, @lines,
            @subtotal, @shipping, @total, @pay_currency, @payment_method, @internal_note, @is_demo)`);
  const run = db.transaction(() => seedOrders().forEach((o) => insertOrder.run(orderToRow(o, 1))));
  run();
  res.json({ ok: true });
});
