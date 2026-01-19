const fetch = require('node-fetch');

const API_URL = 'http://localhost:3006/api';
const PHONE = '8780552986';
const PASS = '111123';

async function run() {
    console.log("1. Logging in...");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: PHONE, password: PASS })
    });
    const loginData = await loginRes.json();
    console.log("Login Response:", loginData);

    if (!loginData.success || !loginData.otp) {
        console.error("Login failed or OTP not returned");
        return;
    }

    const otp = loginData.otp;
    console.log(`2. Verifying OTP: ${otp}`);

    const verifyRes = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phone: PHONE,
            otp: otp,
            deviceInfo: { device: 'Test Script', browser: 'Node', os: 'Windows', ip: '127.0.0.1' }
        })
    });
    const verifyData = await verifyRes.json();
    console.log("Verify Response:", verifyData);

    if (!verifyData.success || !verifyData.token) {
        console.error("Verification failed");
        return;
    }

    const token = verifyData.token;
    console.log("3. Fetching Entities with Token...");

    const entitiesRes = await fetch(`${API_URL}/entities`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (entitiesRes.ok) {
        const entities = await entitiesRes.json();
        console.log("Entities Response:", entities);
    } else {
        console.error("Entities fetch failed:", entitiesRes.status, await entitiesRes.text());
    }

    console.log("4. Fetching Sessions...");
    const sessionsRes = await fetch(`${API_URL}/entities/sessions`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    if (sessionsRes.ok) {
        const sessions = await sessionsRes.json();
        console.log("Sessions Response:", sessions);
    } else {
        console.error("Sessions fetch failed:", sessionsRes.status, await sessionsRes.text());
    }
}

run();
