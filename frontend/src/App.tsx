import React, { Suspense, lazy, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ShopProvider, useShop } from './context/ShopContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { BuilderPage } from './pages/BuilderPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AboutPage } from './pages/AboutPage';
import { FaqsPage } from './pages/FaqsPage';
import { LookbookPage } from './pages/LookbookPage';
// โหลดแยก chunk — ลูกค้าหน้าร้านจะไม่ต้องดาวน์โหลดโค้ดหลังบ้านเลย
const AdminApp = lazy(() => import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })));

const MainContent: React.FC = () => {
  const { activePage, notification } = useShop();
  const content = activePage === 'home' ? <HomePage />
    : activePage === 'product' ? <ProductDetailPage />
    : activePage === 'builder' ? <BuilderPage />
    : activePage === 'checkout' ? <CheckoutPage />
    : activePage === 'about' ? <AboutPage />
    : activePage === 'faqs' ? <FaqsPage />
    : activePage === 'lookbook' ? <LookbookPage />
    : <ShopPage />;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-sky-200 selection:text-sky-950">
      {notification && (
        <div className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-2xl bg-sky-950 text-white px-4 py-3 shadow-2xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-cyan-300" /> {notification}
        </div>
      )}
      <Navbar />
      <main className="flex-1">{content}</main>
      <CartDrawer />
      <Footer />
    </div>
  );
};

/**
 * ระบบจัดการร้านอยู่แยกจากหน้าร้านโดยสิ้นเชิง เข้าถึงได้ 2 ทาง:
 *   /admin              — ต้องตั้ง SPA fallback ที่ host ก่อน
 *   /#admin/dashboard   — ใช้ได้ทันทีบน static host ทุกเจ้า ไม่ต้องตั้งค่าอะไร
 */
const isAdminUrl = () =>
  window.location.pathname.replace(/\/+$/, '') === '/admin' || window.location.hash.startsWith('#admin');

export default function App() {
  const [admin, setAdmin] = useState(isAdminUrl);

  useEffect(() => {
    const sync = () => setAdmin(isAdminUrl());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  if (admin) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen grid place-items-center bg-slate-50 text-sm text-slate-500">
            กำลังโหลดระบบจัดการร้าน…
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <LanguageProvider>
      <CurrencyProvider>
        <ShopProvider>
          <MainContent />
        </ShopProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}
