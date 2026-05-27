import nodemailer from 'nodemailer';

/**
 * Utility to send emails via SMTP.
 * Falls back to logging to console if SMTP_USER or SMTP_PASS are not configured.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.log('\n--- [MOCK EMAIL DISPATCH] ---');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    if (html) {
      console.log(`HTML:\n${html}`);
    } else {
      console.log(`Text:    ${text}`);
    }
    console.log('------------------------------\n');
    return { mock: true, message: 'SMTP not configured. Logged to console.' };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });

  // Define mail options
  const mailOptions = {
    from: `"Work Space Support" <${user}>`,
    to,
    subject,
    text: text || 'Work Space Password Reset',
    html: html
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  console.log(`Real email sent successfully. Message ID: ${info.messageId}`);
  return info;
};

export default sendEmail;
