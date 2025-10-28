require('dotenv').config();
const pool = require('../db/index');
const { sendEmail } = require('../utils/sendEmail');
const cron = require('node-cron');

async function checkPendingApplications() {
  console.log('⏳ Checking for pending applications...');

  try {
    const result = await pool.query(`
      SELECT a.application_id, a.title, a.submission_date, r.email AS researcher_email
      FROM application a
      JOIN researcher r ON a.researcher_id = r.researcher_id
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

      try {
        await sendEmail(app.researcher_email, subject, message);
      } catch (err) {
        console.error(`❌ Error sending email for App #${app.application_id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Database check failed:', err.message);
  }

  console.log('✅ 48-hour pending check complete.\n');
}

// ✅ Schedule: runs every minute (for testing)
cron.schedule('* * * * *', async () => {
  await checkPendingApplications();
});

// Change this later to once a day:
// cron.schedule('0 0 * * *', async () => { await checkPendingApplications(); });
// That runs at midnight every day

console.log('🚀 Cron job started. Checking pending applications every minute...');
