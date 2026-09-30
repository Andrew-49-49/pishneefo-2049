import React, { useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CHARM_PRODUCTS } from '../data/mockData';
import { useCurrency } from '../context/CurrencyContext';
import { CategoryType, MaterialType, PriceRangeType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

const categoryValues: CategoryType[] = ['All', 'Tropical', 'Shells', 'Waves', 'Sea Life', 'Letters', 'Symbols'];
const materialValues: (MaterialType | 'All')[] = ['All', 'Gold', 'Silver', 'Mixed Metal'];

export const ShopPage: React.FC = () => {
  const {
    navigateTo, addToCart, searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory, materialFilter, setMaterialFilter,
    priceFilter, setPriceFilter,
  } = useShop();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [sort, setSort] = useState<'featured' | 'low' | 'high'>('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const items = CHARM_PRODUCTS.filter((product) => {
      const categoryOk = selectedCategory === 'All' || product.category === selectedCategory;
      const materialOk = materialFilter === 'All' || product.material === materialFilter;
      const query = searchQuery.trim().toLowerCase();
      const queryOk = !query || product.name.toLowerCase().includes(query) || product.description?.toLowerCase().includes(query);
      const priceOk = priceFilter === 'all'
        || (priceFilter === 'under-25' && product.price < 130000)
        || (priceFilter === '25-50' && product.price >= 130000 && product.price < 150000)
        || (priceFilter === '50-100' && product.price >= 150000 && product.price <= 170000)
        || (priceFilter === 'over-100' && product.price > 170000);
      return categoryOk && materialOk && queryOk && priceOk;
    });
    if (sort === 'low') return [...items].sort((a, b) => a.price - b.price);
    if (sort === 'high') return [...items].sort((a, b) => b.price - a.price);
    return [...items].sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
  }, [searchQuery, selectedCategory, materialFilter, priceFilter, sort]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setMaterialFilter('All');
    setPriceFilter('all');
    setSearchQuery('');
  };

  const Sidebar = () => (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-sky-950"><SlidersHorizontal className="w-4 h-4 text-sky-500" />{t('shop.filters')}</div>
        <button onClick={clearFilters} className="text-[11px] text-sky-600 hover:text-sky-900">{t('shop.clear')}</button>
      </div>

      <label className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-3.5 py-3 shadow-sm focus-within:border-sky-400">
        <Search className="w-4 h-4 text-sky-400" />
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('shop.search')} className="w-full text-sm outline-none bg-transparent" />
      </label>

      <div className="border-t border-sky-100 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-sky-950">{t('shop.category')}</h3>
        <div className="mt-3 space-y-1">
          {categoryValues.map((value) => (
            <button key={value} onClick={() => setSelectedCategory(value)} className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${selectedCategory === value ? 'bg-sky-100 text-sky-800 font-semibold' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'}`}>
              <span>{t(`category.${value}`)}</span><span className="text-[10px] text-slate-400">{value === 'All' ? CHARM_PRODUCTS.length : CHARM_PRODUCTS.filter((p) => p.category === value).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-sky-100 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-sky-950">{t('shop.material')}</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {materialValues.map((value) => (
            <button key={value} onClick={() => setMaterialFilter(value)} className={`rounded-xl border px-3 py-2.5 text-xs text-left ${materialFilter === value ? 'border-sky-400 bg-sky-50 text-sky-800 font-semibold' : 'border-slate-200 text-slate-600 hover:border-sky-200'}`}>{t(`material.${value}`)}</button>
          ))}
        </div>
      </div>

      <div className="border-t border-sky-100 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-sky-950">{t('shop.price')}</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          {([
            ['all', t('shop.all')],
            ['under-25', `< ${formatPrice(130000)}`],
            ['25-50', `${formatPrice(130000)} – ${formatPrice(149000)}`],
            ['50-100', `${formatPrice(150000)} – ${formatPrice(170000)}`],
            ['over-100', `> ${formatPrice(170000)}`],
          ] as [PriceRangeType, string][]).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer rounded-lg py-1.5">
              <input type="radio" name="price" checked={priceFilter === value} onChange={() => setPriceFilter(value)} className="accent-sky-600" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/70 via-white to-white">
      <section className="border-b border-sky-100 bg-white/70">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <p className="text-[10px] tracking-[0.22em] font-bold text-sky-500">{t('shop.kicker')}</p>
          <h1 className="font-serif text-4xl sm:text-5xl mt-2 text-sky-950">{t('shop.title')}</h1>
          <p className="mt-4 text-sm text-slate-600 leading-6 max-w-2xl">{t('shop.subtitle')}</p>
        </div>
      </section>

      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] gap-9 items-start">
          <aside className="hidden lg:block sticky top-[125px] rounded-[26px] border border-sky-100 bg-white p-5 shadow-[0_14px_45px_rgba(14,165,233,0.08)]"><Sidebar /></aside>

          <main>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <button onClick={() => setFiltersOpen(true)} className="lg:hidden rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-sky-700 inline-flex items-center gap-2"><Filter className="w-4 h-4" />{t('shop.filters')}</button>
                <span className="text-xs text-slate-500"><strong className="text-sky-950">{filtered.length}</strong> {t('shop.results')}</span>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <span className="hidden sm:inline">{t('shop.sort')}</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-xl border border-sky-100 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-sky-400">
                  <option value="featured">{t('shop.featured')}</option>
                  <option value="low">{t('shop.lowHigh')}</option>
                  <option value="high">{t('shop.highLow')}</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-5 gap-y-9">
              {filtered.map((product) => (
                <article key={product.id} className="group">
                  <button onClick={() => navigateTo('product', product.id)} className="block aspect-square rounded-[24px] bg-gradient-to-br from-sky-50 to-cyan-50 overflow-hidden relative w-full border border-sky-100">
                    {product.badge && <span className="absolute left-3 top-3 z-10 rounded-full bg-sky-950 text-white text-[9px] px-2.5 py-1.5">{product.badge}</span>}
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-700" />
                  </button>
                  <div className="pt-4">
                    <button onClick={() => navigateTo('product', product.id)} className="text-left text-sm leading-5 font-medium text-slate-800 hover:text-sky-700">{product.name}</button>
                    <div className="mt-2 flex items-center gap-2"><span className="text-sm font-bold text-sky-800">{formatPrice(product.price)}</span>{product.originalPrice && <span className="text-xs text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>}</div>
                    <button onClick={() => addToCart(product)} className="mt-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.11em] text-sky-700 border-b border-cyan-300 pb-1 hover:text-sky-950">{t('shop.add')}</button>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && <div className="py-24 rounded-[28px] border border-dashed border-sky-200 bg-sky-50/60 text-center"><p className="text-sm text-slate-500">{t('shop.empty')}</p><button onClick={clearFilters} className="mt-4 rounded-full bg-sky-600 text-white px-5 py-2.5 text-xs font-semibold">{t('shop.clear')}</button></div>}
          </main>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button className="absolute inset-0 bg-sky-950/40" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />
          <aside className="absolute left-0 top-0 bottom-0 w-[88%] max-w-[340px] bg-white p-5 overflow-y-auto shadow-2xl">
            <div className="flex justify-end mb-1"><button onClick={() => setFiltersOpen(false)} className="w-9 h-9 rounded-full bg-sky-50 text-sky-700 grid place-items-center"><X className="w-4 h-4" /></button></div>
            <Sidebar />
          </aside>
        </div>
      )}
    </div>
  );
};
