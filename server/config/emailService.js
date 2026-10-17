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

const sendGroupInviteEmail = async (toEmail, { groupName, inviterName, role, inviteLink }) => {
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
        subject: `You've been invited to join ${groupName} on CollabSpace`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
            <h2 style="color: #6366f1; text-align: center; margin-bottom: 6px;">CollabSpace</h2>
            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 24px;">Workspace Team Invitation</p>
            <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #334155;">
              <p style="margin: 0 0 10px 0; font-size: 15px; color: #f8fafc;">
                <strong>${inviterName || 'A team member'}</strong> has invited you to join the <strong>${groupName}</strong> workspace as <strong>${role}</strong>.
              </p>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                Collaborate on documents, share notes, and communicate in real-time.
              </p>
            </div>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${inviteLink}" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
                Accept Invitation & Join Workspace →
              </a>
            </div>
            <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 24px;">
              Or copy and paste this link in your browser:<br/>
              <span style="color: #818cf8; word-break: break-all;">${inviteLink}</span>
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Workspace invitation email sent to ${toEmail}`);
      return { sent: true, mode: 'smtp' };
    } catch (err) {
      console.error(`⚠️ SMTP Error sending invite: ${err.message}. Falling back to console.`);
    }
  }

  // Development fallback: Print to console
  console.log(`\n======================================================`);
  console.log(`📩 [WORKSPACE INVITATION EMAIL]`);
  console.log(`👤 Inviter: ${inviterName || 'Workspace Admin'}`);
  console.log(`👥 Workspace: ${groupName}`);
  console.log(`🛡️ Assigned Role: ${role}`);
  console.log(`📬 Recipient: ${toEmail}`);
  console.log(`🔗 Invite Link: ${inviteLink}`);
  console.log(`⏳ Valid for: 7 days`);
  console.log(`======================================================\n`);

  return { sent: true, mode: 'console' };
};

module.exports = { sendOtpEmail, sendGroupInviteEmail };
