import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', async (req, res) => {
    try {
        const { message, context, history } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const prompt = `
        Context: You are a legal AI assistant analyzing a specific contract.
        The user is asking questions about the following document content:
        "${context ? context.substring(0, 5000) : 'No document context provided'}"
        
        User Question: ${message}
        
        Answer concisely and professionally. Cite specific clauses if possible.
        `;

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        res.status(500).json({ message: 'Failed to generate response', error: error.message });
    }
});

export default router;
