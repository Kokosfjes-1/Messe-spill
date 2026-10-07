const { app } = require('@azure/functions');
const { getTable, cleanTag, PARTITION } = require('../shared');
const { checkPassword, issueToken, adminOnly } = require('../auth');
const { PARAMS, readSettings, writeSettings } = require('../difficulty');

// Admin API used by /admin. Routes live under /api/manage because Azure Functions
// reserves routes starting with "admin".

const readJson = async req => { try { return await req.json(); } catch { return {}; } };
const noStore = { 'Cache-Control': 'no-store' };

app.http('manageLogin', {
  methods: ['POST'], authLevel: 'anonymous', route: 'manage/login',
  handler: async (req) => {
    const { password } = await readJson(req);
    if (!checkPassword(password)) {
      await new Promise(r => setTimeout(r, 1500)); // slow down password guessing
      return { status: 401, jsonBody: { error: 'wrong password' } };
    }
    return { headers: noStore, jsonBody: { token: issueToken() } };
  },
});

app.http('managePlayers', {
  methods: ['GET'], authLevel: 'anonymous', route: 'manage/players',
  handler: adminOnly(async () => {
    const table = await getTable();
    const players = [];
    for await (const r of table.listEntities({ queryOptions: { filter: `PartitionKey eq '${PARTITION}'` } })) {
      players.push({ phone: r.rowKey, tag: r.tag || '', bestTime: r.bestTime, lastTime: r.lastTime, plays: r.plays, firstSeen: r.firstSeen, lastSeen: r.lastSeen });
    }
    players.sort((a, b) => b.bestTime - a.bestTime);
    return { headers: noStore, jsonBody: players };
  }),
});

app.http('managePlayerUpdate', {
  methods: ['POST'], authLevel: 'anonymous', route: 'manage/players/update',
  handler: adminOnly(async (req) => {
    const { phone, tag } = await readJson(req);
    if (typeof phone !== 'string') return { status: 400, jsonBody: { error: 'phone required' } };
    const table = await getTable();
    try {
      await table.updateEntity({ partitionKey: PARTITION, rowKey: phone, tag: cleanTag(tag) }, 'Merge');
    } catch (e) {
      if (e.statusCode === 404) return { status: 404, jsonBody: { error: 'not found' } };
      throw e;
    }
    return { jsonBody: { ok: true, tag: cleanTag(tag) } };
  }),
});

app.http('managePlayerDelete', {
  methods: ['POST'], authLevel: 'anonymous', route: 'manage/players/delete',
  handler: adminOnly(async (req) => {
    const { phone } = await readJson(req);
    if (typeof phone !== 'string') return { status: 400, jsonBody: { error: 'phone required' } };
    const table = await getTable();
    try { await table.deleteEntity(PARTITION, phone); } catch (e) { if (e.statusCode !== 404) throw e; }
    return { jsonBody: { ok: true } };
  }),
});

app.http('managePlayersDeleteAll', {
  methods: ['POST'], authLevel: 'anonymous', route: 'manage/players/delete-all',
  handler: adminOnly(async (req) => {
    const { confirm } = await readJson(req);
    if (confirm !== 'SLETT') return { status: 400, jsonBody: { error: 'type SLETT to confirm' } };
    const table = await getTable();
    let deleted = 0;
    for await (const r of table.listEntities({ queryOptions: { filter: `PartitionKey eq '${PARTITION}'`, select: ['RowKey'] } })) {
      await table.deleteEntity(PARTITION, r.rowKey);
      deleted++;
    }
    return { jsonBody: { ok: true, deleted } };
  }),
});

app.http('manageSettings', {
  methods: ['GET', 'POST'], authLevel: 'anonymous', route: 'manage/settings',
  handler: adminOnly(async (req) => {
    if (req.method === 'POST') {
      const { master, values } = await readJson(req);
      const saved = await writeSettings(master, values);
      return { jsonBody: { ok: true, ...saved } };
    }
    const settings = await readSettings();
    return { headers: noStore, jsonBody: { params: PARAMS, ...settings } };
  }),
});
