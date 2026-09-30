import React, { useState } from 'react';
import { ArrowRight, Clock, Share2, Sparkles, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { LOOKBOOK_ARTICLES } from '../data/mockData';
import { LookbookArticle } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const LookbookPage: React.FC = () => {
  const { navigateTo, showNotification } = useShop();
  const { t } = useLanguage();
  const [activeArticle, setActiveArticle] = useState<LookbookArticle | null>(null);

  return (
    <div className="pb-20 bg-gradient-to-b from-sky-50/60 via-white to-white">
      <section className="relative min-h-[470px] bg-cover bg-center flex items-center px-4" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=88&w=1800')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/90 via-sky-900/50 to-cyan-400/10" />
        <div className="relative max-w-[1380px] mx-auto w-full px-0 sm:px-2 lg:px-4 text-white">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-cyan-100"><Sparkles className="w-3.5 h-3.5" />{t('journal.kicker')}</div>
            <h1 className="font-serif text-5xl sm:text-6xl mt-5">{t('journal.title')}</h1>
            <p className="mt-5 text-sm sm:text-base text-sky-100 leading-7">{t('journal.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LOOKBOOK_ARTICLES.map((article) => (
            <button key={article.id} onClick={() => setActiveArticle(article)} className="group text-left rounded-[28px] overflow-hidden border border-sky-100 bg-white shadow-[0_12px_35px_rgba(14,165,233,.06)] hover:shadow-[0_18px_45px_rgba(14,165,233,.12)] transition-all">
              <div className="aspect-[1.35] overflow-hidden bg-sky-50"><img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" /></div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.12em] text-sky-500 font-bold"><span>{article.category}</span><span className="normal-case tracking-normal font-medium text-slate-400 inline-flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime}</span></div>
                <h3 className="font-serif text-2xl mt-3 text-sky-950 leading-snug">{article.title}</h3>
                <p className="mt-3 text-sm text-slate-500 leading-6 line-clamp-3">{article.summary}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-sky-700">{t('journal.read')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] p-8 sm:p-12 bg-gradient-to-br from-sky-950 via-sky-800 to-cyan-600 text-white text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full border-[45px] border-white/5" />
          <div className="relative max-w-2xl mx-auto"><h2 className="font-serif text-3xl sm:text-4xl">Ready to turn an idea into a bracelet?</h2><p className="mt-4 text-sm text-sky-100">Open the customizer, choose your finish and build your story link by link.</p><button onClick={() => navigateTo('builder')} className="mt-6 rounded-full bg-white text-sky-900 px-7 py-3.5 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:bg-cyan-50">{t('nav.builder')} <ArrowRight className="w-4 h-4" /></button></div>
        </div>
      </section>

      {activeArticle && (
        <div className="fixed inset-0 z-[70] bg-sky-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[30px] max-w-2xl w-full border border-sky-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-8">
            <div className="relative h-64 shrink-0"><img src={activeArticle.image} alt={activeArticle.title} className="w-full h-full object-cover" /><button onClick={() => setActiveArticle(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/90 text-sky-800 rounded-full shadow-md grid place-items-center"><X className="w-5 h-5" /></button></div>
            <div className="p-6 sm:p-8 space-y-4 overflow-y-auto flex-1"><span className="text-[10px] font-bold text-sky-500 uppercase tracking-[0.14em]">{activeArticle.category} · {activeArticle.readTime}</span><h2 className="font-serif text-3xl text-sky-950">{activeArticle.title}</h2><p className="text-sm text-slate-600 leading-7 whitespace-pre-line">{activeArticle.content}</p><div className="pt-6 border-t border-sky-100 flex items-center justify-between gap-3"><button onClick={() => { setActiveArticle(null); navigateTo('builder'); }} className="rounded-full bg-sky-600 text-white px-5 py-2.5 text-xs font-bold">{t('journal.build')}</button><button onClick={() => showNotification('Article link copied')} className="text-xs font-semibold text-sky-600 inline-flex items-center gap-1.5"><Share2 className="w-4 h-4" /> Share</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
};
