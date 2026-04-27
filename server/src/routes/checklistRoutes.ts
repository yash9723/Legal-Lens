import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'No text provided' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
            You are a legal consultant specializing in Indian law. Generate a comprehensive execution checklist for the following legal document content.
            
            Structure the response as follows:
            1. **Stamping**: (Specify stamp duty requirements if applicable, or state "Standard Non-Judicial Stamp Paper")
            2. **Signing Requirements**: (Number of signatories, where to sign/initial)
            3. **Witnesses**: (Required number and qualification)
            4. **Notarization/Registration**: (Need for notary or sub-registrar)
            5. **Post-Execution Steps**: (Filing, scanning, original storage)

            Rules:
            - **Focus on Indian context** (e.g., e-stamping, Franking).
            - Be practical and step-by-step.
            - Do not include preamble.

            Content: "${text}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const checklist = response.text();

        res.json({ checklist });

    } catch (error) {
        console.error('Checklist generation error:', error);
        res.status(500).json({ message: 'Failed to generate checklist' });
    }
});

export default router;
