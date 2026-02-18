const otplib = require('otplib');
console.log('Has TOTP:', !!otplib.TOTP);
if (otplib.TOTP) {
    try {
        const authenticator = new otplib.TOTP();
        console.log('TOTP instantiated');
        console.log('Generate Secret:', authenticator.generateSecret());
    } catch (e) { console.error('Error instantiation:', e); }
}
