import React, { useCallback, useEffect, useState } from 'react';
import {
  ExternalLink, FileText, LayoutDashboard, Loader2, LogOut, Menu, Package, Receipt, RefreshCw,
  Settings as SettingsIcon, TriangleAlert, X,
} from 'lucide-react';
import { Button, ToastProvider } from './ui';
import { fetchStatus, logout } from './auth';
import { clearCache, refresh, useDB } from './store';
import { LoginScreen } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { Content } from './pages/Content';
import { SettingsPage } from './pages/Settings';

export type AdminRoute = 'dashboard' | 'products' | 'orders' | 'content' | 'settings';

const NAV: { id: AdminRoute; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'ภาพรวม', icon: <LayoutDashboard className="w-[18px] h-[18px]" aria-hidden="true" /> },
  { id: 'products', label: 'สินค้า', icon: <Package className="w-[18px] h-[18px]" aria-hidden="true" /> },
  { id: 'orders', label: 'คำสั่งซื้อ', icon: <Receipt className="w-[18px] h-[18px]" aria-hidden="true" /> },
  { id: 'content', label: 'เนื้อหา', icon: <FileText className="w-[18px] h-[18px]" aria-hidden="true" /> },
  { id: 'settings', label: 'ตั้งค่า', icon: <SettingsIcon className="w-[18px] h-[18px]" aria-hidden="true" /> },
];

const PAGE_TITLE: Record<AdminRoute, { title: string; subtitle: string }> = {
  dashboard: { title: 'ภาพรวมร้าน', subtitle: 'ยอดขาย คำสั่งซื้อ และสินค้าที่ต้องดูแล' },
  products: { title: 'จัดการสินค้า', subtitle: 'เพิ่ม แก้ไข ตั้งราคา และคุมสต็อก' },
  orders: { title: 'คำสั่งซื้อ', subtitle: 'ติดตามสถานะและดูรายละเอียดการผลิต' },
  content: { title: 'เนื้อหาเว็บไซต์', subtitle: 'บทความ คำถามที่พบบ่อย และหน้า Our Story' },
  settings: { title: 'ตั้งค่า', subtitle: 'ข้อมูลร้าน อัตราแลกเปลี่ยน และการสำรองข้อมูล' },
};

/**
 * เส้นทางใช้ hash เพื่อให้ deep link ทำงานได้ทุกที่โดยไม่ต้องพึ่ง SPA fallback
 * (ตอนรันผ่าน `npm start` เซิร์ฟเวอร์ Express มี fallback ให้อยู่แล้ว /admin ก็ใช้ได้)
 */
function parseHash(): AdminRoute {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const segment = raw.split('/')[1] as AdminRoute | undefined;
  return NAV.some((n) => n.id === segment) ? (segment as AdminRoute) : 'dashboard';
}

type Phase = 'checking' | 'login' | 'loading' | 'ready' | 'error';

export const AdminApp: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('checking');
  const [isSetup, setIsSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [route, setRoute] = useState<AdminRoute>(parseHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [currency, setCurrency] = useState(() => window.localStorage.getItem('pishneefo-admin-currency') ?? 'THB');

  /** ถามเซิร์ฟเวอร์ว่ามีบัญชีไหม และเรายังล็อกอินอยู่หรือเปล่า แล้วโหลดข้อมูล */
  const bootstrap = useCallback(async () => {
    setPhase('checking');
    setErrorMessage('');
    try {
      const status = await fetchStatus();
      setIsSetup(!status.hasAccount);
      if (!status.user) {
        clearCache();
        setPhase('login');
        return;
      }
      setUsername(status.user.username);
      setPhase('loading');
      await refresh();
      setPhase('ready');
    } catch (error) {
      setErrorMessage((error as Error).message);
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash());
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash.startsWith('#admin')) window.location.hash = '#admin/dashboard';
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const go = useCallback((next: string) => {
    window.location.hash = `#admin/${next}`;
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    clearCache();
    setPhase('login');
  }, []);

  /** เซสชันหมดอายุระหว่างใช้งาน — พากลับไปหน้าล็อกอินแทนที่จะค้างหน้าเปล่า */
  const handleSessionLost = useCallback(() => {
    clearCache();
    setPhase('login');
  }, []);

  if (phase === 'checking' || phase === 'loading') {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <p className="flex items-center gap-2.5 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          {phase === 'checking' ? 'กำลังตรวจสอบสิทธิ์…' : 'กำลังโหลดข้อมูลร้าน…'}
        </p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-700 grid place-items-center">
            <TriangleAlert className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-base font-bold text-sky-950">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{errorMessage}</p>
          <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-left text-xs text-slate-600">
            ตรวจว่าเซิร์ฟเวอร์รันอยู่: <code className="font-mono font-semibold text-sky-900">npm run dev</code>
            <br />
            แล้วเปิด <code className="font-mono">http://localhost:4000/api/health</code> ดูว่าตอบกลับไหม
          </p>
          <Button className="mt-5" icon={<RefreshCw className="w-4 h-4" aria-hidden="true" />} onClick={() => void bootstrap()}>
            ลองใหม่
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'login') {
    return <LoginScreen isSetup={isSetup} onSuccess={() => void bootstrap()} />;
  }

  return (
    <ToastProvider>
      <AdminShell
        route={route}
        currency={currency}
        username={username}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        onGo={go}
        onCurrencyChange={(next) => {
          setCurrency(next);
          window.localStorage.setItem('pishneefo-admin-currency', next);
        }}
        onLogout={() => void handleLogout()}
        onSessionLost={handleSessionLost}
      >
        {route === 'dashboard' && (
          <Dashboard
            currency={currency}
            onGoTo={go}
            onOpenOrder={(id) => {
              setOpenOrderId(id);
              go('orders');
            }}
          />
        )}
        {route === 'products' && <Products currency={currency} />}
        {route === 'orders' && <Orders currency={currency} openOrderId={openOrderId} onOpenOrder={setOpenOrderId} />}
        {route === 'content' && <Content />}
        {route === 'settings' && <SettingsPage currency={currency} />}
      </AdminShell>
    </ToastProvider>
  );
};

const AdminShell: React.FC<{
  route: AdminRoute;
  currency: string;
  username: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onGo: (r: string) => void;
  onCurrencyChange: (c: string) => void;
  onLogout: () => void;
  onSessionLost: () => void;
  children: React.ReactNode;
}> = ({ route, currency, username, menuOpen, onToggleMenu, onGo, onCurrencyChange, onLogout, onSessionLost, children }) => {
  const db = useDB();
  const page = PAGE_TITLE[route];
  const pendingCount = db.orders.filter((o) => o.status === 'pending').length;
  const [syncing, setSyncing] = useState(false);

  const reload = async () => {
    setSyncing(true);
    try {
      await refresh();
    } catch (error) {
      if ((error as { status?: number }).status === 401) onSessionLost();
    } finally {
      setSyncing(false);
    }
  };

  const navList = (
    <nav aria-label="เมนูหลัก" className="space-y-1">
      {NAV.map((item) => {
        const active = route === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onGo(item.id)}
            aria-current={active ? 'page' : undefined}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? 'bg-sky-800 text-white' : 'text-sky-100/80 hover:bg-sky-900/60 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.id === 'orders' && pendingCount > 0 && (
              <span
                className="min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-cyan-400 text-[10px] font-bold text-sky-950"
                aria-label={`${pendingCount} รายการรอชำระเงิน`}
              >
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-sky-950 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen bg-sky-950 px-4 py-5">
          <BrandBlock />
          <div className="mt-6 flex-1">{navList}</div>
          <SidebarFooter onLogout={onLogout} username={username} />
        </aside>

        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-[70]">
            <button className="absolute inset-0 bg-sky-950/50" onClick={onToggleMenu} aria-label="ปิดเมนู" />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sky-950 px-4 py-5 flex flex-col shadow-2xl">
              <div className="flex items-start justify-between">
                <BrandBlock />
                <button
                  onClick={onToggleMenu}
                  aria-label="ปิดเมนู"
                  className="w-9 h-9 grid place-items-center rounded-lg text-sky-200 hover:bg-sky-900"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 flex-1">{navList}</div>
              <SidebarFooter onLogout={onLogout} username={username} />
            </aside>
          </div>
        )}

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3.5">
              <button
                onClick={onToggleMenu}
                aria-label="เปิดเมนู"
                aria-expanded={menuOpen}
                className="lg:hidden w-9 h-9 grid place-items-center rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-sky-950 truncate">{page.title}</h1>
                <p className="text-xs text-slate-500 truncate hidden sm:block">{page.subtitle}</p>
              </div>

              <button
                onClick={() => void reload()}
                aria-label="ดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์"
                title="ดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์"
                className="w-9 h-9 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-sky-900 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>

              <label className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500 hidden md:inline">แสดงราคาเป็น</span>
                <span className="sr-only md:hidden">สกุลเงินที่ใช้แสดงราคา</span>
                <select
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                >
                  {db.settings.rates.map((rate) => (
                    <option key={rate.code} value={rate.code}>{rate.code}</option>
                  ))}
                </select>
              </label>

              <a
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                ดูหน้าร้าน
              </a>
            </div>
          </header>

          <main id="admin-content" className="px-4 sm:px-6 py-5 sm:py-6 max-w-[80rem]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

const BrandBlock: React.FC = () => (
  <div className="flex items-center gap-3">
    <img
      src="/assets/pishneefo-2049-logo.jpeg"
      alt=""
      width={40}
      height={40}
      className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
    />
    <div className="min-w-0">
      <p className="font-serif text-sm font-bold text-white leading-tight truncate">Pishneefo 2049</p>
      <p className="text-[10px] tracking-[0.16em] text-cyan-300 font-bold">ระบบจัดการร้าน</p>
    </div>
  </div>
);

const SidebarFooter: React.FC<{ onLogout: () => void; username: string }> = ({ onLogout, username }) => (
  <div className="pt-4 mt-4 border-t border-sky-900">
    <p className="px-3 text-[11px] text-sky-300 truncate">เข้าใช้งานเป็น <strong className="text-white">{username}</strong></p>
    <button
      onClick={onLogout}
      className="mt-2 w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-100/80 hover:bg-sky-900/60 hover:text-white transition-colors"
    >
      <LogOut className="w-[18px] h-[18px]" aria-hidden="true" />
      ออกจากระบบ
    </button>
  </div>
);
