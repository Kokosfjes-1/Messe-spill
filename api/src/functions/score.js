const { app } = require('@azure/functions');
const { getTable, normalizePhone, PARTITION, MAX_TIME } = require('../shared');

// POST /api/score  { phone, time, consent }
// One row per phone number, keeping that player's best time.
app.http('score', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'score',
  handler: async (req) => {
    let body;
    try { body = await req.json(); } catch { return { status: 400, jsonBody: { error: 'invalid json' } }; }

    const phone = normalizePhone(body.phone);
    const time = Math.round(Number(body.time) * 100) / 100;
    if (!phone) return { status: 400, jsonBody: { error: 'invalid phone' } };
    if (!Number.isFinite(time) || time <= 0 || time > MAX_TIME) return { status: 400, jsonBody: { error: 'invalid time' } };
    if (body.consent !== true) return { status: 400, jsonBody: { error: 'consent required' } };

    const table = await getTable();
    let existing = null;
    try { existing = await table.getEntity(PARTITION, phone); } catch (e) { if (e.statusCode !== 404) throw e; }

    const bestTime = Math.max(time, existing ? existing.bestTime : 0);
    await table.upsertEntity({
      partitionKey: PARTITION,
      rowKey: phone,
      bestTime,
      lastTime: time,
      plays: (existing ? existing.plays : 0) + 1,
      firstSeen: existing ? existing.firstSeen : new Date(),
      lastSeen: new Date(),
    }, 'Replace');

    return { jsonBody: { ok: true, bestTime, newBest: !existing || time > existing.bestTime } };
  },
});
