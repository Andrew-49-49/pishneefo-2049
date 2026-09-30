import React, { useState } from 'react';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLanguage } from '../i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { navigateTo, showNotification } = useShop();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');

  const subscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    showNotification(t('footer.thanks'));
    setEmail('');
  };

  return (
    <footer className="mt-20 relative overflow-hidden bg-sky-950 text-white">
      <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400" />
      <div className="absolute -top-48 -right-32 w-[480px] h-[480px] rounded-full border-[80px] border-cyan-300/10" />
      <div className="absolute -bottom-56 -left-20 w-[480px] h-[480px] rounded-full bg-sky-500/20 blur-3xl" />
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">
          <div>
            <div className="flex items-center gap-4">
              <img src="/assets/pishneefo-2049-logo.jpeg" alt="Pishneefo 2049" className="w-20 h-20 rounded-[22px] object-cover border border-white/20" />
              <div>
                <div className="font-serif text-xl font-bold tracking-[0.04em]">Pishneefo 2049</div>
                <div className="mt-1 text-[8px] tracking-[0.24em] text-cyan-300">SINCE 2021</div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-sky-200/80 max-w-xs">{t('footer.tagline')}</p>
            <div className="flex gap-3 mt-6">
              <a href="#instagram" onClick={(e) => e.preventDefault()} className="w-9 h-9 border border-sky-700 grid place-items-center rounded-full hover:border-cyan-300 hover:text-cyan-300"><Instagram className="w-4 h-4" /></a>
              <a href="#facebook" onClick={(e) => e.preventDefault()} className="w-9 h-9 border border-sky-700 grid place-items-center rounded-full hover:border-cyan-300 hover:text-cyan-300"><Facebook className="w-4 h-4" /></a>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold tracking-[0.16em] text-cyan-300 uppercase">{t('footer.explore')}</h3>
            <div className="mt-5 space-y-3 text-sm text-sky-200/80">
              <button onClick={() => navigateTo('shop')} className="block hover:text-white">{t('nav.shop')}</button>
              <button onClick={() => navigateTo('builder')} className="block hover:text-white">{t('nav.builder')}</button>
              <button onClick={() => navigateTo('lookbook')} className="block hover:text-white">{t('nav.journal')}</button>
              <button onClick={() => navigateTo('about')} className="block hover:text-white">{t('nav.about')}</button>
              <button onClick={() => navigateTo('faqs')} className="block hover:text-white">{t('nav.support')}</button>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold tracking-[0.16em] text-cyan-300 uppercase">{t('footer.contact')}</h3>
            <div className="mt-5 space-y-4 text-sm text-sky-200/80">
              <div className="flex gap-3"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-cyan-300" /><span>Southeast Asia</span></div>
              <div className="flex gap-3"><Phone className="w-4 h-4 mt-0.5 shrink-0 text-cyan-300" /><span>Hotline: 09xx xxx xxx</span></div>
              <div className="flex gap-3"><Mail className="w-4 h-4 mt-0.5 shrink-0 text-cyan-300" /><span>hello@pishneefo2049.com</span></div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold tracking-[0.16em] text-cyan-300 uppercase">{t('footer.news')}</h3>
            <p className="mt-5 text-sm text-sky-200/80 leading-6">{t('footer.newsText')}</p>
            <form onSubmit={subscribe} className="mt-5 flex rounded-full border border-sky-700 bg-white/5 p-1 focus-within:border-cyan-300">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder={t('footer.email')} className="flex-1 min-w-0 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-sky-500" />
              <button className="rounded-full bg-cyan-300 text-sky-950 px-4 text-[10px] font-bold uppercase tracking-wider hover:bg-white">{t('footer.subscribe')}</button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-sky-800 flex flex-col sm:flex-row gap-3 justify-between text-[10px] tracking-wide text-sky-400">
          <span>© 2026 PISHNEEFO 2049. ALL RIGHTS RESERVED.</span>
          <span>{t('footer.privacy')}</span>
        </div>
      </div>
    </footer>
  );
};
