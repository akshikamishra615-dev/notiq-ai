/**
 * NOTIQ AI — Production Input Validation & Mass-Assignment Defense Utility
 * Provides lightweight, strict, dependency-free input validation helpers.
 */

export const validator = {
  isValidEmail(email: any): boolean {
    if (typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    if (clean.length < 5 || clean.length > 254) return false;
    // Standard RFC-5322 pattern check
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(clean);
  },

  isValidOtp(otp: any): boolean {
    if (typeof otp !== 'string') return false;
    return /^\d{6}$/.test(otp.trim());
  },

  isStrongPassword(password: any): boolean {
    if (typeof password !== 'string') return false;
    // Minimum 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/.test(password);
  },

  isValidId(id: any): boolean {
    if (typeof id !== 'string') return false;
    const trimmed = id.trim();
    if (trimmed.length < 1 || trimmed.length > 100) return false;
    // Prevent directory traversal or control characters in IDs
    return !/[\/\s\\<>\`\'\"\;\:]/.test(trimmed);
  },

  isSafeString(str: any, maxLength: number = 5000): boolean {
    if (typeof str !== 'string') return false;
    return str.length <= maxLength;
  },

  isSafeArray(arr: any, maxItems: number = 500): boolean {
    if (!Array.isArray(arr)) return false;
    return arr.length <= maxItems;
  },

  hasPrototypePollution(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    const jsonString = JSON.stringify(obj);
    if (!jsonString) return false;
    return jsonString.includes('"__proto__":') || jsonString.includes('"constructor":') || jsonString.includes('"prototype":');
  },

  sanitizePagination(page: any, limit: any, defaultLimit: number = 50, maxLimit: number = 200): { page: number; limit: number } {
    let p = parseInt(page, 10);
    let l = parseInt(limit, 10);

    if (isNaN(p) || p < 1) p = 1;
    if (isNaN(l) || l < 1) l = defaultLimit;
    if (l > maxLimit) l = maxLimit;

    return { page: p, limit: l };
  },

  /**
   * Mass assignment defense: strips dangerous privilege and internal keys from incoming body
   */
  sanitizeBody<T extends Record<string, any>>(body: any, allowedKeys: string[]): Record<string, any> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return {};
    }
    const forbiddenKeys = new Set(['userId', 'role', 'isAdmin', 'isadmin', 'createdAt', 'updatedAt', 'ownerId', 'createdby', 'id']);
    const clean: Record<string, any> = {};

    for (const key of allowedKeys) {
      if (forbiddenKeys.has(key)) continue;
      if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
        clean[key] = body[key];
      }
    }
    return clean;
  }
};
