import { Request, Response, NextFunction } from 'express';

/**
 * NOTIQ AI V52.0 - cleanHindiOCRMiddleware
 * Enforces UTF-8 JSON response headers and strips raw OCR codes, dotted circles, and corrupted chars
 */
export function cleanHindiOCRMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Force UTF-8 JSON Content-Type headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Encoding', 'identity');

  // 2. Clean incoming request body text fields if present
  if (req.body && typeof req.body === 'object') {
    sanitizeObjectStrings(req.body);
  }

  // 3. Intercept res.json to ensure outgoing JSON is clean UTF-8 without escaped Unicode
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (body && typeof body === 'object') {
      sanitizeObjectStrings(body);
    }
    return originalJson(body);
  };

  next();
}

/**
 * Deep recursive sanitation for all strings in an object or array
 */
function sanitizeObjectStrings(obj: any) {
  if (!obj || typeof obj !== 'object') return;

  const systemKeys = new Set(['email', 'password', 'token', 'refreshToken', 'authorization', 'id', 'userId', 'workspaceId', 'stickyId', 'summaryId', 'otpCode', 'otpInput', 'encryptedContent', 'salt', 'passwordHash', 'jwt', 'apiKey']);

  for (const key of Object.keys(obj)) {
    if (systemKeys.has(key) || key.toLowerCase().endsWith('id')) {
      continue;
    }
    const val = obj[key];
    if (typeof val === 'string') {
      obj[key] = cleanBackendString(val);
    } else if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        if (typeof val[i] === 'string') {
          val[i] = cleanBackendString(val[i]);
        } else if (typeof val[i] === 'object') {
          sanitizeObjectStrings(val[i]);
        }
      }
    } else if (typeof val === 'object') {
      sanitizeObjectStrings(val);
    }
  }
}

/**
 * Clean string: NFC normalize, strip OCR codes, dotted circles, replacement chars, and zero-width chars
 */
export function cleanBackendString(text: string): string {
  if (!text) return '';

  const ocrCodesPattern = /\b(UXV|UXK|UXJ|QWX|PLM|XZY|ZXC|VBN|FGH|JKL|WER|TYU|IOP|ASD|GHJ|KLZ|XCV|BNM|KZHUUQ|KRUVSKTZ|USSOZZKK)\b/gi;

  let cleaned = text
    .normalize('NFC')
    .replace(ocrCodesPattern, '')
    .replace(/[\u25CC\u25CB\u25EF◌]/g, '') // Remove dotted circles
    .replace(/\uFFFD/g, '')                 // Remove replacement character ()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
    .replace(/[\*\#\`\~\_\^\<\>]+/g, '')   // Remove markdown decorative artifacts
    .replace(/ {2,}/g, ' ');

  // Fix attached matras
  cleaned = cleaned.replace(/([\u0900-\u097F])\s+([\u093E-\u094C\u0901\u0902\u0903\u094D])/g, '$1$2');

  return cleaned.trim();
}
