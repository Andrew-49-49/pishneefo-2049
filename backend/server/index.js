import express from 'express';
import cookieParser from 'cookie-parser';
import { router } from './routes.js';
import { pruneSessions, seedIfEmpty } from './db.js';

const PORT = Number(process.env.PORT) || 4000;
const isProd = process.env.NODE_ENV === 'production';

const app = express();

// อยู่หลัง reverse proxy (nginx / Cloud Run) — ต้องเชื่อ X-Forwarded-For เพื่อให้ req.ip ถูกต้อง
// ไม่งั้นตัวจำกัดจำนวนครั้งล็อกอินจะเห็นทุกคนเป็น IP เดียวกัน
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.disable('x-powered-by');

app.use(express.json({ limit: '10mb' }));   // เผื่อไฟล์สำรองก้อนใหญ่ตอน import
app.use(cookieParser());

// ส่วนหัวความปลอดภัยพื้นฐาน (ไม่ต้องพึ่ง helmet)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: Math.round(process.uptime()) }));
app.use('/api', router);

// 404 ของ API ต้องเป็น JSON ไม่ใช่ HTML ของ SPA
app.use('/api', (_req, res) => res.status(404).json({ error: 'ไม่พบ endpoint นี้' }));

// ตัวจับ error กลางทาง — ตอบ JSON เสมอ ไม่ปล่อย stack trace ออกไปตอน production
app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  if (status >= 500) console.error('[server]', err);
  res.status(status).json({ error: status >= 500 && isProd ? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' : err.message });
});

const seeded = seedIfEmpty();
pruneSessions();
setInterval(pruneSessions, 6 * 3600_000).unref();   // เก็บกวาดเซสชันหมดอายุทุก 6 ชั่วโมง

app.listen(PORT, () => {
  console.log(`\n  Pishneefo 2049 API`);
  console.log(`  ➜  http://localhost:${PORT}/api/health`);
  if (seeded) console.log('  ➜  สร้างฐานข้อมูลใหม่พร้อมข้อมูลตั้งต้นแล้ว');
  console.log('  ➜  API-only server\n');
});
