const { app } = require('@azure/functions');
const { readSettings } = require('../difficulty');

// GET /api/settings -> { values }  difficulty the game should use (public, nothing secret)
app.http('settings', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'settings',
  handler: async () => {
    const { values } = await readSettings();
    return { headers: { 'Cache-Control': 'no-store' }, jsonBody: { values } };
  },
});
