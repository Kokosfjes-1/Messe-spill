const { TableClient } = require('@azure/data-tables');

const TABLE = 'scores';
const PARTITION = 'player';
const MAX_TIME = 600; // seconds – anything above this is not a real run

let client;
async function getTable() {
  if (!client) {
    client = TableClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING, TABLE);
    try { await client.createTable(); } catch (e) { if (e.statusCode !== 409) throw e; }
  }
  return client;
}

// "912 34 567" -> "+4791234567", "0046 70..." -> "+4670...", otherwise null
function normalizePhone(raw) {
  if (typeof raw !== 'string') return null;
  let p = raw.replace(/[\s\-().]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (/^\d{8}$/.test(p)) p = '+47' + p;
  return /^\+\d{8,15}$/.test(p) ? p : null;
}

module.exports = { getTable, normalizePhone, PARTITION, MAX_TIME };
