import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connection established successfully');
  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to MongoDB');
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB connection lost. Attempting reconnect...');
});

mongoose.connection.on('error', (err) => {
  logger.error({ err }, '⚠️ MongoDB connection error occurred');
});
