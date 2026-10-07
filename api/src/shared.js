const { TableClient } = require('@azure/data-tables');

const TABLE = 'scores';
const PARTITION = 'player';
const MAX_TIME = 600; // seconds – anything above this is not a real run

const clients = {};
async function getTable(name = TABLE) {
  if (!clients[name]) {
    const client = TableClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING, name);
    try { await client.createTable(); } catch (e) { if (e.statusCode !== 409) throw e; }
    clients[name] = client;
  }
  return clients[name];
}

// "912 34 567" -> "+4791234567", "0046 70..." -> "+4670...", otherwise null
function normalizePhone(raw) {
  if (typeof raw !== 'string') return null;
  let p = raw.replace(/[\s\-().]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (/^\d{8}$/.test(p)) p = '+47' + p;
  return /^\+\d{8,15}$/.test(p) ? p : null;
}

// Public nickname shown on the leaderboard: trimmed, max 16 chars, no control chars.
// Anything that looks like a phone number is dropped so nobody publishes their number by mistake.
function cleanTag(raw) {
  if (typeof raw !== 'string') return '';
  const tag = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  return /\d{5,}/.test(tag.replace(/[\s\-().+]/g, '')) ? '' : tag;
}

module.exports = { getTable, normalizePhone, cleanTag, PARTITION, MAX_TIME };
