const axios = require('axios');

async function test() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'test_policy_final@example.com', // Using user created previously
            password: 'Password123!' // Strong password I set earlier (or I reused one) - wait, I set 'weak' in one test but then enforced policy. Let's create a NEW user to be sure or use known one. 'test_phone@example.com' was used in previous step.
        });

        // Let's use test_phone@example.com / Password123! from previous step
        // password was Password123!

        // Actually, I'll just use test_phone@example.com

    } catch (err) {
        // console.log("Login failed or user doesn't exist. Creating new user.");
    }

    try {
        // Create user if not exists or just login
        let token;
        try {
            const login = await axios.post('http://localhost:3000/api/auth/login', {
                email: 'email_test@example.com',
                password: 'Password123!'
            });
            token = login.data.token;
        } catch (e) {
            // Signup
            const signup = await axios.post('http://localhost:3000/api/auth/signup', {
                name: 'Email', surname: 'Test', email: 'email_test@example.com', password: 'Password123!', faculty_id: 1, phone: '+1234567890'
            });
            token = signup.data.token;
        }

        console.log('Token acquired.');

        // 2. Submit Application
        const submitRes = await axios.post('http://localhost:3000/api/applications', {
            faculty_id: 1,
            committee_id: 1,
            title: "Email Notification Test",
            description: "Testing email dispatch",
            skip_documents: true
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Application submitted status:', submitRes.status);
        console.log('Response:', submitRes.data);

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

test();
