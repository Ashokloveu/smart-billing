import mongoose from 'mongoose';
import { env } from '../backend/src/config/env.js';

export interface MigrationStep {
  name: string;
  up: (session: mongoose.ClientSession) => Promise<void>;
  down: (session: mongoose.ClientSession) => Promise<void>;
}

export async function runMigration(step: MigrationStep) {
  console.log(`=================================================================`);
  console.log(`  TRANSACTION-SAFE DATABASE MIGRATION: ${step.name}`);
  console.log(`=================================================================\n`);

  await mongoose.connect(env.MONGODB_URI);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(`⏳ Executing migration 'up' in session transaction...`);
    await step.up(session);
    await session.commitTransaction();
    console.log(`✅ Migration '${step.name}' applied and committed successfully.\n`);
  } catch (err) {
    console.error(`❌ Migration failed! Aborting transaction...`, err);
    await session.abortTransaction();
    console.log(`🔄 Transaction rolled back cleanly. No partial schema writes committed.\n`);
    throw err;
  } finally {
    session.endSession();
    await mongoose.disconnect();
  }
}
