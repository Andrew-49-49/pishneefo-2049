import React, { useEffect, useRef, useState } from 'react';
import { Database, Download, KeyRound, RotateCcw, Sparkles, Trash2, TriangleAlert, Upload } from 'lucide-react';
import { clearDemoData, exportData, importData, resetData, restoreDemoData, saveSettings, useDB } from '../store';
import { changePassword } from '../auth';
import { formatMoney, formatNumber } from '../format';
import { Button, Card, CardHeader, ConfirmDialog, Field, Input, useAction } from '../ui';

export const SettingsPage: React.FC<{ currency: string }> = ({ currency }) => {
  const db = useDB();
  const { run, busy } = useAction();
  const [store, setStore] = useState(db.settings);
  const [confirming, setConfirming] = useState<'reset' | 'demo' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(store) !== JSON.stringify(db.settings);

  // ถ้าเซิร์ฟเวอร์ส่งค่าใหม่มา (เช่นหลัง import) ให้ฟอร์มตามไปด้วย เว้นแต่กำลังแก้ค้างอยู่
  useEffect(() => {
    if (!dirty) setStore(db.settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.settings]);

  const saveStore = () => void run(() => saveSettings(store), 'บันทึกการตั้งค่าแล้ว');

  const setRate = (code: string, value: number) =>
    setStore((prev) => ({
      ...prev,
      rates: prev.rates.map((r) => (r.code === code ? { ...r, rateFromVND: value } : r)),
    }));

  const doExport = () =>
    void run(async () => {
      const payload = await exportData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `pishneefo-2049-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 'ดาวน์โหลดไฟล์สำรองแล้ว');

  const doImport = async (file: File) => {
    await run(async () => {
      const text = await file.text();
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error('ไฟล์ไม่ใช่ JSON ที่ถูกต้อง');
      }
      await importData(payload);   // เซิร์ฟเวอร์ตรวจโครงสร้างอีกชั้นก่อนเขียนลง DB
    }, 'นำเข้าข้อมูลสำเร็จ');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ข้อมูลร้าน */}
      <Card>
        <CardHeader title="ข้อมูลร้าน" subtitle="ข้อมูลติดต่อและข้อความที่แสดงบนหน้าร้าน" />
        <div className="px-5 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ชื่อร้าน">
              {(props) => <Input {...props} value={store.storeName} onChange={(e) => setStore({ ...store, storeName: e.target.value })} />}
            </Field>
            <Field label="อีเมลติดต่อ">
              {(props) => <Input {...props} type="email" value={store.email} onChange={(e) => setStore({ ...store, email: e.target.value })} />}
            </Field>
            <Field label="เบอร์โทร">
              {(props) => <Input {...props} value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} />}
            </Field>
            <Field label="ที่อยู่ / พื้นที่ให้บริการ">
              {(props) => <Input {...props} value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} />}
            </Field>
          </div>
          <Field label="คำโปรยร้าน">
            {(props) => <Input {...props} value={store.tagline} onChange={(e) => setStore({ ...store, tagline: e.target.value })} />}
          </Field>
          <Field label="แถบประกาศด้านบนเว็บ" hint="ข้อความที่วิ่งอยู่บนสุดของทุกหน้า">
            {(props) => <Input {...props} value={store.announcement} onChange={(e) => setStore({ ...store, announcement: e.target.value })} />}
          </Field>
        </div>
      </Card>

      {/* การจัดส่งและสต็อก */}
      <Card>
        <CardHeader title="การจัดส่งและสต็อก" subtitle="กรอกเป็น VND ซึ่งเป็นสกุลหลักของระบบ" />
        <div className="px-5 py-5 grid gap-4 sm:grid-cols-3">
          <Field label="ค่าจัดส่ง (VND)">
            {(props) => (
              <Input
                {...props}
                type="number"
                min={0}
                step={1000}
                value={store.shippingFee}
                onChange={(e) => setStore({ ...store, shippingFee: Number(e.target.value) })}
              />
            )}
          </Field>
          <Field label="ยอดขั้นต่ำส่งฟรี (VND)" hint={`= ${formatMoney(store.freeShippingThreshold, currency, db.settings)}`}>
            {(props) => (
              <Input
                {...props}
                type="number"
                min={0}
                step={10000}
                value={store.freeShippingThreshold}
                onChange={(e) => setStore({ ...store, freeShippingThreshold: Number(e.target.value) })}
              />
            )}
          </Field>
          <Field label="เตือนเมื่อสต็อกเหลือ ≤" hint="ใช้ตัดสินว่าสินค้าไหน 'ใกล้หมด'">
            {(props) => (
              <Input
                {...props}
                type="number"
                min={0}
                value={store.lowStockThreshold}
                onChange={(e) => setStore({ ...store, lowStockThreshold: Number(e.target.value) })}
              />
            )}
          </Field>
        </div>
      </Card>

      {/* อัตราแลกเปลี่ยน */}
      <Card>
        <CardHeader
          title="อัตราแลกเปลี่ยน"
          subtitle="จำนวนหน่วยของสกุลนั้นต่อ 1 VND — ใช้แปลงราคาตอนแสดงผลเท่านั้น"
        />
        <div className="px-5 py-5 space-y-3">
          {store.rates.map((rate) => (
            <div key={rate.code} className="grid grid-cols-[7rem_1fr_11rem] items-center gap-3">
              <span className="text-sm font-semibold text-slate-800">
                {rate.symbol} {rate.code}
                {rate.code !== 'VND' && rate.rateFromVND > 0 && (
                  <span className="block text-[10px] font-normal text-slate-400 tabular-nums">
                    1 {rate.symbol} ≈ {Math.round(1 / rate.rateFromVND).toLocaleString('en-US')} ₫
                  </span>
                )}
              </span>
              <input
                type="number"
                step="0.0000001"
                min={0}
                value={rate.rateFromVND}
                disabled={rate.code === 'VND'}
                onChange={(e) => setRate(rate.code, Number(e.target.value))}
                aria-label={`อัตราแลกเปลี่ยนของ ${rate.label}`}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm tabular-nums outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500"
              />
              <span className="text-xs text-slate-500 tabular-nums text-right">
                159,000 ₫ ≈ {formatMoney(159000, rate.code, { ...store })}
              </span>
            </div>
          ))}
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
            <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              อัตราเหล่านี้เป็นค่าคงที่ที่กรอกเอง ไม่ใช่อัตราตลาดจริง
              ก่อนรับชำระเงินจริงควรต่อกับผู้ให้บริการ FX หรือ payment gateway
            </span>
          </p>
        </div>
      </Card>

      {dirty && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-xl border border-sky-200 bg-white px-4 py-3 shadow-lg">
          <span className="text-xs text-slate-600">มีการแก้ไขที่ยังไม่ได้บันทึก</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStore(db.settings)}>ยกเลิก</Button>
            <Button onClick={saveStore} loading={busy}>บันทึกการตั้งค่า</Button>
          </div>
        </div>
      )}

      <ChangePasswordCard />

      {/* ข้อมูล */}
      <Card>
        <CardHeader
          title="ข้อมูลและการสำรอง"
          subtitle={`เก็บใน SQLite บนเซิร์ฟเวอร์ · สินค้า ${formatNumber(db.products.length)} · คำสั่งซื้อ ${formatNumber(db.orders.length)}`}
        />
        <div className="px-5 py-5 space-y-4">
          <p className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs leading-5 text-sky-900">
            ข้อมูลทั้งหมดอยู่ในไฟล์ <code className="font-mono">data/pishneefo.db</code> บนเซิร์ฟเวอร์
            เปิดจากเครื่องไหนก็เห็นข้อมูลชุดเดียวกัน — ควรตั้ง backup ของไฟล์นั้นไว้ด้วย
            และกด "ดาวน์โหลดไฟล์สำรอง" เก็บสำเนาไว้เป็นระยะ
          </p>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Download className="w-4 h-4" aria-hidden="true" />} onClick={doExport}>
              ดาวน์โหลดไฟล์สำรอง
            </Button>
            <Button variant="secondary" icon={<Upload className="w-4 h-4" aria-hidden="true" />} onClick={() => fileRef.current?.click()}>
              นำเข้าไฟล์สำรอง
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="เลือกไฟล์สำรองเพื่อนำเข้า"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void doImport(file);
              }}
            />
            {db.demoDataPresent ? (
              <Button variant="secondary" icon={<Trash2 className="w-4 h-4" aria-hidden="true" />} onClick={() => setConfirming('demo')}>
                ล้างคำสั่งซื้อตัวอย่าง
              </Button>
            ) : (
              <Button
                variant="secondary"
                icon={<Sparkles className="w-4 h-4" aria-hidden="true" />}
                onClick={() => void run(() => restoreDemoData(), 'ใส่คำสั่งซื้อตัวอย่างกลับแล้ว')}
              >
                ใส่ข้อมูลตัวอย่างกลับ
              </Button>
            )}
            <Button variant="danger" icon={<RotateCcw className="w-4 h-4" aria-hidden="true" />} onClick={() => setConfirming('reset')}>
              รีเซ็ตข้อมูลทั้งหมด
            </Button>
          </div>

          <div className="flex items-start gap-2.5 pt-1 text-xs text-slate-500">
            <Database className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span>
              การนำเข้าไฟล์จะทับข้อมูลสินค้า คำสั่งซื้อ เนื้อหา และการตั้งค่าทั้งหมด
              แต่จะ<strong>ไม่</strong>แตะตาราง users และ sessions — ไฟล์ที่นำเข้าจึงเปลี่ยนรหัสผ่านคุณไม่ได้
            </span>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={confirming === 'demo'}
        title="ล้างคำสั่งซื้อตัวอย่าง"
        message="จะลบคำสั่งซื้อตัวอย่างทั้งหมดออก เหลือระบบเปล่าพร้อมใช้งานจริง สินค้าและเนื้อหายังอยู่ครบ"
        confirmLabel="ล้างข้อมูลตัวอย่าง"
        destructive
        onConfirm={() => {
          void run(() => clearDemoData(), 'ล้างคำสั่งซื้อตัวอย่างแล้ว').then(() => setConfirming(null));
        }}
        onCancel={() => setConfirming(null)}
      />

      <ConfirmDialog
        open={confirming === 'reset'}
        title="รีเซ็ตข้อมูลทั้งหมด"
        message="สินค้า คำสั่งซื้อ เนื้อหา และการตั้งค่าทั้งหมดจะกลับไปเป็นค่าเริ่มต้น การกระทำนี้ย้อนกลับไม่ได้ — ควรดาวน์โหลดไฟล์สำรองก่อน"
        confirmLabel="รีเซ็ตทั้งหมด"
        destructive
        onConfirm={() => {
          void run(() => resetData(), 'รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นแล้ว').then(() => setConfirming(null));
        }}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
};

const ChangePasswordCard: React.FC = () => {
  const { run } = useAction();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (next !== confirm) return setError('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');

    setBusy(true);
    const result = await changePassword(current, next);
    setBusy(false);

    if (result.ok) {
      setCurrent('');
      setNext('');
      setConfirm('');
      // เซิร์ฟเวอร์ล้างเซสชันอื่นทั้งหมดแล้ว เหลือเฉพาะเครื่องนี้
      void run(async () => {}, 'เปลี่ยนรหัสผ่านแล้ว · อุปกรณ์อื่นถูกให้ออกจากระบบทั้งหมด');
    } else {
      setError(result.error ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    }
  };

  return (
    <Card>
      <CardHeader title="เปลี่ยนรหัสผ่าน" subtitle="สร้าง salt ใหม่และเตะทุกเซสชันออก ยกเว้นเครื่องนี้" />
      <form onSubmit={submit} className="px-5 py-5 space-y-4 max-w-md">
        <Field label="รหัสผ่านปัจจุบัน" required>
          {(props) => (
            <Input {...props} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          )}
        </Field>
        <Field label="รหัสผ่านใหม่" required hint="อย่างน้อย 8 ตัว มีพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข">
          {(props) => (
            <Input {...props} type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
          )}
        </Field>
        <Field label="ยืนยันรหัสผ่านใหม่" required error={error}>
          {(props) => (
            <Input {...props} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          )}
        </Field>
        <Button type="submit" loading={busy} icon={<KeyRound className="w-4 h-4" aria-hidden="true" />}>
          เปลี่ยนรหัสผ่าน
        </Button>
      </form>
    </Card>
  );
};
