const nodemailer = require('nodemailer');
require('dotenv').config();
// Log environment variables for debugging (remove in production)
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[REDACTED]' : 'undefined');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: `"Shopii" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};



module.exports = { sendEmail, };