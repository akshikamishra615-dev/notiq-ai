import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { logger } from './logger';
import { validator } from './validator';
import { 
  dbService, 
  prisma,
  hashPassword,
  hashPasswordV2,
  verifyPassword,
  generateSalt, 
  decryptAES256,
  DBUser, 
  DBUserProfile 
} from './db';
import { cleanHindiOCRMiddleware } from './cleanHindiOCRMiddleware';
import { HindiReconstructionService } from './hindiReconstructionService';
import { BackendTranslationEngine } from './translationEngine';
import { BackendSummaryGenerator } from './backendSummaryGenerator';
import { sendOtpEmailViaMailjet } from './emailService';

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Secret Resolution with Production Defaults
const JWT_SECRET = process.env.JWT_SECRET || 'notiq_ai_production_jwt_access_secret_key_2026_fallback';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'notiq_ai_production_jwt_refresh_secret_key_2026_fallback';

// CORS Security Configuration
const configuredOrigins = process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS;
const allowedOriginsList = configuredOrigins
  ? configuredOrigins.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000', 'https://notiq-ai.netlify.app'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like server-to-server or mobile native requests)
    if (!origin) return callback(null, true);

    if (origin.endsWith('.netlify.app') || allowedOriginsList.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
}));

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(cleanHindiOCRMiddleware);

// Path Normalization Middleware for Netlify Functions Serverless Rewrites
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api');
  }
  next();
});

export interface AuthenticatedRequest extends Request {
  user?: DBUser;
  requestId?: string;
  _startTime?: number;
}

// Request Correlation & HTTP Lifecycle Logging Middleware
app.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  req.requestId = reqId;
  req._startTime = Date.now();
  res.setHeader('X-Request-ID', reqId);

  res.on('finish', () => {
    const durationMs = Date.now() - (req._startTime || Date.now());
    if (req.path === '/api/health' && res.statusCode === 200) {
      return; // Omit spammy 200 health checks
    }
    logger.info('http.request', `${req.method} ${req.path} ${res.statusCode} in ${durationMs}ms`, reqId, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
      ip: getClientIp(req),
    });
  });

  next();
});

// In-Memory Rate Limiter Helper with Automatic Memory Cleanup
class RateLimiter {
  private requests: Map<string, { count: number; firstRequest: number }> = new Map();

  constructor(private windowMs: number, private maxRequests: number) {}

  private cleanupExpired(now: number) {
    if (this.requests.size > 50) {
      for (const [k, rec] of this.requests.entries()) {
        if (now - rec.firstRequest > this.windowMs) {
          this.requests.delete(k);
        }
      }
    }
  }

  isRateLimited(key: string): boolean {
    if (!IS_PROD && key.startsWith('reg-')) {
      return false;
    }
    const now = Date.now();
    this.cleanupExpired(now);
    const record = this.requests.get(key);
    if (!record || now - record.firstRequest > this.windowMs) {
      this.requests.set(key, { count: 1, firstRequest: now });
      return false;
    }
    if (record.count >= this.maxRequests) {
      return true;
    }
    record.count += 1;
    return false;
  }
}

// Rate Limiter Instances
const otpGenLimiter = new RateLimiter(5 * 60 * 1000, 3);    // Max 3 OTP generation calls per 5 minutes
const otpVerifyLimiter = new RateLimiter(5 * 60 * 1000, 5); // Max 5 OTP verification attempts per 5 minutes
const registerLimiter = new RateLimiter(15 * 60 * 1000, 200); // Max 200 registration attempts per 15 minutes
const forgotLimiter = new RateLimiter(5 * 60 * 1000, 3);   // Max 3 password reset requests per 5 minutes

// AI Endpoint Rate Limiters
const aiProcessLimiter = new RateLimiter(5 * 60 * 1000, 15);    // Max 15 OCR process calls per 5 minutes
const aiTranslateLimiter = new RateLimiter(5 * 60 * 1000, 30);  // Max 30 translate calls per 5 minutes
const aiReconstructLimiter = new RateLimiter(5 * 60 * 1000, 30);// Max 30 Hindi reconstruct calls per 5 minutes
const aiChatLimiter = new RateLimiter(5 * 60 * 1000, 60);       // Max 60 chat calls per 5 minutes

// Per-User Concurrency Guard for Expensive AI Operations
export class UserConcurrencyGuard {
  private activeRequests: Map<string, number> = new Map();

  constructor(private maxConcurrent: number = 2) {}

  tryAcquire(userId: string): boolean {
    const current = this.activeRequests.get(userId) || 0;
    if (current >= this.maxConcurrent) {
      return false;
    }
    this.activeRequests.set(userId, current + 1);
    return true;
  }

  release(userId: string): void {
    const current = this.activeRequests.get(userId) || 0;
    if (current <= 1) {
      this.activeRequests.delete(userId);
    } else {
      this.activeRequests.set(userId, current - 1);
    }
  }

  getActiveCount(userId: string): number {
    return this.activeRequests.get(userId) || 0;
  }
}

export const aiConcurrencyGuard = new UserConcurrencyGuard(2);

// Lightweight AI Usage Tracking Memory Store
export const aiUsageTracker = {
  logs: [] as { userId: string; operation: string; timestamp: number; success: boolean }[],
  track(userId: string, operation: string, success: boolean) {
    this.logs.push({ userId, operation, timestamp: Date.now(), success });
    if (this.logs.length > 500) {
      this.logs.shift();
    }
  },
};

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const reqId = req.requestId;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('auth.missing_token', 'Authentication attempt without access token', reqId, { path: req.path });
    return res.status(401).json({ error: 'Authentication required. Access token missing.', ...(reqId ? { requestId: reqId } : {}) });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { userId: string; email: string };
    const user = await dbService.findUserById(decoded.userId);
    if (!user) {
      logger.warn('auth.revoked_user', 'Valid token provided for non-existent or revoked user account', reqId, { userId: decoded.userId });
      return res.status(403).json({ error: 'User account not found or access revoked.', ...(reqId ? { requestId: reqId } : {}) });
    }
    req.user = user;
    next();
  } catch (err: any) {
    logger.warn('auth.token_verification_failed', 'JWT verification failed', reqId, { path: req.path, errorType: err?.name || err?.message });
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired. Please refresh your session.', ...(reqId ? { requestId: reqId } : {}) });
    }
    return res.status(403).json({ error: 'Invalid access token.', ...(reqId ? { requestId: reqId } : {}) });
  }
}

// Helper to determine IP address safely
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Standardized Error Response Helper with Request ID Correlation
function sendError(res: Response, req: AuthenticatedRequest, status: number, message: string, err?: any) {
  const reqId = req.requestId;
  if (status >= 500) {
    logger.error('api.error', message, reqId, { status, error: err?.message || err, path: req.path });
  } else {
    logger.warn('api.warning', message, reqId, { status, error: err?.message || err, path: req.path });
  }
  const body: Record<string, any> = { error: message };
  if (reqId) body.requestId = reqId;
  return res.status(status).json(body);
}

// ====================================================
// AUTHENTICATION REST ENDPOINTS (/api/auth/*)
// ====================================================

// POST /api/auth/register
app.post('/api/auth/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (validator.hasPrototypePollution(req.body)) {
      return sendError(res, req, 400, 'Invalid JSON payload structure.');
    }

    const ip = getClientIp(req);
    if (registerLimiter.isRateLimited(`reg-${ip}`)) {
      return sendError(res, req, 429, 'Too many registration requests from this IP. Please try again later.');
    }

    const { fullName, email, phone, password, avatar } = req.body;

    if (!fullName || (!email && !phone) || !password) {
      return sendError(res, req, 400, 'Full name, email/phone, and password are required.');
    }

    if (email && !validator.isValidEmail(email)) {
      return sendError(res, req, 400, 'Invalid email address format.');
    }

    // Strong Password Validation
    if (!validator.isStrongPassword(password)) {
      return sendError(
        res, 
        req, 
        400, 
        'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.'
      );
    }

    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const cleanPhone = phone ? phone.trim() : undefined;

    let existingUser = cleanEmail ? await dbService.findUserByEmail(cleanEmail) : undefined;
    
    // If existing user is VERIFIED, block duplicate registration
    if (existingUser && existingUser.emailVerified) {
      return sendError(res, req, 400, 'An account with this email address already exists. Please login.');
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    let targetUserId: string;

    if (existingUser && !existingUser.emailVerified) {
      // Re-use existing UNVERIFIED account: update password and details
      targetUserId = existingUser.id;
      await dbService.updateUser(targetUserId, {
        fullName,
        avatar: avatar || '🎓',
        passwordHash,
        salt,
      });
    } else {
      // Create new user account
      targetUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newUser: DBUser = {
        id: targetUserId,
        fullName,
        email: cleanEmail || `${cleanPhone}@notiq.phone`,
        phone: cleanPhone,
        avatar: avatar || '🎓',
        passwordHash,
        salt,
        emailVerified: false,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      const newProfile: DBUserProfile = {
        userId: targetUserId,
        preferredLanguage: 'auto',
        theme: 'dark',
        streak: 0,
        studyGoal: 30,
        timezone: 'UTC',
        xp: 0,
        level: 1,
      };

      await dbService.createUser(newUser, newProfile);
    }

    // Generate cryptographically secure OTP (5-minute expiry)
    const otpRecord = await dbService.createOtp(cleanEmail, cleanPhone);

    await dbService.updateUser(targetUserId, {
      otpCode: otpRecord.otpCode,
      otpExpiresAt: otpRecord.expiresAt,
    });

    // Execute Mailjet Transactional Email Send (AWAIT MAILJET RESPONSE)
    if (cleanEmail) {
      const emailResult = await sendOtpEmailViaMailjet({
        toEmail: cleanEmail,
        userName: fullName,
        otpCode: otpRecord.otpCode,
        type: 'verify',
      });

      if (!emailResult.success) {
        logger.warn('auth.register_email_failed', 'Mailjet OTP email delivery unconfigured or failed', req.requestId, { error: emailResult.error });
        return res.status(201).json({
          message: 'Account registered successfully. Your 6-digit OTP verification code is provided below.',
          userId: targetUserId,
          email: cleanEmail,
          requireVerification: true,
          otpCode: otpRecord.otpCode,
        });
      }
    }

    const responsePayload: Record<string, any> = {
      message: 'Account registered successfully. A 6-digit OTP code has been dispatched to your email (valid for 5 minutes).',
      userId: targetUserId,
      email: cleanEmail,
      requireVerification: true,
    };

    if (!IS_PROD || process.env.SHOW_DEV_OTP === 'true') {
      responsePayload.otpCode = otpRecord.otpCode;
    }

    res.status(201).json(responsePayload);
  } catch (err: any) {
    sendError(res, req, 500, IS_PROD ? 'Registration error.' : (err?.message || 'Registration error.'));
  }
});

// POST /api/auth/send-otp
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;
    const cleanEmail = email?.toLowerCase().trim();
    const cleanPhone = phone?.trim();

    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ error: 'Email address or phone number is required.' });
    }

    const targetKey = cleanEmail ? `otp-gen-${cleanEmail}` : `otp-gen-${cleanPhone}`;
    const ipKey = `otp-gen-ip-${getClientIp(req)}`;

    if (otpGenLimiter.isRateLimited(targetKey) || otpGenLimiter.isRateLimited(ipKey)) {
      return res.status(429).json({ error: 'Too many OTP requests. Please wait 1 minute before requesting another OTP.' });
    }

    let user = cleanEmail ? await dbService.findUserByEmail(cleanEmail) : (cleanPhone ? await dbService.findUserByPhone(cleanPhone) : undefined);
    if (!user) {
      return res.status(404).json({ error: 'Account not found with this email address.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Account is already verified. Please log in.' });
    }

    const otpRecord = await dbService.createOtp(cleanEmail, cleanPhone);

    await dbService.updateUser(user.id, {
      otpCode: otpRecord.otpCode,
      otpExpiresAt: otpRecord.expiresAt,
    });

    if (cleanEmail) {
      const emailResult = await sendOtpEmailViaMailjet({
        toEmail: cleanEmail,
        userName: user.fullName,
        otpCode: otpRecord.otpCode,
        type: 'verify',
      });

      if (!emailResult.success) {
        return res.status(200).json({
          message: 'New 6-digit OTP verification code generated. Your OTP verification code is provided below.',
          email: cleanEmail,
          otpCode: otpRecord.otpCode,
        });
      }
    }

    const responsePayload: Record<string, any> = {
      message: 'New 6-digit OTP verification code sent to your email (valid for 5 minutes).',
      email: cleanEmail,
    };

    if (!IS_PROD && process.env.SHOW_DEV_OTP === 'true') {
      responsePayload.otpCode = otpRecord.otpCode;
    }

    res.json(responsePayload);
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'OTP request error.' : (err?.message || 'OTP request error.') });
  }
});

// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, phone, otpInput } = req.body;
    const cleanEmail = email?.toLowerCase().trim();
    const cleanPhone = phone?.trim();
    const targetKey = cleanEmail ? `otp-ver-${cleanEmail}` : `otp-ver-${cleanPhone}`;

    if (otpVerifyLimiter.isRateLimited(targetKey)) {
      return res.status(429).json({ error: 'Too many failed verification attempts. Please request a new OTP after 5 minutes.' });
    }

    let user = cleanEmail ? await dbService.findUserByEmail(cleanEmail) : (cleanPhone ? await dbService.findUserByPhone(cleanPhone) : undefined);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const isValid = await dbService.verifyOtp(otpInput, cleanEmail, cleanPhone);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit OTP code.' });
    }

    await dbService.updateUser(user.id, { 
      emailVerified: true, 
      phoneVerified: true, 
      otpCode: undefined 
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: 3600 });
    const refreshToken = jwt.sign({ userId: user.id, nonce: `${Date.now()}-${Math.random()}` }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    await dbService.createSession(user.id, refreshToken);

    res.json({
      message: 'OTP verified successfully!',
      token,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        emailVerified: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Verification error.' : (err?.message || 'Verification error.') });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await dbService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isDeactivated) {
      return res.status(403).json({ error: 'This account is currently deactivated. Please contact support or reactivate your account.' });
    }

    // Fail-Closed Security Enforcement: Reject missing credentials/salt immediately
    if (!user.salt || !user.passwordHash) {
      logger.warn('auth.missing_credentials', 'Login rejected: User account missing salt or passwordHash', req.requestId, { userId: user.id });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Backward-Compatible Password Verification & Transparent Rehash Upgrade
    const { valid, needsRehash } = verifyPassword(password, user.salt, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (needsRehash) {
      const upgradedHash = hashPasswordV2(password, user.salt);
      await dbService.updateUser(user.id, { passwordHash: upgradedHash, lastLogin: new Date().toISOString() });
    } else {
      await dbService.updateUser(user.id, { lastLogin: new Date().toISOString() });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: 3600 });
    const refreshToken = jwt.sign({ userId: user.id, nonce: `${Date.now()}-${Math.random()}` }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    await dbService.createSession(user.id, refreshToken);

    res.json({
      message: 'Login successful.',
      token,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Login error.' : (err?.message || 'Login error.') });
  }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !validator.isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (forgotLimiter.isRateLimited(`forgot-${cleanEmail}`)) {
      return res.status(429).json({ error: 'Too many password reset requests. Please wait 5 minutes.' });
    }

    const user = await dbService.findUserByEmail(cleanEmail);
    if (user) {
      const otpRecord = await dbService.createOtp(cleanEmail);
      await dbService.updateUser(user.id, {
        otpCode: otpRecord.otpCode,
        otpExpiresAt: otpRecord.expiresAt,
      });

      const emailResult = await sendOtpEmailViaMailjet({
        toEmail: cleanEmail,
        userName: user.fullName,
        otpCode: otpRecord.otpCode,
        type: 'forgot',
      });

      if (!emailResult.success) {
        return res.json({
          message: 'Password reset code generated. Your OTP verification code is provided below.',
          otpCode: otpRecord.otpCode,
        });
      }
    }

    res.json({
      message: 'If an account exists with this email address, a 6-digit OTP verification code has been dispatched to your email (valid for 5 minutes).',
    });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Password reset error.' : (err?.message || 'Password reset error.') });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, otpInput, newPassword } = req.body;

    if (!email || !otpInput || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP code, and new password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await dbService.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const isValidOtp = await dbService.verifyOtp(otpInput, cleanEmail);
    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit OTP code.' });
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long with 1 uppercase, 1 lowercase, 1 number, and 1 special character.',
      });
    }

    const newSalt = generateSalt();
    const newPasswordHash = hashPassword(newPassword, newSalt);

    await dbService.resetUserPassword(user.id, newPasswordHash, newSalt);

    res.json({ message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Password reset error.' : (err?.message || 'Password reset error.') });
  }
});

// POST /api/auth/refresh-token
app.post('/api/auth/refresh-token', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] }) as { userId: string };
    const user = await dbService.findUserById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'Session invalid or user account removed.' });
    }

    const newToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: 3600 });
    res.json({ token: newToken });
  } catch {
    res.status(403).json({ error: 'Invalid or expired refresh token. Please login again.' });
  }
});

// POST /api/auth/deactivate (Temporarily Deactivate Account - Data Preserved)
app.post('/api/auth/deactivate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, req, 401, 'Authentication required.');
    const userId = req.user.id;
    await dbService.deactivateUserAccount(userId);
    res.json({ message: 'Account deactivated successfully. Your data remains preserved.' });
  } catch (err: any) {
    sendError(res, req, 500, 'Failed to deactivate account.', err);
  }
});

// DELETE /api/auth/account (Permanently Delete Account & All Data)
app.delete('/api/auth/account', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, req, 401, 'Authentication required.');
    const userId = req.user.id;
    const { password, confirmationText } = req.body;

    if (confirmationText !== 'DELETE') {
      return sendError(res, req, 400, 'Please type "DELETE" to confirm permanent account deletion.');
    }

    if (!password) {
      return sendError(res, req, 400, 'Password is required to confirm permanent account deletion.');
    }

    const user = await dbService.findUserById(userId);
    if (!user) {
      return sendError(res, req, 404, 'User account not found.');
    }

    const { valid } = verifyPassword(password, user.salt, user.passwordHash);
    if (!valid) {
      return sendError(res, req, 401, 'Incorrect password. Account deletion cancelled.');
    }

    await dbService.deleteUserAccountPermanently(userId);
    res.json({ status: 'success', message: 'Account and all associated study data have been permanently deleted.' });
  } catch (err: any) {
    sendError(res, req, 500, 'Failed to permanently delete account.', err);
  }
});

// ====================================================
// USER PROFILE ENDPOINTS (/api/user/profile)
// ====================================================

// GET /api/user/profile
app.get('/api/user/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, req, 401, 'Unauthorized');
    const profile = await dbService.getUserProfile(req.user.id);
    res.json({
      user: {
        id: req.user.id,
        fullName: req.user.fullName,
        email: req.user.email,
        avatar: req.user.avatar,
      },
      profile: profile || {},
    });
  } catch (err: any) {
    sendError(res, req, 500, 'Failed to fetch user profile.', err);
  }
});

// PUT /api/user/profile
app.put('/api/user/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, req, 401, 'Unauthorized');

    const { fullName, avatar, college, course, semester, academicYear, classGrade, userType, subjects, learningGoals, preferredLanguage } = req.body;

    if (fullName) {
      await dbService.updateUser(req.user.id, { fullName, avatar });
    }

    const subjectsJson = Array.isArray(subjects) ? JSON.stringify(subjects) : (typeof subjects === 'string' ? subjects : undefined);

    const updatedProfile = await dbService.updateUserProfile(req.user.id, {
      college,
      course,
      semester,
      academicYear,
      classGrade,
      userType,
      ...(subjectsJson ? { subjectsJson } : {}),
      learningGoals,
      preferredLanguage,
    });

    const updatedUser = await dbService.findUserById(req.user.id);

    res.json({
      message: 'Profile updated successfully.',
      user: updatedUser,
      profile: updatedProfile,
    });
  } catch (err: any) {
    sendError(res, req, 500, 'Failed to update user profile.', err);
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const refreshToken = req.body.refreshToken;
    await dbService.revokeUserSessions(userId, refreshToken);
    res.json({ message: 'Logged out successfully from this device.' });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Logout error.' : (err?.message || 'Logout error.') });
  }
});

// POST /api/auth/logout-all
app.post('/api/auth/logout-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await dbService.revokeUserSessions(userId);
    res.json({ message: 'Logged out from all active devices.' });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Logout error.' : (err?.message || 'Logout error.') });
  }
});

// ====================================================
// WORKSPACE ENDPOINTS (/api/workspaces/*)
// ====================================================

app.get('/api/workspaces', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaces = await dbService.getUserWorkspaces(userId);
    res.json({ workspaces });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Workspace error.' : (err?.message || 'Workspace error.') });
  }
});

app.post('/api/workspaces', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceName, description, icon } = req.body;

    if (!workspaceName) {
      return res.status(400).json({ error: 'Workspace name is required.' });
    }

    const newWs = await dbService.createWorkspace({
      id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      workspaceName,
      description: description || '',
      icon: icon || '📚',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({ workspace: newWs });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Workspace error.' : (err?.message || 'Workspace error.') });
  }
});

app.put('/api/workspaces/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.id;
    const updated = await dbService.updateWorkspace(workspaceId, userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Workspace not found or access denied.' });
    }
    res.json({ workspace: updated });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Workspace error.' : (err?.message || 'Workspace error.') });
  }
});

app.delete('/api/workspaces/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.id;
    const deleted = await dbService.deleteWorkspace(workspaceId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Workspace not found or access denied.' });
    }
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Workspace error.' : (err?.message || 'Workspace error.') });
  }
});

// ====================================================
// STICKY NOTES ENDPOINTS (/api/sticky/*)
// ====================================================

const getStickyHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;
    const notes = await dbService.getStickyNotes(userId, workspaceId);
    res.json({ notes });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Sticky notes error.' : (err?.message || 'Sticky notes error.') });
  }
};

app.get('/api/sticky', authenticateToken, getStickyHandler);
app.get('/api/sticky/:workspaceId', authenticateToken, getStickyHandler);

app.post('/api/sticky', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const noteData = req.body;

    if (!noteData.title || !noteData.summary) {
      return res.status(400).json({ error: 'Title and summary are required.' });
    }

    const savedNote = await dbService.saveStickyNote({
      id: noteData.id || `sticky-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      workspaceId: noteData.workspaceId || `ws-${userId}-default`,
      title: noteData.title,
      summaryText: noteData.summary,
      bullets: noteData.bullets || [],
      keywords: noteData.keywords || [],
      topic: noteData.topic || 'General Concepts',
      pageNumber: noteData.pageNumber || '1',
      priority: noteData.priority || 'medium',
      color: noteData.color || 'purple',
      pinned: !!noteData.pinned,
      rotation: noteData.rotation || 0,
      createdAt: noteData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({ note: savedNote });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Sticky note error.' : (err?.message || 'Sticky note error.') });
  }
});

app.put('/api/sticky/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const existing = await dbService.getStickyNoteById(noteId, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Sticky note not found or access denied.' });
    }
    const updated = await dbService.saveStickyNote({
      ...existing,
      ...req.body,
      id: noteId,
      userId,
    });
    res.json({ note: updated });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Sticky note error.' : (err?.message || 'Sticky note error.') });
  }
});

app.delete('/api/sticky/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const deleted = await dbService.deleteStickyNote(noteId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Sticky note not found or access denied.' });
    }
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Sticky note error.' : (err?.message || 'Sticky note error.') });
  }
});

// ====================================================
// FLASHCARDS ENDPOINTS (/api/flashcards/*)
// ====================================================

const getFlashcardsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;
    const flashcards = await dbService.getFlashcards(userId, workspaceId);
    res.json({ flashcards });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Flashcard error.' : (err?.message || 'Flashcard error.') });
  }
};

app.get('/api/flashcards', authenticateToken, getFlashcardsHandler);
app.get('/api/flashcards/:workspaceId', authenticateToken, getFlashcardsHandler);

app.post('/api/flashcards', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, workspaceId, stickyId, question, answer, difficulty, mastered } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required.' });
    }

    const saved = await dbService.saveFlashcard({
      id: id || `fc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      workspaceId: workspaceId || `ws-${userId}-default`,
      stickyId,
      question,
      answer,
      difficulty: difficulty || 'medium',
      mastered: !!mastered,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({ flashcard: saved });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Flashcard error.' : (err?.message || 'Flashcard error.') });
  }
});

app.put('/api/flashcards/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const flashcardId = req.params.id;
    const flashcards = await dbService.getFlashcards(userId);
    const existing = flashcards.find(f => f.id === flashcardId);
    if (!existing) {
      return res.status(404).json({ error: 'Flashcard not found or access denied.' });
    }
    const updated = await dbService.saveFlashcard({
      ...existing,
      ...req.body,
      id: flashcardId,
      userId,
    });
    res.json({ flashcard: updated });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Flashcard error.' : (err?.message || 'Flashcard error.') });
  }
});

app.delete('/api/flashcards/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const flashcardId = req.params.id;
    const deleted = await dbService.deleteFlashcard(flashcardId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Flashcard not found or access denied.' });
    }
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Flashcard error.' : (err?.message || 'Flashcard error.') });
  }
});

// ====================================================
// QUIZ ENDPOINTS (/api/quizzes/*)
// ====================================================

const getQuizzesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId;
    const quizzes = await dbService.getQuizzes(userId, workspaceId);
    res.json({ quizzes });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Quiz error.' : (err?.message || 'Quiz error.') });
  }
};

app.get('/api/quizzes', authenticateToken, getQuizzesHandler);
app.get('/api/quizzes/:workspaceId', authenticateToken, getQuizzesHandler);

app.post('/api/quizzes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, workspaceId, question, options, correctAnswer, explanation, marks } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options are required.' });
    }

    const saved = await dbService.saveQuiz({
      id: id || `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      workspaceId: workspaceId || `ws-${userId}-default`,
      question,
      options,
      correctAnswer: correctAnswer ?? 0,
      explanation: explanation || '',
      marks: marks || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({ quiz: saved });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Quiz error.' : (err?.message || 'Quiz error.') });
  }
});

app.put('/api/quizzes/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const quizId = req.params.id;
    const quizzes = await dbService.getQuizzes(userId);
    const existing = quizzes.find(q => q.id === quizId);
    if (!existing) {
      return res.status(404).json({ error: 'Quiz not found or access denied.' });
    }
    const updated = await dbService.saveQuiz({
      ...existing,
      ...req.body,
      id: quizId,
      userId,
    });
    res.json({ quiz: updated });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Quiz error.' : (err?.message || 'Quiz error.') });
  }
});

app.delete('/api/quizzes/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const quizId = req.params.id;
    const deleted = await dbService.deleteQuiz(quizId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Quiz not found or access denied.' });
    }
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Quiz error.' : (err?.message || 'Quiz error.') });
  }
});

// ====================================================
// VAULT ENDPOINTS (/api/vault/*)
// ====================================================

app.get('/api/vault', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const vaultNotes = (await dbService.getVaultNotes(userId)).map(v => ({
      id: v.id,
      title: v.title,
      isLocked: v.isLocked,
      lockType: v.lockType,
      category: v.category,
      createdAt: v.createdAt,
    }));
    res.json({ vaultNotes });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Vault error.' : (err?.message || 'Vault error.') });
  }
});

app.post('/api/vault', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, content, category, lockType } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const note = await dbService.createVaultNote(userId, title, content, category, lockType);
    res.status(201).json({
      id: note.id,
      title: note.title,
      isLocked: true,
      message: 'Encrypted with AES-256 and stored safely in Production Database Storage.',
    });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Vault error.' : (err?.message || 'Vault error.') });
  }
});

app.post('/api/vault/unlock', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { vaultId } = req.body;

    const targetNote = await dbService.getVaultNoteById(vaultId, userId);

    if (!targetNote) {
      return res.status(404).json({ error: 'Vault item not found.' });
    }

    const decryptedContent = decryptAES256(targetNote.encryptedContent);

    res.json({
      id: targetNote.id,
      title: targetNote.title,
      content: decryptedContent,
      category: targetNote.category,
    });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Vault unlock error.' : (err?.message || 'Vault unlock error.') });
  }
});

app.delete('/api/vault/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const deleted = await dbService.deleteVaultNote(noteId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Vault item not found or access denied.' });
    }
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Vault error.' : (err?.message || 'Vault error.') });
  }
});

// ====================================================
// AI CHAT HISTORY ENDPOINTS (/api/chat/*)
// ====================================================

app.get('/api/chat/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = (req.query.workspaceId as string) || `ws-${userId}-default`;
    const history = await dbService.getChatHistory(userId, workspaceId);
    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Chat history error.' : (err?.message || 'Chat history error.') });
  }
});

app.post('/api/chat/message', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    if (aiChatLimiter.isRateLimited(`chat-${userId}`)) {
      return sendError(res, req, 429, 'Chat message rate limit exceeded. Please wait a moment before sending another message.');
    }

    const { workspaceId, userMessage, aiResponse } = req.body;

    if (!userMessage) {
      return sendError(res, req, 400, 'userMessage is required.');
    }

    if (typeof userMessage === 'string' && userMessage.length > 20000) {
      return sendError(res, req, 400, 'Chat message exceeds maximum allowed character limit (20,000 characters).');
    }

    if (aiResponse && typeof aiResponse === 'string' && aiResponse.length > 20000) {
      return sendError(res, req, 400, 'AI response payload exceeds maximum allowed character limit (20,000 characters).');
    }

    const chatItem = await dbService.saveChatMessage({
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      workspaceId: workspaceId || `ws-${userId}-default`,
      sender: 'user',
      message: userMessage,
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });

    aiUsageTracker.track(userId, 'chat.message', true);
    res.status(201).json({ chatItem });
  } catch (err: any) {
    res.status(500).json({ error: IS_PROD ? 'Chat message error.' : (err?.message || 'Chat message error.') });
  }
});

// ====================================================
// DATA MIGRATION ENDPOINT (/api/sync/*)
// ====================================================

app.post('/api/sync/migrate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const payload = req.body || {};
    const result = await dbService.migrateUserData(userId, payload);
    res.json(result);
  } catch (err: any) {
    console.error('Error during user data migration:', err);
    res.status(500).json({ error: IS_PROD ? 'Data migration failed.' : (err?.message || 'Data migration failed.') });
  }
});

// ====================================================
// V52.0 OCR & HINDI RECONSTRUCTION PIPELINE (/api/ocr/*)
// ====================================================

// POST /api/ocr/process - Complete Language Processing Pipeline
app.post('/api/ocr/process', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  if (aiProcessLimiter.isRateLimited(`ocr-${userId}`)) {
    return sendError(res, req, 429, 'AI OCR processing rate limit exceeded. Please try again after 5 minutes.');
  }

  if (!aiConcurrencyGuard.tryAcquire(userId)) {
    return sendError(res, req, 429, 'Too many concurrent AI requests in progress. Please wait for your previous request to finish.');
  }

  try {
    const { rawText, title, outputLanguage, mode } = req.body;

    if (!rawText) {
      return sendError(res, req, 400, 'rawText is required for OCR processing.');
    }

    if (typeof rawText === 'string' && rawText.length > 100000) {
      return sendError(res, req, 400, 'Input text exceeds maximum allowed size limit (100,000 characters).');
    }

    const docTitle = title || 'अध्याय का मुख्य विषय';
    const result = await BackendSummaryGenerator.processDocument(
      rawText,
      docTitle,
      outputLanguage || 'auto',
      mode || 'smart-summary'
    );

    aiUsageTracker.track(userId, 'ocr.process', true);
    res.json(result);
  } catch (err: any) {
    aiUsageTracker.track(userId, 'ocr.process', false);
    res.status(500).json({ 
      status: 'ERROR', 
      error: IS_PROD ? 'Error executing language processing pipeline.' : (err?.message || 'Error processing OCR.')
    });
  } finally {
    aiConcurrencyGuard.release(userId);
  }
});

// POST /api/reconstruct/hindi - Pure Hindi Reconstruction & Spell Repair
app.post('/api/reconstruct/hindi', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  if (aiReconstructLimiter.isRateLimited(`reconstruct-${userId}`)) {
    return sendError(res, req, 429, 'Hindi reconstruction rate limit exceeded. Please wait a moment before trying again.');
  }

  if (!aiConcurrencyGuard.tryAcquire(userId)) {
    return sendError(res, req, 429, 'Too many concurrent AI requests in progress. Please wait for your previous request to finish.');
  }

  try {
    const { text } = req.body;
    if (!text) {
      return sendError(res, req, 400, 'text is required.');
    }

    if (typeof text === 'string' && text.length > 50000) {
      return sendError(res, req, 400, 'Text exceeds maximum allowed size limit for Hindi reconstruction (50,000 characters).');
    }

    const cleanHindi = HindiReconstructionService.reconstruct(text);
    const isValid = HindiReconstructionService.validateHindiResponse(cleanHindi);

    aiUsageTracker.track(userId, 'reconstruct.hindi', true);
    res.json({
      cleanText: cleanHindi,
      isValid,
      length: cleanHindi.length,
    });
  } catch (err: any) {
    aiUsageTracker.track(userId, 'reconstruct.hindi', false);
    res.status(500).json({ error: IS_PROD ? 'Hindi reconstruction error.' : (err?.message || 'Hindi reconstruction error.') });
  } finally {
    aiConcurrencyGuard.release(userId);
  }
});

// POST /api/translate - Semantic Backend Translation
app.post('/api/translate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  if (aiTranslateLimiter.isRateLimited(`translate-${userId}`)) {
    return sendError(res, req, 429, 'Translation rate limit exceeded. Please wait a moment before trying again.');
  }

  if (!aiConcurrencyGuard.tryAcquire(userId)) {
    return sendError(res, req, 429, 'Too many concurrent AI requests in progress. Please wait for your previous request to finish.');
  }

  try {
    const { text, targetLang, sourceLang } = req.body;
    if (!text || !targetLang) {
      return sendError(res, req, 400, 'text and targetLang are required.');
    }

    if (typeof text === 'string' && text.length > 50000) {
      return sendError(res, req, 400, 'Text exceeds maximum allowed size limit for translation (50,000 characters).');
    }

    const translated = await BackendTranslationEngine.translate(text, targetLang, sourceLang);

    aiUsageTracker.track(userId, 'translate', true);
    res.json({ translatedText: translated });
  } catch (err: any) {
    aiUsageTracker.track(userId, 'translate', false);
    res.status(500).json({ error: IS_PROD ? 'Translation error.' : (err?.message || 'Translation error.') });
  } finally {
    aiConcurrencyGuard.release(userId);
  }
});

// GET /api/health - Production Operational Liveness & Database Readiness Check
app.get('/api/health', async (req: AuthenticatedRequest, res: Response) => {
  const reqId = req.requestId;
  let dbReady = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
  } catch (err: any) {
    logger.error('db.health_check_failed', 'Database query check failed during health readiness check', reqId, { error: err?.message });
  }

  const isHealthy = dbReady;
  const status = isHealthy ? 'ok' : 'degraded';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    liveness: true,
    readiness: dbReady,
    version: 'V52.0',
    uptime: Math.floor(process.uptime()),
    database: dbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: IS_PROD ? 'production' : 'development',
    ...(reqId ? { requestId: reqId } : {}),
  });
});

// Global Error Handling Middleware (Prevents Sensitive Information Leakage)
app.use((err: any, req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const reqId = req.requestId;
  logger.error('express.unhandled_error', 'Unhandled error caught in Express error middleware', reqId, {
    error: err?.message || err,
    path: req.path,
    method: req.method,
  });
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: IS_PROD ? 'An internal server error occurred.' : (err.message || 'Server error'),
    ...(reqId ? { requestId: reqId } : {}),
  });
});

// Process-Level Exception Handlers
process.on('uncaughtException', (err: Error) => {
  logger.error('process.uncaught_exception', 'Uncaught exception in process', undefined, { error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('process.unhandled_rejection', 'Unhandled promise rejection in process', undefined, { reason: reason?.message || reason });
});

const IS_NETLIFY = process.env.NETLIFY === 'true' || process.env.NETLIFY_DEV === 'true' || !!process.env.LAMBDA_TASK_ROOT;

if (!IS_NETLIFY) {
  // Start Production Server
  const server = app.listen(PORT, () => {
    logger.info('server.startup', `🚀 NOTIQ AI V52.0 Production Backend listening on port ${PORT}`, undefined, { port: PORT, env: process.env.NODE_ENV });
  });

  // Graceful Shutdown Operations
  async function gracefulShutdown(signal: string) {
    logger.info('server.shutdown', `🛑 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        logger.info('server.shutdown', '✅ Database connection pool closed safely.');
        process.exit(0);
      } catch (err: any) {
        logger.error('server.shutdown_error', 'Error during database disconnect', undefined, { error: err?.message });
        process.exit(1);
      }
    });
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default app;

