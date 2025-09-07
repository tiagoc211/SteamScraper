import React, { createContext, useState, useContext, useEffect } from 'react';
import { steamCurrencies, defaultCurrency } from '../data/currencies';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    try {
      const storedCurrencyId = localStorage.getItem('steam-currency-id');
      if (storedCurrencyId) {
        const found = steamCurrencies.find(c => c.id === parseInt(storedCurrencyId, 10));
        return found || defaultCurrency;
      }
    } catch (error) {
      console.error("Erro ao ler a moeda do localStorage", error);
    }
    return defaultCurrency;
  });

  useEffect(() => {
    try {
      localStorage.setItem('steam-currency-id', currency.id);
    } catch (error) {
      console.error("Erro ao guardar a moeda no localStorage", error);
    }
  }, [currency]);

  const value = { currency, setCurrency };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  return useContext(CurrencyContext);
};