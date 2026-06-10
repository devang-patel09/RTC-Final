const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

function readKeyFile(envVar, filename) {
  if (process.env[envVar]) return process.env[envVar];
  const filePath = path.join(__dirname, '..', '..', filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8').trim();
  }
  return undefined;
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtPrivateKey: readKeyFile('JWT_PRIVATE_KEY', 'jwtRS256.key'),
  jwtPublicKey: readKeyFile('JWT_PUBLIC_KEY', 'jwtRS256.key.pub'),
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY,
  sentryDsn: process.env.SENTRY_DSN,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};