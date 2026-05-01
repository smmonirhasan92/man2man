'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
    // [v7.0] 1 NXS = 1 Cent ($0.01) Model
    // No BDT conversion in wallet per user request.
    const [currency, setCurrency] = useState('USD');
    const [rates] = useState({
        NXS_TO_USD: 0.01
    });

    useEffect(() => {
        setCurrency('USD');
    }, []);

    const toggleCurrency = () => {
        // Toggle Logic if needed in future
    };

    // Helper to format in USD ($)
    const formatMoney = (nxsAmount) => {
        const usdValue = parseFloat(nxsAmount || 0) * rates.NXS_TO_USD;
        return `$${usdValue.toFixed(2)}`;
    };

    // [v7.1] Helper to format in NXS (Standard)
    const formatNXS = (usdAmount) => {
        const nxsValue = Math.round(parseFloat(usdAmount || 0) * 100);
        return `${nxsValue} NXS`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, toggleCurrency, formatMoney, formatNXS, rates }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export const useCurrency = () => useContext(CurrencyContext);
