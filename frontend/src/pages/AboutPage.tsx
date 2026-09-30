import React from 'react';
import { Heart, Sparkles, Star, Users } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLanguage } from '../i18n/LanguageContext';

export const AboutPage: React.FC = () => {
  const { navigateTo } = useShop();
  const { t } = useLanguage();

  return (
    <div className="bg-white">
      <section className="relative h-[520px] sm:h-[620px] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=90&w=1900')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/80 via-sky-900/50 to-cyan-500/20" />
        <div className="relative h-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-white">
          <div className="max-w-2xl"><p className="text-[10px] tracking-[0.22em] font-bold text-cyan-200">{t('about.kicker')}</p><h1 className="font-serif text-5xl sm:text-6xl mt-4 leading-tight">{t('about.title')}</h1></div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <p className="text-[10px] tracking-[0.2em] text-sky-500 font-bold">{t('about.storyKicker')}</p>
        <h2 className="font-serif text-4xl sm:text-5xl mt-3 text-sky-950">{t('about.storyTitle')}</h2>
        <p className="mt-6 text-sm sm:text-base text-slate-600 leading-8">{t('about.storyText')}</p>
      </section>

      <section className="bg-gradient-to-b from-sky-50 to-white py-16">
        <div className="max-w-[1150px] mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            [Heart, 'Personal', 'Build around the people and memories that matter to you.'],
            [Sparkles, 'Thoughtful', 'Small details chosen to be easy to mix, gift and keep.'],
            [Star, 'Timeless', 'Simple modular forms designed to grow with your story.'],
            [Users, 'Connected', 'A little object can become a reminder of someone important.'],
          ].map(([Icon, title, desc]: any) => (
            <div key={title} className="rounded-[26px] border border-sky-100 bg-white p-6 text-center shadow-[0_12px_35px_rgba(14,165,233,.06)]">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto grid place-items-center"><Icon className="w-6 h-6" strokeWidth={1.4} /></div>
              <h3 className="font-serif text-xl mt-4 text-sky-950">{title}</h3><p className="text-xs text-slate-500 mt-2 leading-5">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[1180px] mx-auto px-4 sm:px-6 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div className="rounded-[30px] overflow-hidden bg-sky-50"><img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=90&w=1200" alt="Charm story" className="w-full aspect-[4/3] object-cover" /></div>
        <div>
          <p className="text-[10px] tracking-[0.2em] text-sky-500 font-bold">{t('about.cta')}</p>
          <h2 className="font-serif text-4xl mt-3 text-sky-950">{t('about.ctaText')}</h2>
          <div className="mt-7 flex flex-wrap gap-3"><button onClick={() => navigateTo('shop')} className="rounded-full bg-sky-600 text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-sky-700">{t('about.shop')}</button><button onClick={() => navigateTo('builder')} className="rounded-full border border-sky-300 text-sky-700 px-6 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-sky-50">{t('about.build')}</button></div>
        </div>
      </section>
    </div>
  );
};
