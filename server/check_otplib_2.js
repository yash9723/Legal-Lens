const otplib = require('otplib');
console.log('otplib.default keys:', otplib.default ? Object.keys(otplib.default) : 'No default');
try {
    const preset = require('@otplib/preset-default');
    console.log('preset exports:', Object.keys(preset));
} catch (e) { console.log('preset-default not found'); }
