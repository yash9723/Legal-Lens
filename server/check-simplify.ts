import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret'; // Fallback to what might be default

// Create dummy token
const token = jwt.sign({ id: 'dummy_user_id', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

async function testSimplify() {
    try {
        console.log(`Testing Simplify Endpoint on port ${PORT}...`);
        const response = await axios.post(`http://localhost:${PORT}/api/simplify`, {
            text: "The Lessee shall indemnify the Lessor against all claims.",
            language: "hinglish"
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("✅ Success!");
        console.log("Result:", response.data);
    } catch (error: any) {
        console.error("❌ Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

testSimplify();
