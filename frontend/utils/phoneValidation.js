/**
 * Phone Validation Utility for Man2Man (USA Affiliate)
 * Enforces strict rules for mobile operator prefixes and lengths.
 */

const validationRules = {
    '+880': {
        name: 'Bangladesh',
        regex: /^0?1[3-9]\d{8}$/,
        example: '017XXXXXXXX or 17XXXXXXXX',
        error: 'Invalid BD number. Use 10 or 11 digits (e.g., 017... or 17...).'
    },
    '+91': {
        name: 'India',
        regex: /^[6-9]\d{9}$/,
        example: '9XXXXXXXXX',
        error: 'Invalid India number. Must be 10 digits starting with 6-9.'
    },
    '+92': {
        name: 'Pakistan',
        regex: /^3\d{9}$/,
        example: '3XXXXXXXXX',
        error: 'Invalid Pakistan number. Must be 10 digits starting with 3.'
    },
    '+966': {
        name: 'Saudi Arabia',
        regex: /^5\d{8}$/,
        example: '5XXXXXXXX',
        error: 'Invalid Saudi number. Must be 9 digits starting with 5.'
    }
};

/**
 * Validates a phone number based on the country code.
 * @param {string} countryCode - e.g., '+880'
 * @param {string} phoneNumber - The raw phone number input
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validatePhone = (countryCode, phoneNumber) => {
    const rule = validationRules[countryCode];
    
    // If we don't have a specific rule for this country, allow standard 7-15 digits
    if (!rule) {
        const genericRegex = /^\d{7,15}$/;
        return {
            isValid: genericRegex.test(phoneNumber),
            error: genericRegex.test(phoneNumber) ? null : 'Invalid phone number length.'
        };
    }

    const isValid = rule.regex.test(phoneNumber);
    return {
        isValid,
        error: isValid ? null : rule.error
    };
};

export default validationRules;
