import React, { useState } from 'react';
import { KeyRound, ShieldAlert, ShieldCheck, UserPlus } from 'lucide-react';
import { Button, Field, Input } from '../ui';
import { checkPasswordStrength, createAccount, login } from '../auth';

export const LoginScreen: React.FC<{
  /** true = ยังไม่มีบัญชีในระบบ ให้แสดงหน้าตั้งค่าครั้งแรก (เซิร์ฟเวอร์เป็นคนบอก) */
  isSetup: boolean;
  onSuccess: () => void;
}> = ({ isSetup, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const strength = isSetup && password ? checkPasswordStrength(password) : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (isSetup && password !== confirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setBusy(true);
    const result = isSetup ? await createAccount(username, password) : await login(username, password);
    setBusy(false);

    if (result.ok) onSuccess();
    else setError(result.error ?? 'เกิดข้อผิดพลาด');
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-sky-100 via-sky-50 to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <img
            src="/assets/pishneefo-2049-logo.jpeg"
            alt=""
            width={64}
            height={64}
            className="w-16 h-16 rounded-2xl object-cover mx-auto border border-white shadow-md"
          />
          <h1 className="font-serif text-2xl text-sky-950 mt-4">Pishneefo 2049</h1>
          <p className="text-xs tracking-[0.18em] text-sky-700 font-bold mt-1">ระบบจัดการร้าน</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-[0_10px_40px_rgba(6,55,111,.08)]">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 grid place-items-center shrink-0">
              {isSetup ? <UserPlus className="w-4 h-4" aria-hidden="true" /> : <KeyRound className="w-4 h-4" aria-hidden="true" />}
            </span>
            <div>
              <h2 className="text-sm font-bold text-sky-950">{isSetup ? 'สร้างบัญชีผู้ดูแล' : 'เข้าสู่ระบบ'}</h2>
              <p className="text-xs text-slate-500">
                {isSetup ? 'ตั้งค่าครั้งแรก — บัญชีนี้จะถูกเก็บไว้บนเซิร์ฟเวอร์' : 'ใส่ชื่อผู้ใช้และรหัสผ่านของคุณ'}
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="ชื่อผู้ใช้" required>
              {(props) => (
                <Input
                  {...props}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              )}
            </Field>

            <Field
              label="รหัสผ่าน"
              required
              hint={isSetup ? 'อย่างน้อย 8 ตัว มีพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข' : undefined}
            >
              {(props) => (
                <Input
                  {...props}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSetup ? 'new-password' : 'current-password'}
                  required
                />
              )}
            </Field>

            {isSetup && (
              <>
                <Field label="ยืนยันรหัสผ่าน" required>
                  {(props) => (
                    <Input
                      {...props}
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  )}
                </Field>

                {strength && (
                  <ul className="space-y-1" aria-live="polite">
                    {strength.ok ? (
                      <li className="flex items-center gap-1.5 text-xs text-green-800">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> รหัสผ่านใช้ได้
                      </li>
                    ) : (
                      strength.problems.map((problem) => (
                        <li key={problem} className="flex items-center gap-1.5 text-xs text-amber-800">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> {problem}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </>
            )}

            {error && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                {error}
              </p>
            )}

            <Button type="submit" loading={busy} className="w-full">
              {isSetup ? 'สร้างบัญชีและเข้าใช้งาน' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
          รหัสผ่านถูก hash ด้วย scrypt บนเซิร์ฟเวอร์ · session อยู่ใน httpOnly cookie ที่ JavaScript อ่านไม่ได้
          <br />
          ระบบล็อกชั่วคราวเมื่อใส่รหัสผิดติดกันหลายครั้ง
        </p>
      </div>
    </div>
  );
};
