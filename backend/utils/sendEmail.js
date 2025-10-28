const nodemailer = require("nodemailer");

// Using Ethereal test account
const transporter = nodemailer.createTransport({
  host: "imap.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: "mpjxwb7m67eyxoqu@ethereal.email",
    pass: "TtpwHH71ttjX4PRGDg",
  },
});

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
