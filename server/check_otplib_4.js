const otplib = require('otplib');
console.log('Has Authenticator:', !!otplib.Authenticator);
if (otplib.Authenticator) {
    try {
        const authenticator = new otplib.Authenticator();
        console.log('Authenticator instantiated');
        console.log('Secret:', authenticator.generateSecret());
    } catch (e) { console.error('Error:', e); }
} else {
    console.log('Keys:', Object.keys(otplib));
}
