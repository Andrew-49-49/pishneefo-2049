import { api } from './api';

/**
 * ตัวห่อบาง ๆ ของ auth API
 *
 * ต่างจากเวอร์ชันก่อนหน้าตรงที่ตอนนี้ **ไม่มี logic ความปลอดภัยอยู่ฝั่ง client เลย**
 * การ hash รหัสผ่าน การออก session การนับครั้งที่ผิด และการตัดสินว่าใครเข้าถึงอะไรได้
 * เกิดขึ้นบนเซิร์ฟเวอร์ทั้งหมด — ต่อให้แก้โค้ดในเบราว์เซอร์ก็ข้ามไม่ได้
 *
 * session อยู่ใน httpOnly cookie ที่ JavaScript อ่านไม่ได้ ไฟล์นี้จึงไม่มี token ให้เก็บ
 */

export interface SessionUser {
  username: string;
  lastLoginAt?: string;
}

/** ตรวจว่ามีบัญชีผู้ดูแลแล้วหรือยัง และตอนนี้ล็อกอินอยู่ในนาม */
export async function fetchStatus(): Promise<{ hasAccount: boolean; user: SessionUser | null }> {
  return api.auth.status();
}

export async function createAccount(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.auth.setup(username, password);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.auth.login(username, password);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function logout(): Promise<void> {
  try {
    await api.auth.logout();
  } catch {
    // ถึงเซิร์ฟเวอร์จะตอบไม่ได้ ก็ยังต้องพากลับไปหน้าล็อกอินอยู่ดี
  }
}

export async function changePassword(current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.auth.changePassword(current, next);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * ตรวจความแข็งแรงของรหัสผ่านฝั่ง client — ไว้แสดงคำแนะนำระหว่างพิมพ์เท่านั้น
 * กฎชุดเดียวกันนี้ถูกบังคับซ้ำบนเซิร์ฟเวอร์ (server/auth.js) ซึ่งเป็นด่านจริง
 */
export function checkPasswordStrength(password: string): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  if (password.length < 8) problems.push('ต้องยาวอย่างน้อย 8 ตัวอักษร');
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) problems.push('ต้องมีทั้งตัวพิมพ์เล็กและพิมพ์ใหญ่');
  if (!/[0-9]/.test(password)) problems.push('ต้องมีตัวเลขอย่างน้อย 1 ตัว');
  const weak = ['password', '12345678', 'qwertyui', 'admin123', 'pishneefo'];
  if (weak.some((w) => password.toLowerCase().includes(w))) problems.push('เดาง่ายเกินไป');
  return { ok: problems.length === 0, problems };
}
