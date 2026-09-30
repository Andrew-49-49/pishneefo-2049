import React, { useState } from 'react';
import { FileText, GripVertical, HelpCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { createArticle, createFaq, deleteArticle, deleteFaq, reorderArticles, saveAbout, updateArticle, updateFaq, useDB } from '../store';
import { FaqItem, JournalArticle } from '../types';
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, Input, Modal, Textarea, useAction } from '../ui';

type Tab = 'journal' | 'faq' | 'about';

const TABS: { id: Tab; label: string }[] = [
  { id: 'journal', label: 'บทความ (Journal)' },
  { id: 'faq', label: 'คำถามที่พบบ่อย' },
  { id: 'about', label: 'หน้า Our Story' },
];

export const Content: React.FC = () => {
  const [tab, setTab] = useState<Tab>('journal');

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="ประเภทเนื้อหา" className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              tab === item.id ? 'bg-sky-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'journal' && <JournalTab />}
      {tab === 'faq' && <FaqTab />}
      {tab === 'about' && <AboutTab />}
    </div>
  );
};

/* ───────────────── บทความ ───────────────── */

const emptyArticle = (): JournalArticle => ({
  id: '', title: '', category: '', summary: '', content: '', image: '', readTime: '3 min read', published: true,
});

const JournalTab: React.FC = () => {
  const db = useDB();
  const { run } = useAction();
  const [editing, setEditing] = useState<JournalArticle | null>(null);
  const [deleting, setDeleting] = useState<JournalArticle | null>(null);

  const save = async (draft: JournalArticle) => {
    const isNew = !draft.id;
    const { id, ...input } = draft;
    const ok = await run(
      () => (isNew ? createArticle(input) : updateArticle(id, input)),
      isNew ? 'เพิ่มบทความแล้ว' : 'บันทึกบทความแล้ว',
    );
    if (ok) setEditing(null);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= db.journal.length) return;
    const ids = db.journal.map((a) => a.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void run(() => reorderArticles(ids));
  };

  return (
    <>
      <div className="flex justify-end">
        <Button icon={<Plus className="w-4 h-4" aria-hidden="true" />} onClick={() => setEditing(emptyArticle())}>
          เพิ่มบทความ
        </Button>
      </div>

      <Card className="mt-4 overflow-hidden">
        {db.journal.length === 0 ? (
          <EmptyState icon={<FileText className="w-6 h-6" aria-hidden="true" />} title="ยังไม่มีบทความ" message="เพิ่มบทความแรกเพื่อแสดงในหน้า Journal" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {db.journal.map((article, index) => (
              <li key={article.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col shrink-0" aria-hidden="true">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`เลื่อน "${article.title}" ขึ้น`}
                    className="text-slate-400 hover:text-sky-800 disabled:opacity-25 text-xs leading-3"
                  >
                    ▲
                  </button>
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 my-0.5" />
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === db.journal.length - 1}
                    aria-label={`เลื่อน "${article.title}" ลง`}
                    className="text-slate-400 hover:text-sky-800 disabled:opacity-25 text-xs leading-3"
                  >
                    ▼
                  </button>
                </div>
                <span className="w-16 h-12 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
                  {article.image && <img src={article.image} alt="" width={64} height={48} loading="lazy" className="w-full h-full object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-900 truncate">{article.title}</p>
                    {!article.published && <Badge className="border bg-slate-100 text-slate-600 border-slate-200">ฉบับร่าง</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{article.category} · {article.readTime}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(article)}
                    aria-label={`แก้ไข ${article.title}`}
                    className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-sky-100 hover:text-sky-900"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setDeleting(article)}
                    aria-label={`ลบ ${article.title}`}
                    className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-rose-100 hover:text-rose-800"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && <ArticleForm draft={editing} onSave={save} onCancel={() => setEditing(null)} />}

      <ConfirmDialog
        open={deleting !== null}
        title="ลบบทความ"
        message={`ต้องการลบ "${deleting?.title}" ใช่ไหม? การลบนี้ย้อนกลับไม่ได้`}
        confirmLabel="ลบ"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          void run(() => deleteArticle(deleting.id), 'ลบบทความแล้ว').then((ok) => ok && setDeleting(null));
        }}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
};

const ArticleForm: React.FC<{ draft: JournalArticle; onSave: (a: JournalArticle) => Promise<void>; onCancel: () => void }> = ({
  draft, onSave, onCancel,
}) => {
  const [form, setForm] = useState(draft);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof JournalArticle>(k: K, v: JournalArticle[K]) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Modal
      open
      onClose={onCancel}
      title={draft.id ? 'แก้ไขบทความ' : 'เพิ่มบทความใหม่'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>ยกเลิก</Button>
          <Button
            loading={saving}
            onClick={async () => {
              if (!form.title.trim()) return setError('ต้องใส่หัวข้อบทความ');
              setSaving(true);
              await onSave(form);
              setSaving(false);
            }}
          >
            บันทึก
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="หัวข้อ" required error={error}>
          {(props) => <Input {...props} value={form.title} onChange={(e) => { set('title', e.target.value); setError(''); }} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="หมวดหมู่" hint="เช่น Mix & Match, Gift Guides">
            {(props) => <Input {...props} value={form.category} onChange={(e) => set('category', e.target.value)} />}
          </Field>
          <Field label="เวลาอ่าน" hint='เช่น "3 min read"'>
            {(props) => <Input {...props} value={form.readTime} onChange={(e) => set('readTime', e.target.value)} />}
          </Field>
        </div>
        <Field label="ลิงก์รูปหน้าปก">
          {(props) => <Input {...props} type="url" value={form.image} onChange={(e) => set('image', e.target.value)} />}
        </Field>
        <Field label="สรุปย่อ" hint="ข้อความที่แสดงบนการ์ดในหน้ารายการ">
          {(props) => <Textarea {...props} rows={2} value={form.summary} onChange={(e) => set('summary', e.target.value)} />}
        </Field>
        <Field label="เนื้อหาเต็ม">
          {(props) => <Textarea {...props} rows={7} value={form.content} onChange={(e) => set('content', e.target.value)} />}
        </Field>
        <label className="flex items-center gap-2.5 text-sm text-slate-700">
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="w-4 h-4 rounded accent-sky-700" />
          เผยแพร่บนหน้าร้าน
        </label>
      </div>
    </Modal>
  );
};

/* ───────────────── FAQ ───────────────── */

const FaqTab: React.FC = () => {
  const db = useDB();
  const { run } = useAction();
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [deleting, setDeleting] = useState<FaqItem | null>(null);

  return (
    <>
      <div className="flex justify-end">
        <Button
          icon={<Plus className="w-4 h-4" aria-hidden="true" />}
          onClick={() => setEditing({ id: '', question: '', answer: '' })}
        >
          เพิ่มคำถาม
        </Button>
      </div>

      <Card className="mt-4 overflow-hidden">
        {db.faq.length === 0 ? (
          <EmptyState icon={<HelpCircle className="w-6 h-6" aria-hidden="true" />} title="ยังไม่มีคำถาม" message="เพิ่มคำถามที่ลูกค้าถามบ่อยเพื่อลดงานตอบแชท" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {db.faq.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.question}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-5">{item.answer}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(item)}
                    aria-label={`แก้ไขคำถาม: ${item.question}`}
                    className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-sky-100 hover:text-sky-900"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setDeleting(item)}
                    aria-label={`ลบคำถาม: ${item.question}`}
                    className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-rose-100 hover:text-rose-800"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <FaqForm
          draft={editing}
          onSave={async (record) => {
            const isNew = !record.id;
            const { id, ...input } = record;
            const ok = await run(
              () => (isNew ? createFaq(input) : updateFaq(id, input)),
              isNew ? 'เพิ่มคำถามแล้ว' : 'บันทึกแล้ว',
            );
            if (ok) setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="ลบคำถาม"
        message={`ต้องการลบ "${deleting?.question}" ใช่ไหม?`}
        confirmLabel="ลบ"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          void run(() => deleteFaq(deleting.id), 'ลบคำถามแล้ว').then((ok) => ok && setDeleting(null));
        }}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
};

const FaqForm: React.FC<{ draft: FaqItem; onSave: (f: FaqItem) => Promise<void>; onCancel: () => void }> = ({ draft, onSave, onCancel }) => {
  const [form, setForm] = useState(draft);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      open
      onClose={onCancel}
      title={draft.id ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>ยกเลิก</Button>
          <Button
            loading={saving}
            onClick={async () => {
              if (!form.question.trim()) return setError('ต้องใส่คำถาม');
              setSaving(true);
              await onSave(form);
              setSaving(false);
            }}
          >
            บันทึก
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="คำถาม" required error={error}>
          {(props) => (
            <Input {...props} value={form.question} onChange={(e) => { setForm((p) => ({ ...p, question: e.target.value })); setError(''); }} />
          )}
        </Field>
        <Field label="คำตอบ">
          {(props) => <Textarea {...props} rows={5} value={form.answer} onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))} />}
        </Field>
      </div>
    </Modal>
  );
};

/* ───────────────── Our Story ───────────────── */

const AboutTab: React.FC = () => {
  const db = useDB();
  const { run, busy } = useAction();
  const [form, setForm] = useState(db.about);
  const dirty = JSON.stringify(form) !== JSON.stringify(db.about);

  return (
    <Card>
      <CardHeader title="เนื้อหาหน้า Our Story" subtitle="ข้อความที่แสดงในหน้า /about ของหน้าร้าน" />
      <div className="px-5 py-5 space-y-4">
        <Field label="ข้อความนำ (kicker)" hint="ตัวเล็กเหนือหัวข้อใหญ่">
          {(props) => <Input {...props} value={form.kicker} onChange={(e) => setForm((p) => ({ ...p, kicker: e.target.value }))} />}
        </Field>
        <Field label="หัวข้อหลัก">
          {(props) => <Input {...props} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />}
        </Field>
        <Field label="หัวข้อส่วนเรื่องราว">
          {(props) => <Input {...props} value={form.storyTitle} onChange={(e) => setForm((p) => ({ ...p, storyTitle: e.target.value }))} />}
        </Field>
        <Field label="เนื้อหาเรื่องราว">
          {(props) => <Textarea {...props} rows={5} value={form.storyText} onChange={(e) => setForm((p) => ({ ...p, storyText: e.target.value }))} />}
        </Field>
        <div className="flex items-center gap-3 pt-1">
          <Button
            disabled={!dirty}
            loading={busy}
            onClick={() => void run(() => saveAbout(form), 'บันทึกเนื้อหาแล้ว')}
          >
            บันทึก
          </Button>
          {dirty && <span className="text-xs text-amber-800">มีการแก้ไขที่ยังไม่ได้บันทึก</span>}
        </div>
      </div>
    </Card>
  );
};
