import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

const xss = require('xss-clean');

dotenv.config();

const app = express();

// 1. Secrets Management & Validation
const requiredEnvVars = ['JWT_SECRET', 'GEMINI_API_KEY', 'MONGODB_URI', 'GOOGLE_CLIENT_ID'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const PORT = process.env.PORT || 5000;

// Security Middleware Imports
import { enforceHttps, validateOrigin, generalLimiter } from './middleware/security';
import { logger } from './utils/logger';

// 2. Security Middleware
app.use(enforceHttps);
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());
app.use(xss());

// 3. Strict CORS
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost', // Android Capacitor
    'capacitor://localhost', // iOS Capacitor
    'http://10.161.12.13:3000'
];

if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}

// Apply validateOrigin middleware (Strict check)
// Note: We apply it globally for now to secure the API. 
// If it breaks static assets or something we can narrow it down.
app.use(validateOrigin(allowedOrigins));

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 4. Rate Limiting (General)
app.use(generalLimiter);

app.use(express.json({ limit: '5mb' }));

// Request logger (using structured logger)
app.use((req, res, next) => {
    logger.info(`Incoming Request: ${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// Basic health check route
// Basic health check route
app.get('/', (req, res) => {
    res.send('Legal Lens API is running');
});

import authRoutes from './routes/authRoutes';
import analyzeRoutes from './routes/analyzeRoutes';
import historyRoutes from './routes/historyRoutes';
import chatRoutes from './routes/chatRoutes';
import negotiateRoutes from './routes/negotiateRoutes';
import simplifyRoutes from './routes/simplifyRoutes';
import summarizeRoutes from './routes/summarizeRoutes';
import deadlineRoutes from './routes/deadlineRoutes';
import checklistRoutes from './routes/checklistRoutes';
import caseAnalysisRoutes from './routes/caseAnalysisRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/negotiate', negotiateRoutes);
app.use('/api/simplify', simplifyRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/deadline', deadlineRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/case-analysis', caseAnalysisRoutes);

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/legallens';

console.log('Starting server...');
console.log('Trying to connect to MongoDB at:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
