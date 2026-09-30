import { Settings } from './types';

/** แปลงยอด VND เป็นสกุลที่เลือกแล้วจัดรูปแบบ */
export function formatMoney(valueInVND: number, currency: string, settings: Settings): string {
  const rate = settings.rates.find((r) => r.code === currency) ?? settings.rates[0];
  const converted = valueInVND * rate.rateFromVND;
  const amount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: rate.decimals,
    maximumFractionDigits: rate.decimals,
  }).format(converted);
  // ₫ วางท้ายตามธรรมเนียมเวียดนาม สกุลอื่นวางหน้า
  return rate.code === 'VND' ? `${amount} ${rate.symbol}` : `${rate.symbol}${amount}`;
}

/** ตัวเลขสั้นสำหรับแกนกราฟ: 1.2M / 340K */
export function compactMoney(valueInVND: number, currency: string, settings: Settings): string {
  const rate = settings.rates.find((r) => r.code === currency) ?? settings.rates[0];
  const v = valueInVND * rate.rateFromVND;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return v.toFixed(rate.decimals);
}

const DATE_FMT = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
const DATETIME_FMT = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
});

export const formatDate = (iso: string) => DATE_FMT.format(new Date(iso));
export const formatDateTime = (iso: string) => DATETIME_FMT.format(new Date(iso));

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เมื่อครู่';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;
  return formatDate(iso);
}

export const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);

/** yyyy-mm-dd ตามเวลาท้องถิ่น (ไม่ใช่ UTC) เพื่อให้จัดกลุ่มรายวันตรงกับที่ผู้ใช้เห็น */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
