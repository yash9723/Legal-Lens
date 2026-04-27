import express from 'express';
import { AuthRequest } from '../middleware/auth';
import Analysis from '../models/Analysis';
import jwt from 'jsonwebtoken';

import { logger } from '../utils/logger';

const router = express.Router();

// Get all analyses for user
router.get('/', async (req: AuthRequest, res) => {
    try {
        // Try to extract user from token if present
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                req.user = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            } catch (e) { /* ignore */ }
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.json([]); // No user = no history
        }

        const analyses = await Analysis.find({ userId }).sort({ createdAt: -1 });

        const formatted = analyses.map(a => ({
            id: a._id,
            userId: a.userId,
            fileName: a.fileName,
            date: a.createdAt.toLocaleDateString(),
            timestamp: a.createdAt.getTime(),
            result: a.result,
            type: a.fileType,
            previewText: a.previewText
        }));

        res.json(formatted);
    } catch (err) {
        logger.error('History API Error', err);
        res.status(500).send('Server Error');
    }
});

// Get single analysis
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                req.user = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            } catch (e) { /* ignore */ }
        }

        const userId = req.user?.id;
        const analysis = await Analysis.findOne({ _id: req.params.id, ...(userId ? { userId } : {}) });

        if (!analysis) {
            return res.status(404).json({ message: 'Analysis not found' });
        }

        res.json({
            id: analysis._id,
            userId: analysis.userId,
            fileName: analysis.fileName,
            date: analysis.createdAt.toLocaleDateString(),
            timestamp: analysis.createdAt.getTime(),
            result: analysis.result,
            type: analysis.fileType,
            previewText: analysis.previewText
        });
    } catch (err) {
        logger.error('History API Error', err);
        res.status(500).send('Server Error');
    }
});

// Delete analysis
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                req.user = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            } catch (e) { /* ignore */ }
        }

        const userId = req.user?.id;
        const analysis = await Analysis.findOneAndDelete({ _id: req.params.id, ...(userId ? { userId } : {}) });

        if (!analysis) {
            return res.status(404).json({ message: 'Analysis not found' });
        }

        if (userId) {
            logger.logAction(userId, 'DELETE_ANALYSIS', { analysisId: req.params.id });
        }

        res.json({ message: 'Analysis deleted successfully' });
    } catch (err) {
        logger.error('History Delete API Error', err);
        res.status(500).send('Server Error');
    }
});

export default router;
