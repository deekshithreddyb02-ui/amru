/**
 * PII Masking Utilities
 * GDPR & Indian IT Act compliant masking for sensitive data display.
 */

/** Mask email: "john.doe@example.com" → "jo****@example.com" */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}****@${domain}`;
  return `${local.slice(0, 2)}****@${domain}`;
};

/** Mask phone: "+91-741-0030-418" → "+91-XXX-XXXX-418" */
export const maskPhone = (phone: string): string => {
  if (!phone) return phone;
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 4) return phone;
  // Show first 2 and last 3 digits, mask the rest
  const visibleEnd = digits.slice(-3);
  const visibleStart = digits.slice(0, 2);
  const masked = visibleStart + "XXXXX" + visibleEnd;
  // Reconstruct with original formatting hints
  return phone.length > 6
    ? phone.slice(0, phone.indexOf(digits[2])) +
      "X".repeat(phone.length - phone.indexOf(digits[2]) - (phone.length - phone.lastIndexOf(visibleEnd[0]))) +
      phone.slice(phone.lastIndexOf(visibleEnd[0]))
    : masked;
};

/** Simple phone masking that preserves format better */
export const maskPhoneSimple = (phone: string): string => {
  if (!phone) return phone;
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.length <= 4) return phone;
  // Keep first 3 and last 2 characters visible
  const start = cleaned.slice(0, 3);
  const end = cleaned.slice(-2);
  const middleLen = cleaned.length - 5;
  return `${start}${"•".repeat(Math.max(middleLen, 3))}${end}`;
};

/** Mask UUID: "a1b2c3d4-..." → "a1b2••••" */
export const maskUserId = (id: string): string => {
  if (!id) return id;
  return `${id.slice(0, 4)}••••`;
};
