// backend/config/validateEnv.js

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'PORT'
];

const optionalEnvVars = [
  'NODE_ENV',
  'CORS_ORIGIN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'REDIS_URL',
  'LOG_LEVEL'
];

/**
 * Validate that all required environment variables are set
 */
export const validateEnv = () => {
  console.log('🔍 Validating environment variables...');

  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  // If any required variables are missing, throw error
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file'
    );
  }

  // Check optional variables and warn if missing
  optionalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  });

  if (warnings.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    warnings.forEach(envVar => {
      console.warn(`   - ${envVar}`);
    });
  }

  // Validate specific formats
  validateJWTSecret();
  validateMongoURI();
  validateEmail();
  validatePort();

  console.log('✅ Environment validation passed');
};

/**
 * Validate JWT_SECRET format and strength
 */
function validateJWTSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret.length < 32) {
    console.warn(
      '⚠️  JWT_SECRET is less than 32 characters. ' +
      'Consider using a stronger secret for production.'
    );
  }

  // Check if it's a weak secret
  const weakSecrets = ['secret', 'password', '123456', 'your-secret-key'];
  if (weakSecrets.includes(secret.toLowerCase())) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '❌ JWT_SECRET is too weak for production! ' +
        'Please use a strong, random secret.'
      );
    } else {
      console.warn('⚠️  JWT_SECRET is weak. This is only acceptable in development.');
    }
  }
}

/**
 * Validate MONGO_URI format
 */
function validateMongoURI() {
  const uri = process.env.MONGO_URI;

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error(
      '❌ MONGO_URI must start with mongodb:// or mongodb+srv://'
    );
  }
}

/**
 * Validate email configuration
 */
function validateEmail() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailUser)) {
    throw new Error('❌ EMAIL_USER must be a valid email address');
  }

  if (emailPass.length < 8) {
    console.warn('⚠️  EMAIL_PASS seems too short. Make sure it\'s correct.');
  }
}

/**
 * Validate PORT
 */
function validatePort() {
  const port = parseInt(process.env.PORT);

  if (isNaN(port)) {
    throw new Error('❌ PORT must be a valid number');
  }

  if (port < 1 || port > 65535) {
    throw new Error('❌ PORT must be between 1 and 65535');
  }

  // Warn about privileged ports
  if (port < 1024 && process.platform !== 'win32') {
    console.warn(
      `⚠️  PORT ${port} is a privileged port. ` +
      'You may need elevated permissions to use it.'
    );
  }
}

/**
 * Get environment configuration with defaults
 */
export const getEnvConfig = () => {
  return {
    // Required
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    port: parseInt(process.env.PORT) || 5000,

    // Optional with defaults
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    
    // Cloud storage (optional)
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      enabled: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      )
    },

    // Redis (optional)
    redis: {
      url: process.env.REDIS_URL,
      enabled: Boolean(process.env.REDIS_URL)
    },

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',

    // Feature flags
    features: {
      fileUpload: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
      rateLimit: process.env.NODE_ENV === 'production',
      caching: Boolean(process.env.REDIS_URL)
    }
  };
};

/**
 * Display environment configuration (without sensitive data)
 */
export const displayEnvConfig = () => {
  const config = getEnvConfig();

  console.log('\n📋 Environment Configuration:');
  console.log(`   NODE_ENV: ${config.nodeEnv}`);
  console.log(`   PORT: ${config.port}`);
  console.log(`   CORS_ORIGIN: ${config.corsOrigin}`);
  console.log(`   DATABASE: ${config.mongoUri.includes('localhost') ? 'Local' : 'Cloud'}`);
  console.log(`   EMAIL: ${config.emailUser}`);
  console.log(`   CLOUDINARY: ${config.cloudinary.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`   REDIS: ${config.redis.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`   LOG_LEVEL: ${config.logLevel}`);
  console.log('\n🎯 Features:');
  console.log(`   File Upload: ${config.features.fileUpload ? '✅' : '❌'}`);
  console.log(`   Rate Limiting: ${config.features.rateLimit ? '✅' : '❌'}`);
  console.log(`   Caching: ${config.features.caching ? '✅' : '❌'}`);
  console.log('');
};

export default {
  validateEnv,
  getEnvConfig,
  displayEnvConfig
};