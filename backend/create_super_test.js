const pool = require('./db');
const bcrypt = require('bcrypt');

async function createSuperAdmin() {
    const email = 'antigravity_super@test.com';
    const password = 'testpassword123';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Check if user exists
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length > 0) {
            // Update role to 1
            await pool.query('UPDATE users SET role_id = 1 WHERE email = $1', [email]);
            console.log('User updated to Super Admin. Credentials: ' + email + ' / ' + password);
        } else {
            // Create user
            await pool.query(
                'INSERT INTO users (name, surname, email, password, role_id) VALUES ($1, $2, $3, $4, $5)',
                ['Test', 'SuperAdmin', email, hashedPassword, 1]
            );
            console.log('Super Admin created. Credentials: ' + email + ' / ' + password);
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

createSuperAdmin();
