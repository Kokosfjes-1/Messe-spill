const { app } = require('@azure/functions');
const { getTable, PARTITION } = require('../shared');

// GET /api/top -> [{ time }, ...]  top 3 best times, never phone numbers
app.http('top', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'top',
  handler: async () => {
    const table = await getTable();
    const times = [];
    const rows = table.listEntities({ queryOptions: { filter: `PartitionKey eq '${PARTITION}'`, select: ['bestTime'] } });
    for await (const row of rows) times.push(row.bestTime);
    times.sort((a, b) => b - a);
    return {
      headers: { 'Cache-Control': 'no-store' },
      jsonBody: times.slice(0, 3).map(time => ({ time })),
    };
  },
});
