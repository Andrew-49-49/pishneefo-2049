import React from 'react';
import { Banknote, LockKeyhole } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CURRENCY_OPTIONS, useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../i18n/LanguageContext';

const fields = {
  email: 'Email address', first: 'First name', last: 'Last name', address: 'Address', city: 'City / Province', phone: 'Phone number', note: 'Order note (optional)',
};

export const CheckoutPage: React.FC = () => {
  const { cart, cartSubtotal } = useShop();
  const { t } = useLanguage();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const shipping = cartSubtotal >= 500000 || cart.length === 0 ? 0 : 30000;
  const inputClass = 'w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3.5 text-sm outline-none focus:border-sky-500 focus:bg-white';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-white">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div><p className="text-[10px] tracking-[0.2em] font-bold text-sky-700">PISHNEEFO 2049</p><h1 className="font-serif text-4xl text-sky-950 mt-1">{t('checkout.title')}</h1></div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400"><LockKeyhole className="w-4 h-4 text-sky-700" /> Secure checkout demo</div>
        </div>

        <div className="grid lg:grid-cols-[1fr_430px] gap-8 lg:gap-10 items-start">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-7">
            <section className="ocean-card p-5 sm:p-7">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-sky-950 mb-4">{t('checkout.contact')}</h2>
              <input required type="email" placeholder={fields.email} className={inputClass} />
            </section>

            <section className="ocean-card p-5 sm:p-7">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-sky-950 mb-4">{t('checkout.shipping')}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input required placeholder={fields.first} className={inputClass} />
                <input required placeholder={fields.last} className={inputClass} />
                <input required placeholder={fields.phone} className={`${inputClass} sm:col-span-2`} />
                <input required placeholder={fields.address} className={`${inputClass} sm:col-span-2`} />
                <input required placeholder={fields.city} className={`${inputClass} sm:col-span-2`} />
                <textarea placeholder={fields.note} className={`${inputClass} sm:col-span-2 min-h-24 resize-none`} />
              </div>
            </section>

            <section className="ocean-card p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-sky-950">{t('checkout.payment')}</h2>
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-sky-800"><Banknote className="w-4 h-4" /> Pay in {currency}</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 mb-4">
                {CURRENCY_OPTIONS.map((item) => (
                  <button type="button" key={item.code} onClick={() => setCurrency(item.code)} className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${currency === item.code ? 'border-sky-500 bg-sky-100 text-sky-950 font-semibold shadow-sm' : 'border-sky-200 bg-white text-slate-600 hover:border-sky-300'}`}>
                    <div className="flex items-center justify-between gap-3"><span>{item.label}</span><strong>{item.symbol} {item.code}</strong></div>
                  </button>
                ))}
              </div>
              <label className="rounded-2xl border border-sky-300 bg-sky-50 p-4 flex items-center gap-3 text-sm text-sky-950"><input type="radio" defaultChecked className="accent-sky-700" /> {t('checkout.cod')}</label>
              <p className="mt-3 text-[11px] leading-5 text-slate-400">Currency conversion in this demo uses fixed sample rates. Connect your payment gateway or FX API before accepting real payments.</p>
            </section>

            <button disabled={cart.length === 0} className="w-full rounded-full bg-sky-950 disabled:bg-slate-300 text-white py-4 text-xs font-bold uppercase tracking-[0.12em] shadow-lg hover:bg-sky-800">{t('checkout.order')} — {formatPrice(cartSubtotal + shipping)}</button>
          </form>

          <aside className="ocean-card p-5 sm:p-7 h-fit lg:sticky lg:top-[140px]">
            <h2 className="font-serif text-2xl text-sky-950">{t('checkout.summary')}</h2>
            <div className="mt-2 inline-flex rounded-full bg-cyan-100 text-sky-950 px-3 py-1 text-[10px] font-bold">PRICES IN {currency}</div>
            <div className="mt-6 space-y-4">
              {cart.length === 0 && <div className="rounded-2xl bg-sky-50 p-5 text-sm text-slate-400 text-center">{t('cart.empty')}</div>}
              {cart.map((item) => {
                const image = item.charm?.image || item.customBracelet?.links.find((link) => link.charm)?.charm?.image;
                const name = item.charm?.name || 'Custom Italian Charm Bracelet';
                return (
                  <div key={item.id} className="flex gap-3 border-b border-sky-100 pb-4">
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 overflow-hidden shrink-0 border border-sky-100">{image && <img src={image} alt={name} className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium text-slate-700 line-clamp-2">{name}</div><div className="text-xs text-slate-400 mt-1">× {item.quantity}</div></div>
                    <div className="text-sm font-bold text-sky-950">{formatPrice(item.unitPrice * item.quantity)}</div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-sky-100 mt-6 pt-5 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between"><span>{t('checkout.subtotal')}</span><span>{formatPrice(cartSubtotal)}</span></div>
              <div className="flex justify-between"><span>{t('checkout.shippingFee')}</span><span>{shipping === 0 ? t('checkout.free') : formatPrice(shipping)}</span></div>
              <div className="flex justify-between border-t border-sky-100 pt-4 text-base font-bold text-sky-950"><span>{t('checkout.total')}</span><span className="text-sky-950">{formatPrice(cartSubtotal + shipping)}</span></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
