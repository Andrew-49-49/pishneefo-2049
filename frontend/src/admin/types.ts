import { Charm } from '../types';

/** ทุกจำนวนเงินในระบบเก็บเป็น VND เสมอ (แหล่งความจริงเดียว) แล้วค่อยแปลงตอนแสดงผล */
export type Money = number;

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'รอชำระเงิน',
  paid: 'ชำระแล้ว',
  shipped: 'จัดส่งแล้ว',
  completed: 'สำเร็จ',
  cancelled: 'ยกเลิก',
};

/** สีสถานะมาพร้อมข้อความกำกับเสมอ — สีไม่เคยเป็นช่องทางสื่อสารเพียงอย่างเดียว */
export const ORDER_STATUS_STYLE: Record<OrderStatus, { dot: string; pill: string }> = {
  pending: { dot: '#B45309', pill: 'bg-amber-50 text-amber-900 border-amber-200' },
  paid: { dot: '#2375BE', pill: 'bg-sky-50 text-sky-900 border-sky-200' },
  shipped: { dot: '#6D28D9', pill: 'bg-violet-50 text-violet-900 border-violet-200' },
  completed: { dot: '#0F7A0F', pill: 'bg-green-50 text-green-900 border-green-200' },
  cancelled: { dot: '#B91C1C', pill: 'bg-rose-50 text-rose-900 border-rose-200' },
};

/** ชิ้นงานในคำสั่งซื้อ — เก็บ snapshot ของสินค้าไว้ ณ เวลาที่สั่ง ไม่อ้างอิงสินค้าปัจจุบัน */
export interface OrderLine {
  id: string;
  type: 'charm' | 'custom-bracelet';
  name: string;
  sku?: string;
  image?: string;
  quantity: number;
  unitPrice: Money;
  /** เฉพาะสร้อยกำหนดเอง — ข้อมูลที่ต้องใช้ในการผลิตจริง */
  bracelet?: {
    finishId: string;
    finishLabel: string;
    linkCount: number;
    basePrice: Money;
    /** ตำแหน่งข้อ (เริ่มที่ 1) → ชื่อชาร์ม; null = ข้อว่าง */
    links: { position: number; charmName: string | null; charmSku?: string; image?: string }[];
  };
}

export interface Order {
  id: string;
  /** เลขที่คำสั่งซื้อที่ลูกค้าเห็น เช่น P2049-000142 */
  code: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    note?: string;
  };
  lines: OrderLine[];
  subtotal: Money;
  shipping: Money;
  total: Money;
  /** สกุลเงินที่ลูกค้าเลือกตอนชำระ (ยอดยังเก็บเป็น VND) */
  payCurrency: string;
  paymentMethod: string;
  /** บันทึกภายในร้าน ลูกค้าไม่เห็น */
  internalNote?: string;
}

/** สินค้าในระบบ admin = Charm ของหน้าร้าน + ฟิลด์ที่ร้านต้องใช้เพิ่ม */
export interface AdminProduct extends Charm {
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  image: string;
  readTime: string;
  published: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface Settings {
  storeName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  announcement: string;
  /** ค่าส่ง (VND) และยอดขั้นต่ำที่ส่งฟรี (VND) */
  shippingFee: Money;
  freeShippingThreshold: Money;
  /** อัตราแลกเปลี่ยน: 1 VND = rate หน่วยของสกุลนั้น */
  rates: { code: string; label: string; symbol: string; rateFromVND: number; decimals: number }[];
  lowStockThreshold: number;
}

export interface AboutContent {
  kicker: string;
  title: string;
  storyTitle: string;
  storyText: string;
}

/**
 * ภาพรวมข้อมูลทั้งก้อนที่เซิร์ฟเวอร์ส่งมาที่ GET /api/db
 *
 * ไม่มีข้อมูลบัญชีผู้ใช้หรือรหัสผ่านอยู่ในนี้เลย — สิ่งเหล่านั้นอยู่ในตาราง
 * users/sessions บนเซิร์ฟเวอร์และไม่เคยถูกส่งมาที่เบราว์เซอร์
 */
export interface AdminDB {
  products: AdminProduct[];
  orders: Order[];
  journal: JournalArticle[];
  faq: FaqItem[];
  about: AboutContent;
  settings: Settings;
  /** true = ยังมีคำสั่งซื้อตัวอย่างที่ระบบใส่ให้อยู่ ยังไม่เคยกดล้าง */
  demoDataPresent: boolean;
}
