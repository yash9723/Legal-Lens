import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', auth, async (req: AuthRequest, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'No text provided for extraction' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
            You are a legal operations assistant. Extract all critical dates and deadlines from the following legal text.
            
            Provide the output in a strictly valid JSON array of objects:
            [
              {
                "title": "Clear description of the deadline",
                "date": "YYYY-MM-DD (Estimate if only relative time is given, assuming today is ${new Date().toISOString().split('T')[0]})",
                "originalText": "The exact sentence from the contract",
                "type": "Payment|Termination|Performance|Renewal|Other"
              }
            ]

            Rules:
            - If no specific date is found, but a relative one is (e.g., "30 days from signing"), calculate it based on today's date.
            - Only return the JSON array. No preamble.
            - If no dates are found, return an empty array [].

            Legal Text: "${text}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const resultText = response.text();

        // Cleanup markdown if present
        const cleanText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const deadlines = JSON.parse(cleanText);

        res.json({ deadlines });

    } catch (error) {
        console.error('Deadline extraction error:', error);
        res.status(500).json({ message: 'Failed to extract deadlines' });
    }
});

export default router;
