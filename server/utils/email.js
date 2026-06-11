const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;
let smtpStatus = 'not_initialized';

const getTransporterConfig = () => {
  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    return {
      host: config.smtp.host,
      user: config.smtp.user,
      pass: config.smtp.pass,
    };
  }
  return null;
};

const tryConnect = async (cfg, port, secure) => {
  const t = nodemailer.createTransport({
    host: cfg.host,
    port,
    secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  await t.verify();
  return t;
};

const initTransporter = async () => {
  const cfg = getTransporterConfig();

  if (!cfg) {
    const test = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: test.user, pass: test.pass },
    });
    smtpStatus = 'ethereal_no_config';
    console.log('SMTP: no credentials — using Ethereal (fake). Emails will NOT be delivered.');
    console.log('  Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to send real emails.');
    return;
  }

  const ports = config.smtp.host.includes('gmail')
    ? [[587, false], [465, true]]
    : [[config.smtp.port || 587, (config.smtp.port || 587) === 465]];

  for (const [port, secure] of ports) {
    try {
      transporter = await tryConnect(cfg, port, secure);
      smtpStatus = 'connected';
      console.log(`SMTP: connected to ${cfg.host}:${port} as ${cfg.user}`);
      return;
    } catch (err) {
      console.warn(`SMTP: ${cfg.host}:${port} failed — ${err.message}`);
    }
  }

  const test = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email', port: 587, secure: false,
    auth: { user: test.user, pass: test.pass },
  });
  smtpStatus = 'ethereal_fallback';
  console.warn('SMTP: ALL connection attempts failed. Falling back to Ethereal (fake).');
  console.warn('  Emails will NOT reach real recipients.');
  console.warn('  For Gmail, generate a fresh App Password at:');
  console.warn('  https://myaccount.google.com/apppasswords');
  console.warn('  Then update SMTP_PASS in .env and restart.');
  console.warn('  Ethereal preview account:', test.user);
};

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) await initTransporter();

  const info = await transporter.sendMail({
    from: `"Bug Tracker" <${config.smtp.user || 'noreply@bugtracker.dev'}>`,
    to,
    subject,
    html,
  });

  if (smtpStatus !== 'connected') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Email preview URL:', previewUrl);
    }
  }

  return true;
};

const getSmtpStatus = () => smtpStatus;

module.exports = { sendEmail, initTransporter, getSmtpStatus };
