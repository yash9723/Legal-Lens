export const redactPII = (text: string): string => {
    if (!text) return text;

    // 1. Email Redaction
    // Regex: matches typical email patterns
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let redacted = text.replace(emailRegex, '[REDACTED-EMAIL]');

    // 2. Phone Number Redaction
    // Regex: matches various phone formats (e.g., 123-456-7890, (123) 456-7890, +1 123 456 7890)
    // We need to be careful not to match dates or other numbers too aggressively.
    // This looks for groups of digits separated by dashes, dots, or spaces.
    const phoneRegex = /(?:\+?\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g;
    redacted = redacted.replace(phoneRegex, '[REDACTED-PHONE]');

    // 3. Social Security Number (SSN) Redaction (US format: AAA-GG-SSSS)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    redacted = redacted.replace(ssnRegex, '[REDACTED-SSN]');

    // 4. Credit Card Number Redaction
    // Matches 13-19 digits, possibly with dashes or spaces
    // Using a simple check to avoid matching long generic numbers if possible, 
    // but for safety, we'll target sequences that look like cards.
    const creditCardRegex = /\b(?:\d{4}[- ]?){3}\d{4}\b|\b\d{16}\b/g;
    redacted = redacted.replace(creditCardRegex, '[REDACTED-CC]');

    return redacted;
};
