import React, { useState } from 'react';
import { ChevronDown, MessageCircleQuestion, Ruler, ShieldCheck, Truck } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const faqs = [
  { q: 'What is an Italian Charm bracelet?', a: 'Italian Charms are modular links that connect to form a bracelet. You can rearrange the links, replace individual pieces and keep adding new memories over time.' },
  { q: 'How do I choose the right size?', a: 'Open the Customize Bracelet page and select a link count. If you are between sizes, choose the larger option for a more relaxed fit.' },
  { q: 'How do I add or remove a charm?', a: 'Hold two neighboring links and gently open the connector sideways. Hook or unhook the charm, then let the links close back into place.' },
  { q: 'How long does shipping take?', a: 'Most demo orders are shown as 1–5 business days depending on destination. Replace this with your real shipping policy before production.' },
  { q: 'Can I exchange an item?', a: 'Eligible unused items in original condition can be requested for exchange within 7 days, subject to your final store policy.' },
];

export const FaqsPage: React.FC = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-white">
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-14 sm:py-18 text-center">
        <div className="w-14 h-14 rounded-[20px] bg-sky-200 text-sky-950 grid place-items-center mx-auto"><MessageCircleQuestion className="w-7 h-7" /></div>
        <p className="mt-5 text-[10px] tracking-[0.2em] font-bold text-sky-700">{t('faq.kicker')}</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2 text-sky-950">{t('faq.title')}</h1>
        <p className="mt-4 text-sm text-slate-500 max-w-xl mx-auto leading-6">{t('faq.subtitle')}</p>
      </section>

      <section className="max-w-[1050px] mx-auto px-4 sm:px-6 pb-20 grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="space-y-3">
          {[[Ruler, 'Sizing', 'Use the bracelet builder to preview link counts.'], [Truck, 'Delivery', 'Shipping details can be connected to your real policy.'], [ShieldCheck, 'Care', 'Keep charms dry and store them carefully.']].map(([Icon, title, desc]: any) => (
            <div key={title} className="rounded-[22px] bg-white border border-sky-200 p-4 shadow-[0_10px_30px_rgba(6,74,163,.05)]"><div className="flex gap-3"><span className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-950 grid place-items-center shrink-0"><Icon className="w-5 h-5" /></span><div><h3 className="text-sm font-semibold text-sky-950">{title}</h3><p className="text-xs text-slate-400 mt-1 leading-5">{desc}</p></div></div></div>
          ))}
        </aside>
        <div className="space-y-3">
          {faqs.map((item, index) => (
            <div key={item.q} className="rounded-[22px] border border-sky-200 bg-white overflow-hidden shadow-[0_10px_30px_rgba(6,74,163,.04)]">
              <button onClick={() => setOpen(open === index ? -1 : index)} className="w-full px-5 sm:px-6 py-5 flex items-center justify-between gap-4 text-left"><span className="font-semibold text-sm sm:text-base text-sky-950">{item.q}</span><ChevronDown className={`w-5 h-5 text-sky-700 shrink-0 transition-transform ${open === index ? 'rotate-180' : ''}`} /></button>
              {open === index && <div className="px-5 sm:px-6 pb-6 text-sm leading-7 text-slate-600 border-t border-sky-100 pt-4">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
