import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Check, Info, Loader2, X } from 'lucide-react';

/* ───────────────────────── ปุ่ม ───────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_STYLE: Record<ButtonVariant, string> = {
  primary: 'bg-sky-800 text-white hover:bg-sky-900 disabled:bg-slate-300 disabled:text-slate-500',
  secondary: 'bg-white text-sky-900 border border-sky-200 hover:bg-sky-50 disabled:text-slate-400',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 disabled:text-slate-300',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-slate-300',
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean; icon?: React.ReactNode }
> = ({ variant = 'primary', loading, icon, children, className = '', disabled, ...rest }) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${BUTTON_STYLE[variant]} ${className}`}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : icon}
    {children}
  </button>
);

/* ───────────────────────── ฟิลด์ฟอร์ม ───────────────────────── */
/* ทุกฟิลด์มี <label> ผูกกับ input จริง ไม่ใช้ placeholder แทน label */

const CONTROL =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500';

export const Field: React.FC<{
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode;
}> = ({ label, hint, error, required, children }) => {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-rose-600 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-700 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...rest }) => (
  <input {...rest} className={`${CONTROL} ${className}`} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...rest }) => (
  <textarea {...rest} className={`${CONTROL} resize-y ${className}`} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...rest }) => (
  <select {...rest} className={`${CONTROL} ${className}`}>{children}</select>
);

/* ───────────────────────── การ์ด ───────────────────────── */

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(6,55,111,.06)] ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title, subtitle, action,
}) => (
  <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200">
    <div>
      <h2 className="text-sm font-bold text-sky-950">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

/* ───────────────────────── Modal ─────────────────────────
   ทำครบตามที่ควรเป็น: role=dialog, aria-modal, ปิดด้วย Escape,
   คลิกพื้นหลังปิดได้, ขัง focus ไว้ในกล่อง, คืน focus กลับที่เดิมตอนปิด,
   และล็อกการ scroll ของหน้าเบื้องหลัง
   ─────────────────────────────────────────────────────── */

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ open, onClose, title, description, children, footer, size = 'md' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    // ย้าย focus เข้ากล่องทันทีที่เปิด
    window.requestAnimationFrame(() => (focusables()[0] ?? panelRef.current)?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="fixed inset-0 bg-sky-950/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative w-full ${width} rounded-2xl bg-white shadow-2xl my-auto outline-none`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id={titleId} className="text-base font-bold text-sky-950">{title}</h2>
            {description && <p id={descId} className="text-xs text-slate-500 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="shrink-0 w-9 h-9 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, message, confirmLabel = 'ยืนยัน', destructive, onConfirm, onCancel }) => (
  <Modal
    open={open}
    onClose={onCancel}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onCancel}>ยกเลิก</Button>
        <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </>
    }
  >
    <p className="text-sm leading-6 text-slate-600">{message}</p>
  </Modal>
);

/* ───────────────────────── Toast ─────────────────────────
   อยู่ใน aria-live region เพื่อให้ screen reader ได้ยินด้วย
   และแต่ละใบมี timer ของตัวเอง ไม่ล้างกันเอง
   ─────────────────────────────────────────────────────── */

interface ToastItem { id: number; message: string; tone: 'success' | 'error' | 'info' }

const ToastContext = createContext<(message: string, tone?: ToastItem['tone']) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const ICON = { success: Check, error: AlertTriangle, info: Info };
  const TONE = {
    success: 'border-green-200 bg-green-50 text-green-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-[90] flex flex-col gap-2 pointer-events-none">
        {items.map((item) => {
          const Icon = ICON[item.tone];
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg max-w-sm ${TONE[item.tone]}`}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{item.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * ตัวช่วยเรียก action ที่คุยกับเซิร์ฟเวอร์
 * ทุกจุดที่แก้ข้อมูลต้องผ่านตัวนี้ เพื่อให้ error จากเซิร์ฟเวอร์ถูกแสดงเสมอ
 * ไม่ใช่เงียบหายไปแล้วผู้ใช้เข้าใจผิดว่าบันทึกสำเร็จ
 */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (fn: () => Promise<unknown>, successMessage?: string): Promise<boolean> => {
      setBusy(true);
      try {
        await fn();
        if (successMessage) toast(successMessage);
        return true;
      } catch (error) {
        toast((error as Error).message || 'บันทึกไม่สำเร็จ', 'error');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );

  return { busy, run };
}

/* ───────────────────────── อื่น ๆ ───────────────────────── */

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; message: string; action?: React.ReactNode }> = ({
  icon, title, message, action,
}) => (
  <div className="py-16 text-center">
    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 grid place-items-center">{icon}</div>
    <h3 className="mt-4 text-sm font-bold text-slate-800">{title}</h3>
    <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto leading-6">{message}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; className?: string; dot?: string }> = ({
  children, className = 'bg-slate-100 text-slate-700 border-slate-200', dot,
}) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${className}`}>
    {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} aria-hidden="true" />}
    {children}
  </span>
);
