const { app } = require('@azure/functions');
const { getTable, PARTITION } = require('../shared');

// GET /api/top -> [{ time, tag }, ...]  top 3 best times, never phone numbers
app.http('top', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'top',
  handler: async () => {
    const table = await getTable();
    const scores = [];
    const rows = table.listEntities({ queryOptions: { filter: `PartitionKey eq '${PARTITION}'`, select: ['bestTime', 'tag'] } });
    for await (const row of rows) scores.push({ time: row.bestTime, tag: row.tag || '' });
    scores.sort((a, b) => b.time - a.time);
    return {
      headers: { 'Cache-Control': 'no-store' },
      jsonBody: scores.slice(0, 3),
    };
  },
});
