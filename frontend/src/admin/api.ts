import { AdminDB, AdminProduct, AboutContent, FaqItem, JournalArticle, Order, OrderStatus, Settings } from './types';

/**
 * ตัวเรียก REST API ของหลังบ้าน
 *
 * · ใช้ path แบบ relative (/api/…) และ Vite proxy ส่งต่อไป Express ตอน dev
 *   ทำให้เป็น same-origin ทั้งคู่ → cookie ส่งไปเองโดยไม่ต้องตั้ง CORS
 * · session อยู่ใน httpOnly cookie ไฟล์นี้จึงไม่เคยแตะ token เลย
 *   (ตั้งใจให้เป็นแบบนั้น — JavaScript อ่านไม่ได้ = ขโมยผ่าน XSS ไม่ได้)
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      ...options,
    });
  } catch {
    throw new ApiError('ติดต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจว่ารันเซิร์ฟเวอร์อยู่หรือไม่ (npm run dev)', 0);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError('เซิร์ฟเวอร์ตอบกลับด้วยข้อมูลที่อ่านไม่ได้', response.status);
    }
  }

  if (!response.ok) {
    const message = (payload as { error?: string } | null)?.error ?? `เกิดข้อผิดพลาด (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

const send = <T>(method: string, path: string, body?: unknown) =>
  request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

/** ฟิลด์ที่ส่งขึ้นเซิร์ฟเวอร์ตอนสร้าง/แก้สินค้า (เซิร์ฟเวอร์เป็นคนกำหนด id/slug/เวลาเอง) */
export type ProductInput = Omit<AdminProduct, 'id' | 'createdAt' | 'updatedAt'> & { slug?: string };

export interface AuthStatus {
  hasAccount: boolean;
  user: { username: string; lastLoginAt?: string } | null;
}

export const api = {
  auth: {
    status: () => request<AuthStatus>('/auth/status'),
    setup: (username: string, password: string) => send<{ user: { username: string } }>('POST', '/auth/setup', { username, password }),
    login: (username: string, password: string) => send<{ user: { username: string } }>('POST', '/auth/login', { username, password }),
    logout: () => send<{ ok: true }>('POST', '/auth/logout'),
    changePassword: (current: string, next: string) => send<{ ok: true }>('POST', '/auth/password', { current, next }),
  },

  db: {
    load: () => request<AdminDB>('/db'),
  },

  products: {
    create: (input: ProductInput) => send<AdminProduct>('POST', '/products', input),
    update: (id: string, input: ProductInput) => send<AdminProduct>('PUT', `/products/${encodeURIComponent(id)}`, input),
    patch: (id: string, fields: { stock?: number; active?: boolean }) =>
      send<AdminProduct>('PATCH', `/products/${encodeURIComponent(id)}`, fields),
    remove: (id: string) => send<{ ok: true }>('DELETE', `/products/${encodeURIComponent(id)}`),
  },

  orders: {
    patch: (id: string, fields: { status?: OrderStatus; internalNote?: string }) =>
      send<Order>('PATCH', `/orders/${encodeURIComponent(id)}`, fields),
  },

  journal: {
    create: (input: Omit<JournalArticle, 'id'>) => send<JournalArticle>('POST', '/journal', input),
    update: (id: string, input: Omit<JournalArticle, 'id'>) => send<JournalArticle>('PUT', `/journal/${encodeURIComponent(id)}`, input),
    remove: (id: string) => send<{ ok: true }>('DELETE', `/journal/${encodeURIComponent(id)}`),
    reorder: (ids: string[]) => send<{ ok: true }>('POST', '/journal/reorder', { ids }),
  },

  faq: {
    create: (input: Omit<FaqItem, 'id'>) => send<FaqItem>('POST', '/faq', input),
    update: (id: string, input: Omit<FaqItem, 'id'>) => send<FaqItem>('PUT', `/faq/${encodeURIComponent(id)}`, input),
    remove: (id: string) => send<{ ok: true }>('DELETE', `/faq/${encodeURIComponent(id)}`),
  },

  about: {
    save: (about: AboutContent) => send<AboutContent>('PUT', '/about', about),
  },

  settings: {
    save: (settings: Settings) => send<Settings>('PUT', '/settings', settings),
  },

  data: {
    exportAll: () => request<Record<string, unknown>>('/export'),
    importAll: (payload: unknown) => send<{ ok: true }>('POST', '/import', payload),
    reset: () => send<{ ok: true }>('POST', '/data/reset'),
    clearDemo: () => send<{ ok: true; removed: number }>('POST', '/data/clear-demo'),
    restoreDemo: () => send<{ ok: true }>('POST', '/data/demo-orders'),
  },
};
