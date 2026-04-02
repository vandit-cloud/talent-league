/**
 * Input sanitization utilities.
 * Strips HTML tags and dangerous characters from user input
 * to prevent XSS and NoSQL injection.
 */

const sanitizeString = (value) => {
    if (typeof value !== 'string') return value;
    return value
        .replace(/[<>]/g, '')           // Strip HTML angle brackets
        .replace(/\$/g, '')             // Strip $ to prevent NoSQL operators
        .replace(/\{|\}/g, '')          // Strip braces
        .trim();
};

const sanitizeEmail = (value) => {
    if (typeof value !== 'string') return value;
    return value.toLowerCase().trim().replace(/[<>{}$]/g, '');
};

const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            cleaned[key] = sanitizeString(value);
        } else {
            cleaned[key] = value;
        }
    }
    return cleaned;
};

module.exports = { sanitizeString, sanitizeEmail, sanitizeObject };
