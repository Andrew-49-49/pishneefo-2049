import crypto from 'node:crypto';
import { db } from './db.js';

/**
 * การตรวจสอบสิทธิ์ฝั่งเซิร์ฟเวอร์
 *
 * ต่างจากเวอร์ชัน localStorage ตรงที่ตอนนี้ "ของจริง" แล้ว:
 *  · รหัสผ่าน hash ด้วย scrypt (มาตรฐาน memory-hard ใน node:crypto ไม่ต้องลง lib)
 *  · session token สุ่ม 32 ไบต์ ส่งกลับเป็น httpOnly cookie — JavaScript ในหน้าเว็บอ่านไม่ได้
 *    ต่อให้มีช่อง XSS ก็ขโมย token ไปใช้ต่อไม่ได้
 *  · ในฐานข้อมูลเก็บแค่ sha256 ของ token ถ้าไฟล์ DB หลุด ก็ยังปลอมเซสชันไม่ได้
 *  · ทุก route ที่แก้ข้อมูลถูกบังคับผ่าน requireAuth — client แก้อะไรก็ข้ามไม่ได้
 *  · จำกัดจำนวนครั้งที่ล็อกอินผิดต่อ IP
 */

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SESSION_DAYS = 7;
const MAX_FAILURES = 5;
const LOCK_MINUTES = 10;

export const SESSION_COOKIE = 'p2049_session';

const hex = (buf) => buf.toString('hex');
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTS, (err, key) => (err ? reject(err) : resolve(hex(key))));
  });
}

/** เทียบแบบใช้เวลาคงที่ กัน timing attack */
function safeEqual(a, b) {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkPasswordStrength(password) {
  const problems = [];
  if (typeof password !== 'string' || password.length < 8) problems.push('ต้องยาวอย่างน้อย 8 ตัวอักษร');
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) problems.push('ต้องมีทั้งตัวพิมพ์เล็กและพิมพ์ใหญ่');
  if (!/[0-9]/.test(password)) problems.push('ต้องมีตัวเลขอย่างน้อย 1 ตัว');
  const weak = ['password', '12345678', 'qwertyui', 'admin123', 'pishneefo'];
  if (weak.some((w) => String(password).toLowerCase().includes(w))) problems.push('เดาง่ายเกินไป');
  return { ok: problems.length === 0, problems };
}

export function hasAccount() {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0;
}

export async function createAccount(username, password) {
  if (hasAccount()) return { ok: false, error: 'มีบัญชีผู้ดูแลอยู่แล้ว' };
  const name = String(username ?? '').trim();
  if (name.length < 3) return { ok: false, error: 'ชื่อผู้ใช้ต้องยาวอย่างน้อย 3 ตัวอักษร' };

  const strength = checkPasswordStrength(password);
  if (!strength.ok) return { ok: false, error: strength.problems.join(' · ') };

  const salt = hex(crypto.randomBytes(16));
  const passwordHash = await scrypt(password, salt);
  const id = crypto.randomUUID();

  db.prepare('INSERT INTO users (id, username, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, passwordHash, salt, new Date().toISOString());

  return { ok: true, user: { id, username: name } };
}

/* ───────────── จำกัดจำนวนครั้งที่ล็อกอินผิด ───────────── */

export function lockStatus(ip) {
  const row = db.prepare('SELECT failures, locked_until FROM login_attempts WHERE ip = ?').get(ip);
  if (!row?.locked_until) return { locked: false, minutesLeft: 0 };
  const left = new Date(row.locked_until).getTime() - Date.now();
  if (left <= 0) {
    db.prepare('UPDATE login_attempts SET failures = 0, locked_until = NULL WHERE ip = ?').run(ip);
    return { locked: false, minutesLeft: 0 };
  }
  return { locked: true, minutesLeft: Math.ceil(left / 60000) };
}

function recordFailure(ip) {
  const row = db.prepare('SELECT failures FROM login_attempts WHERE ip = ?').get(ip);
  const failures = (row?.failures ?? 0) + 1;
  const shouldLock = failures >= MAX_FAILURES;
  db.prepare(`
    INSERT INTO login_attempts (ip, failures, locked_until) VALUES (?, ?, ?)
    ON CONFLICT(ip) DO UPDATE SET failures = excluded.failures, locked_until = excluded.locked_until
  `).run(ip, shouldLock ? 0 : failures, shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null);
  return { shouldLock, remaining: MAX_FAILURES - failures };
}

function clearFailures(ip) {
  db.prepare('DELETE FROM login_attempts WHERE ip = ?').run(ip);
}

/* ───────────── login / session ───────────── */

export async function login(username, password, ip, userAgent) {
  const lock = lockStatus(ip);
  if (lock.locked) return { ok: false, status: 429, error: `ใส่รหัสผิดหลายครั้งเกินไป กรุณารออีก ${lock.minutesLeft} นาที` };

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username ?? '').trim());

  // ถึงไม่เจอ user ก็ยังคำนวณ scrypt ให้เสียเวลาเท่ากัน จะได้ไม่รู้ว่าชื่อผู้ใช้มีจริงหรือไม่
  const salt = user?.salt ?? hex(crypto.randomBytes(16));
  const candidate = await scrypt(String(password ?? ''), salt);
  const matches = user ? safeEqual(candidate, user.password_hash) : false;

  if (!matches) {
    const { shouldLock, remaining } = recordFailure(ip);
    return {
      ok: false,
      status: 401,
      error: shouldLock
        ? `ใส่รหัสผิด ${MAX_FAILURES} ครั้งติด ระบบล็อกไว้ ${LOCK_MINUTES} นาที`
        : `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลืออีก ${remaining} ครั้ง)`,
    };
  }

  clearFailures(ip);
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);
  return { ok: true, user: { id: user.id, username: user.username }, token: createSession(user.id, userAgent) };
}

export function createSession(userId, userAgent) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)')
    .run(sha256(token), userId, new Date().toISOString(), expiresAt, String(userAgent ?? '').slice(0, 200));
  return { token, expiresAt };
}

export function resolveSession(token) {
  if (!token) return null;
  const row = db.prepare(`
    SELECT s.expires_at, u.id, u.username, u.last_login_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `).get(sha256(token));
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(sha256(token));
    return null;
  }
  return { id: row.id, username: row.username, lastLoginAt: row.last_login_at };
}

export function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(sha256(token));
}

export async function changePassword(userId, current, next) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return { ok: false, error: 'ไม่พบบัญชีผู้ใช้' };

  const candidate = await scrypt(String(current ?? ''), user.salt);
  if (!safeEqual(candidate, user.password_hash)) return { ok: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };

  const strength = checkPasswordStrength(next);
  if (!strength.ok) return { ok: false, error: strength.problems.join(' · ') };

  const salt = hex(crypto.randomBytes(16));
  const passwordHash = await scrypt(next, salt);

  // เปลี่ยนรหัสแล้วต้องเตะทุกเซสชันออก แล้วออกใหม่ให้เฉพาะเครื่องนี้
  const apply = db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(passwordHash, salt, userId);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  });
  apply();

  return { ok: true };
}

/* ───────────── middleware ───────────── */

export function requireAuth(req, res, next) {
  const user = resolveSession(req.cookies?.[SESSION_COOKIE]);
  if (!user) {
    res.status(401).json({ error: 'ต้องเข้าสู่ระบบก่อน' });
    return;
  }
  req.user = user;
  next();
}

export function cookieOptions(expiresAt) {
  return {
    httpOnly: true,                                   // JS ในหน้าเว็บอ่านไม่ได้
    sameSite: 'strict',                               // กัน CSRF ข้ามเว็บ
    secure: process.env.NODE_ENV === 'production',    // บังคับ HTTPS ตอนขึ้นจริง
    path: '/',
    expires: expiresAt ? new Date(expiresAt) : undefined,
  };
}
