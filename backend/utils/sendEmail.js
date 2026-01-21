// backend/utils/sendEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  // Use Real Email Service (Gmail/Outlook/etc)
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // Default to Gmail
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log(`📧 Using Real Email Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
} else {
  // Use Ethereal test account (Fallback)
  transporter = nodemailer.createTransport({
    host: "imap.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: "mpjxwb7m67eyxoqu@ethereal.email",
      pass: "TtpwHH71ttjX4PRGDg",
    },
  });
  console.log("⚠️ Using Ethereal Test Email Service (No real emails will be sent)");
}

async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: '"Ethic Committee" <no-reply@ethiccommittee.com>',
      to,
      subject,
      text,
    });

    console.log(`✅ Email sent to ${to}`);
    console.log("📩 Preview URL:", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
}

module.exports = { sendEmail };
