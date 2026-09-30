import React, { useEffect, useRef, useState } from 'react';
import { Banknote, ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CURRENCY_OPTIONS, useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../i18n/LanguageContext';

export const Navbar: React.FC = () => {
  const { activePage, navigateTo, cartCount, setIsCartOpen, searchQuery, setSearchQuery } = useShop();
  const { t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: t('nav.home'), page: 'home' as const },
    { label: t('nav.shop'), page: 'shop' as const },
    { label: t('nav.builder'), page: 'builder' as const },
    { label: t('nav.journal'), page: 'lookbook' as const },
    { label: t('nav.about'), page: 'about' as const },
  ];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) setCurrencyOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigateTo('shop');
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-sky-200 bg-sky-100/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(6,74,163,0.07)]">
      <div className="bg-sky-950 text-white text-[10px] sm:text-[11px] tracking-[0.12em] text-center py-2.5 px-4">
        <span className="text-cyan-300">✦</span> {t('announcement')} <span className="text-cyan-300">✦</span>
      </div>

      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[88px] flex items-center justify-between gap-5">
          <button onClick={() => navigateTo('home')} className="shrink-0 flex items-center gap-3 text-left" aria-label="Pishneefo 2049 home">
            <img src="/assets/pishneefo-2049-logo.jpeg" alt="Pishneefo 2049" className="w-[76px] h-[60px] sm:w-[92px] sm:h-[66px] object-cover rounded-2xl border border-white/70 shadow-sm" />
            <span className="hidden md:block">
              <span className="block font-serif font-bold text-[21px] tracking-[0.04em] leading-none text-sky-950">Pishneefo 2049</span>
              <span className="block mt-2 text-[8px] tracking-[0.25em] text-sky-700">SINCE 2021 · CHARMS & MEMORIES</span>
            </span>
          </button>

          <nav className="hidden xl:flex items-center gap-5 2xl:gap-7 text-[11px] tracking-[0.07em] font-semibold uppercase">
            {navItems.map((item) => (
              <button key={item.page} onClick={() => navigateTo(item.page)} className={`relative py-3 transition-colors ${activePage === item.page ? 'text-sky-950' : 'text-sky-800/75 hover:text-sky-950'}`}>
                {item.label}
                {activePage === item.page && <span className="absolute left-0 right-0 bottom-1 h-0.5 rounded-full bg-cyan-400" />}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <div className="relative">
              <button onClick={() => setSearchOpen((v) => !v)} className="w-10 h-10 grid place-items-center rounded-full text-sky-900 hover:bg-white hover:text-sky-950" aria-label={t('search.button')}>
                <Search className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </button>
              {searchOpen && (
                <form onSubmit={handleSearch} className="absolute right-0 top-12 w-[310px] rounded-2xl bg-white border border-sky-200 shadow-[0_20px_60px_rgba(6,74,163,0.18)] p-3 flex gap-2">
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus placeholder={t('search.placeholder')} className="min-w-0 flex-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:bg-white" />
                  <button className="rounded-xl bg-sky-950 text-white px-4 text-[11px] font-semibold uppercase tracking-wide hover:bg-sky-800">{t('search.button')}</button>
                </form>
              )}
            </div>

            <div ref={currencyRef} className="relative">
              <button onClick={() => setCurrencyOpen((v) => !v)} className="h-10 px-2.5 lg:px-3 flex items-center gap-1.5 rounded-full text-sky-900 hover:bg-white hover:text-sky-950 text-[11px] font-bold" aria-label="Choose currency">
                <Banknote className="w-[17px] h-[17px]" strokeWidth={1.8} />
                <span>{currency}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
              </button>
              {currencyOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-2xl bg-white border border-sky-200 shadow-[0_20px_60px_rgba(6,74,163,0.18)] p-2">
                  <div className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-sky-700">Payment currency</div>
                  {CURRENCY_OPTIONS.map((item) => (
                    <button key={item.code} onClick={() => { setCurrency(item.code); setCurrencyOpen(false); }} className={`w-full rounded-xl px-3 py-2.5 flex items-center justify-between text-sm ${currency === item.code ? 'bg-sky-100 text-sky-950 font-semibold' : 'text-slate-600 hover:bg-sky-50'}`}>
                      <span>{item.label}</span><span className="font-bold">{item.symbol} {item.code}</span>
                    </button>
                  ))}
                  <p className="px-3 pt-2 pb-1 text-[10px] leading-4 text-slate-400">Displayed prices use demo conversion rates and can be connected to a live FX service later.</p>
                </div>
              )}
            </div>

            <button onClick={() => navigateTo('faqs')} className="hidden lg:grid w-10 h-10 place-items-center rounded-full text-sky-900 hover:bg-white hover:text-sky-950" aria-label={t('nav.support')}>
              <UserRound className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </button>

            <button onClick={() => setIsCartOpen(true)} className="w-10 h-10 grid place-items-center rounded-full text-sky-900 hover:bg-white hover:text-sky-950 relative" aria-label={t('cart.title')}>
              <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.8} />
              {cartCount > 0 && <span className="absolute top-0 right-0 min-w-5 h-5 px-1 rounded-full bg-cyan-400 text-sky-950 font-bold text-[10px] grid place-items-center shadow-sm">{cartCount}</span>}
            </button>

            <button onClick={() => setMobileMenuOpen((v) => !v)} className="xl:hidden w-10 h-10 grid place-items-center rounded-full text-sky-900 hover:bg-white" aria-label="Menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="xl:hidden bg-sky-50 border-t border-sky-200 px-4 pb-5 shadow-lg">
          <div className="py-2">
            {navItems.map((item) => (
              <button key={item.page} onClick={() => { navigateTo(item.page); setMobileMenuOpen(false); }} className={`block w-full text-left py-3.5 border-b border-sky-100 text-sm ${activePage === item.page ? 'text-sky-950 font-semibold' : 'text-sky-800'}`}>{item.label}</button>
            ))}
          </div>
          <div className="pt-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-sky-700 mb-2">Payment currency</div>
            <div className="grid grid-cols-2 gap-2">
              {CURRENCY_OPTIONS.map((item) => (
                <button key={item.code} onClick={() => setCurrency(item.code)} className={`rounded-xl border px-3 py-2.5 text-left text-sm ${currency === item.code ? 'border-sky-500 bg-white text-sky-950 font-semibold' : 'border-sky-200 text-sky-800'}`}>{item.symbol} {item.code}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
