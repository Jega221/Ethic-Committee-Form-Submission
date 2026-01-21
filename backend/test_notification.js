const { createNotification } = require('./utils/notifications');
require('dotenv').config();

async function test() {
    try {
        console.log("Testing for user 37...");
        // User 37
        await createNotification(37, null, "Direct Test Notification User 37");
        console.log("Direct test success");
    } catch (e) {
        console.error("Direct test failed:", e);
    } finally {
        process.exit(0);
    }
}

test();
