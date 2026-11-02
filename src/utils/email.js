// utils/email.js
require("dotenv").config(); // 👉 Load biến môi trường ở đây!

const nodemailer = require("nodemailer");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };
    await transporter.sendMail(mailOptions);
    logger.info('Email sent');
  } catch (error) {
    logger.error('Email delivery failed', error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendEmail };