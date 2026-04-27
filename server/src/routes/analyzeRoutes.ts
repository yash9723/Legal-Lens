import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', async (req: AuthRequest, res) => {
    try {
        // Try to extract user from token if present, but don't require it
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                req.user = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            } catch (e) { /* ignore invalid token */ }
        }

        const { content, type, fileName } = req.body;

        const userId = req.user?.id;

        // 1. Fetch User and Check Limits (skip if anonymous)
        let user: any = null;
        if (userId) {
            user = await User.findById(userId);
        }

        if (user && user.role !== 'admin') {
            const limits: { [key: string]: number } = {
                'Free': 2,
                'Starter': 10,
                'Professional': 50,
                'Team': 200
            };

            const limit = limits[user.plan] || 2;

            const charLimits: { [key: string]: number } = {
                'Free': 15000,
                'Starter': 45000,
            };

            if (user.documentsAnalyzed >= limit) {
                return res.status(403).json({
                    message: `You have reached the limit of ${limit} documents for the ${user.plan} plan. Please upgrade to analyze more.`
                });
            }

            const contentLen = content ? content.length : 0;
            const maxChars = charLimits[user.plan];

            if (maxChars && contentLen > maxChars) {
                return res.status(403).json({
                    message: `Document too long for ${user.plan} plan. Limit is ~${Math.round(maxChars / 3000)} pages. Please upgrade for larger documents.`
                });
            }
        }

        if (!process.env.GEMINI_API_KEY) {
            logger.error("Gemini API Key missing in env");
            return res.status(500).json({ message: 'Server Configuration Error' });
        }

        let promptParts: any[] = [];

        // Construct the instruction part
        const instructions = `
      Analyze the following legal contract or document. 
      Provide the output in the following strictly valid JSON format:
      {
        "oneLineOverview": "A brief summary...",
        "contractSnapshot": [{"label": "string", "value": "string"}],
        "keyClauses": [{"title": "string", "explanation": "string"}],
        "risks": [{"level": "High|Medium|Low", "description": "string", "consequence": "string", "favors": "string"}],
        "negotiationPoints": [{"clause": "string", "issue": "string", "suggestion": "string", "rationale": "string"}],
        "obligations": [{"task": "string", "deadline": "string", "penalty": "string"}],
        "missingClauses": ["string"],
        "governingLaw": "string",
        "disputeResolution": "string",
        "transactionValue": "string (e.g., '10000 INR')",
        "indianLegalCompliance": {
            "stampDutyApplicable": true,
            "statutoryWarnings": ["string (e.g., 'Requires Notarization', 'Stamp Paper insufficient')"]
        },
        "moneyAndExit": "string",
        "verdict": {"status": "Safe|Negotiate|High Risk", "explanation": "string"}
      }
      
      - Evaluate validity under "The Indian Contract Act, 1872".
      - Check for "Consideration" (Section 2d).
      - Check for "Free Consent" (Section 13).
      - If Rent Agreement, extract monthly rent for Stamp Duty estimation.
      - Flag if the contract looks like it needs to be on Non-Judicial Stamp Paper.

      TRANSLATION INSTRUCTION:
      - The user has requested the output to be in specific language: "${req.body.outputLanguage || 'English'}".
      - You MUST translate the values of "oneLineOverview", "keyClauses" (explanation), "risks" (description, consequence), "negotiationPoints" (issue, suggestion, rationale), "verdict" (explanation), "obligations" (task) into "${req.body.outputLanguage || 'English'}".
      - Keep the keys in English as per the JSON structure. Only translate the values.
    `;

        promptParts.push(instructions);

        if (type === 'image' && content) {
            const contents = Array.isArray(content) ? content : [content];

            contents.forEach((c: string) => {
                // Content is expected to be base64 string. 
                // Frontend might send "data:image/png;base64,..."
                // We need to strip the prefix if present.
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

        // Verified working model: gemini-flash-latest
        const textModels = ['gemini-flash-latest'];
        const imageModels = ['gemini-flash-latest'];

        const modelsToTry = type === 'image' ? imageModels : textModels;

        // Privacy: Clean local variables to minimize memory resonance if reused (though GC handles this)
        let text = '';
        let success = false;
        let lastError;
        let usedModel = '';

        for (const modelName of modelsToTry) {
            try {
                // logger.info(`Attempting analysis with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent(promptParts);
                const response = await result.response;
                text = response.text();

                // logger.info(`Success with ${modelName}`);
                usedModel = modelName;
                success = true;
                break;
            } catch (e: any) {
                logger.warn(`Failed with ${modelName}: ${e.message}`);
                lastError = e;
            }
        }

        if (!success) {
            logger.error("All models failed for analysis", { error: lastError?.message });
            return res.status(500).json({
                message: 'Analysis failed. Please try again later.',
                // details: lastError?.message // Don't expose internal errors to client
            });
        }

        // Robust cleanup for markdown code blocks (handles ```json, ```, and trailing content)
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let analysisResult;
        try {
            // Find the first '{' and last '}' to extract valid JSON if there's extra text
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                const jsonString = cleanText.substring(firstBrace, lastBrace + 1);
                analysisResult = JSON.parse(jsonString);
            } else {
                throw new Error("No JSON object found in response");
            }
        } catch (e) {
            logger.error("Failed to parse JSON from Gemini", { error: e });
            return res.status(500).json({ message: 'Failed to process AI response' });
        }

        // 2. Feature Gating: Filter Result based on Plan
        if (user) {
            const userPlan = (user.plan || 'Free');

            if (user.role !== 'admin') {
                if (userPlan === 'Free') {
                    analysisResult.negotiationPoints = [];
                    if (analysisResult.risks) {
                        analysisResult.risks = analysisResult.risks.map((r: any) => ({
                            ...r,
                            level: 'Hidden (Upgrade to View)',
                            consequence: 'Hidden (Upgrade to View)'
                        }));
                    }
                } else if (userPlan === 'Starter') {
                    analysisResult.negotiationPoints = [];
                }
            }
        }

        // Audit Log
        if (userId) {
            logger.logAction(userId, 'DOCUMENT_ANALYZED', {
                fileName: fileName || 'Untitled',
                fileType: type,
                model: usedModel,
                plan: user?.plan
            });

            // Update user stats
            await User.findByIdAndUpdate(userId, { $inc: { documentsAnalyzed: 1 } });
        }

        // Return the stateless result (add fileName/id for frontend compatibility if needed, though id will be null)
        const responsePayload = {
            ...analysisResult,
            _id: 'stateless_' + Date.now(), // Mock ID for frontend
            fileName: fileName || 'Untitled Document',
            fileType: type,
            createdAt: new Date(),
            // No result stored
        };

        res.json(responsePayload);

    } catch (err: any) {
        logger.error('Analyze Route Error', err);
        res.status(500).send('Server Error');
    }
});

export default router;
