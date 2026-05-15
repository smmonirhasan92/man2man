// Currency Utility for NXS and USD
// Standard Ratio: 1 USD = 100 NXS

export const NXS_RATIO = 100;

export const formatNXS = (amount, includeSymbol = true) => {
    const value = Number(amount || 0);
    const formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
    return includeSymbol ? `${formatted} NXS` : formatted;
};

export const formatUSD = (amount, includeSymbol = true) => {
    const value = Number(amount || 0);
    const formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return includeSymbol ? `$${formatted}` : formatted;
};

export const nxsToUsd = (nxsAmount) => {
    return Number((Number(nxsAmount || 0) / NXS_RATIO).toFixed(2));
};

export const usdToNxs = (usdAmount) => {
    return Number((Number(usdAmount || 0) * NXS_RATIO).toFixed(2));
};

export const formatNxsToUsd = (nxsAmount) => {
    return formatUSD(nxsToUsd(nxsAmount));
};
