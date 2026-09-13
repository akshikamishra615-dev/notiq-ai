import { PrismaClient as SqlitePrismaClient } from '@prisma/client';
import { PrismaClient as PostgresPrismaClient } from '@prisma/client-postgres';

const sqliteDb = new SqlitePrismaClient();
const postgresDb = new PostgresPrismaClient();

async function runMigration() {
  console.log('====================================================');
  console.log('STARTING FAST & SAFE SQLITE -> NEON DATA MIGRATION');
  console.log('====================================================\n');

  // 1. User (137)
  const users = await sqliteDb.user.findMany();
  console.log(`[1/10] Migrating ${users.length} User records...`);
  if (users.length > 0) {
    await postgresDb.user.createMany({ data: users, skipDuplicates: true });
  }
  const pgUsersCount = await postgresDb.user.count();
  console.log(`[1/10] User migration complete. SQLite: ${users.length} | Neon: ${pgUsersCount}`);

  // 2. UserProfile (137)
  const profiles = await sqliteDb.userProfile.findMany();
  console.log(`[2/10] Migrating ${profiles.length} UserProfile records...`);
  if (profiles.length > 0) {
    await postgresDb.userProfile.createMany({ data: profiles, skipDuplicates: true });
  }
  const pgProfilesCount = await postgresDb.userProfile.count();
  console.log(`[2/10] UserProfile migration complete. SQLite: ${profiles.length} | Neon: ${pgProfilesCount}`);

  // 3. Workspace (196)
  const workspaces = await sqliteDb.workspace.findMany();
  console.log(`[3/10] Migrating ${workspaces.length} Workspace records...`);
  if (workspaces.length > 0) {
    await postgresDb.workspace.createMany({ data: workspaces, skipDuplicates: true });
  }
  const pgWorkspacesCount = await postgresDb.workspace.count();
  console.log(`[3/10] Workspace migration complete. SQLite: ${workspaces.length} | Neon: ${pgWorkspacesCount}`);

  // 4. StickyNote (84)
  const stickyNotes = await sqliteDb.stickyNote.findMany();
  console.log(`[4/10] Migrating ${stickyNotes.length} StickyNote records...`);
  if (stickyNotes.length > 0) {
    await postgresDb.stickyNote.createMany({ data: stickyNotes, skipDuplicates: true });
  }
  const pgStickiesCount = await postgresDb.stickyNote.count();
  console.log(`[4/10] StickyNote migration complete. SQLite: ${stickyNotes.length} | Neon: ${pgStickiesCount}`);

  // 5. Flashcard (26)
  const flashcards = await sqliteDb.flashcard.findMany();
  console.log(`[5/10] Migrating ${flashcards.length} Flashcard records...`);
  if (flashcards.length > 0) {
    await postgresDb.flashcard.createMany({ data: flashcards, skipDuplicates: true });
  }
  const pgFlashcardsCount = await postgresDb.flashcard.count();
  console.log(`[5/10] Flashcard migration complete. SQLite: ${flashcards.length} | Neon: ${pgFlashcardsCount}`);

  // 6. Quiz (26)
  const quizzes = await sqliteDb.quiz.findMany();
  console.log(`[6/10] Migrating ${quizzes.length} Quiz records...`);
  if (quizzes.length > 0) {
    await postgresDb.quiz.createMany({ data: quizzes, skipDuplicates: true });
  }
  const pgQuizzesCount = await postgresDb.quiz.count();
  console.log(`[6/10] Quiz migration complete. SQLite: ${quizzes.length} | Neon: ${pgQuizzesCount}`);

  // 7. VaultNote (30)
  const vaultNotes = await sqliteDb.vaultNote.findMany();
  console.log(`[7/10] Migrating ${vaultNotes.length} VaultNote records...`);
  if (vaultNotes.length > 0) {
    await postgresDb.vaultNote.createMany({ data: vaultNotes, skipDuplicates: true });
  }
  const pgVaultCount = await postgresDb.vaultNote.count();
  console.log(`[7/10] VaultNote migration complete. SQLite: ${vaultNotes.length} | Neon: ${pgVaultCount}`);

  // 8. AiChatHistory (10)
  const chatHistory = await sqliteDb.aiChatHistory.findMany();
  console.log(`[8/10] Migrating ${chatHistory.length} AiChatHistory records...`);
  if (chatHistory.length > 0) {
    await postgresDb.aiChatHistory.createMany({ data: chatHistory, skipDuplicates: true });
  }
  const pgChatCount = await postgresDb.aiChatHistory.count();
  console.log(`[8/10] AiChatHistory migration complete. SQLite: ${chatHistory.length} | Neon: ${pgChatCount}`);

  // 9. Session (96)
  const sessions = await sqliteDb.session.findMany();
  console.log(`[9/10] Migrating ${sessions.length} Session records...`);
  if (sessions.length > 0) {
    await postgresDb.session.createMany({ data: sessions, skipDuplicates: true });
  }
  const pgSessionsCount = await postgresDb.session.count();
  console.log(`[9/10] Session migration complete. SQLite: ${sessions.length} | Neon: ${pgSessionsCount}`);

  // 10. OtpVerification (179)
  const otps = await sqliteDb.otpVerification.findMany();
  console.log(`[10/10] Migrating ${otps.length} OtpVerification records...`);
  if (otps.length > 0) {
    await postgresDb.otpVerification.createMany({ data: otps, skipDuplicates: true });
  }
  const pgOtpsCount = await postgresDb.otpVerification.count();
  console.log(`[10/10] OtpVerification migration complete. SQLite: ${otps.length} | Neon: ${pgOtpsCount}`);

  console.log('\n====================================================');
  console.log('ALL DATA RECORDS MIGRATED TO NEON POSTGRESQL SUCCESSFULLY!');
  console.log('====================================================');

  await sqliteDb.$disconnect();
  await postgresDb.$disconnect();
}

runMigration().catch(async (err) => {
  console.error('\n❌ MIGRATION FAILED:', err.message);
  await sqliteDb.$disconnect();
  await postgresDb.$disconnect();
  process.exit(1);
});
