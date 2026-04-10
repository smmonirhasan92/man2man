/**
 * Global Currency Configuration
 * Centralized source of truth for NXS, USD, and BDT conversions.
 */

const CURRENCY_CONFIG = {
    // 1 NXS = $0.01 (1 Cent)
    // Decreased from 0.02 to improve user intuition in Bangladesh
    NXS_TO_USD: 0.01,

    // Official System Exchange Rate ($1 USD -> BDT)
    // User Approved: 123
    USD_TO_BDT: 123,

    // Display Strategy
    SHOW_BDT_EQUIVALENT: true,

    // Financial Limits (in NXS)
    TRANSFER_MINIMUM_NXS: 500, // Equivalent to $5.00
};

module.exports = CURRENCY_CONFIG;
