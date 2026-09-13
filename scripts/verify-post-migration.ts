import { PrismaClient as SqlitePrismaClient } from '@prisma/client';
import { PrismaClient as PostgresPrismaClient } from '@prisma/client-postgres';

const sqliteDb = new SqlitePrismaClient();
const postgresDb = new PostgresPrismaClient();

async function verify() {
  console.log('====================================================');
  console.log('POST-MIGRATION RECORD COUNT & INTEGRITY VERIFICATION');
  console.log('====================================================\n');

  const models = [
    'User',
    'UserProfile',
    'OtpVerification',
    'Session',
    'Workspace',
    'StickyNote',
    'Flashcard',
    'Quiz',
    'VaultNote',
    'AiChatHistory'
  ];

  const sqliteCounts: Record<string, number> = {
    User: await sqliteDb.user.count(),
    UserProfile: await sqliteDb.userProfile.count(),
    OtpVerification: await sqliteDb.otpVerification.count(),
    Session: await sqliteDb.session.count(),
    Workspace: await sqliteDb.workspace.count(),
    StickyNote: await sqliteDb.stickyNote.count(),
    Flashcard: await sqliteDb.flashcard.count(),
    Quiz: await sqliteDb.quiz.count(),
    VaultNote: await sqliteDb.vaultNote.count(),
    AiChatHistory: await sqliteDb.aiChatHistory.count(),
  };

  const postgresCounts: Record<string, number> = {
    User: await postgresDb.user.count(),
    UserProfile: await postgresDb.userProfile.count(),
    OtpVerification: await postgresDb.otpVerification.count(),
    Session: await postgresDb.session.count(),
    Workspace: await postgresDb.workspace.count(),
    StickyNote: await postgresDb.stickyNote.count(),
    Flashcard: await postgresDb.flashcard.count(),
    Quiz: await postgresDb.quiz.count(),
    VaultNote: await postgresDb.vaultNote.count(),
    AiChatHistory: await postgresDb.aiChatHistory.count(),
  };

  console.log('| Model | SQLite Count | Neon Count | Match |');
  console.log('|---|---:|---:|---|');
  let allMatch = true;

  for (const m of models) {
    const s = sqliteCounts[m];
    const p = postgresCounts[m];
    const match = s === p ? 'YES' : 'NO';
    if (s !== p) allMatch = false;
    console.log(`| ${m} | ${s} | ${p} | ${match} |`);
  }

  console.log('\n--- RELATIONSHIP INTEGRITY CHECK ---');

  // User <-> Profile
  const pgProfiles = await postgresDb.userProfile.findMany({ select: { userId: true } });
  const userIds = new Set((await postgresDb.user.findMany({ select: { id: true } })).map(u => u.id));
  const orphanProfiles = pgProfiles.filter(p => !userIds.has(p.userId));
  console.log(`User/Profile relation orphans: ${orphanProfiles.length}`);

  // Workspace <-> User
  const pgWorkspaces = await postgresDb.workspace.findMany({ select: { id: true, userId: true } });
  const workspaceIds = new Set(pgWorkspaces.map(w => w.id));
  const orphanWorkspaces = pgWorkspaces.filter(w => !userIds.has(w.userId));
  console.log(`User/Workspace relation orphans: ${orphanWorkspaces.length}`);

  // StickyNote <-> Workspace
  const pgStickies = await postgresDb.stickyNote.findMany({ select: { id: true, workspaceId: true, userId: true } });
  const orphanStickies = pgStickies.filter(s => !workspaceIds.has(s.workspaceId) || !userIds.has(s.userId));
  console.log(`Workspace/StickyNote relation orphans: ${orphanStickies.length}`);

  // Flashcard <-> Workspace
  const pgFlashcards = await postgresDb.flashcard.findMany({ select: { id: true, workspaceId: true, userId: true } });
  const orphanFlashcards = pgFlashcards.filter(f => !workspaceIds.has(f.workspaceId) || !userIds.has(f.userId));
  console.log(`Workspace/Flashcard relation orphans: ${orphanFlashcards.length}`);

  // Quiz <-> Workspace
  const pgQuizzes = await postgresDb.quiz.findMany({ select: { id: true, workspaceId: true, userId: true } });
  const orphanQuizzes = pgQuizzes.filter(q => !workspaceIds.has(q.workspaceId) || !userIds.has(q.userId));
  console.log(`Workspace/Quiz relation orphans: ${orphanQuizzes.length}`);

  // VaultNote <-> User
  const pgVaults = await postgresDb.vaultNote.findMany({ select: { id: true, userId: true, encryptedContent: true } });
  const orphanVaults = pgVaults.filter(v => !userIds.has(v.userId));
  console.log(`User/VaultNote relation orphans: ${orphanVaults.length}`);

  // AiChatHistory <-> Workspace
  const pgChats = await postgresDb.aiChatHistory.findMany({ select: { id: true, workspaceId: true, userId: true } });
  const orphanChats = pgChats.filter(c => !workspaceIds.has(c.workspaceId) || !userIds.has(c.userId));
  console.log(`Workspace/AI History relation orphans: ${orphanChats.length}`);

  // Session <-> User
  const pgSessions = await postgresDb.session.findMany({ select: { id: true, userId: true } });
  const orphanSessions = pgSessions.filter(s => !userIds.has(s.userId));
  console.log(`User/Session relation orphans: ${orphanSessions.length}`);

  // OtpVerification <-> User
  const pgOtps = await postgresDb.otpVerification.findMany({ select: { id: true, userId: true } });
  const orphanOtps = pgOtps.filter(o => o.userId && !userIds.has(o.userId));
  console.log(`User/OTP relation orphans: ${orphanOtps.length}`);

  // Flashcard <-> StickyNote
  const stickyIds = new Set(pgStickies.map(s => s.id));
  const pgFlashcardsWithSticky = await postgresDb.flashcard.findMany({ where: { stickyId: { not: null } }, select: { id: true, stickyId: true } });
  const orphanFlashcardStickies = pgFlashcardsWithSticky.filter(f => f.stickyId && !stickyIds.has(f.stickyId));
  console.log(`Flashcard/StickyNote relation orphans: ${orphanFlashcardStickies.length}`);

  // Check Encrypted Vault Content Intact
  const sqliteVaults = await sqliteDb.vaultNote.findMany({ select: { id: true, encryptedContent: true } });
  const sqliteVaultMap = new Map(sqliteVaults.map(v => [v.id, v.encryptedContent]));
  let encryptedMatch = true;
  for (const pv of pgVaults) {
    const sv = sqliteVaultMap.get(pv.id);
    if (sv !== pv.encryptedContent) {
      encryptedMatch = false;
      break;
    }
  }
  console.log(`Encrypted Vault Content Byte-for-Byte Match: ${encryptedMatch ? 'YES' : 'NO'}`);

  console.log('\n--- VERIFICATION CONCLUSION ---');
  console.log(`All Model Counts Match: ${allMatch ? 'YES' : 'NO'}`);

  await sqliteDb.$disconnect();
  await postgresDb.$disconnect();
}

verify().catch(async (err) => {
  console.error('Verification error:', err);
  await sqliteDb.$disconnect();
  await postgresDb.$disconnect();
  process.exit(1);
});
