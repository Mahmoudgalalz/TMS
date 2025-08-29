export const DATABASE_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'service_tickets',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  url: process.env.QUEUE_REDIS_URL,
};

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
};

export const CORS_CONFIG = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
};

export const AI_CONFIG = {
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:3003',
  fallbackEnabled: true,
};

export const FILE_UPLOAD_CONFIG = {
  maxFileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'text/csv',
    'text/plain',
  ],
  uploadPath: process.env.UPLOAD_PATH || './uploads',
};

export const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export const APP_CONFIG = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: '/api',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
};

export const PAGINATION_CONFIG = {
  defaultLimit: 10,
  maxLimit: 100,
};

export const QUEUE_CONFIG = {
  redisUrl: process.env.QUEUE_REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Validation schemas
export const VALIDATION_RULES = {
  password: {
    minLength: 8,
    requireUppercase: false,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  ticket: {
    titleMaxLength: 200,
    descriptionMaxLength: 5000,
    ticketNumberPrefix: 'TKT',
  },
  user: {
    usernameMaxLength: 50,
    usernameMinLength: 3,
    emailMaxLength: 255,
  },
  csv: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['text/csv', 'application/csv'],
  },
};
