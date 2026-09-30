import React from 'react';
import { ArrowRight, Gift, RefreshCw, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CHARM_PRODUCTS } from '../data/mockData';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../i18n/LanguageContext';

export const HomePage: React.FC = () => {
  const { navigateTo, addToCart } = useShop();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="overflow-hidden">
      <section className="brand-sparkle relative min-h-[650px] lg:min-h-[720px] flex items-center bg-sky-300 overflow-hidden">
        <div className="absolute -left-28 -top-28 w-[390px] h-[390px] rounded-full border-[70px] border-white/20" />
        <div className="absolute left-[42%] -bottom-20 w-56 h-56 rounded-full bg-cyan-400/90 blur-[1px]" />
        <div className="absolute right-[7%] top-[18%] w-24 h-24 rounded-full border-[14px] border-cyan-400/80" />

        <div className="relative max-w-[1380px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-24 grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
          <div className="max-w-2xl text-sky-950">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 backdrop-blur-md px-4 py-2 text-[10px] sm:text-[11px] tracking-[0.18em] font-bold">
              <Sparkles className="w-4 h-4 text-cyan-600" /> {t('home.kicker')}
            </div>
            <h1 className="font-serif font-bold text-5xl sm:text-6xl lg:text-[76px] leading-[1.02] mt-6 max-w-2xl">{t('home.title')}</h1>
            <p className="mt-6 text-sm sm:text-base text-sky-900/80 leading-7 max-w-lg">{t('home.subtitle')}</p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <button onClick={() => navigateTo('shop')} className="rounded-full bg-sky-950 text-white px-7 py-4 text-xs font-bold tracking-[0.1em] uppercase inline-flex items-center justify-center gap-3 hover:bg-sky-800 shadow-xl">
                {t('home.shop')} <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigateTo('builder')} className="rounded-full bg-cyan-400 text-sky-950 px-7 py-4 text-xs font-bold tracking-[0.1em] uppercase inline-flex items-center justify-center gap-3 hover:bg-white shadow-lg">
                <Sparkles className="w-4 h-4" /> {t('home.build')}
              </button>
            </div>
            <div className="mt-8 text-[10px] font-bold tracking-[0.2em] text-sky-800">SINCE 2021 · USD / THB / LAK / VND</div>
          </div>

          <div className="relative max-w-[560px] lg:ml-auto w-full">
            <div className="absolute -inset-5 rounded-[42px] bg-white/30 rotate-3" />
            <div className="relative rounded-[36px] border border-white/70 bg-white/50 backdrop-blur-xl p-4 sm:p-5 shadow-[0_30px_80px_rgba(6,55,111,.16)]">
              <img src="/assets/pishneefo-2049-logo.jpeg" alt="Pishneefo 2049 logo" className="w-full aspect-square object-cover rounded-[28px]" />
            </div>
            <div className="absolute -bottom-8 -left-7 sm:-left-12 w-36 h-36 sm:w-44 sm:h-44 rounded-full border-[8px] border-white overflow-hidden shadow-2xl bg-white">
              <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=90&w=700" alt="Italian charm jewelry" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
          <div>
            <p className="text-[10px] sm:text-[11px] tracking-[0.22em] font-bold text-sky-500">{t('home.best')}</p>
            <h2 className="font-serif text-4xl sm:text-5xl mt-2 text-sky-950">{t('home.bestTitle')}</h2>
          </div>
          <button onClick={() => navigateTo('shop')} className="inline-flex items-center gap-2 text-xs font-semibold text-sky-700 hover:text-sky-900">{t('home.viewAll')} <ArrowRight className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-9">
          {CHARM_PRODUCTS.slice(0, 8).map((product) => (
            <article key={product.id} className="group">
              <div className="relative">
                <button onClick={() => navigateTo('product', product.id)} className="block w-full aspect-square rounded-[26px] bg-gradient-to-br from-sky-50 to-cyan-50 overflow-hidden relative border border-sky-100">
                  {product.badge && <span className="absolute top-3 left-3 z-10 rounded-full bg-sky-950 text-white text-[9px] px-2.5 py-1.5 tracking-wide">{product.badge}</span>}
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-700" />
                </button>
                <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                  <button onClick={() => addToCart(product)} className="w-full rounded-full bg-white/95 backdrop-blur-md py-3 text-[10px] font-bold uppercase tracking-wider text-sky-800 shadow-lg">{t('shop.add')}</button>
                </div>
              </div>
              <div className="pt-4">
                <button onClick={() => navigateTo('product', product.id)} className="text-left text-sm font-medium text-slate-800 hover:text-sky-700">{product.name}</button>
                <div className="mt-2 flex items-center gap-2"><span className="font-bold text-sm text-sky-800">{formatPrice(product.price)}</span>{product.originalPrice && <span className="text-xs text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative py-20 sm:py-24 bg-gradient-to-br from-sky-950 via-sky-800 to-cyan-700 overflow-hidden text-white">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full border-[80px] border-white/5" />
        <div className="absolute -bottom-40 -left-28 w-[430px] h-[430px] rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="relative max-w-[1250px] mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -inset-5 rounded-[36px] bg-cyan-300/20 rotate-2" />
            <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=90&w=1200" className="relative w-full aspect-[4/3] object-cover rounded-[30px] shadow-2xl" alt="Custom Italian charm bracelet" />
          </div>
          <div className="lg:px-8">
            <p className="text-[10px] tracking-[0.22em] text-cyan-200 font-bold">{t('home.makeKicker')}</p>
            <h2 className="font-serif text-4xl sm:text-5xl mt-3 leading-tight">{t('home.makeTitle')}</h2>
            <p className="mt-5 text-sky-100 leading-7 text-sm sm:text-base">{t('home.makeText')}</p>
            <button onClick={() => navigateTo('builder')} className="mt-8 rounded-full bg-cyan-300 text-sky-950 px-7 py-4 text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center gap-3 hover:bg-white">
              {t('home.startBuild')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          [Truck, t('home.feature1'), t('home.feature1d')],
          [RefreshCw, t('home.feature2'), t('home.feature2d')],
          [ShieldCheck, t('home.feature3'), t('home.feature3d')],
          [Gift, t('home.feature4'), t('home.feature4d')],
        ].map(([Icon, title, desc]: any) => (
          <div key={title} className="rounded-3xl border border-sky-100 bg-sky-50/50 p-6 text-center">
            <div className="w-11 h-11 mx-auto rounded-2xl bg-white text-sky-600 grid place-items-center shadow-sm"><Icon className="w-5 h-5" strokeWidth={1.5} /></div>
            <h3 className="text-sm font-semibold mt-4 text-sky-950">{title}</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-5">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};
