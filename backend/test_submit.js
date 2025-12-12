const fs = require('fs');
const path = require('path');

// We use native fetch (available in Node 18+)
async function testSubmit() {
    const formData = new FormData();
    formData.append('user_id', '1'); // Assuming user ID 1 exists
    formData.append('faculty_id', '1');
    formData.append('committee_id', '1');
    formData.append('title', 'Test API Submission');
    formData.append('description', 'Testing backend submission logic via script');

    // Create a dummy file
    const dummyFilePath = path.join(__dirname, 'test_doc.txt');
    fs.writeFileSync(dummyFilePath, 'dummy content');

    const fileBlob = new Blob([fs.readFileSync(dummyFilePath)], { type: 'text/plain' });
    formData.append('documents', fileBlob, 'test_doc.txt');

    try {
        console.log('Sending request...');
        const res = await fetch('http://localhost:3000/api/applications', {
            method: 'POST',
            body: formData,
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (err) {
        console.error('Fetch error:', err);
    } finally {
        if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    }
}

testSubmit();
