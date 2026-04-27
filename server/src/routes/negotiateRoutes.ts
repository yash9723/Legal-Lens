import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', async (req, res) => {
    console.log("Negotiation route hit");
    try {
        const { risks, summary, counterpartyName } = req.body;
        console.log("Payload:", { risks: risks?.length, summary, counterpartyName });

        if (!risks || !Array.isArray(risks)) {
            console.error("Invalid risks array");
            return res.status(400).json({ message: 'Risks array is required' });
        }

        const modelName = 'gemini-flash-latest';
        console.log(`Initializing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
        You are an expert contract negotiator. 
        Your task is to draft a professional, polite, but firm email to a counterparty regarding a contract.
        
        The contract summary is: "${summary || 'Not provided'}"
        
        The specific risks/clauses we want to address are:
        ${risks.map((r: any) => `- Clause: "${r.clause}". Concern: ${r.description}. Desired Change: Mitigate this risk.`).join('\n')}
        
        Please draft an email that:
        1. Acknowledges receipt of the contract.
        2. Expresses general interest in moving forward.
        3. Professionally outlines the points that need discussion/revision based on the risks above.
        4. Keeps a collaborative tone.
        
        Target Audience: ${counterpartyName || 'The Counterparty'}
        
        Output ONLY the email body text.
        `;

        console.log("Sending prompt to Gemini...");
        const result = await model.generateContent(prompt);
        console.log("Gemini response received");
        const response = await result.response;
        const text = response.text();
        console.log("Generated text length:", text.length);

        res.json({ emailDraft: text });

    } catch (error: any) {
        console.error('Negotiation API Error Full:', error);
        res.status(500).json({ message: 'Failed to generate email', error: error.message, details: error.toString() });
    }
});

export default router;
