import express from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Analysis from '../models/Analysis';

import { logger } from '../utils/logger';

const router = express.Router();

// Get all analyses for user
router.get('/', auth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user.id;
        const analyses = await Analysis.find({ userId }).sort({ createdAt: -1 });

        // Map to the format expected by frontend types if needed, or return as is
        // The frontend expects: id, userId, fileName, date, timestamp, result, type, previewText
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
router.get('/:id', auth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user.id;
        const analysis = await Analysis.findOne({ _id: req.params.id, userId });

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
router.delete('/:id', auth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user.id;
        const analysis = await Analysis.findOneAndDelete({ _id: req.params.id, userId });

        if (!analysis) {
            return res.status(404).json({ message: 'Analysis not found' });
        }

        logger.logAction(userId, 'DELETE_ANALYSIS', { analysisId: req.params.id });

        res.json({ message: 'Analysis deleted successfully' });
    } catch (err) {
        logger.error('History Delete API Error', err);
        res.status(500).send('Server Error');
    }
});

export default router;
