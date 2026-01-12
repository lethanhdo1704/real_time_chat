// backend/config/validateEnv.js

/**
 * 🔥 ENVIRONMENT VARIABLE VALIDATION
 * 
 * Validates and provides centralized env config
 * Prevents runtime errors from missing/invalid env vars
 * 
 * @production
 */

export const getEnvConfig = () => {
  // ============================================
  // REQUIRED ENVIRONMENT VARIABLES
  // ============================================
  const required = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT || 5000,
  };

  // Check required vars
  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n   - ${missing.join('\n   - ')}`
    );
  }

  // ============================================
  // OPTIONAL ENVIRONMENT VARIABLES
  // ============================================
  const optional = {
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET,
    PUBLIC_API_URL: process.env.PUBLIC_API_URL,
    
    // Cloudinary (deprecated)
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    
    // R2 Storage
    R2_ENABLED: process.env.R2_ENABLED,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    
    // Redis
    REDIS_URL: process.env.REDIS_URL,
    
    // Other
    LOG_LEVEL: process.env.LOG_LEVEL,
  };

  // Log missing optional vars (warning only)
  const missingOptional = Object.entries(optional)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingOptional.length > 0) {
    console.log('⚠️  Optional environment variables not set:');
    missingOptional.forEach(key => console.log(`   - ${key}`));
  }

  // ============================================
  // RETURN VALIDATED CONFIG
  // ============================================
  return {
    // Core
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5000,
    
    // Database
    mongoUri: process.env.MONGO_URI,
    
    // Security
    jwtSecret: process.env.JWT_SECRET,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    trustProxy: process.env.TRUST_PROXY === 'true',
    
    // CORS
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    
    // Email
    email: {
      enabled: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    
    // reCAPTCHA
    recaptcha: {
      enabled: !!process.env.RECAPTCHA_SECRET,
      secret: process.env.RECAPTCHA_SECRET,
    },
    
    // Public API
    publicApiUrl: process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`,
    
    // ============================================
    // 🔥 CLOUDFLARE R2 STORAGE
    // ============================================
    r2: {
      enabled: process.env.R2_ENABLED === 'true',
      endpoint: process.env.R2_ENDPOINT,
      bucket: process.env.R2_BUCKET,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      publicUrl: process.env.R2_PUBLIC_URL,
    },
    
    // ============================================
    // CLOUDINARY (DEPRECATED)
    // ============================================
    cloudinary: {
      enabled: !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    
    // Redis
    redis: {
      enabled: !!process.env.REDIS_URL,
      url: process.env.REDIS_URL,
    },
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
  };
};

/**
 * 🔥 VALIDATE ENVIRONMENT (called at startup)
 */
export const validateEnv = () => {
  try {
    getEnvConfig();
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
  }
};

/**
 * 🔥 VALIDATE AND LOG CONFIGURATION
 * 
 * Call this at startup to validate env and log config
 */
export const validateAndLogConfig = () => {
  console.log('🔍 Validating environment variables...');
  
  try {
    const config = getEnvConfig();
    
    console.log('✅ Environment validation passed');
    console.log('📋 Environment Configuration:');
    console.log(`   NODE_ENV: ${config.nodeEnv}`);
    console.log(`   PORT: ${config.port}`);
    console.log(`   CORS_ORIGIN: ${config.corsOrigin}`);
    console.log(`   DATABASE: ${config.mongoUri ? 'Local' : 'Not configured'}`);
    console.log(`   EMAIL: ${config.email.user || 'Not configured'}`);
    
    console.log('💾 Storage:');
    
    // R2 Config
    if (config.r2.enabled) {
      console.log('   R2: ✅ Enabled');
      console.log(`      Bucket: ${config.r2.bucket}`);
      console.log(`      Endpoint: ${config.r2.endpoint}`);
      console.log(`      Public URL: ${config.r2.publicUrl || '⚠️  Not configured'}`);
    } else {
      console.log('   R2: ❌ Disabled');
    }
    
    // Cloudinary Config (deprecated)
    if (config.cloudinary.enabled) {
      console.log('   Cloudinary: ✅ Enabled (deprecated)');
    } else {
      console.log('   Cloudinary: ❌ Disabled');
    }
    
    console.log(`   REDIS: ${config.redis.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   LOG_LEVEL: ${config.logLevel}`);
    
    console.log('🎯 Features:');
    console.log(`   File Upload: ${config.r2.enabled || config.cloudinary.enabled ? '✅' : '❌'}`);
    console.log(`   Rate Limiting: ${config.redis.enabled ? '✅' : '❌'}`);
    console.log(`   Caching: ${config.redis.enabled ? '✅' : '❌'}`);
    
    return config;
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
  }
};

// ============================================
// 🔥 BACKWARD COMPATIBILITY ALIAS
// ============================================
export const displayEnvConfig = validateAndLogConfig;

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  getEnvConfig,
  validateEnv,
  validateAndLogConfig,
  displayEnvConfig, // Alias
};