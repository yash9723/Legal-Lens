const otplib = require('otplib');
console.log('Keys:', JSON.stringify(Object.keys(otplib)));
console.log('Has authenticator:', !!otplib.authenticator);
console.log('typeof authenticator:', typeof otplib.authenticator);
