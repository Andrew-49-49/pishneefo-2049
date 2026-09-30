import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Minus, Plus, RefreshCw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CHARM_PRODUCTS } from '../data/mockData';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../i18n/LanguageContext';

export const ProductDetailPage: React.FC = () => {
  const { selectedProductId, navigateTo, addToCart } = useShop();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const product = CHARM_PRODUCTS.find((item) => item.id === selectedProductId) || CHARM_PRODUCTS[0];
  const images = product.gallery?.length ? product.gallery : [product.image];
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState<'details' | 'shipping' | null>('details');
  const related = useMemo(() => CHARM_PRODUCTS.filter((item) => item.id !== product.id).slice(0, 4), [product.id]);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
  }, [product.id]);

  const buyNow = () => {
    addToCart(product, quantity);
    navigateTo('checkout');
  };

  return (
    <div className="bg-gradient-to-b from-sky-50/50 via-white to-white min-h-screen">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-8 overflow-hidden">
          <button onClick={() => navigateTo('home')} className="hover:text-sky-700 shrink-0">{t('product.home')}</button><ChevronRight className="w-3 h-3 shrink-0" />
          <button onClick={() => navigateTo('shop')} className="hover:text-sky-700 shrink-0">{t('product.collection')}</button><ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-sky-950 truncate">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <div className="aspect-square rounded-[30px] bg-gradient-to-br from-sky-50 to-cyan-50 overflow-hidden border border-sky-100 shadow-[0_20px_60px_rgba(14,165,233,0.08)]">
              <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {images.map((image, index) => (
                <button key={`${image}-${index}`} onClick={() => setActiveImage(index)} className={`aspect-square rounded-2xl overflow-hidden border-2 ${activeImage === index ? 'border-sky-500' : 'border-transparent hover:border-sky-100'}`}>
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-[130px] rounded-[30px] bg-white border border-sky-100 p-6 sm:p-8 shadow-[0_20px_60px_rgba(14,165,233,0.08)]">
            {product.badge && <span className="inline-block rounded-full bg-sky-950 text-white text-[9px] font-bold tracking-wider px-3 py-1.5 mb-4">{product.badge}</span>}
            <h1 className="font-serif text-3xl sm:text-4xl leading-tight text-sky-950">{product.name}</h1>
            <div className="mt-4 flex items-center gap-3"><span className="text-xl font-bold text-sky-800">{formatPrice(product.price)}</span>{product.originalPrice && <span className="text-sm text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>}</div>
            <p className="mt-5 text-sm leading-7 text-slate-600">{product.shortDescription || product.description}</p>
            <div className="mt-5 text-xs text-slate-400">SKU: {product.sku || 'P2049-IC'} · {product.stock && product.stock > 0 ? `${product.stock} ${t('product.stock')}` : t('product.contact')}</div>

            <div className="mt-7">
              <div className="text-[10px] font-bold tracking-[0.14em] text-sky-950 mb-2 uppercase">{t('product.quantity')}</div>
              <div className="inline-flex rounded-full border border-sky-200 h-11 overflow-hidden bg-sky-50/50">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 grid place-items-center hover:bg-sky-100"><Minus className="w-4 h-4" /></button>
                <span className="w-12 grid place-items-center text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-11 grid place-items-center hover:bg-sky-100"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            <button onClick={() => addToCart(product, quantity)} className="mt-6 w-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 text-white py-4 text-xs font-bold tracking-[0.12em] uppercase flex items-center justify-center gap-2 shadow-[0_14px_30px_rgba(14,165,233,0.25)] hover:from-sky-700 hover:to-cyan-600">
              <ShoppingBag className="w-4 h-4" /> {t('product.add')} — {formatPrice(product.price * quantity)}
            </button>
            <button onClick={buyNow} className="mt-3 w-full rounded-full border border-sky-300 text-sky-800 py-4 text-xs font-bold tracking-[0.12em] uppercase hover:bg-sky-50">{t('product.buy')}</button>

            <div className="grid sm:grid-cols-3 gap-3 mt-7 py-5 border-y border-sky-100 text-center">
              <div className="text-[11px] text-slate-600"><Truck className="w-5 h-5 mx-auto mb-2 text-sky-500" strokeWidth={1.5} />{t('product.shipping')}</div>
              <div className="text-[11px] text-slate-600"><RefreshCw className="w-5 h-5 mx-auto mb-2 text-sky-500" strokeWidth={1.5} />{t('product.exchange')}</div>
              <div className="text-[11px] text-slate-600"><ShieldCheck className="w-5 h-5 mx-auto mb-2 text-sky-500" strokeWidth={1.5} />{t('product.care')}</div>
            </div>

            <div className="mt-4 border-b border-sky-100">
              <button onClick={() => setOpen(open === 'details' ? null : 'details')} className="w-full py-4 flex justify-between text-xs font-bold uppercase tracking-[0.08em] text-sky-950">
                {t('product.details')} <ChevronDown className={`w-4 h-4 transition ${open === 'details' ? 'rotate-180' : ''}`} />
              </button>
              {open === 'details' && <div className="pb-5 text-sm text-slate-600 leading-7"><p>{product.description}</p><p className="mt-3">Italian Charm uses modular links so you can rearrange and expand your bracelet over time. Actual color may vary slightly by screen and lighting.</p></div>}
            </div>
            <div className="border-b border-sky-100">
              <button onClick={() => setOpen(open === 'shipping' ? null : 'shipping')} className="w-full py-4 flex justify-between text-xs font-bold uppercase tracking-[0.08em] text-sky-950">
                {t('product.delivery')} <ChevronDown className={`w-4 h-4 transition ${open === 'shipping' ? 'rotate-180' : ''}`} />
              </button>
              {open === 'shipping' && <div className="pb-5 text-sm text-slate-600 leading-7">Delivery is typically 1–5 business days depending on location. Unused eligible items can be requested for exchange within 7 days.</div>}
            </div>
          </div>
        </div>

        <section className="mt-20 pt-12 border-t border-sky-100">
          <div className="text-center"><p className="text-[10px] tracking-[0.2em] font-bold text-sky-500">{t('product.relatedKicker')}</p><h2 className="font-serif text-3xl sm:text-4xl mt-2 text-sky-950">{t('product.related')}</h2></div>
          <div className="mt-9 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {related.map((item) => (
              <article key={item.id} className="group">
                <button onClick={() => navigateTo('product', item.id)} className="aspect-square w-full rounded-[24px] bg-sky-50 overflow-hidden border border-sky-100"><img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-700" /></button>
                <button onClick={() => navigateTo('product', item.id)} className="text-left text-sm mt-3 font-medium text-slate-800 hover:text-sky-700">{item.name}</button>
                <div className="text-sm font-bold text-sky-800 mt-1">{formatPrice(item.price)}</div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
