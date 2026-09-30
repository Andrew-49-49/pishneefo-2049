import React, { useMemo, useState } from 'react';
import { Gem, Inbox, Mail, MapPin, Phone, Printer, Search, StickyNote } from 'lucide-react';
import { patchOrder, useDB } from '../store';
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, ORDER_STATUSES, Order, OrderLine, OrderStatus } from '../types';
import { formatDateTime, formatMoney, formatNumber, relativeTime } from '../format';
import { Badge, Button, Card, EmptyState, Field, Modal, Select, Textarea, useAction } from '../ui';

export const Orders: React.FC<{
  currency: string;
  openOrderId: string | null;
  onOpenOrder: (id: string | null) => void;
}> = ({ currency, openOrderId, onOpenOrder }) => {
  const db = useDB();
  const { run } = useAction();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all');

  const money = (v: number) => formatMoney(v, currency, db.settings);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.orders.filter((order) => {
      const matchesStatus = status === 'all' || order.status === status;
      if (!q) return matchesStatus;
      const haystack = [
        order.code,
        `${order.customer.firstName} ${order.customer.lastName}`,
        order.customer.email,
        order.customer.phone,
        order.customer.city,
      ].join(' ').toLowerCase();
      return matchesStatus && haystack.includes(q);
    });
  }, [db.orders, query, status]);

  const totals = useMemo(
    () => ({
      count: rows.length,
      value: rows.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
    }),
    [rows],
  );

  const setStatusFor = (orderId: string, next: OrderStatus) => {
    void run(() => patchOrder(orderId, { status: next }), `เปลี่ยนสถานะเป็น "${ORDER_STATUS_LABEL[next]}" แล้ว`);
  };

  const setNote = (orderId: string, note: string) => {
    void run(() => patchOrder(orderId, { internalNote: note }), 'บันทึกภายในถูกบันทึกแล้ว');
  };

  const active = openOrderId ? db.orders.find((o) => o.id === openOrderId) ?? null : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[15rem]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="ค้นหาคำสั่งซื้อจากเลขที่ ชื่อลูกค้า อีเมล หรือเบอร์โทร"
            placeholder="ค้นหาเลขที่ออร์เดอร์ ชื่อลูกค้า อีเมล หรือเบอร์โทร…"
            className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <span className="whitespace-nowrap">สถานะ</span>
          <Select value={status} onChange={(e) => setStatus(e.target.value as 'all' | OrderStatus)} className="!py-2 !w-auto">
            <option value="all">ทั้งหมด</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
            ))}
          </Select>
        </label>
      </div>

      <p className="text-xs text-slate-500" aria-live="polite">
        {formatNumber(totals.count)} รายการ · มูลค่ารวม {money(totals.value)} (ไม่นับที่ยกเลิก)
      </p>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Inbox className="w-6 h-6" aria-hidden="true" />}
            title="ไม่พบคำสั่งซื้อ"
            message={db.orders.length ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ' : 'เมื่อหน้าร้านถูกต่อเข้ากับระบบนี้ คำสั่งซื้อจะเข้ามาแสดงที่นี่'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <caption className="sr-only">รายการคำสั่งซื้อ</caption>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3 text-left font-semibold">เลขที่</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">ลูกค้า</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">รายการ</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">วันที่</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">สถานะ</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((order) => {
                  const braceletCount = order.lines.filter((l) => l.type === 'custom-bracelet').length;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => onOpenOrder(order.id)}
                      className="cursor-pointer hover:bg-sky-50/40"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenOrder(order.id); }}
                          className="font-bold text-sky-800 tabular-nums hover:underline"
                        >
                          {order.code}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900">{order.customer.firstName} {order.customer.lastName}</p>
                        <p className="text-[11px] text-slate-500">{order.customer.city}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {order.lines.length} รายการ
                        {braceletCount > 0 && (
                          <span className="ml-1.5 inline-flex items-center gap-1 text-sky-800 font-semibold">
                            <Gem className="w-3 h-3" aria-hidden="true" />
                            สร้อย {braceletCount}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{relativeTime(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`border ${ORDER_STATUS_STYLE[order.status].pill}`} dot={ORDER_STATUS_STYLE[order.status].dot}>
                          {ORDER_STATUS_LABEL[order.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-sky-950 tabular-nums whitespace-nowrap">{money(order.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {active && (
        <OrderDetail
          order={active}
          currency={currency}
          onClose={() => onOpenOrder(null)}
          onStatusChange={(s) => setStatusFor(active.id, s)}
          onNoteChange={(n) => setNote(active.id, n)}
        />
      )}
    </div>
  );
};

/* ───────────────── รายละเอียดคำสั่งซื้อ ───────────────── */

const OrderDetail: React.FC<{
  order: Order;
  currency: string;
  onClose: () => void;
  onStatusChange: (s: OrderStatus) => void;
  onNoteChange: (n: string) => void;
}> = ({ order, currency, onClose, onStatusChange, onNoteChange }) => {
  const db = useDB();
  const [note, setNote] = useState(order.internalNote ?? '');
  const money = (v: number) => formatMoney(v, currency, db.settings);

  return (
    <Modal
      open
      onClose={onClose}
      title={`คำสั่งซื้อ ${order.code}`}
      description={`${formatDateTime(order.createdAt)} · ลูกค้าเลือกชำระเป็น ${order.payCurrency}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" icon={<Printer className="w-4 h-4" aria-hidden="true" />} onClick={() => window.print()}>
            พิมพ์ใบสั่งผลิต
          </Button>
          <Button onClick={onClose}>ปิด</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          {/* ข้อมูลลูกค้า */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-xs font-bold text-slate-700 mb-3">ข้อมูลผู้รับ</h3>
            <p className="text-sm font-semibold text-slate-900">{order.customer.firstName} {order.customer.lastName}</p>
            <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                <span>{order.customer.address}, {order.customer.city}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <a href={`tel:${order.customer.phone}`} className="hover:text-sky-800 hover:underline tabular-nums">{order.customer.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <a href={`mailto:${order.customer.email}`} className="hover:text-sky-800 hover:underline break-all">{order.customer.email}</a>
              </li>
            </ul>
            {order.customer.note && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
                <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span><strong>ลูกค้าฝากไว้:</strong> {order.customer.note}</span>
              </p>
            )}
          </div>

          {/* สถานะ */}
          <div className="rounded-xl border border-slate-200 p-4">
            <Field label="สถานะคำสั่งซื้อ">
              {(props) => (
                <Select {...props} value={order.status} onChange={(e) => onStatusChange(e.target.value as OrderStatus)}>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                  ))}
                </Select>
              )}
            </Field>
            <p className="mt-2 text-[11px] text-slate-500">แก้ไขล่าสุด {relativeTime(order.updatedAt)}</p>
            <p className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              ชำระโดย<br /><strong className="text-slate-700">{order.paymentMethod}</strong>
            </p>
          </div>
        </div>

        {/* รายการสินค้า */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 mb-2.5">รายการสินค้า</h3>
          <div className="space-y-3">
            {order.lines.map((line) => <LineDetail key={line.id} line={line} money={money} />)}
          </div>
        </div>

        {/* ยอดรวม */}
        <div className="rounded-xl bg-sky-50 border border-sky-100 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>ยอดสินค้า</span>
            <span className="tabular-nums">{money(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>ค่าจัดส่ง</span>
            <span className="tabular-nums">{order.shipping === 0 ? 'ฟรี' : money(order.shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-sky-200 pt-2 text-base font-bold text-sky-950">
            <span>ยอดรวม</span>
            <span className="tabular-nums">{money(order.total)}</span>
          </div>
        </div>

        {/* บันทึกภายใน */}
        <Field label="บันทึกภายใน" hint="เห็นเฉพาะทีมงาน ลูกค้าไม่เห็น — บันทึกอัตโนมัติเมื่อคลิกออกจากช่อง">
          {(props) => (
            <Textarea
              {...props}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => note !== (order.internalNote ?? '') && onNoteChange(note)}
            />
          )}
        </Field>
      </div>
    </Modal>
  );
};

/** แสดงรายการสินค้าหนึ่งบรรทัด — ถ้าเป็นสร้อยกำหนดเอง จะกางผังข้อสร้อยให้ครบเพื่อใช้ผลิตจริง */
const LineDetail: React.FC<{ line: OrderLine; money: (v: number) => string }> = ({ line, money }) => {
  const bracelet = line.bracelet;
  const filled = bracelet?.links.filter((l) => l.charmName) ?? [];

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <span className="w-12 h-12 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
          {line.image && <img src={line.image} alt="" width={48} height={48} loading="lazy" className="w-full h-full object-cover" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 truncate">{line.name}</p>
          <p className="text-[11px] text-slate-500 tabular-nums">
            {line.sku ? `${line.sku} · ` : ''}จำนวน {line.quantity} × {money(line.unitPrice)}
          </p>
        </div>
        <span className="text-sm font-bold text-sky-950 tabular-nums shrink-0">{money(line.unitPrice * line.quantity)}</span>
      </div>

      {bracelet && (
        <div className="border-t border-slate-200 bg-sky-50/60 p-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold text-sky-900">
              <Gem className="w-3.5 h-3.5" aria-hidden="true" /> รายละเอียดการผลิต
            </span>
            <span className="text-slate-600">
              สี: <strong className="text-sky-900">{bracelet.finishLabel}</strong>
            </span>
            <span className="text-slate-600">
              ขนาด: <strong className="text-sky-900">{bracelet.linkCount} ข้อ</strong>
            </span>
            <span className="text-slate-600">
              ติดชาร์ม: <strong className="text-sky-900">{filled.length} ข้อ</strong>
            </span>
          </div>

          {/* ผังข้อสร้อยเรียงตามตำแหน่งจริง */}
          <div className="flex flex-wrap gap-1">
            {bracelet.links.map((link) => (
              <span
                key={link.position}
                title={link.charmName ? `ข้อ ${link.position}: ${link.charmName}` : `ข้อ ${link.position}: ว่าง`}
                className={`grid place-items-center w-7 h-8 rounded text-[9px] font-bold border ${
                  link.charmName
                    ? 'border-sky-400 bg-white text-sky-900 overflow-hidden'
                    : 'border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {link.charmName && link.image ? (
                  <img src={link.image} alt="" width={28} height={32} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  link.position
                )}
              </span>
            ))}
          </div>

          {filled.length > 0 && (
            <ul className="mt-2.5 space-y-0.5 text-[11px] text-slate-600">
              {filled.map((link) => (
                <li key={link.position}>
                  <span className="inline-block w-12 tabular-nums text-slate-400">ข้อ {link.position}</span>
                  {link.charmName}
                  {link.charmSku && <span className="text-slate-400"> · {link.charmSku}</span>}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-2.5 pt-2.5 border-t border-sky-200/70 text-[11px] text-slate-500 tabular-nums">
            ตัวเรือน {money(bracelet.basePrice)} + ชาร์ม {money(line.unitPrice - bracelet.basePrice)} = {money(line.unitPrice)}
          </p>
        </div>
      )}
    </div>
  );
};
