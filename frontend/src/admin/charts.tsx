import React, { useEffect, useRef, useState } from 'react';

/**
 * กราฟทั้งหมดวาดด้วย SVG ล้วน ไม่พึ่งไลบรารีภายนอก
 *
 * หลักการที่ยึด:
 *  · ชุดข้อมูลเดียว = สีเดียว (sequential hue ของแบรนด์) ไม่ต้องมี legend
 *  · เส้นกริดและแกนต้องจางกว่าข้อมูลเสมอ
 *  · ปลายแท่งมนเฉพาะด้านปลาย ยึดฐานไว้ที่เส้นศูนย์
 *  · เว้นช่องว่างสีพื้นหลัง 2px ระหว่างแท่งที่ติดกัน
 *  · ติดป้ายค่าเฉพาะจุดที่สำคัญ ไม่ติดทุกจุด
 *  · ทุกกราฟมี hover tooltip และสลับดูเป็นตารางได้ (เพื่อคนที่อ่านสีไม่ได้)
 */

const INK = '#2375BE';       // สีข้อมูลหลัก — 4.82:1 บนพื้นขาว
const INK_STRONG = '#0D4D99'; // ตอน hover — 8.27:1
const GRID = '#E5F5FF';
const AXIS_TEXT = '#64748b';
const MUTED = '#CBD5E1';

/**
 * วัดความกว้างจริงของคอนเทนเนอร์ แล้วใช้เป็น viewBox
 * เพื่อให้ 1 หน่วยใน SVG = 1 พิกเซลจริง ตัวหนังสือบนแกนจะได้ไม่ถูกย่อจนอ่านไม่ออกบนจอเล็ก
 */
function useElementWidth<T extends HTMLElement>(fallback = 720) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/* ───────────────── กราฟแท่งแนวตั้ง (ยอดขายรายวัน) ───────────────── */

export interface ColumnPoint {
  key: string;
  label: string;
  value: number;
  fullLabel: string;
}

export const ColumnChart: React.FC<{
  data: ColumnPoint[];
  formatValue: (v: number) => string;
  formatAxis: (v: number) => string;
  height?: number;
  emptyMessage?: string;
}> = ({ data, formatValue, formatAxis, height = 200, emptyMessage = 'ยังไม่มีข้อมูล' }) => {
  const [hover, setHover] = useState<number | null>(null);
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();

  if (!data.length) return <div className="py-14 text-center text-sm text-slate-400">{emptyMessage}</div>;

  const max = Math.max(...data.map((d) => d.value), 1);
  // ปัดเพดานขึ้นให้เป็นเลขกลม เส้นกริดจะได้อ่านง่าย
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const ceiling = Math.ceil(max / magnitude) * magnitude;
  const ticks = [0, ceiling / 2, ceiling];

  const narrow = width < 560;
  const PAD_L = narrow ? 40 : 52;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 26;
  const plotW = Math.max(120, width - PAD_L - PAD_R);
  const plotH = height - PAD_T - PAD_B;
  const slot = plotW / data.length;
  const barW = Math.max(3, Math.min(34, slot - 2)); // เว้น 2px ระหว่างแท่ง
  // ป้ายแกน x ต้องการราว 34px ต่อป้าย — คำนวณระยะห่างจากพื้นที่จริงแทนค่าคงที่
  const labelEvery = Math.max(1, Math.ceil(34 / slot));

  return (
    <div ref={wrapRef} className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block max-w-full"
        style={{ height }}
        role="img"
        aria-label={`กราฟแท่งแสดงยอดขายรายวัน ${data.length} วัน สูงสุด ${formatValue(max)}`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => {
          const y = PAD_T + plotH - (t / ceiling) * plotH;
          return (
            <g key={t}>
              <line x1={PAD_L} x2={width - PAD_R} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize={10} fill={AXIS_TEXT}>{formatAxis(t)}</text>
            </g>
          );
        })}

        {data.map((point, index) => {
          const barH = ceiling === 0 ? 0 : (point.value / ceiling) * plotH;
          const x = PAD_L + index * slot + (slot - barW) / 2;
          const y = PAD_T + plotH - barH;
          const active = hover === index;
          return (
            <g key={point.key}>
              {/* พื้นที่รับ hover กว้างกว่าตัวแท่ง เพื่อให้เล็งง่าย */}
              <rect
                x={PAD_L + index * slot}
                y={PAD_T}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(index)}
              />
              {point.value > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(barH, 2)}
                  rx={Math.min(4, barW / 2)}
                  fill={active ? INK_STRONG : INK}
                  pointerEvents="none"
                />
              )}
              {index % labelEvery === 0 && (
                <text
                  x={PAD_L + index * slot + slot / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fill={AXIS_TEXT}
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}

        <line x1={PAD_L} x2={width - PAD_R} y1={PAD_T + plotH} y2={PAD_T + plotH} stroke="#C9E9FB" strokeWidth={1} />
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-sky-950 px-2.5 py-1.5 text-[11px] leading-4 text-white shadow-lg whitespace-nowrap"
          style={{ left: `${((PAD_L + hover * slot + slot / 2) / width) * 100}%`, top: 4 }}
        >
          <div className="font-semibold">{formatValue(data[hover].value)}</div>
          <div className="text-sky-300">{data[hover].fullLabel}</div>
        </div>
      )}
    </div>
  );
};

/* ───────────────── กราฟแท่งแนวนอน (จัดอันดับ) ───────────────── */

export interface BarRow {
  key: string;
  label: string;
  value: number;
  sublabel?: string;
}

export const RankedBars: React.FC<{
  rows: BarRow[];
  formatValue: (v: number) => string;
  emptyMessage?: string;
}> = ({ rows, formatValue, emptyMessage = 'ยังไม่มีข้อมูล' }) => {
  const [hover, setHover] = useState<string | null>(null);
  if (!rows.length) return <div className="py-10 text-center text-sm text-slate-400">{emptyMessage}</div>;
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.key}
          onMouseEnter={() => setHover(row.key)}
          onMouseLeave={() => setHover(null)}
          className="group"
        >
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className="text-xs font-medium text-slate-700 truncate">{row.label}</span>
            <span className="text-xs font-bold text-sky-950 tabular-nums shrink-0">{formatValue(row.value)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full" style={{ background: GRID }}>
              <div
                className="h-2 rounded-full transition-colors"
                style={{ width: `${Math.max((row.value / max) * 100, 1.5)}%`, background: hover === row.key ? INK_STRONG : INK }}
              />
            </div>
            {row.sublabel && <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">{row.sublabel}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
};

/* ───────────────── เส้นเล็กในการ์ดตัวเลข ───────────────── */

export const Sparkline: React.FC<{ values: number[]; width?: number; height?: number }> = ({
  values, width = 96, height = 28,
}) => {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / span) * (height - 4) - 2}`);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <polyline points={points.join(' ')} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) * step} cy={height - ((values[values.length - 1] - min) / span) * (height - 4) - 2} r={3} fill={INK} />
    </svg>
  );
};

/* ───────────────── มาตรวัดสัดส่วน ───────────────── */

export const Meter: React.FC<{ value: number; total: number; label: string; formatValue: (v: number) => string }> = ({
  value, total, label, formatValue,
}) => {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="text-xs font-bold text-sky-950 tabular-nums">{formatValue(value)}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: GRID }}>
        <div className="h-2 rounded-full" style={{ width: `${Math.max(pct, 1)}%`, background: pct > 0 ? INK : MUTED }} />
      </div>
    </div>
  );
};

/* ───────────────── สลับดูเป็นตาราง (ทางเลือกที่ไม่ต้องพึ่งสี) ───────────────── */

export const ChartTableToggle: React.FC<{
  rows: { label: string; value: string }[];
  headers: [string, string];
}> = ({ rows, headers }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-2"
      >
        {open ? 'ซ่อนตาราง' : 'ดูเป็นตาราง'}
      </button>
      {open && (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <caption className="sr-only">ข้อมูลเดียวกับกราฟด้านบนในรูปแบบตาราง</caption>
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-semibold text-slate-600">{headers[0]}</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-600">{headers[1]}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.label}-${index}`} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 text-slate-700">{row.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-slate-900">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
