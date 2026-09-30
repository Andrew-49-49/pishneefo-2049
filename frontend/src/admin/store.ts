import { useSyncExternalStore } from 'react';
import { AdminDB, AboutContent, FaqItem, JournalArticle, OrderStatus, Settings } from './types';
import { ProductInput, api } from './api';

/**
 * แคชฝั่ง client ของภาพรวมข้อมูลทั้งก้อน
 *
 * แหล่งความจริงอยู่ที่ SQLite บนเซิร์ฟเวอร์ ไฟล์นี้เก็บแค่สำเนาไว้ให้หน้าจอวาดเร็ว
 * ทุกฟังก์ชันที่แก้ข้อมูลจะยิง API ก่อน แล้วค่อยดึงภาพรวมใหม่มาทับ —
 * ไม่มีการแก้แคชเองแบบ optimistic เพราะถ้าเซิร์ฟเวอร์ปฏิเสธ หน้าจอจะโกหกผู้ใช้ทันที
 */

let snapshot: AdminDB | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;

/** ดึงข้อมูลใหม่จากเซิร์ฟเวอร์แล้วแจ้งทุกหน้าจอที่ subscribe อยู่ */
export async function refresh(): Promise<AdminDB> {
  const next = await api.db.load();
  snapshot = next;
  emit();
  return next;
}

export function clearCache() {
  snapshot = null;
  emit();
}

/**
 * คืนข้อมูลที่โหลดไว้แล้ว
 * AdminApp จะไม่เรนเดอร์หน้าใด ๆ จนกว่า refresh() รอบแรกจะเสร็จ
 * ฟังก์ชันนี้จึงคืนค่าที่ไม่ใช่ null เสมอเมื่อถูกเรียกจากในหน้า
 */
export function useDB(): AdminDB {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!value) throw new Error('useDB ถูกเรียกก่อนที่ข้อมูลจะโหลดเสร็จ');
  return value;
}

export const isLoaded = () => snapshot !== null;

/* ───────────── การกระทำต่าง ๆ: ยิง API แล้วรีเฟรช ───────────── */

const after = async <T>(promise: Promise<T>): Promise<T> => {
  const result = await promise;
  await refresh();
  return result;
};

export const createProduct = (input: ProductInput) => after(api.products.create(input));
export const updateProduct = (id: string, input: ProductInput) => after(api.products.update(id, input));
export const patchProduct = (id: string, fields: { stock?: number; active?: boolean }) => after(api.products.patch(id, fields));
export const deleteProduct = (id: string) => after(api.products.remove(id));

export const patchOrder = (id: string, fields: { status?: OrderStatus; internalNote?: string }) =>
  after(api.orders.patch(id, fields));

export const createArticle = (input: Omit<JournalArticle, 'id'>) => after(api.journal.create(input));
export const updateArticle = (id: string, input: Omit<JournalArticle, 'id'>) => after(api.journal.update(id, input));
export const deleteArticle = (id: string) => after(api.journal.remove(id));
export const reorderArticles = (ids: string[]) => after(api.journal.reorder(ids));

export const createFaq = (input: Omit<FaqItem, 'id'>) => after(api.faq.create(input));
export const updateFaq = (id: string, input: Omit<FaqItem, 'id'>) => after(api.faq.update(id, input));
export const deleteFaq = (id: string) => after(api.faq.remove(id));

export const saveAbout = (about: AboutContent) => after(api.about.save(about));
export const saveSettings = (settings: Settings) => after(api.settings.save(settings));

export const exportData = () => api.data.exportAll();
export const importData = (payload: unknown) => after(api.data.importAll(payload));
export const resetData = () => after(api.data.reset());
export const clearDemoData = () => after(api.data.clearDemo());
export const restoreDemoData = () => after(api.data.restoreDemo());
