import nodemailer from 'nodemailer';

/**
 * Utility to send emails via SMTP or Resend HTTP API.
 * Falls back to logging to console if SMTP_USER or SMTP_PASS are not configured.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  // Option 1: Send via Resend HTTP API (useful for Render Free tier where SMTP ports are blocked)
  if (process.env.RESEND_API_KEY) {
    const resendFrom = process.env.RESEND_FROM || 'onboarding@resend.dev';
    console.log('Using Resend HTTP API to send email...');
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendFrom,
          to: typeof to === 'string' ? [to] : to,
          subject: subject,
          html: html,
          text: text || 'Work Space Email Alert'
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Resend API returned status ${response.status}`);
      }
      console.log(`Real email sent successfully via Resend. ID: ${data.id}`);
      return data;
    } catch (err) {
      console.error('Failed to send email via Resend:', err);
      throw err;
    }
  }

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

  // Create transporter with timeouts to prevent hanging if port is blocked
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    },
    connectionTimeout: 10000, // 10 seconds timeout
    greetingTimeout: 10000,
    socketTimeout: 10000
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
