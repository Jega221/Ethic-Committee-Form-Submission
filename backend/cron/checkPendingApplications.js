// backend/cron/checkPendingApplications.js
require('dotenv').config();
const pool = require('../db/index');
const { sendEmail } = require('../utils/sendEmail');
const { createNotification } = require('../utils/notifications'); // if you have this
const cron = require('node-cron');

async function checkPendingApplications() {
  console.log('⏳ Checking for pending applications...');

  try {
    const result = await pool.query(`
      SELECT 
      a.application_id, 
      a.title, 
      a.submission_date, 
      u.email AS researcher_email, 
      u.id AS researcher_id
      FROM application a
      JOIN users u ON a.researcher_id = u.id
      WHERE a.status = 'Pending'
        AND a.submission_date < NOW() - INTERVAL '48 hours'
    `);

    if (result.rows.length === 0) {
      console.log('✅ No pending applications over 48 hours.');
      return;
    }

    for (const app of result.rows) {
      console.log(`🔔 Pending >48hr: Application #${app.application_id}`);

      const subject = `Reminder: Application #${app.application_id} Pending for 48+ Hours`;
      const message = `
        Hello,
        Your application titled "${app.title}" has been pending for more than 48 hours.
        Please wait for admin review or contact the committee.
      `;

      // Send email
      try {
        await sendEmail(app.researcher_email, subject, message);
      } catch (err) {
        console.error(`❌ Error sending email for App #${app.application_id}:`, err.message);
      }

      // Optional: create notification record in DB (if notifications table exists)
      if (typeof createNotification === 'function') {
        try {
          await createNotification(
            app.researcher_id,
            app.application_id,
            "Your application has been pending for over 48 hours. Please contact the committee if needed."
          );
        } catch (notifyErr) {
          console.error(`⚠️ Failed to create notification for App #${app.application_id}:`, notifyErr.message);
        }
      }
    }
  } catch (err) {
    console.error('❌ Database check failed:', err.message);
  }

  console.log('✅ 48-hour pending check complete.\n');
}

// // Run every minute for testing
// cron.schedule('* * * * *', async () => {
//   await checkPendingApplications();
// });
// console.log('🚀 Cron job started. Checking pending applications every minute...');

module.exports = checkPendingApplications;
