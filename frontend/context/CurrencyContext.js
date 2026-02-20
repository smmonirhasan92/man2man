'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
    // Default to USD, force rate to 1
    const [currency, setCurrency] = useState('USD');
    const [rates, setRates] = useState({
        USD: 1,
        BDT: 1 // [FIX] Disabled BDT conversion. 1 Unit = $1 USD.
    });

    useEffect(() => {
        // Force USD preference
        localStorage.setItem('currencyMode', 'USD');
        setCurrency('USD');
        setRates({ USD: 1, BDT: 1 });
    }, []);

    const toggleCurrency = () => {
        // [FIX] Disabled Toggle. Always USD.
        setCurrency('USD');
    };

    // Helper to format money
    // ASSUMPTION: Backend stores USD.
    const formatMoney = (amount) => {
        const val = parseFloat(amount || 0);
        return `$${val.toFixed(2)}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, toggleCurrency, formatMoney }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export const useCurrency = () => useContext(CurrencyContext);
