const nodemailer = require('nodemailer');

const sendOtpEmail = async (toEmail, otp) => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || '"CollabSpace" <no-reply@collabspace.com>',
        to: toEmail,
        subject: `Your CollabSpace Authentication Code: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
            <h2 style="color: #6366f1; text-align: center; margin-bottom: 8px;">CollabSpace</h2>
            <p style="font-size: 14px; color: #94a3b8; text-align: center;">Direct Email Authentication</p>
            <div style="margin: 24px 0; padding: 18px; background: #1e293b; border-radius: 12px; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">This code will expire in 10 minutes. If you did not request this code, you can ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Authentication email sent to ${toEmail}`);
      return { sent: true, mode: 'smtp' };
    } catch (err) {
      console.error(`⚠️ SMTP Error: ${err.message}. Falling back to console.`);
    }
  }

  // Development fallback: Print to console
  console.log(`\n======================================================`);
  console.log(`🔐 [DIRECT EMAIL AUTHENTICATION]`);
  console.log(`📩 Recipient: ${toEmail}`);
  console.log(`🔑 Verification OTP: ${otp}`);
  console.log(`⏳ Valid for: 10 minutes`);
  console.log(`======================================================\n`);

  return { sent: true, mode: 'console' };
};

module.exports = { sendOtpEmail };
