import { PrismaClient as PostgresPrismaClient } from '@prisma/client-postgres';

const pgPrisma = new PostgresPrismaClient();

async function testCrud() {
  console.log('====================================================');
  console.log('CONTROLLED NEON POSTGRESQL CRUD & CLEANUP TEST');
  console.log('====================================================\n');

  const testUser = await pgPrisma.user.findFirst();
  if (!testUser) throw new Error('No user found for test');

  // 1. Create Temporary Workspace
  const testWsId = `temp-ws-${Date.now()}`;
  const createdWs = await pgPrisma.workspace.create({
    data: {
      id: testWsId,
      userId: testUser.id,
      workspaceName: 'Temporary Migration Test Workspace',
      description: 'Temporary workspace for CRUD validation'
    }
  });
  console.log(`[CRUD PASS] Temporary Workspace Created: ID=${createdWs.id}`);

  // 2. Create Temporary StickyNote
  const testStickyId = `temp-sticky-${Date.now()}`;
  const createdSticky = await pgPrisma.stickyNote.create({
    data: {
      id: testStickyId,
      workspaceId: testWsId,
      userId: testUser.id,
      title: 'Temporary Test Note',
      summaryText: 'This is a temporary test note for CRUD validation.'
    }
  });
  console.log(`[CRUD PASS] Temporary StickyNote Created: ID=${createdSticky.id}`);

  // 3. Create Temporary Flashcard
  const testFcId = `temp-fc-${Date.now()}`;
  const createdFc = await pgPrisma.flashcard.create({
    data: {
      id: testFcId,
      workspaceId: testWsId,
      userId: testUser.id,
      stickyId: testStickyId,
      question: 'Is Neon PostgreSQL CRUD working?',
      answer: 'Yes, perfectly!'
    }
  });
  console.log(`[CRUD PASS] Temporary Flashcard Created: ID=${createdFc.id}`);

  // 4. Create Temporary Quiz
  const testQuizId = `temp-quiz-${Date.now()}`;
  const createdQuiz = await pgPrisma.quiz.create({
    data: {
      id: testQuizId,
      workspaceId: testWsId,
      userId: testUser.id,
      question: 'Test Quiz Question?',
      optionsJson: JSON.stringify(['A', 'B', 'C', 'D']),
      correctAnswer: 'A'
    }
  });
  console.log(`[CRUD PASS] Temporary Quiz Created: ID=${createdQuiz.id}`);

  console.log('\n--- CLEANING UP TEMPORARY TEST RECORDS ---');
  await pgPrisma.quiz.delete({ where: { id: testQuizId } });
  await pgPrisma.flashcard.delete({ where: { id: testFcId } });
  await pgPrisma.stickyNote.delete({ where: { id: testStickyId } });
  await pgPrisma.workspace.delete({ where: { id: testWsId } });
  console.log('[CLEANUP PASS] All temporary test records removed.');

  const finalWsCount = await pgPrisma.workspace.count();
  const finalStickyCount = await pgPrisma.stickyNote.count();
  const finalFcCount = await pgPrisma.flashcard.count();
  const finalQuizCount = await pgPrisma.quiz.count();

  console.log('\n--- FINAL COUNTS VERIFICATION ---');
  console.log(`Workspace Count: ${finalWsCount} (Expected: 196)`);
  console.log(`StickyNote Count: ${finalStickyCount} (Expected: 84)`);
  console.log(`Flashcard Count: ${finalFcCount} (Expected: 26)`);
  console.log(`Quiz Count: ${finalQuizCount} (Expected: 26)`);

  if (finalWsCount === 196 && finalStickyCount === 84 && finalFcCount === 26 && finalQuizCount === 26) {
    console.log('SUCCESS: All record counts returned to exact baseline values!');
  } else {
    throw new Error('Count mismatch after cleanup!');
  }

  await pgPrisma.$disconnect();
}

testCrud().catch(async (err) => {
  console.error('CRUD Test Error:', err);
  await pgPrisma.$disconnect();
  process.exit(1);
});
