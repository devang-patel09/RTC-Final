const welcomeEmail = (name, verifyUrl) => `
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .header { background: linear-gradient(135deg, #2563EB, #1E293B); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; }
  .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .button { display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
  .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Welcome to Bug Tracker 🐛</h1></div>
    <div class="content">
      <h2>Hi ${name},</h2>
      <p>Thanks for signing up! Please verify your email address to get started.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" class="button">Verify Email Address</a>
      </p>
      <p>Or copy this link: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    </div>
    <div class="footer"><p>&copy; 2024 Bug Tracker. All rights reserved.</p></div>
  </div>
</body>
</html>`;

module.exports = { welcomeEmail };
