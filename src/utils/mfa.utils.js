const speakeasy = require('speakeasy');

function generateSecret(userEmail, userName) {
  return speakeasy.generateSecret({
    length: 20,
    name: `${userName} (${userEmail})`,
    issuer: 'TechStore'
  });
}

function generateTOTP(secret) {
  return speakeasy.totp({ secret: secret.base32 || secret, encoding: 'base32' });
}

function verifyTOTP(secret, token) {
  return speakeasy.totp.verify({ secret: secret.base32 || secret, encoding: 'base32', token, window: 1 });
}

module.exports = { generateSecret, generateTOTP, verifyTOTP };
