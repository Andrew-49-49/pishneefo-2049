import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ImageOff, PackageSearch, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { createProduct, deleteProduct, patchProduct, updateProduct, useDB } from '../store';
import { AdminProduct } from '../types';
import { CategoryType, MaterialType } from '../../types';
import { formatMoney, formatNumber, slugify } from '../format';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Textarea, useAction } from '../ui';

const CATEGORIES: CategoryType[] = ['Tropical', 'Shells', 'Waves', 'Sea Life', 'Anklets', 'Letters', 'Symbols'];
const MATERIALS: MaterialType[] = ['Gold', 'Silver', 'Mixed Metal'];

type SortKey = 'name' | 'price' | 'stock' | 'updated';

const emptyDraft = (): AdminProduct => ({
  id: '',
  slug: '',
  name: '',
  price: 0,
  category: 'Symbols',
  material: 'Silver',
  image: '',
  gallery: [],
  shortDescription: '',
  description: '',
  sku: '',
  stock: 0,
  badge: '',
  isFeatured: false,
  active: true,
  createdAt: '',
  updatedAt: '',
});

export const Products: React.FC<{ currency: string }> = ({ currency }) => {
  const db = useDB();
  const { run } = useAction();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | CategoryType>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [sort, setSort] = useState<SortKey>('updated');
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);

  const money = (v: number) => formatMoney(v, currency, db.settings);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = db.products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q);
      const matchesCategory = category === 'All' || p.category === category;
      const stock = p.stock ?? 0;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'out' && stock === 0) ||
        (stockFilter === 'low' && stock > 0 && stock <= db.settings.lowStockThreshold);
      return matchesQuery && matchesCategory && matchesStock;
    });
    const sorted = [...list];
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'price') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'stock') sorted.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
    else sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return sorted;
  }, [db.products, db.settings.lowStockThreshold, query, category, stockFilter, sort]);

  /** เซิร์ฟเวอร์เป็นคนกำหนด id, slug และเวลา — ส่งไปเฉพาะเนื้อหาที่ผู้ใช้กรอก */
  const save = async (draft: AdminProduct) => {
    const isNew = !draft.id;
    const input = {
      name: draft.name,
      slug: draft.slug || slugify(draft.name),
      price: draft.price,
      originalPrice: draft.originalPrice,
      category: draft.category,
      material: draft.material,
      image: draft.image,
      gallery: (draft.gallery ?? []).filter(Boolean),
      shortDescription: draft.shortDescription,
      description: draft.description,
      sku: draft.sku,
      stock: draft.stock,
      badge: draft.badge,
      isFeatured: draft.isFeatured,
      active: draft.active,
    };

    const ok = await run(
      () => (isNew ? createProduct(input) : updateProduct(draft.id, input)),
      isNew ? `เพิ่ม "${draft.name}" แล้ว` : `บันทึก "${draft.name}" แล้ว`,
    );
    if (ok) setEditing(null);
  };

  const remove = async (product: AdminProduct) => {
    const ok = await run(() => deleteProduct(product.id), `ลบ "${product.name}" แล้ว`);
    if (ok) setDeleting(null);
  };

  const setStock = (product: AdminProduct, stock: number) => {
    void run(() => patchProduct(product.id, { stock: Math.max(0, stock) }));
  };

  const toggleActive = (product: AdminProduct) => {
    void run(
      () => patchProduct(product.id, { active: !product.active }),
      product.active ? `ซ่อน "${product.name}" จากหน้าร้านแล้ว` : `แสดง "${product.name}" บนหน้าร้านแล้ว`,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[15rem]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="ค้นหาสินค้าตามชื่อหรือ SKU"
            placeholder="ค้นหาชื่อสินค้าหรือ SKU…"
            className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600">
          <span className="whitespace-nowrap">หมวด</span>
          <Select value={category} onChange={(e) => setCategory(e.target.value as 'All' | CategoryType)} className="!py-2 !w-auto">
            <option value="All">ทั้งหมด</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-600">
          <span className="whitespace-nowrap">สต็อก</span>
          <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)} className="!py-2 !w-auto">
            <option value="all">ทั้งหมด</option>
            <option value="low">ใกล้หมด</option>
            <option value="out">หมดแล้ว</option>
          </Select>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-600">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only whitespace-nowrap">เรียงตาม</span>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="!py-2 !w-auto">
            <option value="updated">แก้ไขล่าสุด</option>
            <option value="name">ชื่อ A–Z</option>
            <option value="price">ราคาสูง→ต่ำ</option>
            <option value="stock">สต็อกน้อย→มาก</option>
          </Select>
        </label>

        <Button icon={<Plus className="w-4 h-4" aria-hidden="true" />} onClick={() => setEditing(emptyDraft())}>
          เพิ่มสินค้า
        </Button>
      </div>

      <p className="text-xs text-slate-500" aria-live="polite">
        แสดง {formatNumber(rows.length)} จาก {formatNumber(db.products.length)} รายการ
      </p>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="w-6 h-6" aria-hidden="true" />}
            title="ไม่พบสินค้าที่ตรงเงื่อนไข"
            message="ลองล้างตัวกรองหรือเปลี่ยนคำค้นหา"
            action={
              <Button variant="secondary" onClick={() => { setQuery(''); setCategory('All'); setStockFilter('all'); }}>
                ล้างตัวกรอง
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem] text-sm">
              <caption className="sr-only">รายการสินค้าทั้งหมดในร้าน</caption>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3 text-left font-semibold">สินค้า</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">หมวด / วัสดุ</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">ราคา</th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold">สต็อก</th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold">หน้าร้าน</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((product) => {
                  const stock = product.stock ?? 0;
                  const low = stock > 0 && stock <= db.settings.lowStockThreshold;
                  return (
                    <tr key={product.id} className="hover:bg-sky-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-11 h-11 shrink-0 rounded-xl bg-slate-100 overflow-hidden grid place-items-center">
                            {product.image ? (
                              <img src={product.image} alt="" width={44} height={44} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (
                              <ImageOff className="w-4 h-4 text-slate-400" aria-hidden="true" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{product.name}</p>
                            <p className="text-[11px] text-slate-500 tabular-nums">{product.sku || '—'}</p>
                          </div>
                          {product.badge && <Badge className="border bg-sky-50 text-sky-900 border-sky-200">{product.badge}</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {product.category}
                        <span className="text-slate-300 mx-1">·</span>
                        {product.material}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{money(product.price)}</span>
                        {product.originalPrice && (
                          <span className="block text-[11px] text-slate-500 line-through">{money(product.originalPrice)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <input
                            type="number"
                            min={0}
                            value={stock}
                            onChange={(e) => setStock(product, Number(e.target.value))}
                            aria-label={`จำนวนสต็อกของ ${product.name}`}
                            className={`w-20 rounded-lg border px-2 py-1.5 text-center text-sm tabular-nums outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 ${
                              stock === 0
                                ? 'border-rose-300 bg-rose-50 text-rose-900'
                                : low
                                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                                  : 'border-slate-300 bg-white text-slate-900'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(product)}
                          role="switch"
                          aria-checked={product.active}
                          aria-label={`แสดง ${product.name} บนหน้าร้าน`}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.active ? 'bg-sky-700' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${product.active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditing(product)}
                            aria-label={`แก้ไข ${product.name}`}
                            className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-sky-100 hover:text-sky-900"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setDeleting(product)}
                            aria-label={`ลบ ${product.name}`}
                            className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-rose-100 hover:text-rose-800"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && <ProductForm draft={editing} currency={currency} onSave={save} onCancel={() => setEditing(null)} />}

      <ConfirmDialog
        open={deleting !== null}
        title="ลบสินค้า"
        message={`ต้องการลบ "${deleting?.name}" ออกจากระบบใช่ไหม? การลบนี้ย้อนกลับไม่ได้ — ถ้าแค่อยากซ่อนจากหน้าร้าน ให้ปิดสวิตช์ "หน้าร้าน" แทน`}
        confirmLabel="ลบถาวร"
        destructive
        onConfirm={() => { if (deleting) void remove(deleting); }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

/* ───────────────── ฟอร์มเพิ่ม/แก้ไขสินค้า ───────────────── */

const ProductForm: React.FC<{
  draft: AdminProduct;
  currency: string;
  onSave: (p: AdminProduct) => Promise<void>;
  onCancel: () => void;
}> = ({ draft, onSave, onCancel }) => {
  const [form, setForm] = useState<AdminProduct>(draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isNew = !draft.id;

  const set = <K extends keyof AdminProduct>(key: K, value: AdminProduct[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ตรวจฝั่ง client เพื่อบอกผู้ใช้เร็ว ๆ — เซิร์ฟเวอร์ตรวจซ้ำอีกชั้นอยู่แล้ว
  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'ต้องใส่ชื่อสินค้า';
    if (!(form.price > 0)) next.price = 'ราคาต้องมากกว่า 0';
    if (form.originalPrice && form.originalPrice <= form.price) next.originalPrice = 'ราคาเดิมต้องสูงกว่าราคาขาย';
    if ((form.stock ?? 0) < 0) next.stock = 'สต็อกติดลบไม่ได้';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title={isNew ? 'เพิ่มสินค้าใหม่' : `แก้ไข: ${draft.name}`}
      description="ราคาทั้งหมดกรอกเป็น VND (สกุลหลักของระบบ) แล้วระบบจะแปลงให้ตอนแสดงผล"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>ยกเลิก</Button>
          <Button onClick={() => void submit()} loading={saving}>{isNew ? 'เพิ่มสินค้า' : 'บันทึกการแก้ไข'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ชื่อสินค้า" required error={errors.name}>
            {(props) => (
              <Input
                {...props}
                value={form.name}
                onChange={(e) => {
                  set('name', e.target.value);
                  if (isNew) set('slug', slugify(e.target.value));
                }}
              />
            )}
          </Field>
          <Field label="Slug (ใช้ใน URL)" hint="เว้นว่างได้ ระบบจะสร้างจากชื่อให้">
            {(props) => <Input {...props} value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} />}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="ราคาขาย (VND)" required error={errors.price}>
            {(props) => (
              <Input {...props} type="number" min={0} step={1000} value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
            )}
          </Field>
          <Field label="ราคาเดิม (VND)" hint="ใส่เมื่อจะขีดฆ่าโชว์ส่วนลด" error={errors.originalPrice}>
            {(props) => (
              <Input
                {...props}
                type="number"
                min={0}
                step={1000}
                value={form.originalPrice ?? ''}
                onChange={(e) => set('originalPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            )}
          </Field>
          <Field label="สต็อก (ชิ้น)" error={errors.stock}>
            {(props) => (
              <Input {...props} type="number" min={0} value={form.stock ?? 0} onChange={(e) => set('stock', Number(e.target.value))} />
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="หมวดหมู่">
            {(props) => (
              <Select {...props} value={form.category} onChange={(e) => set('category', e.target.value as CategoryType)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            )}
          </Field>
          <Field label="วัสดุ">
            {(props) => (
              <Select {...props} value={form.material} onChange={(e) => set('material', e.target.value as MaterialType)}>
                {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            )}
          </Field>
          <Field label="SKU">
            {(props) => <Input {...props} value={form.sku ?? ''} onChange={(e) => set('sku', e.target.value)} />}
          </Field>
        </div>

        <Field label="ลิงก์รูปหลัก" hint="วาง URL รูปภาพ">
          {(props) => <Input {...props} type="url" value={form.image} onChange={(e) => set('image', e.target.value)} />}
        </Field>

        {form.image && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <img
              src={form.image}
              alt="ตัวอย่างรูปสินค้า"
              width={64}
              height={64}
              className="w-16 h-16 rounded-lg object-cover bg-white"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.25'; }}
            />
            <p className="text-xs text-slate-500">ตัวอย่างรูปที่จะแสดงบนหน้าร้าน</p>
          </div>
        )}

        <Field label="ลิงก์รูปเพิ่มเติม (แกลเลอรี)" hint="คั่นแต่ละ URL ด้วยการขึ้นบรรทัดใหม่">
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              value={(form.gallery ?? []).join('\n')}
              onChange={(e) => set('gallery', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
            />
          )}
        </Field>

        <Field label="คำโปรยสั้น" hint="ข้อความใต้ชื่อสินค้าในหน้ารายละเอียด">
          {(props) => <Input {...props} value={form.shortDescription ?? ''} onChange={(e) => set('shortDescription', e.target.value)} />}
        </Field>

        <Field label="รายละเอียดสินค้า">
          {(props) => <Textarea {...props} rows={4} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ป้ายกำกับ" hint='เช่น "Best seller", "New" — เว้นว่างได้'>
            {(props) => <Input {...props} value={form.badge ?? ''} onChange={(e) => set('badge', e.target.value)} />}
          </Field>
          <div className="flex flex-col justify-center gap-3 pt-5">
            <label className="flex items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!form.isFeatured}
                onChange={(e) => set('isFeatured', e.target.checked)}
                className="w-4 h-4 rounded accent-sky-700"
              />
              แสดงในกลุ่มสินค้าแนะนำ
            </label>
            <label className="flex items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
                className="w-4 h-4 rounded accent-sky-700"
              />
              แสดงบนหน้าร้าน
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};
