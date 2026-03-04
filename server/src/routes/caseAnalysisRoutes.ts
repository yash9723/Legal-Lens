import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { logger } from '../utils/logger';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', auth, async (req: AuthRequest, res) => {
    try {
        const { content, type, caseType, fileName } = req.body;

        const userId = req.user.id;

        // 1. Fetch User and Check Limits
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const limits: { [key: string]: number } = {
            'Free': 2,
            'Starter': 10,
            'Professional': 50,
            'Team': 200
        };

        const limit = limits[user.plan] || 2;

        if (user.role !== 'admin') {
            if (user.documentsAnalyzed >= limit) {
                return res.status(403).json({
                    message: `You have reached the limit of ${limit} documents for the ${user.plan} plan. Please upgrade to analyze more.`
                });
            }
        }

        if (!process.env.GEMINI_API_KEY) {
            logger.error("Gemini API Key missing in env");
            return res.status(500).json({ message: 'Server Configuration Error' });
        }

        let promptParts: any[] = [];

        const instructions = `
You are an expert Indian legal analyst specializing in case law analysis for advocates and legal officials.
Analyze the following ${caseType || 'legal'} document thoroughly and provide a comprehensive case analysis.

Provide the output in the following strictly valid JSON format:
{
  "caseSummary": "A comprehensive 2-3 paragraph overview of the case",
  "caseType": "string (FIR/Petition/Judgment/Affidavit/Charge Sheet/Appeal/Other)",
  "caseNumber": "string or null (extract if available)",
  "courtName": "string or null (extract if available)",
  "filingDate": "string or null (extract if available)",
  "parties": [
    {"name": "string", "role": "string (Complainant/Defendant/Petitioner/Respondent/Witness/Judge/Advocate)", "details": "brief description"}
  ],
  "timeline": [
    {"date": "string (date or approximate period)", "event": "string", "significance": "string (why this matters)"}
  ],
  "legalIssues": [
    {"issue": "string (core legal question)", "relevantLaw": "string (applicable section/act)", "analysis": "string (brief analysis)"}
  ],
  "prosecutionArguments": [
    {"point": "string", "strength": "Strong|Moderate|Weak", "explanation": "string"}
  ],
  "defenseArguments": [
    {"point": "string", "strength": "Strong|Moderate|Weak", "explanation": "string"}
  ],
  "citedPrecedents": [
    {"caseName": "string", "citation": "string (e.g. AIR 2020 SC 123)", "relevance": "string", "favorsSide": "Prosecution/Petitioner|Defense/Respondent|Neutral"}
  ],
  "prosecutionStrengths": [
    {"type": "strength", "description": "string", "impact": "High|Medium|Low"}
  ],
  "prosecutionWeaknesses": [
    {"type": "weakness", "description": "string", "impact": "High|Medium|Low"}
  ],
  "defenseStrengths": [
    {"type": "strength", "description": "string", "impact": "High|Medium|Low"}
  ],
  "defenseWeaknesses": [
    {"type": "weakness", "description": "string", "impact": "High|Medium|Low"}
  ],
  "recommendedStrategy": [
    {"action": "string", "priority": "Immediate|Short-term|Long-term", "details": "string (actionable details)"}
  ],
  "outcomePrediction": {
    "likelihood": "Favorable|Unfavorable|Uncertain",
    "confidence": 65,
    "reasoning": "string (detailed reasoning for the prediction)"
  }
}

IMPORTANT ANALYSIS GUIDELINES:
- Identify ALL parties mentioned in the document with their exact roles.
- Build a chronological timeline of ALL significant events.
- Identify applicable sections of IPC, CrPC, CPC, Evidence Act, and any specific Acts mentioned.
- Cite any case laws or precedents referenced in the document with proper citations.
- Analyze both prosecution/petitioner AND defense/respondent arguments fairly.
- Be specific about strengths and weaknesses — don't be vague.
- Provide actionable, practical strategy recommendations an advocate can use.
- The outcome prediction should be realistic and well-reasoned, not speculative.
- If the document is an FIR, focus on charges, facts alleged, and preliminary assessment.
- If it's a Judgment, extract the ratio decidendi and key holdings.
- If it's a Petition, identify the relief sought and grounds.
`;

        promptParts.push(instructions);

        if (type === 'image' && content) {
            const contents = Array.isArray(content) ? content : [content];

            contents.forEach((c: string) => {
                const base64Data = c.includes('base64,') ? c.split('base64,')[1] : c;

                promptParts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: req.body.mimeType || 'image/png'
                    }
                });
            });
        } else {
            promptParts.push(`Document Content:\n${content}`);
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        let text = '';
        let success = false;

        try {
            const result = await model.generateContent(promptParts);
            const response = await result.response;
            text = response.text();
            success = true;
        } catch (e: any) {
            logger.error(`Case analysis model failed: ${e.message}`);
        }

        if (!success) {
            logger.error("Case analysis failed");
            return res.status(500).json({
                message: 'Case analysis failed. Please try again later.',
            });
        }

        // Robust JSON extraction
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let analysisResult;
        try {
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                const jsonString = cleanText.substring(firstBrace, lastBrace + 1);
                analysisResult = JSON.parse(jsonString);
            } else {
                throw new Error("No JSON object found in response");
            }
        } catch (e) {
            logger.error("Failed to parse JSON from Gemini for case analysis", { error: e });
            return res.status(500).json({ message: 'Failed to process AI response' });
        }

        // Audit Log
        logger.logAction(userId, 'CASE_ANALYZED', {
            fileName: fileName || 'Untitled Case',
            caseType: caseType || 'Other',
            plan: user.plan
        });

        // Update user stats
        await User.findByIdAndUpdate(userId, { $inc: { documentsAnalyzed: 1 } });

        const responsePayload = {
            ...analysisResult,
            _id: 'case_' + Date.now(),
            fileName: fileName || 'Untitled Case',
            caseType: caseType || 'Other',
            createdAt: new Date(),
        };

        res.json(responsePayload);

    } catch (err: any) {
        logger.error('Case Analysis Route Error', err);
        res.status(500).send('Server Error');
    }
});

export default router;
