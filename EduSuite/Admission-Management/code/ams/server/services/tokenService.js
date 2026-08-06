const crypto = require('crypto');

// Random, unguessable, single-use tokens for public (no-login) links (FR2, FR19, FR23)
const generateToken = (bytes = 24) => crypto.randomBytes(bytes).toString('hex');

module.exports = { generateToken };
