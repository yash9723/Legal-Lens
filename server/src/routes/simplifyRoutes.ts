import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', async (req, res) => {
    try {
        const { text, language } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'No text provided for simplification' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        let prompt = '';

        if (language === 'hinglish') {
            prompt = `
                You are a smart Indian legal assistant.
                Explain the following legal clause in "Hinglish" (Hindi + English mix) for a layperson.
                
                Rules:
                - **ACCURACY IS PARAMOUNT.** Explain ONLY what the text says. Do not invent examples or scenarios not present in the text.
                - Use Roman Hindi (e.g., "Samjho", "Matlab yeh hai").
                - Tone: Professional but easy to understand (Casual Office style).
                - Structure: Start with the core meaning, then explain the implication.
                
                Original Text: "${text}"
            `;
        } else if (language === 'tenglish') {
            prompt = `
                You are a Hyderabadi legal assistant. 
                Explain the following legal clause in "Tenglish" (Telugu + English mix) with Hyderabadi flavor.
                
                Rules:
                - **ACCURACY IS PARAMOUNT.** Explain ONLY what the text says. Do not invent distinct lawyers or scenarios if the text doesn't mention them.
                - Use Roman Telugu (e.g., "Lite teesko", "Matter enti ante").
                - Tone: Friendly but stick to the facts.
                - **Do not ramble.** Keep it concise.
                
                Original Text: "${text}"
            `;
        } else {
            // Default to Plain English
            prompt = `
                Rewrite the following legal text into "Plain English" at a 5th-grade reading level.
                
                Rules:
                - Use short sentences.
                - No legal jargon (replace "indemnify" with "protect", "force majeure" with "unexpected events").
                - Use bullet points if there are multiple conditions.
                - Make it sound like a friendly email explanation.
                
                Original Text: "${text}"
            `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const simplifiedText = response.text();

        res.json({ simplifiedText });

    } catch (error) {
        console.error('Simplification error:', error);
        res.status(500).json({ message: 'Failed to simplify text' });
    }
});

export default router;
