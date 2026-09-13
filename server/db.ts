import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Global Singleton Instance of Prisma Client for Production Connection Pooling
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function initSqlitePragmas(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
  if (!dbUrl.startsWith('file:')) {
    return;
  }
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$queryRawUnsafe('PRAGMA foreign_keys = ON;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
    logger.info('db.pragmas', 'SQLite WAL and integrity pragmas initialized successfully.');
  } catch (err: any) {
    logger.warn('db.pragmas_warning', 'Failed to execute SQLite pragmas', undefined, { error: err?.message });
  }
}
initSqlitePragmas();

const DB_FILE = path.join(process.cwd(), 'notiq_cloud_database.json');
const AES_SECRET = process.env.VAULT_AES_KEY || 'notiq_ai_aes_256_secret_key_32_bytes_long_prod!';

export interface DBUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar: string;
  passwordHash: string;
  salt: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  isDeactivated?: boolean;
  otpCode?: string;
  otpExpiresAt?: number;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
}

export interface DBUserProfile {
  userId: string;
  college?: string;
  course?: string;
  semester?: string;
  academicYear?: string;
  classGrade?: string;
  userType?: string;
  subjectsJson?: string;
  learningGoals?: string;
  preferredLanguage: string;
  theme: string;
  streak: number;
  studyGoal: number;
  timezone: string;
  xp: number;
  level: number;
}

export interface DBOtpVerification {
  id: string;
  userId?: string;
  email?: string;
  phone?: string;
  otpCode: string;
  expiresAt: number;
  verified: boolean;
  createdAt: string;
}

export interface DBUserSession {
  id: string;
  userId: string;
  refreshToken: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  expiresAt: number;
  createdAt: string;
}

export interface DBWorkspace {
  id: string;
  userId: string;
  workspaceName: string;
  description?: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBStickyNote {
  id: string;
  summaryId?: string;
  workspaceId: string;
  userId: string;
  title: string;
  summaryText: string;
  bullets: string[];
  keywords: string[];
  topic: string;
  pageNumber: string;
  priority: string;
  color: string;
  pinned: boolean;
  rotation: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBVaultNote {
  id: string;
  userId: string;
  title: string;
  isLocked: boolean;
  lockType: string;
  encryptedContent: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBAiChatHistory {
  id: string;
  workspaceId: string;
  userId: string;
  sender: 'user' | 'assistant';
  message: string;
  response?: string;
  timestamp: string;
}

export interface DBFlashcard {
  id: string;
  userId: string;
  workspaceId: string;
  stickyId?: string;
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  mastered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DBQuiz {
  id: string;
  userId: string;
  workspaceId: string;
  question: string;
  options: string[];
  correctAnswer: number | string;
  explanation?: string;
  marks?: number;
  createdAt: string;
  updatedAt: string;
}

// Security Helpers: Password Hashing & AES-256 Encryption

// Legacy PBKDF2 (1,000 iterations - backwards compatibility for existing user hashes)
export function hashPasswordLegacy(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Production Strong PBKDF2 (210,000 iterations - OWASP recommended minimum for SHA-512)
export function hashPasswordV2(password: string, salt: string): string {
  const rawHash = crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
  return `pbkdf2_210k$${rawHash}`;
}

// Primary hashing function for all NEW registrations & password resets
export function hashPassword(password: string, salt: string): string {
  return hashPasswordV2(password, salt);
}

// Backward-compatible Password Verification with Transparent Rehash Signal
export function verifyPassword(password: string, salt: string, storedHash: string): { valid: boolean; needsRehash: boolean } {
  if (!password || !salt || !storedHash) {
    return { valid: false, needsRehash: false };
  }

  // Strong Hash V2 (210,000 iterations)
  if (storedHash.startsWith('pbkdf2_210k$')) {
    const expected = hashPasswordV2(password, salt);
    try {
      const isValid = crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(expected));
      return { valid: isValid, needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Legacy Hash (1,000 iterations - existing users)
  const legacyComputed = hashPasswordLegacy(password, salt);
  if (legacyComputed.length === storedHash.length) {
    try {
      const isValid = crypto.timingSafeEqual(Buffer.from(legacyComputed), Buffer.from(storedHash));
      return { valid: isValid, needsRehash: isValid };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  return { valid: false, needsRehash: false };
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function encryptAES256(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(AES_SECRET.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptAES256(encryptedText: string): string {
  try {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(AES_SECRET.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText;
  }
}

// Helper Mappers for DB -> DBInterface
function mapUser(u: any): DBUser {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone || undefined,
    avatar: u.avatar || '🎓',
    passwordHash: u.passwordHash,
    salt: u.salt,
    emailVerified: u.emailVerified,
    phoneVerified: u.phoneVerified,
    isDeactivated: !!u.isDeactivated,
    otpCode: u.otpCode || undefined,
    otpExpiresAt: u.otpExpiresAt ? Number(u.otpExpiresAt) : undefined,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString(),
    lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date().toISOString(),
  };
}

function mapWorkspace(w: any): DBWorkspace {
  return {
    id: w.id,
    userId: w.userId,
    workspaceName: w.workspaceName,
    description: w.description || '',
    icon: w.icon || '📚',
    createdAt: w.createdAt ? new Date(w.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: w.updatedAt ? new Date(w.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapSticky(s: any): DBStickyNote {
  let bullets: string[] = [];
  let keywords: string[] = [];
  try { bullets = JSON.parse(s.bulletsJson || '[]'); } catch {}
  try { keywords = JSON.parse(s.keywordsJson || '[]'); } catch {}

  return {
    id: s.id,
    summaryId: s.summaryId || undefined,
    workspaceId: s.workspaceId,
    userId: s.userId,
    title: s.title,
    summaryText: s.summaryText,
    bullets,
    keywords,
    topic: s.topic || 'General Concepts',
    pageNumber: s.pageNumber || '1',
    priority: s.priority || 'medium',
    color: s.color || 'purple',
    pinned: !!s.pinned,
    rotation: s.rotation || 0,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapFlashcard(f: any): DBFlashcard {
  return {
    id: f.id,
    userId: f.userId,
    workspaceId: f.workspaceId,
    stickyId: f.stickyId || undefined,
    question: f.question,
    answer: f.answer,
    difficulty: (f.difficulty as any) || 'medium',
    mastered: !!f.mastered,
    createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapQuiz(q: any): DBQuiz {
  let options: string[] = [];
  try { options = JSON.parse(q.optionsJson || '[]'); } catch {}
  let parsedAns: number | string = q.correctAnswer;
  if (!isNaN(Number(q.correctAnswer))) {
    parsedAns = Number(q.correctAnswer);
  }

  return {
    id: q.id,
    userId: q.userId,
    workspaceId: q.workspaceId,
    question: q.question,
    options,
    correctAnswer: parsedAns,
    explanation: q.explanation || '',
    marks: q.marks || 1,
    createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: q.updatedAt ? new Date(q.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapVault(v: any): DBVaultNote {
  return {
    id: v.id,
    userId: v.userId,
    title: v.title,
    isLocked: !!v.isLocked,
    lockType: v.lockType || 'PIN',
    encryptedContent: v.encryptedContent,
    category: v.category || 'Personal',
    createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapChat(c: any): DBAiChatHistory {
  return {
    id: c.id,
    workspaceId: c.workspaceId,
    userId: c.userId,
    sender: c.sender as 'user' | 'assistant',
    message: c.message,
    response: c.response || undefined,
    timestamp: c.timestamp ? new Date(c.timestamp).toISOString() : new Date().toISOString(),
  };
}

export const dbService = {
  // User Management
  async findUserByEmail(email: string): Promise<DBUser | undefined> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return user ? mapUser(user) : undefined;
  },

  async findUserByPhone(phone: string): Promise<DBUser | undefined> {
    const user = await prisma.user.findFirst({
      where: { phone: phone.trim() },
    });
    return user ? mapUser(user) : undefined;
  },

  async findUserById(id: string): Promise<DBUser | undefined> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? mapUser(user) : undefined;
  },

  async createUser(user: DBUser, profile: DBUserProfile): Promise<DBUser> {
    const createdUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email.toLowerCase().trim(),
          phone: user.phone ? user.phone.trim() : null,
          avatar: user.avatar || '🎓',
          passwordHash: user.passwordHash,
          salt: user.salt,
          emailVerified: user.emailVerified,
          phoneVerified: !!user.phoneVerified,
          otpCode: user.otpCode || null,
          otpExpiresAt: user.otpExpiresAt ? user.otpExpiresAt : null,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          college: profile.college || null,
          course: profile.course || null,
          semester: profile.semester || null,
          preferredLanguage: profile.preferredLanguage || 'auto',
          theme: profile.theme || 'dark',
          streak: profile.streak || 0,
          studyGoal: profile.studyGoal || 30,
          timezone: profile.timezone || 'UTC',
          xp: profile.xp || 0,
          level: profile.level || 1,
        },
      });

      // Default Workspace for new user
      await tx.workspace.create({
        data: {
          id: `ws-${user.id}-default`,
          userId: user.id,
          workspaceName: 'General Study Workspace',
          description: 'Default workspace for notes, flashcards, and quizzes.',
          icon: '📚',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return u;
    });

    return mapUser(createdUser);
  },

  async updateUser(id: string, updates: Partial<DBUser>): Promise<DBUser | undefined> {
    const dataToUpdate: any = {};
    if (updates.fullName !== undefined) dataToUpdate.fullName = updates.fullName;
    if (updates.email !== undefined) dataToUpdate.email = updates.email.toLowerCase().trim();
    if (updates.phone !== undefined) dataToUpdate.phone = updates.phone;
    if (updates.avatar !== undefined) dataToUpdate.avatar = updates.avatar;
    if (updates.passwordHash !== undefined) dataToUpdate.passwordHash = updates.passwordHash;
    if (updates.salt !== undefined) dataToUpdate.salt = updates.salt;
    if (updates.emailVerified !== undefined) dataToUpdate.emailVerified = updates.emailVerified;
    if (updates.phoneVerified !== undefined) dataToUpdate.phoneVerified = updates.phoneVerified;
    if ('otpCode' in updates) dataToUpdate.otpCode = updates.otpCode || null;
    if ('otpExpiresAt' in updates) dataToUpdate.otpExpiresAt = updates.otpExpiresAt || null;
    if (updates.lastLogin !== undefined) dataToUpdate.lastLogin = new Date(updates.lastLogin);
    dataToUpdate.updatedAt = new Date();

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
    return updated ? mapUser(updated) : undefined;
  },

  async resetUserPassword(userId: string, passwordHash: string, salt: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          salt,
          emailVerified: true,
          otpCode: null,
          otpExpiresAt: null,
          updatedAt: new Date(),
        },
      });
      await tx.session.deleteMany({
        where: { userId },
      });
    });
  },

  // Profile Management
  async getUserProfile(userId: string): Promise<DBUserProfile | undefined> {
    const p = await prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!p) return undefined;
    return {
      userId: p.userId,
      college: p.college || undefined,
      course: p.course || undefined,
      semester: p.semester || undefined,
      academicYear: p.academicYear || undefined,
      classGrade: p.classGrade || undefined,
      userType: p.userType || 'Student',
      subjectsJson: p.subjectsJson || '[]',
      learningGoals: p.learningGoals || undefined,
      preferredLanguage: p.preferredLanguage,
      theme: p.theme,
      streak: p.streak,
      studyGoal: p.studyGoal,
      timezone: p.timezone,
      xp: p.xp,
      level: p.level,
    };
  },

  async updateUserProfile(userId: string, updates: Partial<DBUserProfile>): Promise<DBUserProfile | undefined> {
    const updated = await prisma.userProfile.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        college: updates.college || null,
        course: updates.course || null,
        semester: updates.semester || null,
        academicYear: updates.academicYear || null,
        classGrade: updates.classGrade || null,
        userType: updates.userType || 'Student',
        subjectsJson: updates.subjectsJson || '[]',
        learningGoals: updates.learningGoals || null,
        preferredLanguage: updates.preferredLanguage || 'auto',
        theme: updates.theme || 'dark',
        streak: updates.streak || 0,
        studyGoal: updates.studyGoal || 30,
        timezone: updates.timezone || 'UTC',
        xp: updates.xp || 0,
        level: updates.level || 1,
      },
    });

    return {
      userId: updated.userId,
      college: updated.college || undefined,
      course: updated.course || undefined,
      semester: updated.semester || undefined,
      academicYear: updated.academicYear || undefined,
      classGrade: updated.classGrade || undefined,
      userType: updated.userType || 'Student',
      subjectsJson: updated.subjectsJson || '[]',
      learningGoals: updated.learningGoals || undefined,
      preferredLanguage: updated.preferredLanguage,
      theme: updated.theme,
      streak: updated.streak,
      studyGoal: updated.studyGoal,
      timezone: updated.timezone,
      xp: updated.xp,
      level: updated.level,
    };
  },

  // OTP Management
  async createOtp(email?: string, phone?: string): Promise<DBOtpVerification> {
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 MINUTES (300 SECONDS) TTL
    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const cleanPhone = phone ? phone.trim() : undefined;

    // Invalidate any previous active/unverified OTPs for this email address immediately
    if (cleanEmail) {
      await prisma.otpVerification.updateMany({
        where: { email: cleanEmail, verified: false },
        data: { verified: true },
      });
    }

    const id = `otp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const created = await prisma.otpVerification.create({
      data: {
        id,
        email: cleanEmail || null,
        phone: cleanPhone || null,
        otpCode,
        expiresAt,
        verified: false,
      },
    });

    return {
      id: created.id,
      email: created.email || undefined,
      phone: created.phone || undefined,
      otpCode: created.otpCode,
      expiresAt: Number(created.expiresAt),
      verified: created.verified,
      createdAt: created.createdAt.toISOString(),
    };
  },

  async verifyOtp(otpInput: string, email?: string, phone?: string): Promise<boolean> {
    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const cleanPhone = phone ? phone.trim() : undefined;
    const now = Date.now();

    const record = await prisma.otpVerification.findFirst({
      where: {
        otpCode: otpInput.trim(),
        verified: false,
        expiresAt: { gte: now },
        ...(cleanEmail ? { email: cleanEmail } : {}),
        ...(cleanPhone ? { phone: cleanPhone } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return false;

    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return true;
  },

  async deactivateUserAccount(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isDeactivated: true, updatedAt: new Date() },
      });
      await tx.session.deleteMany({
        where: { userId },
      });
    });
  },

  async reactivateUserAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isDeactivated: false, updatedAt: new Date() },
    });
  },

  async deleteUserAccountPermanently(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.aiChatHistory.deleteMany({ where: { userId } });
      await tx.vaultNote.deleteMany({ where: { userId } });
      await tx.quiz.deleteMany({ where: { userId } });
      await tx.flashcard.deleteMany({ where: { userId } });
      await tx.stickyNote.deleteMany({ where: { userId } });
      await tx.workspace.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.otpVerification.deleteMany({ where: { userId } });
      await tx.userProfile.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  },

  // Session Management
  async createSession(userId: string, refreshToken: string, deviceName = 'Browser', deviceType = 'Desktop', ipAddress = '127.0.0.1'): Promise<DBUserSession> {
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const id = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const session = await prisma.session.upsert({
      where: { refreshToken },
      update: { expiresAt },
      create: {
        id,
        userId,
        refreshToken,
        deviceName,
        deviceType,
        ipAddress,
        expiresAt,
      },
    });

    return {
      id: session.id,
      userId: session.userId,
      refreshToken: session.refreshToken,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      ipAddress: session.ipAddress,
      expiresAt: Number(session.expiresAt),
      createdAt: session.createdAt.toISOString(),
    };
  },

  async findSessionByRefreshToken(refreshToken: string): Promise<DBUserSession | undefined> {
    const s = await prisma.session.findUnique({
      where: { refreshToken },
    });
    if (!s) return undefined;
    return {
      id: s.id,
      userId: s.userId,
      refreshToken: s.refreshToken,
      deviceName: s.deviceName,
      deviceType: s.deviceType,
      ipAddress: s.ipAddress,
      expiresAt: Number(s.expiresAt),
      createdAt: s.createdAt.toISOString(),
    };
  },

  async revokeUserSessions(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { userId, refreshToken },
      });
    } else {
      await prisma.session.deleteMany({
        where: { userId },
      });
    }
  },

  // Workspace Operations
  async getUserWorkspaces(userId: string): Promise<DBWorkspace[]> {
    const list = await prisma.workspace.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return list.map(mapWorkspace);
  },

  async getWorkspaceById(workspaceId: string, userId: string): Promise<DBWorkspace | undefined> {
    const w = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });
    return w ? mapWorkspace(w) : undefined;
  },

  async createWorkspace(workspace: DBWorkspace): Promise<DBWorkspace> {
    const created = await prisma.workspace.create({
      data: {
        id: workspace.id,
        userId: workspace.userId,
        workspaceName: workspace.workspaceName,
        description: workspace.description || '',
        icon: workspace.icon || '📚',
        createdAt: workspace.createdAt ? new Date(workspace.createdAt) : new Date(),
        updatedAt: new Date(),
      },
    });
    return mapWorkspace(created);
  },

  async updateWorkspace(workspaceId: string, userId: string, updates: Partial<DBWorkspace>): Promise<DBWorkspace | undefined> {
    const existing = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });
    if (!existing) return undefined;

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        workspaceName: updates.workspaceName !== undefined ? updates.workspaceName : existing.workspaceName,
        description: updates.description !== undefined ? updates.description : existing.description,
        icon: updates.icon !== undefined ? updates.icon : existing.icon,
        updatedAt: new Date(),
      },
    });
    return mapWorkspace(updated);
  },

  async deleteWorkspace(workspaceId: string, userId: string): Promise<boolean> {
    const existing = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });
    if (!existing) return false;

    await prisma.$transaction(async (tx) => {
      await tx.stickyNote.deleteMany({ where: { workspaceId } });
      await tx.flashcard.deleteMany({ where: { workspaceId } });
      await tx.quiz.deleteMany({ where: { workspaceId } });
      await tx.aiChatHistory.deleteMany({ where: { workspaceId } });
      await tx.workspace.delete({ where: { id: workspaceId } });
    });
    return true;
  },

  // Sticky Note Operations
  async getStickyNotes(userId: string, workspaceId?: string): Promise<DBStickyNote[]> {
    const list = await prisma.stickyNote.findMany({
      where: {
        userId,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(mapSticky);
  },

  async getStickyNoteById(noteId: string, userId: string): Promise<DBStickyNote | undefined> {
    const s = await prisma.stickyNote.findFirst({
      where: { id: noteId, userId },
    });
    return s ? mapSticky(s) : undefined;
  },

  async saveStickyNote(note: DBStickyNote): Promise<DBStickyNote> {
    const bulletsJson = JSON.stringify(note.bullets || []);
    const keywordsJson = JSON.stringify(note.keywords || []);

    const saved = await prisma.stickyNote.upsert({
      where: { id: note.id },
      update: {
        title: note.title,
        summaryText: note.summaryText,
        bulletsJson,
        keywordsJson,
        topic: note.topic || 'General Concepts',
        pageNumber: String(note.pageNumber || '1'),
        priority: note.priority || 'medium',
        color: note.color || 'purple',
        pinned: !!note.pinned,
        rotation: note.rotation || 0,
        updatedAt: new Date(),
      },
      create: {
        id: note.id,
        summaryId: note.summaryId || null,
        workspaceId: note.workspaceId,
        userId: note.userId,
        title: note.title,
        summaryText: note.summaryText,
        bulletsJson,
        keywordsJson,
        topic: note.topic || 'General Concepts',
        pageNumber: String(note.pageNumber || '1'),
        priority: note.priority || 'medium',
        color: note.color || 'purple',
        pinned: !!note.pinned,
        rotation: note.rotation || 0,
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        updatedAt: new Date(),
      },
    });

    return mapSticky(saved);
  },

  async deleteStickyNote(noteId: string, userId: string): Promise<boolean> {
    const existing = await prisma.stickyNote.findFirst({
      where: { id: noteId, userId },
    });
    if (!existing) return false;

    await prisma.stickyNote.delete({
      where: { id: noteId },
    });
    return true;
  },

  // Flashcard Operations
  async getFlashcards(userId: string, workspaceId?: string): Promise<DBFlashcard[]> {
    const list = await prisma.flashcard.findMany({
      where: {
        userId,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(mapFlashcard);
  },

  async saveFlashcard(flashcard: DBFlashcard): Promise<DBFlashcard> {
    const saved = await prisma.flashcard.upsert({
      where: { id: flashcard.id },
      update: {
        question: flashcard.question,
        answer: flashcard.answer,
        difficulty: flashcard.difficulty || 'medium',
        mastered: !!flashcard.mastered,
        updatedAt: new Date(),
      },
      create: {
        id: flashcard.id,
        userId: flashcard.userId,
        workspaceId: flashcard.workspaceId,
        stickyId: flashcard.stickyId || null,
        question: flashcard.question,
        answer: flashcard.answer,
        difficulty: flashcard.difficulty || 'medium',
        mastered: !!flashcard.mastered,
        createdAt: flashcard.createdAt ? new Date(flashcard.createdAt) : new Date(),
        updatedAt: new Date(),
      },
    });

    return mapFlashcard(saved);
  },

  async deleteFlashcard(flashcardId: string, userId: string): Promise<boolean> {
    const existing = await prisma.flashcard.findFirst({
      where: { id: flashcardId, userId },
    });
    if (!existing) return false;

    await prisma.flashcard.delete({
      where: { id: flashcardId },
    });
    return true;
  },

  // Quiz Operations
  async getQuizzes(userId: string, workspaceId?: string): Promise<DBQuiz[]> {
    const list = await prisma.quiz.findMany({
      where: {
        userId,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(mapQuiz);
  },

  async saveQuiz(quiz: DBQuiz): Promise<DBQuiz> {
    const optionsJson = JSON.stringify(quiz.options || []);

    const saved = await prisma.quiz.upsert({
      where: { id: quiz.id },
      update: {
        question: quiz.question,
        optionsJson,
        correctAnswer: String(quiz.correctAnswer ?? 0),
        explanation: quiz.explanation || '',
        marks: quiz.marks || 1,
        updatedAt: new Date(),
      },
      create: {
        id: quiz.id,
        userId: quiz.userId,
        workspaceId: quiz.workspaceId,
        question: quiz.question,
        optionsJson,
        correctAnswer: String(quiz.correctAnswer ?? 0),
        explanation: quiz.explanation || '',
        marks: quiz.marks || 1,
        createdAt: quiz.createdAt ? new Date(quiz.createdAt) : new Date(),
        updatedAt: new Date(),
      },
    });

    return mapQuiz(saved);
  },

  async deleteQuiz(quizId: string, userId: string): Promise<boolean> {
    const existing = await prisma.quiz.findFirst({
      where: { id: quizId, userId },
    });
    if (!existing) return false;

    await prisma.quiz.delete({
      where: { id: quizId },
    });
    return true;
  },

  // Vault Operations
  async getVaultNotes(userId: string): Promise<DBVaultNote[]> {
    const list = await prisma.vaultNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(mapVault);
  },

  async getVaultNoteById(noteId: string, userId: string): Promise<DBVaultNote | undefined> {
    const v = await prisma.vaultNote.findFirst({
      where: { id: noteId, userId },
    });
    return v ? mapVault(v) : undefined;
  },

  async createVaultNote(userId: string, title: string, content: string, category = 'Personal', lockType = 'PIN'): Promise<DBVaultNote> {
    const encryptedContent = encryptAES256(content);
    const id = `vault-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const created = await prisma.vaultNote.create({
      data: {
        id,
        userId,
        title,
        isLocked: true,
        lockType,
        encryptedContent,
        category,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return mapVault(created);
  },

  async saveVaultNote(note: DBVaultNote): Promise<DBVaultNote> {
    const saved = await prisma.vaultNote.upsert({
      where: { id: note.id },
      update: {
        title: note.title,
        isLocked: !!note.isLocked,
        lockType: note.lockType || 'PIN',
        encryptedContent: note.encryptedContent,
        category: note.category || 'Personal',
        updatedAt: new Date(),
      },
      create: {
        id: note.id,
        userId: note.userId,
        title: note.title,
        isLocked: !!note.isLocked,
        lockType: note.lockType || 'PIN',
        encryptedContent: note.encryptedContent,
        category: note.category || 'Personal',
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        updatedAt: new Date(),
      },
    });

    return mapVault(saved);
  },

  async deleteVaultNote(noteId: string, userId: string): Promise<boolean> {
    const existing = await prisma.vaultNote.findFirst({
      where: { id: noteId, userId },
    });
    if (!existing) return false;

    await prisma.vaultNote.delete({
      where: { id: noteId },
    });
    return true;
  },

  // AI Chat History Operations
  async getChatHistory(userId: string, workspaceId: string): Promise<DBAiChatHistory[]> {
    const list = await prisma.aiChatHistory.findMany({
      where: { userId, workspaceId },
      orderBy: { timestamp: 'asc' },
    });
    return list.map(mapChat);
  },

  async saveChatMessage(chatItem: DBAiChatHistory): Promise<DBAiChatHistory> {
    const saved = await prisma.aiChatHistory.create({
      data: {
        id: chatItem.id,
        userId: chatItem.userId,
        workspaceId: chatItem.workspaceId,
        sender: chatItem.sender,
        message: chatItem.message,
        response: chatItem.response || null,
        timestamp: chatItem.timestamp ? new Date(chatItem.timestamp) : new Date(),
      },
    });

    return mapChat(saved);
  },

  // LocalStorage Data Migration
  async migrateUserData(userId: string, payload: any): Promise<{ status: string; stats: any; workspaceMap: Record<string, string> }> {
    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const workspaceMap: Record<string, string> = {};

    const userWorkspaces = await prisma.workspace.findMany({ where: { userId } });
    const defaultWsId = userWorkspaces[0]?.id || `ws-${userId}-default`;

    // 1. Workspaces
    if (Array.isArray(payload?.workspaces)) {
      for (const rawWs of payload.workspaces) {
        try {
          if (!rawWs || typeof rawWs !== 'object' || !rawWs.workspaceName) { skippedCount++; continue; }
          const existing = userWorkspaces.find(w => w.workspaceName.toLowerCase() === rawWs.workspaceName.toLowerCase());
          if (existing) {
            workspaceMap[rawWs.id || existing.id] = existing.id;
            skippedCount++;
          } else {
            const newWsId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            await prisma.workspace.create({
              data: {
                id: newWsId,
                userId,
                workspaceName: rawWs.workspaceName,
                description: rawWs.description || '',
                icon: rawWs.icon || '📚',
                createdAt: rawWs.createdAt ? new Date(rawWs.createdAt) : new Date(),
                updatedAt: new Date(),
              },
            });
            workspaceMap[rawWs.id || newWsId] = newWsId;
            migratedCount++;
          }
        } catch {
          failedCount++;
        }
      }
    }

    // 2. Sticky Notes
    if (Array.isArray(payload?.stickyNotes)) {
      for (const rawNote of payload.stickyNotes) {
        try {
          if (!rawNote || typeof rawNote !== 'object') { skippedCount++; continue; }
          const noteId = rawNote.id || `sticky-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const title = rawNote.title || 'Untitled Note';
          const summary = rawNote.summary || rawNote.summaryText || '';

          const existing = await prisma.stickyNote.findFirst({
            where: {
              userId,
              OR: [{ id: noteId }, { title, summaryText: summary }],
            },
          });

          if (existing) {
            skippedCount++;
          } else {
          const rawWs = rawNote.workspaceId;
          let mappedWs = (rawWs && workspaceMap[rawWs]) ? workspaceMap[rawWs] : rawWs;
          if (!mappedWs || !userWorkspaces.some(w => w.id === mappedWs)) {
            mappedWs = defaultWsId;
          }
          await prisma.stickyNote.create({
            data: {
              id: noteId,
              userId,
              workspaceId: mappedWs,
              title,
              summaryText: summary,
              bulletsJson: JSON.stringify(Array.isArray(rawNote.bullets) ? rawNote.bullets : []),
              keywordsJson: JSON.stringify(Array.isArray(rawNote.keywords) ? rawNote.keywords : []),
              topic: rawNote.topic || 'General Concepts',
              pageNumber: String(rawNote.pageNumber || '1'),
              priority: rawNote.priority || 'medium',
              color: rawNote.color || 'purple',
              pinned: !!rawNote.pinned,
              rotation: rawNote.rotation || 0,
              createdAt: rawNote.createdAt ? new Date(rawNote.createdAt) : new Date(),
              updatedAt: new Date(),
            },
          });
          migratedCount++;
          }
        } catch {
          failedCount++;
        }
      }
    }

    // 3. Flashcards
    if (Array.isArray(payload?.flashcards)) {
      for (const rawFc of payload.flashcards) {
        try {
          if (!rawFc || typeof rawFc !== 'object' || !rawFc.question || !rawFc.answer) { skippedCount++; continue; }
          const fcId = rawFc.id || `fc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

          const existing = await prisma.flashcard.findFirst({
            where: {
              userId,
              OR: [{ id: fcId }, { question: rawFc.question, answer: rawFc.answer }],
            },
          });

          if (existing) {
            skippedCount++;
          } else {
            const rawWs = rawFc.workspaceId;
            let mappedWs = (rawWs && workspaceMap[rawWs]) ? workspaceMap[rawWs] : rawWs;
            if (!mappedWs || !userWorkspaces.some(w => w.id === mappedWs)) {
              mappedWs = defaultWsId;
            }
            await prisma.flashcard.create({
              data: {
                id: fcId,
                userId,
                workspaceId: mappedWs,
                stickyId: rawFc.stickyId || null,
                question: rawFc.question,
                answer: rawFc.answer,
                difficulty: rawFc.difficulty || 'medium',
                mastered: !!rawFc.mastered,
                createdAt: rawFc.createdAt ? new Date(rawFc.createdAt) : new Date(),
                updatedAt: new Date(),
              },
            });
            migratedCount++;
          }
        } catch {
          failedCount++;
        }
      }
    }

    // 4. Quizzes
    if (Array.isArray(payload?.quizzes)) {
      for (const rawQ of payload.quizzes) {
        try {
          if (!rawQ || typeof rawQ !== 'object' || !rawQ.question || !Array.isArray(rawQ.options)) { skippedCount++; continue; }
          const quizId = rawQ.id || `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

          const existing = await prisma.quiz.findFirst({
            where: {
              userId,
              OR: [{ id: quizId }, { question: rawQ.question }],
            },
          });

          if (existing) {
            skippedCount++;
          } else {
            const rawWs = rawQ.workspaceId;
            let mappedWs = (rawWs && workspaceMap[rawWs]) ? workspaceMap[rawWs] : rawWs;
            if (!mappedWs || !userWorkspaces.some(w => w.id === mappedWs)) {
              mappedWs = defaultWsId;
            }
            await prisma.quiz.create({
              data: {
                id: quizId,
                userId,
                workspaceId: mappedWs,
                question: rawQ.question,
                optionsJson: JSON.stringify(rawQ.options),
                correctAnswer: String(rawQ.correctAnswer ?? 0),
                explanation: rawQ.explanation || '',
                marks: rawQ.marks || 1,
                createdAt: rawQ.createdAt ? new Date(rawQ.createdAt) : new Date(),
                updatedAt: new Date(),
              },
            });
            migratedCount++;
          }
        } catch {
          failedCount++;
        }
      }
    }

    // 5. Vault Notes
    if (Array.isArray(payload?.vaultNotes)) {
      for (const rawV of payload.vaultNotes) {
        try {
          if (!rawV || typeof rawV !== 'object' || !rawV.title) { skippedCount++; continue; }
          const vId = rawV.id || `vault-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

          const existing = await prisma.vaultNote.findFirst({
            where: {
              userId,
              OR: [{ id: vId }, { title: rawV.title }],
            },
          });

          if (existing) {
            skippedCount++;
          } else {
            await prisma.vaultNote.create({
              data: {
                id: vId,
                userId,
                title: rawV.title,
                isLocked: true,
                lockType: rawV.lockType || 'PIN',
                encryptedContent: rawV.encryptedContent || encryptAES256(rawV.content || ''),
                category: rawV.category || 'Personal',
                createdAt: rawV.createdAt ? new Date(rawV.createdAt) : new Date(),
                updatedAt: new Date(),
              },
            });
            migratedCount++;
          }
        } catch {
          failedCount++;
        }
      }
    }

    // 6. AI Chat History
    if (Array.isArray(payload?.chatHistory)) {
      for (const rawC of payload.chatHistory) {
        try {
          if (!rawC || typeof rawC !== 'object' || !rawC.message) { skippedCount++; continue; }
          const cId = rawC.id || `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

          const existing = await prisma.aiChatHistory.findFirst({
            where: {
              userId,
              OR: [{ id: cId }, { message: rawC.message }],
            },
          });

          if (existing) {
            skippedCount++;
          } else {
            const rawWs = rawC.workspaceId;
            const mappedWs = (rawWs && workspaceMap[rawWs]) ? workspaceMap[rawWs] : (rawWs || defaultWsId);
            await prisma.aiChatHistory.create({
              data: {
                id: cId,
                userId,
                workspaceId: mappedWs,
                sender: rawC.sender || 'user',
                message: rawC.message,
                response: rawC.response || null,
                timestamp: rawC.timestamp ? new Date(rawC.timestamp) : new Date(),
              },
            });
            migratedCount++;
          }
        } catch {
          failedCount++;
        }
      }
    }

    const status = failedCount > 0 ? 'PARTIALLY_COMPLETED' : 'COMPLETED';
    return {
      status,
      stats: {
        totalProcessed: migratedCount + skippedCount + failedCount,
        migratedCount,
        skippedCount,
        failedCount,
      },
      workspaceMap,
    };
  },
};

// Automatic JSON Store -> Production Database Migration on Boot
export async function migrateJsonToDatabase(): Promise<{ success: boolean; migrated: number }> {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { success: true, migrated: 0 };
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const jsonDB = JSON.parse(raw);
    let count = 0;

    // Migrate Users & Profiles
    if (Array.isArray(jsonDB.users)) {
      for (const u of jsonDB.users) {
        const existing = await prisma.user.findUnique({ where: { id: u.id } });
        if (!existing) {
          const profile = jsonDB.profiles?.[u.id] || {};
          await dbService.createUser(u, profile);
          count++;
        }
      }
    }

    // Migrate Workspaces
    if (Array.isArray(jsonDB.workspaces)) {
      for (const w of jsonDB.workspaces) {
        const existing = await prisma.workspace.findUnique({ where: { id: w.id } });
        if (!existing) {
          await dbService.createWorkspace(w);
          count++;
        }
      }
    }

    // Migrate Sticky Notes
    if (Array.isArray(jsonDB.stickyNotes)) {
      for (const s of jsonDB.stickyNotes) {
        const existing = await prisma.stickyNote.findUnique({ where: { id: s.id } });
        if (!existing) {
          await dbService.saveStickyNote(s);
          count++;
        }
      }
    }

    // Migrate Flashcards
    if (Array.isArray(jsonDB.flashcards)) {
      for (const f of jsonDB.flashcards) {
        const existing = await prisma.flashcard.findUnique({ where: { id: f.id } });
        if (!existing) {
          await dbService.saveFlashcard(f);
          count++;
        }
      }
    }

    // Migrate Quizzes
    if (Array.isArray(jsonDB.quizzes)) {
      for (const q of jsonDB.quizzes) {
        const existing = await prisma.quiz.findUnique({ where: { id: q.id } });
        if (!existing) {
          await dbService.saveQuiz(q);
          count++;
        }
      }
    }

    // Migrate Vault Notes
    if (Array.isArray(jsonDB.vaultNotes)) {
      for (const v of jsonDB.vaultNotes) {
        const existing = await prisma.vaultNote.findUnique({ where: { id: v.id } });
        if (!existing) {
          await dbService.saveVaultNote(v);
          count++;
        }
      }
    }

    // Migrate Chat History
    if (Array.isArray(jsonDB.chatHistory)) {
      for (const c of jsonDB.chatHistory) {
        const existing = await prisma.aiChatHistory.findUnique({ where: { id: c.id } });
        if (!existing) {
          await dbService.saveChatMessage(c);
          count++;
        }
      }
    }

    logger.info('db.bootstrap', `Database Bootstrap: Successfully verified/migrated ${count} pre-existing JSON records into SQLite production DB.`, undefined, { migrated: count });
    return { success: true, migrated: count };
  } catch (err: any) {
    logger.warn('db.bootstrap_warning', 'JSON file migration encountered an exception', undefined, { error: err?.message });
    return { success: false, migrated: 0 };
  }
}

// Boot initial JSON migration asynchronously
migrateJsonToDatabase();
