const nodemailer = require('nodemailer');
require('dotenv').config();
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  socketTimeout: 15000,
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
    logger.info('Email sent');
    return info;
  } catch (error) {
    logger.error('Email delivery failed', error);
    throw new Error('Email sending failed');
  }
};



module.exports = { sendEmail, };