const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const productionEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters for security'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
});

function validateEnvironment() {
  console.log('🔍 Validating Production Environment Variables...');
  const result = productionEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n❌ FATAL: Environment Configuration Error(s):');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  if (result.data.NODE_ENV === 'production') {
    if (result.data.CORS_ORIGIN.includes('localhost') || result.data.CORS_ORIGIN.includes('*')) {
      console.error('\n❌ FATAL: Insecure CORS_ORIGIN for production environment.');
      process.exit(1);
    }
    if (result.data.MONGODB_URI.includes('localhost') || result.data.MONGODB_URI.includes('127.0.0.1')) {
      console.warn('⚠️ WARNING: Using localhost MongoDB URI in production environment.');
    }
  }

  console.log(`✅ Environment validation passed. Mode: ${result.data.NODE_ENV}, Port: ${result.data.PORT}`);
  return result.data;
}

if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };
