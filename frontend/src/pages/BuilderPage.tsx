import React, { useMemo, useState } from 'react';
import { Check, Download, RefreshCw, Search, ShoppingBag, Sparkles, Trash2, Waves } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CHARM_PRODUCTS } from '../data/mockData';
import { Charm } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../i18n/LanguageContext';

type FinishId = 'gold' | 'silver' | 'rose' | 'aqua' | 'black' | 'red' | 'pink' | 'lilac';
type CollectionId = 'beach' | 'lucky' | 'love' | 'travel';

const finishes: { id: FinishId; swatch: string; metal: string }[] = [
  { id: 'gold', swatch: 'linear-gradient(135deg,#fff4b8,#d7a514,#fff7cf)', metal: '#e9c64f' },
  { id: 'silver', swatch: 'linear-gradient(135deg,#ffffff,#b8c6d1,#f8fbff)', metal: '#cbd5e1' },
  { id: 'rose', swatch: 'linear-gradient(135deg,#ffe7dc,#d89d8c,#fff2ec)', metal: '#e7b2a4' },
  { id: 'aqua', swatch: 'linear-gradient(135deg,#67e8f9,#38bdf8,#a78bfa,#22d3ee)', metal: '#38bdf8' },
  { id: 'black', swatch: 'linear-gradient(135deg,#334155,#020617,#475569)', metal: '#263244' },
  { id: 'red', swatch: 'linear-gradient(135deg,#fecaca,#ef4444,#fb7185)', metal: '#f05260' },
  { id: 'pink', swatch: 'linear-gradient(135deg,#fff1f2,#f9a8d4,#fce7f3)', metal: '#f5b4d2' },
  { id: 'lilac', swatch: 'linear-gradient(135deg,#f5f3ff,#c4b5fd,#e9d5ff)', metal: '#c7b9ec' },
];

const collections: { id: CollectionId; image: string; categories: string[] }[] = [
  { id: 'beach', image: CHARM_PRODUCTS[0].image, categories: ['Tropical', 'Shells', 'Waves', 'Sea Life'] },
  { id: 'lucky', image: CHARM_PRODUCTS[8].image, categories: ['Symbols'] },
  { id: 'love', image: CHARM_PRODUCTS[6].image, categories: ['Symbols', 'Letters'] },
  { id: 'travel', image: CHARM_PRODUCTS[9].image, categories: ['Sea Life', 'Tropical', 'Letters'] },
];

const sizeOptions = [
  { count: 14, label: '11.5–12 cm' },
  { count: 16, label: '13–14 cm' },
  { count: 18, label: '15–16 cm' },
  { count: 20, label: '17–18 cm' },
];

export const BuilderPage: React.FC = () => {
  const { builderBracelet, setBuilderLinkCount, setBuilderCharmAt, resetBuilder, addCustomBraceletToCart, showNotification } = useShop();
  const { t } = useLanguage();
  const { currency, formatPrice } = useCurrency();
  const [selectedFinish, setSelectedFinish] = useState<FinishId>('gold');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState<CollectionId>('beach');
  const [query, setQuery] = useState('');

  const finish = finishes.find((item) => item.id === selectedFinish) || finishes[0];
  const activeCollection = collections.find((item) => item.id === selectedCollection) || collections[0];

  const trayCharms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHARM_PRODUCTS.filter((charm) => {
      const collectionOk = activeCollection.categories.includes(charm.category);
      const queryOk = !q || charm.name.toLowerCase().includes(q) || charm.description?.toLowerCase().includes(q);
      return collectionOk && queryOk;
    });
  }, [activeCollection, query]);

  const attached = builderBracelet.links.filter((link) => link.charm);
  const charmsCost = attached.reduce((sum, link) => sum + (link.charm?.price || 0), 0);
  const total = builderBracelet.basePrice + charmsCost;

  const selectCharm = (charm: Charm) => {
    setBuilderCharmAt(selectedSlotIndex, charm);
    const nextEmpty = builderBracelet.links.findIndex((link, index) => index > selectedSlotIndex && !link.charm);
    if (nextEmpty >= 0) setSelectedSlotIndex(nextEmpty);
  };

  const resetAll = () => {
    resetBuilder();
    setSelectedFinish('gold');
    setSelectedSlotIndex(0);
    setSelectedCollection('beach');
    setQuery('');
  };

  const saveDesign = () => {
    const payload = {
      brand: 'Pishneefo 2049',
      finish: t(`builder.finish.${selectedFinish}`),
      linkCount: builderBracelet.linkCount,
      charms: builderBracelet.links.map((link) => ({ position: link.position + 1, charm: link.charm?.name || null })),
      estimate: formatPrice(total),
      currency,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'pishneefo-2049-bracelet-design.json';
    anchor.click();
    URL.revokeObjectURL(url);
    showNotification(t('builder.saved'));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f0faff_0%,#ffffff_28%,#f8fdff_100%)]">
      <section className="relative overflow-hidden border-b border-sky-100">
        <div className="absolute top-0 right-0 w-[540px] h-[340px] bg-cyan-200/25 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-sky-700"><Sparkles className="w-3.5 h-3.5" />{t('builder.kicker')}</div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl mt-4 text-sky-950 leading-[1.07]">{t('builder.title')}</h1>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-7 max-w-2xl">{t('builder.subtitle')}</p>
          </div>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <section className="ocean-card p-5 sm:p-7">
          <div className="section-heading">
            <span className="section-number">01</span>
            <h2>{t('builder.step1')}</h2>
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 snap-x">
            {finishes.map((item) => (
              <button key={item.id} onClick={() => setSelectedFinish(item.id)} className={`min-w-[128px] snap-start rounded-[22px] border p-3 text-left transition-all ${selectedFinish === item.id ? 'border-sky-400 bg-sky-50 shadow-[0_12px_30px_rgba(14,165,233,0.12)]' : 'border-slate-200 bg-white hover:border-sky-200'}`}>
                <div className="aspect-[1.35] rounded-2xl border border-white/70 shadow-inner flex items-center justify-center" style={{ background: item.swatch }}>
                  <div className="w-20 h-9 rounded-full border-[5px] border-white/75 shadow-md" style={{ boxShadow: `inset 0 0 0 7px ${item.metal}, 0 5px 14px rgba(15,23,42,.16)` }} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">{t(`builder.finish.${item.id}`)}</span>
                  {selectedFinish === item.id && <span className="w-5 h-5 rounded-full bg-sky-600 text-white grid place-items-center"><Check className="w-3 h-3" /></span>}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="ocean-card p-5 sm:p-7">
          <div className="section-heading"><span className="section-number">01.5</span><h2>{t('builder.step15')}</h2></div>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {sizeOptions.map((item) => (
              <button key={item.count} onClick={() => { setBuilderLinkCount(item.count); setSelectedSlotIndex(Math.min(selectedSlotIndex, item.count - 1)); }} className={`rounded-2xl border p-4 text-left transition-all ${builderBracelet.linkCount === item.count ? 'border-sky-400 bg-sky-50 text-sky-800 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'}`}>
                <div className="text-lg font-bold">{item.count} <span className="text-xs font-medium">{t('builder.links')}</span></div>
                <div className="text-[11px] mt-1 text-slate-400">{item.label}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="ocean-card overflow-hidden">
          <div className="p-5 sm:p-7 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="section-heading"><span className="section-number">02</span><h2>{t('builder.step2')}</h2></div>
              <p className="mt-2 text-xs sm:text-sm text-slate-500">{t('builder.step2hint')}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={saveDesign} className="rounded-full border border-sky-200 bg-white px-4 py-2.5 text-xs font-semibold text-sky-700 inline-flex items-center gap-2 hover:bg-sky-50"><Download className="w-4 h-4" />{t('builder.download')}</button>
              <button onClick={resetAll} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500 inline-flex items-center gap-2 hover:border-sky-200 hover:text-sky-700"><RefreshCw className="w-4 h-4" />{t('builder.reset')}</button>
            </div>
          </div>

          <div className="p-5 sm:p-8 bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,.22),transparent_45%),linear-gradient(180deg,#f8fdff,#eaf8ff)]">
            <div className="mb-4 flex items-center justify-between gap-3 text-[11px] text-slate-500">
              <span>{t('builder.selected')}: <strong className="text-sky-700">#{selectedSlotIndex + 1}</strong></span>
              <span>{t('builder.finish')}: <strong className="text-sky-700">{t(`builder.finish.${selectedFinish}`)}</strong></span>
            </div>
            <div className="overflow-x-auto rounded-[24px] border border-white bg-white/75 backdrop-blur-md p-4 sm:p-6 shadow-[inset_0_0_30px_rgba(14,165,233,.05),0_18px_50px_rgba(2,132,199,.09)]">
              <div className="min-w-max flex items-center justify-center gap-1.5">
                <div className="w-5 sm:w-6 h-11 sm:h-13 rounded-l-lg border border-slate-300 shadow-sm" style={{ background: finish.swatch }} />
                {builderBracelet.links.map((link, idx) => {
                  const selected = idx === selectedSlotIndex;
                  return (
                    <button key={idx} onClick={() => setSelectedSlotIndex(idx)} className={`relative w-10 h-12 sm:w-12 sm:h-14 rounded-[7px] border-2 shrink-0 transition-all overflow-visible ${selected ? 'border-cyan-400 -translate-y-1 shadow-[0_8px_20px_rgba(34,211,238,.28)]' : 'border-white/80 hover:-translate-y-0.5'}`} style={{ background: finish.swatch }} title={`Link ${idx + 1}`}>
                      <span className="absolute inset-x-1 top-1 h-px bg-white/70" />
                      <span className="absolute inset-x-1 bottom-1 h-px bg-slate-500/20" />
                      {link.charm ? (
                        <span className="absolute inset-1 rounded-[5px] bg-white overflow-hidden shadow-sm">
                          <img src={link.charm.image} alt={link.charm.name} className="w-full h-full object-cover" />
                        </span>
                      ) : <span className="relative z-10 text-[9px] font-bold text-slate-700/60">{idx + 1}</span>}
                    </button>
                  );
                })}
                <div className="w-5 sm:w-6 h-11 sm:h-13 rounded-r-lg border border-slate-300 shadow-sm" style={{ background: finish.swatch }} />
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="rounded-full bg-white border border-sky-100 px-4 py-2 text-[11px] text-slate-500 shadow-sm inline-flex items-center gap-2"><Waves className="w-4 h-4 text-cyan-500" /> {attached.length} / {builderBracelet.linkCount} {t('builder.links')}</div>
            </div>
          </div>
        </section>

        <section className="ocean-card p-5 sm:p-7">
          <div className="section-heading"><span className="section-number">03</span><h2>{t('builder.step3')}</h2></div>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">{t('builder.step3hint')}</p>
          <label className="mt-5 max-w-xl flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 focus-within:bg-white focus-within:border-sky-400">
            <Search className="w-4 h-4 text-sky-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('builder.search')} className="flex-1 bg-transparent text-sm outline-none" />
          </label>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
            {collections.map((item) => (
              <button key={item.id} onClick={() => setSelectedCollection(item.id)} className={`min-w-[185px] rounded-[22px] border p-3 text-left transition-all ${selectedCollection === item.id ? 'border-sky-400 bg-sky-50 shadow-md' : 'border-slate-200 bg-white hover:border-sky-200'}`}>
                <div className="aspect-[1.55] rounded-2xl overflow-hidden bg-sky-50"><img src={item.image} alt={t(`builder.collection.${item.id}`)} className="w-full h-full object-cover" /></div>
                <div className="mt-3 flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">{t(`builder.collection.${item.id}`)}</span>{selectedCollection === item.id && <Check className="w-4 h-4 text-sky-600" />}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="ocean-card p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div><div className="section-heading"><span className="section-number">04</span><h2>{t('builder.step4')}</h2></div><p className="mt-2 text-xs sm:text-sm text-slate-500">{t('builder.step4hint')}</p></div>
            <div className="rounded-full bg-sky-50 border border-sky-100 px-4 py-2 text-[11px] text-sky-700 font-semibold">{t('builder.selected')} #{selectedSlotIndex + 1}</div>
          </div>

          <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {trayCharms.map((charm) => (
              <button key={charm.id} onClick={() => selectCharm(charm)} className="group rounded-2xl border border-sky-100 bg-white p-2.5 text-center hover:border-sky-400 hover:shadow-[0_10px_25px_rgba(14,165,233,.12)] transition-all">
                <div className="aspect-square rounded-xl bg-sky-50 overflow-hidden"><img src={charm.image} alt={charm.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /></div>
                <p className="mt-2 text-[10px] leading-4 font-semibold text-slate-700 line-clamp-2 min-h-8">{charm.name}</p>
                <p className="text-[10px] text-sky-700 font-bold mt-1">{formatPrice(charm.price)}</p>
              </button>
            ))}
          </div>

          {builderBracelet.links[selectedSlotIndex]?.charm && (
            <div className="mt-5 flex justify-center">
              <button onClick={() => setBuilderCharmAt(selectedSlotIndex, null)} className="rounded-full border border-rose-200 bg-rose-50 text-rose-600 px-4 py-2.5 text-xs font-semibold inline-flex items-center gap-2"><Trash2 className="w-4 h-4" />{t('builder.remove')} · {builderBracelet.links[selectedSlotIndex].charm?.name}</button>
            </div>
          )}
        </section>

        <section className="ocean-card overflow-hidden">
          <div className="p-5 sm:p-7 border-b border-sky-100"><div className="section-heading"><span className="section-number">05</span><h2>{t('builder.step5')}</h2></div></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-sky-950 text-white text-[10px] uppercase tracking-[0.12em]"><tr><th className="px-5 py-4 text-left">{t('builder.item')}</th><th className="px-5 py-4 text-center">{t('builder.qty')}</th><th className="px-5 py-4 text-right">{t('builder.price')}</th><th className="px-5 py-4 text-right">{t('builder.total')}</th></tr></thead>
              <tbody>
                <tr className="border-b border-sky-100"><td className="px-5 py-4"><div className="font-semibold text-sky-950">{t('builder.base')}</div><div className="text-xs text-slate-400 mt-1">{t(`builder.finish.${selectedFinish}`)} · {builderBracelet.linkCount} {t('builder.links')}</div></td><td className="px-5 py-4 text-center">1</td><td className="px-5 py-4 text-right">{formatPrice(builderBracelet.basePrice)}</td><td className="px-5 py-4 text-right font-semibold">{formatPrice(builderBracelet.basePrice)}</td></tr>
                <tr className="border-b border-sky-100"><td className="px-5 py-4"><div className="font-semibold text-sky-950">{t('builder.charms')}</div><div className="text-xs text-slate-400 mt-1 line-clamp-1">{attached.map((link) => link.charm?.name).join(' · ') || t('builder.emptyLink')}</div></td><td className="px-5 py-4 text-center">{attached.length}</td><td className="px-5 py-4 text-right">—</td><td className="px-5 py-4 text-right font-semibold">{formatPrice(charmsCost)}</td></tr>
              </tbody>
              <tfoot><tr className="bg-sky-50"><td colSpan={3} className="px-5 py-5 text-right font-bold text-sky-950 uppercase tracking-[0.08em]">{t('builder.total')}</td><td className="px-5 py-5 text-right text-xl font-bold text-sky-700">{formatPrice(total)}</td></tr></tfoot>
            </table>
          </div>
          <div className="p-5 sm:p-7 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white">
            <p className="text-xs text-slate-400 max-w-xl">Price is an estimate based on the current demo product data. Replace mock prices with your production catalog when connecting the real backend.</p>
            <button onClick={() => addCustomBraceletToCart(builderBracelet)} className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 text-white px-7 py-4 text-xs font-bold uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 shadow-[0_14px_30px_rgba(14,165,233,.24)] hover:from-sky-700 hover:to-cyan-600 shrink-0"><ShoppingBag className="w-4 h-4" />{t('builder.addCart')}</button>
          </div>
        </section>
      </div>
    </div>
  );
};
