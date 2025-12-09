const nodemailer = require("nodemailer");

async function createTestAccount() {
  const testAccount = await nodemailer.createTestAccount();
  console.log("✅ New Ethereal test account created:");
  console.log(testAccount);
}

createTestAccount();
