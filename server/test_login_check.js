const express = require('express');
const mongoose = require('mongoose');
const User = require('./src/models/User').default; // Assuming default export
const authRoutes = require('./src/routes/authRoutes').default; // Assuming default export
const request = require('supertest');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
// Mock environment variables
process.env.JWT_SECRET = 'test_secret';

// Mock Mongoose connection (or just mock User.findOne)
// Since we want to test the ROUTE logic (imports etc), we can mock mongoose model.
// But wait, if the error is runtime import, mocking mongoose might mask it if we don't load the route file correctly.
// Actually, `require('./src/routes/authRoutes')` effectively tests imports.

// Let's try to mock the DB or connect to a test one?
// For debugging 500, often it's "cannot find module" or "undefined is not function".
// We can just try to load the app and route.

console.log('Loading authRoutes...');
try {
    const r = require('./src/routes/authRoutes');
    console.log('authRoutes loaded successfully');
} catch (e) {
    console.error('Error loading authRoutes:', e);
}

// Check speakeasy again
try {
    const speakeasy = require('speakeasy');
    console.log('speakeasy loaded:', !!speakeasy);
} catch (e) {
    console.error('speakeasy load failed:', e);
}

// Check qrcode again
try {
    const qrcode = require('qrcode');
    console.log('qrcode loaded:', !!qrcode);
} catch (e) {
    console.error('qrcode load failed:', e);
}
