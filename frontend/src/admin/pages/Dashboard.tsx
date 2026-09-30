import React, { useMemo } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Package, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { useDB } from '../store';
import { compactMoney, dayKey, formatMoney, formatNumber, relativeTime } from '../format';
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, ORDER_STATUSES, Order } from '../types';
import { Badge, Card, CardHeader } from '../ui';
import { ChartTableToggle, ColumnChart, ColumnPoint, Meter, RankedBars, Sparkline } from '../charts';

/** ออร์เดอร์ที่ยกเลิกไม่นับเป็นรายได้ */
const isRevenue = (o: Order) => o.status !== 'cancelled';

export const Dashboard: React.FC<{ currency: string; onOpenOrder: (id: string) => void; onGoTo: (r: string) => void }> = ({
  currency, onOpenOrder, onGoTo,
}) => {
  const db = useDB();
  const money = (v: number) => formatMoney(v, currency, db.settings);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ยอดรายวันย้อนหลัง 30 วัน (รวมวันที่ยอดเป็นศูนย์ เพื่อให้แกนเวลาไม่บิดเบือน)
    const days: ColumnPoint[] = [];
    const byDay = new Map<string, number>();
    for (const order of db.orders) {
      if (!isRevenue(order)) continue;
      const key = dayKey(new Date(order.createdAt));
      byDay.set(key, (byDay.get(key) ?? 0) + order.total);
    }
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      days.push({
        key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        fullLabel: d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }),
        value: byDay.get(key) ?? 0,
      });
    }

    const sum = (list: Order[]) => list.reduce((s, o) => s + o.total, 0);
    const inRange = (from: number, to = 0) =>
      db.orders.filter((o) => {
        if (!isRevenue(o)) return false;
        const age = (today.getTime() - new Date(o.createdAt).setHours(0, 0, 0, 0)) / 86400000;
        return age >= to && age < from;
      });

    const last7 = inRange(7);
    const prev7 = inRange(14, 7);
    const last30 = inRange(30);
    const prev30 = inRange(60, 30);

    const revenue7 = sum(last7);
    const revenuePrev7 = sum(prev7);
    const revenue30 = sum(last30);
    const revenuePrev30 = sum(prev30);

    const delta = (current: number, previous: number) =>
      previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

    // สินค้าขายดี — นับเฉพาะชาร์มที่ขายเป็นชิ้น (สร้อยกำหนดเองแยกดูต่างหาก)
    const productRevenue = new Map<string, { revenue: number; units: number }>();
    let braceletRevenue = 0;
    let braceletCount = 0;
    for (const order of db.orders) {
      if (!isRevenue(order)) continue;
      for (const line of order.lines) {
        if (line.type === 'custom-bracelet') {
          braceletRevenue += line.unitPrice * line.quantity;
          braceletCount += line.quantity;
          continue;
        }
        const entry = productRevenue.get(line.name) ?? { revenue: 0, units: 0 };
        entry.revenue += line.unitPrice * line.quantity;
        entry.units += line.quantity;
        productRevenue.set(line.name, entry);
      }
    }
    const topProducts = [...productRevenue.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 6)
      .map(([name, v]) => ({ key: name, label: name, value: v.revenue, sublabel: `${v.units} ชิ้น` }));

    const statusCounts = ORDER_STATUSES.map((status) => ({
      status,
      count: db.orders.filter((o) => o.status === status).length,
    }));

    const openOrders = db.orders.filter((o) => o.status === 'pending' || o.status === 'paid');
    const lowStock = db.products
      .filter((p) => p.active && (p.stock ?? 0) <= db.settings.lowStockThreshold)
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));

    return {
      days,
      revenue7,
      revenue30,
      delta7: delta(revenue7, revenuePrev7),
      delta30: delta(revenue30, revenuePrev30),
      orders7: last7.length,
      ordersDelta: delta(last7.length, prev7.length),
      aov: last30.length ? revenue30 / last30.length : 0,
      topProducts,
      braceletRevenue,
      braceletCount,
      statusCounts,
      openOrders,
      lowStock,
      recent: db.orders.slice(0, 6),
      totalRevenue: sum(db.orders.filter(isRevenue)),
    };
  }, [db]);

  const spark = stats.days.slice(-14).map((d) => d.value);

  return (
    <div className="space-y-5">
      {db.demoDataPresent && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
          <p className="text-xs text-amber-900 flex-1 min-w-[16rem]">
            ตัวเลขทั้งหมดมาจาก <strong>คำสั่งซื้อตัวอย่าง {db.orders.length} รายการ</strong> ที่ระบบใส่ให้เพื่อให้เห็นหน้าตาการใช้งาน
          </p>
          <button onClick={() => onGoTo('settings')} className="text-xs font-bold text-amber-900 underline underline-offset-2">
            ล้างข้อมูลตัวอย่าง
          </button>
        </div>
      )}

      {/* แถวตัวเลขสรุป */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={<Wallet className="w-4 h-4" aria-hidden="true" />}
          label="ยอดขาย 7 วันล่าสุด"
          value={money(stats.revenue7)}
          delta={stats.delta7}
          deltaLabel="เทียบ 7 วันก่อนหน้า"
          spark={spark}
        />
        <StatTile
          icon={<Receipt className="w-4 h-4" aria-hidden="true" />}
          label="คำสั่งซื้อ 7 วันล่าสุด"
          value={formatNumber(stats.orders7)}
          delta={stats.ordersDelta}
          deltaLabel="เทียบ 7 วันก่อนหน้า"
        />
        <StatTile
          icon={<TrendingUp className="w-4 h-4" aria-hidden="true" />}
          label="ยอดเฉลี่ยต่อออร์เดอร์"
          value={money(stats.aov)}
          hint="คิดจาก 30 วันล่าสุด"
        />
        <StatTile
          icon={<Package className="w-4 h-4" aria-hidden="true" />}
          label="รอดำเนินการ"
          value={formatNumber(stats.openOrders.length)}
          hint={stats.openOrders.length ? 'ยังไม่ได้จัดส่ง' : 'จัดส่งครบแล้ว'}
          tone={stats.openOrders.length > 0 ? 'attention' : 'normal'}
        />
      </div>

      {/* กราฟยอดขายรายวัน */}
      <Card>
        <CardHeader
          title="ยอดขายรายวัน — 30 วันล่าสุด"
          subtitle={`รวม ${money(stats.revenue30)} · ไม่รวมออร์เดอร์ที่ยกเลิก`}
        />
        <div className="px-5 py-5">
          <ColumnChart
            data={stats.days}
            formatValue={money}
            formatAxis={(v) => compactMoney(v, currency, db.settings)}
            height={210}
          />
          <ChartTableToggle
            headers={['วันที่', `ยอดขาย (${currency})`]}
            rows={stats.days.filter((d) => d.value > 0).map((d) => ({ label: d.fullLabel, value: money(d.value) }))}
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* สินค้าขายดี */}
        <Card>
          <CardHeader title="สินค้าขายดี" subtitle="เรียงตามยอดขายรวมตลอดช่วง" />
          <div className="px-5 py-5">
            <RankedBars rows={stats.topProducts} formatValue={money} emptyMessage="ยังไม่มีคำสั่งซื้อ" />
            {stats.braceletCount > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Meter
                  value={stats.braceletRevenue}
                  total={stats.totalRevenue}
                  label={`สร้อยกำหนดเอง · ${stats.braceletCount} เส้น`}
                  formatValue={money}
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  คิดเป็น {((stats.braceletRevenue / (stats.totalRevenue || 1)) * 100).toFixed(0)}% ของยอดขายทั้งหมด
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* สถานะออร์เดอร์ + สต็อกใกล้หมด */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="สถานะคำสั่งซื้อ" subtitle={`ทั้งหมด ${db.orders.length} รายการ`} />
            <ul className="px-5 py-4 space-y-2.5">
              {stats.statusCounts.map(({ status, count }) => (
                <li key={status} className="flex items-center justify-between gap-3">
                  <Badge className={`border ${ORDER_STATUS_STYLE[status].pill}`} dot={ORDER_STATUS_STYLE[status].dot}>
                    {ORDER_STATUS_LABEL[status]}
                  </Badge>
                  <span className="text-sm font-bold text-sky-950 tabular-nums">{formatNumber(count)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="สต็อกใกล้หมด"
              subtitle={`เหลือไม่เกิน ${db.settings.lowStockThreshold} ชิ้น`}
              action={
                <button onClick={() => onGoTo('products')} className="text-xs font-semibold text-sky-700 hover:text-sky-900">
                  จัดการสินค้า
                </button>
              }
            />
            {stats.lowStock.length ? (
              <ul className="px-5 py-4 space-y-2.5">
                {stats.lowStock.slice(0, 5).map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-700 truncate">{product.name}</span>
                    <Badge
                      className={
                        (product.stock ?? 0) === 0
                          ? 'border bg-rose-50 text-rose-900 border-rose-200'
                          : 'border bg-amber-50 text-amber-900 border-amber-200'
                      }
                    >
                      {(product.stock ?? 0) === 0 ? 'หมด' : `เหลือ ${product.stock}`}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-center text-xs text-slate-400">สต็อกทุกรายการยังเพียงพอ</p>
            )}
          </Card>
        </div>
      </div>

      {/* ออร์เดอร์ล่าสุด */}
      <Card>
        <CardHeader
          title="คำสั่งซื้อล่าสุด"
          action={
            <button onClick={() => onGoTo('orders')} className="text-xs font-semibold text-sky-700 hover:text-sky-900">
              ดูทั้งหมด
            </button>
          }
        />
        {stats.recent.length ? (
          <div className="divide-y divide-slate-100">
            {stats.recent.map((order) => (
              <button
                key={order.id}
                onClick={() => onOpenOrder(order.id)}
                className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-sky-50/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-950 tabular-nums">{order.code}</span>
                    <Badge className={`border ${ORDER_STATUS_STYLE[order.status].pill}`} dot={ORDER_STATUS_STYLE[order.status].dot}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {order.customer.firstName} {order.customer.lastName} · {order.lines.length} รายการ · {relativeTime(order.createdAt)}
                  </p>
                </div>
                <span className="text-sm font-bold text-sky-950 tabular-nums shrink-0">{money(order.total)}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-slate-400">ยังไม่มีคำสั่งซื้อ</p>
        )}
      </Card>
    </div>
  );
};

const StatTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  hint?: string;
  spark?: number[];
  tone?: 'normal' | 'attention';
}> = ({ icon, label, value, delta, deltaLabel, hint, spark, tone = 'normal' }) => {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className={`px-5 py-4 ${tone === 'attention' ? 'ring-1 ring-amber-200' : ''}`}>
      <div className="flex items-center gap-2 text-slate-500">
        <span className="text-sky-700">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <p className="text-2xl font-bold text-sky-950 tabular-nums leading-none">{value}</p>
        {spark && <Sparkline values={spark} />}
      </div>
      {delta !== undefined ? (
        <p className={`mt-2.5 flex items-center gap-1 text-[11px] font-semibold ${up ? 'text-green-800' : 'text-rose-800'}`}>
          {up ? <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" /> : <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />}
          {up ? '+' : ''}{delta.toFixed(0)}%
          <span className="font-normal text-slate-400">{deltaLabel}</span>
        </p>
      ) : hint ? (
        <p className="mt-2.5 text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </Card>
  );
};
