import React, { createContext, useContext, useMemo, useState } from 'react';

export type CurrencyCode = 'USD' | 'THB' | 'LAK' | 'VND';

type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  rateFromVND: number;
  decimals: number;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$', rateFromVND: 1 / 26000, decimals: 2 },
  { code: 'THB', label: 'Thai Baht', symbol: '฿', rateFromVND: 35.5 / 26000, decimals: 0 },
  { code: 'LAK', label: 'Lao Kip', symbol: '₭', rateFromVND: 22000 / 26000, decimals: 0 },
  { code: 'VND', label: 'Vietnamese Dong', symbol: '₫', rateFromVND: 1, decimals: 0 },
];

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (valueInVND: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = window.localStorage.getItem('pishneefo-currency') as CurrencyCode | null;
    return CURRENCY_OPTIONS.some((option) => option.code === saved) ? saved! : 'USD';
  });

  const setCurrency = (next: CurrencyCode) => {
    setCurrencyState(next);
    window.localStorage.setItem('pishneefo-currency', next);
  };

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    setCurrency,
    formatPrice: (valueInVND: number) => {
      const option = CURRENCY_OPTIONS.find((item) => item.code === currency)!;
      const converted = valueInVND * option.rateFromVND;
      const amount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: option.decimals,
        maximumFractionDigits: option.decimals,
      }).format(converted);
      return `${option.symbol}${amount}`;
    },
  }), [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
