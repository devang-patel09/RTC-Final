const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const Sentry = require('@sentry/node');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const connectDB = require('./config/database');
const swaggerSpec = require('./utils/swagger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const SocketService = require('./services/SocketService');
const { startCronJobs } = require('./cron');
const { initTransporter, getSmtpStatus } = require('./utils/email');

const app = express();
const server = http.createServer(app);
const startTime = Date.now();

if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.nodeEnv,
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 0,
    maxBreadcrumbs: 50,
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 1000 : 10000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
if (config.nodeEnv === 'production') {
  console.log('Rate limiter enabled: max 1000 requests per 15 minutes');
  app.use('/api/', limiter);
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/v1/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: config.nodeEnv,
    database: dbStatus[dbState] || 'unknown',
    smtp: getSmtpStatus(),
    memory: process.memoryUsage(),
  });
});

app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/ai', require('./routes/ai'));
app.use('/api/v1/analytics', require('./routes/analytics'));
app.use('/api/v1/github', require('./routes/github'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/organizations', require('./routes/organizations'));
app.use('/api/v1/invites', require('./routes/invites'));

app.post('/api/v1/test-email', express.json(), async (req, res) => {
  try {
    const { sendEmail, getSmtpStatus } = require('./utils/email');
    await sendEmail({ to: req.body.to || config.smtp.user, subject: 'Test Email from Bug Tracker', html: '<h1>Test</h1><p>If you see this, email is working!</p>' });
    const status = getSmtpStatus();
    res.json({
      success: true,
      smtp: status,
      message: status === 'connected'
        ? 'Email sent successfully via SMTP!'
        : 'Email sent via Ethereal (fake SMTP) — recipient will NOT receive it. Check server console for preview URL.',
    });
  } catch (err) {
    res.status(500).json({ success: false, smtp: getSmtpStatus(), message: 'Email failed: ' + err.message });
  }
});

if (config.sentryDsn) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    SocketService.initialize(io);
    startCronJobs();

    try {
      await initTransporter();
      console.log('Email service initialized');
    } catch (emailErr) {
      console.warn('Email init failed (emails will not send):', emailErr.message);
    }

    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
      console.log(`API Docs: http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
module.exports = app;