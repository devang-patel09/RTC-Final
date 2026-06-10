const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;

const initTransporter = async () => {
  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
    try {
      await transporter.verify();
      console.log('SMTP connected:', config.smtp.user);
    } catch {
      console.warn('SMTP verification failed, falling back to Ethereal');
      const test = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: test.user, pass: test.pass },
      });
      console.log('Ethereal account:', test.user);
    }
  } else {
    const test = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: test.user, pass: test.pass },
    });
    console.log('No SMTP configured, using Ethereal:', test.user);
  }
};

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) await initTransporter();
  try {
    const info = await transporter.sendMail({
      from: `"Bug Tracker" <${config.smtp.user || 'noreply@bugtracker.dev'}>`,
      to,
      subject,
      html,
    });
    if (config.nodeEnv !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};

module.exports = { sendEmail, initTransporter };
