import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../i18n/LanguageContext';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, setIsCartOpen, cart, cartSubtotal, updateQuantity, removeFromCart, navigateTo } = useShop();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  if (!isCartOpen) return null;

  const checkout = () => {
    setIsCartOpen(false);
    navigateTo('checkout');
  };

  return (
    <div className="fixed inset-0 z-[65]">
      <button className="absolute inset-0 bg-sky-950/50 backdrop-blur-[2px] w-full h-full" onClick={() => setIsCartOpen(false)} aria-label="Close cart" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[450px] bg-white shadow-2xl flex flex-col">
        <div className="h-20 px-5 sm:px-6 flex items-center justify-between border-b border-sky-100 bg-gradient-to-r from-white to-sky-50/70">
          <div><h2 className="font-serif text-2xl text-sky-950">{t('cart.title')}</h2><p className="text-xs text-slate-400 mt-1">{cart.length} {t('cart.items')}</p></div>
          <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 rounded-full bg-white border border-sky-100 text-sky-700 grid place-items-center hover:bg-sky-50"><X className="w-5 h-5" /></button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 grid place-items-center p-8 text-center">
            <div>
              <div className="w-16 h-16 rounded-[22px] bg-sky-50 text-sky-400 grid place-items-center mx-auto"><ShoppingBag className="w-8 h-8" strokeWidth={1.4} /></div>
              <h3 className="font-serif text-2xl text-sky-950 mt-5">{t('cart.empty')}</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">{t('cart.emptyText')}</p>
              <button onClick={() => { setIsCartOpen(false); navigateTo('shop'); }} className="mt-6 rounded-full bg-sky-600 text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-sky-700">{t('cart.shop')}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
              {cart.map((item) => {
                const name = item.type === 'charm' ? item.charm?.name : 'Custom Italian Charm Bracelet';
                const image = item.type === 'charm' ? item.charm?.image : item.customBracelet?.links.find((l) => l.charm)?.charm?.image;
                return (
                  <div key={item.id} className="flex gap-4 border-b border-sky-100 pb-5">
                    <div className="w-24 h-24 rounded-2xl bg-sky-50 shrink-0 overflow-hidden border border-sky-100">{image && <img src={image} alt={name} className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-3 justify-between"><div><h3 className="text-sm leading-5 font-medium text-slate-800">{name}</h3><p className="text-sm font-bold text-sky-800 mt-2">{formatPrice(item.unitPrice)}</p></div><button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 self-start"><Trash2 className="w-4 h-4" /></button></div>
                      <div className="mt-3 inline-flex rounded-full border border-sky-200 h-8 overflow-hidden bg-sky-50/50"><button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 grid place-items-center hover:bg-sky-100"><Minus className="w-3 h-3" /></button><span className="w-8 grid place-items-center text-xs font-semibold">{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 grid place-items-center hover:bg-sky-100"><Plus className="w-3 h-3" /></button></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-sky-100 p-5 sm:p-6 bg-sky-50/50">
              <div className="flex justify-between text-sm text-slate-600"><span>{t('cart.subtotal')}</span><strong className="text-sky-950">{formatPrice(cartSubtotal)}</strong></div>
              <p className="text-xs text-slate-400 mt-2">{t('cart.shippingNote')}</p>
              <button onClick={checkout} className="mt-5 w-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 text-white py-4 text-xs font-bold uppercase tracking-[0.12em] shadow-lg hover:from-sky-700 hover:to-cyan-600">{t('cart.checkout')}</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};
