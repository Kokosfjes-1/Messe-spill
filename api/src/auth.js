const crypto = require('crypto');

// Shared-password login for /admin.
// ADMIN_PASSWORD and ADMIN_SECRET are app settings on the Static Web App.
// Tokens are "<expiry>.<hmac>" and become invalid as soon as the password changes.
const TOKEN_TTL = 12 * 60 * 60 * 1000;

function signingKey() {
  const { ADMIN_SECRET, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_SECRET || !ADMIN_PASSWORD) return null;
  return crypto.createHmac('sha256', ADMIN_SECRET).update(ADMIN_PASSWORD).digest();
}

const sign = exp => crypto.createHmac('sha256', signingKey()).update(String(exp)).digest('base64url');
const sha = s => crypto.createHash('sha256').update(s).digest();

function checkPassword(password) {
  if (!signingKey() || typeof password !== 'string') return false;
  return crypto.timingSafeEqual(sha(password), sha(process.env.ADMIN_PASSWORD));
}

function issueToken() {
  const exp = Date.now() + TOKEN_TTL;
  return `${exp}.${sign(exp)}`;
}

function isAdmin(req) {
  if (!signingKey()) return false;
  const [exp, sig] = (req.headers.get('x-admin-token') || '').split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const expected = Buffer.from(sign(exp)), given = Buffer.from(sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// wraps a handler so it only runs for a logged-in admin
const adminOnly = handler => async (req, ctx) =>
  isAdmin(req) ? handler(req, ctx) : { status: 401, jsonBody: { error: 'unauthorized' } };

module.exports = { checkPassword, issueToken, adminOnly };
