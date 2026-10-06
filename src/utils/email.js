// utils/email.js
require("dotenv").config(); // 👉 Load biến môi trường ở đây!

const nodemailer = require("nodemailer");

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
    console.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendEmail };