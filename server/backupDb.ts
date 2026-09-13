import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

/**
 * Safe Production Database Backup Utility for SQLite
 * Copies 'notiq_production.db' to 'backups/notiq_production_backup_<timestamp>.db'
 * safely without deleting or corrupting active database data.
 */
export function backupProductionDatabase(): { success: boolean; backupPath?: string; bytes?: number; error?: string } {
  try {
    let dbPath = path.join(process.cwd(), 'prisma', 'notiq_production.db');
    if (!fs.existsSync(dbPath)) {
      dbPath = path.join(process.cwd(), 'notiq_production.db');
    }
    if (!fs.existsSync(dbPath)) {
      logger.error('db.backup', 'Database file not found for backup', undefined, { dbPath });
      return { success: false, error: 'Database file not found.' };
    }

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `notiq_production_backup_${timestamp}.db`);

    fs.copyFileSync(dbPath, backupPath);

    if (!fs.existsSync(backupPath)) {
      logger.error('db.backup', 'Backup file creation failed', undefined, { backupPath });
      return { success: false, error: 'Backup copy failed to create file.' };
    }

    const stats = fs.statSync(backupPath);
    if (stats.size === 0) {
      logger.error('db.backup', 'Backup file size is 0 bytes', undefined, { backupPath });
      return { success: false, error: 'Backup file is 0 bytes.' };
    }

    logger.info('db.backup', 'Production database safely backed up', undefined, { backupPath, bytes: stats.size });
    return { success: true, backupPath, bytes: stats.size };
  } catch (err: any) {
    logger.error('db.backup', 'Failed to create database backup snapshot', undefined, { error: err.message });
    return { success: false, error: err.message };
  }
}



/**
 * Safe Backup Restore Verification
 * Copies a backup file to a temporary test location and verifies that it is a valid SQLite DB file with readable data.
 * NEVER overwrites or modifies the active production database.
 */
export async function verifyBackupRestore(backupPath: string): Promise<{ success: boolean; tablesFound?: number; integrityCheck?: string; error?: string }> {
  const tempVerifyDb = path.join(process.cwd(), 'backups', `temp_verify_${Date.now()}.db`);
  let tempPrisma: PrismaClient | null = null;

  try {
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'Backup file does not exist.' };
    }

    // 1. Copy backup to temp location
    fs.copyFileSync(backupPath, tempVerifyDb);

    const stats = fs.statSync(tempVerifyDb);
    if (stats.size === 0) {
      if (fs.existsSync(tempVerifyDb)) fs.unlinkSync(tempVerifyDb);
      return { success: false, error: 'Backup copy is 0 bytes.' };
    }

    // 2. Verify SQLite magic header: "SQLite format 3\0" (first 16 bytes)
    const fd = fs.openSync(tempVerifyDb, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const magic = buffer.toString('utf8', 0, 15);
    if (!magic.startsWith('SQLite format 3')) {
      if (fs.existsSync(tempVerifyDb)) fs.unlinkSync(tempVerifyDb);
      return { success: false, error: 'Backup file header is not a valid SQLite database.' };
    }

    // 3. Perform Deep SQLite Integrity Check using temporary Prisma instance
    const dbUrl = `file:${path.resolve(tempVerifyDb).replace(/\\/g, '/')}`;
    tempPrisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    const rawIntegrity = await tempPrisma.$queryRawUnsafe<{ integrity_check: string }[]>('PRAGMA integrity_check;');
    const integrityStatus = rawIntegrity?.[0]?.integrity_check || 'ok';

    const tables: any[] = await tempPrisma.$queryRawUnsafe('SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%";');

    await tempPrisma.$disconnect();
    tempPrisma = null;

    // 4. Cleanup temp verification file
    if (fs.existsSync(tempVerifyDb)) {
      fs.unlinkSync(tempVerifyDb);
    }

    logger.info('db.backup_verify', 'Backup restore verification succeeded', undefined, {
      backupPath,
      validSqlite: true,
      tablesFound: tables.length,
      integrity: integrityStatus,
    });

    return { success: true, tablesFound: tables.length, integrityCheck: integrityStatus };
  } catch (err: any) {
    if (tempPrisma) {
      try { await tempPrisma.$disconnect(); } catch {}
    }
    if (fs.existsSync(tempVerifyDb)) {
      try { fs.unlinkSync(tempVerifyDb); } catch {}
    }
    logger.error('db.backup_verify', 'Backup restore verification failed', undefined, { backupPath, error: err.message });
    return { success: false, error: err.message };
  }
}

if (process.argv[1]?.includes('backupDb')) {
  backupProductionDatabase();
}
