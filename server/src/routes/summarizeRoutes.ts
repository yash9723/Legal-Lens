import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'No text provided for summarization' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
            You are an expert legal researcher. Summarize the following legal text for a quick executive briefing.
            
            Structure the response as follows:
            1. **Executive Summary**: (1-2 sentences)
            2. **Key Obligations**: (3-5 bullet points)
            3. **Critical Deadlines**: (If any)
            4. **Financial Implications**: (If any)
            5. **Risk Level**: (Low/Medium/High with a 1-sentence reason)

            Rules:
            - **Be extremely concise.**
            - Use professional but accessible language.
            - Do not include any preamble or concluding remarks.
            - If a section (like Deadlines) is not applicable, state "N/A".

            Legal Text: "${text}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        res.json({ summary });

    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).json({ message: 'Failed to summarize text' });
    }
});

export default router;
