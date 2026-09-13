/**
 * NOTIQ AI — Production Structured Logger Utility
 * Provides lightweight, safe, dependency-free structured JSON logging.
 * NEVER logs sensitive data: passwords, OTPs, JWT secrets, tokens, credentials, vault content.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  message: string;
  requestId?: string;
  details?: Record<string, any>;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'salt',
  'otpcode',
  'otpinput',
  'token',
  'refreshtoken',
  'jwt_secret',
  'refresh_token_secret',
  'otp_secret',
  'vault_aes_key',
  'smtp_pass',
  'database_url',
  'authorization',
  'encryptedcontent',
]);

/**
 * Recursively sanitize objects to prevent accidental secret output in logs
 */
export function sanitizeLogDetails(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeLogDetails);
  }

  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('secret') || lowerKey.includes('pass') || lowerKey.includes('auth')) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      cleaned[key] = sanitizeLogDetails(obj[key]);
    } else {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

function writeLog(level: LogLevel, event: string, message: string, requestId?: string, details?: Record<string, any>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
  };

  if (requestId) entry.requestId = requestId;
  if (details) entry.details = sanitizeLogDetails(details);

  const formattedLog = JSON.stringify(entry);

  if (level === 'error') {
    console.error(formattedLog);
  } else if (level === 'warn') {
    console.warn(formattedLog);
  } else {
    console.log(formattedLog);
  }
}

export const logger = {
  info: (event: string, message: string, requestId?: string, details?: Record<string, any>) => 
    writeLog('info', event, message, requestId, details),

  warn: (event: string, message: string, requestId?: string, details?: Record<string, any>) => 
    writeLog('warn', event, message, requestId, details),

  error: (event: string, message: string, requestId?: string, details?: Record<string, any>) => 
    writeLog('error', event, message, requestId, details),

  debug: (event: string, message: string, requestId?: string, details?: Record<string, any>) => 
    writeLog('debug', event, message, requestId, details),
};
