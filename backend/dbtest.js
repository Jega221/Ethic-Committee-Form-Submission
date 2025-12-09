// backend/testDb.js
const pool = require("./db/index");

(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ DB Connected:", res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("❌ DB Connection failed:", err.message);
    process.exit(1);
  }
})();
