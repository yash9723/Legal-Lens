
const API_URL = 'http://127.0.0.1:5000/api';

async function runTest() {
    try {
        const timestamp = Date.now();
        const email = `gating_test_${timestamp}@example.com`;
        const password = 'Password@123';

        console.log(`1. Registering user ${email}...`);
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email, password })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
        const token = regData.token;
        console.log('   User Registered. Plan:', regData.user.plan);

        // --- Test Free Tier ---
        console.log('\n2. Testing Free Tier Analysis...');
        const analyzeRes1 = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content: "This Agreement is made between Party A and Party B. Liability is limited to $5.",
                type: 'text',
                fileName: 'test_doc_free.txt'
            })
        });
        const data1 = await analyzeRes1.json();
        // console.log('   Response Option:', JSON.stringify(data1, null, 2));

        if (data1.result) {
            const risks = data1.result.risks || [];
            const negs = data1.result.negotiationPoints || [];

            const risksHidden = risks.every((r: any) => r.level.includes('Hidden'));
            console.log('   Risks Masked:', risksHidden ? 'YES (Pass)' : 'NO (Fail)');
            console.log('   Negotiation Points Hidden:', negs.length === 0 ? 'YES (Pass)' : `NO (Fail - found ${negs.length})`);
        } else {
            console.log('   Analysis failed or no result:', data1);
        }

        // --- Upgrade to Starter ---
        console.log('\n3. Upgrading to Starter...');
        const upgRes = await fetch(`${API_URL}/auth/upgrade-plan`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ plan: 'Starter' })
        });
        const upgData = await upgRes.json();
        console.log('   Upgraded. New Plan:', upgData.user.plan);


        // --- Test Starter Tier ---
        console.log('\n4. Testing Starter Tier Analysis...');
        const analyzeRes2 = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content: "This is a starter plan test. Indemnification clause is missing.",
                type: 'text',
                fileName: 'test_doc_starter.txt'
            })
        });
        const data2 = await analyzeRes2.json();

        if (data2.result) {
            const risks = data2.result.risks || [];
            const negs = data2.result.negotiationPoints || [];

            const risksVisible = risks.some((r: any) => !r.level.includes('Hidden'));
            console.log('   Risks Visible:', risksVisible ? 'YES (Pass)' : 'NO (Fail - still hidden?)');
            console.log('   Negotiation Points Hidden:', negs.length === 0 ? 'YES (Pass)' : `NO (Fail - found ${negs.length})`);
        }

        console.log('\nDone.');

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

runTest();
