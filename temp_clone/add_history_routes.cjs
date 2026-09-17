const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routes = `
  // History API
  app.get('/api/history', async (req, res) => {
    try {
      const code = req.query.accessCode || '';
      const history = await dbGetHistory(String(code));
      res.json(history);
    } catch (e) {
      res.status(500).json({ error: 'Failed to get history' });
    }
  });

  app.post('/api/history', async (req, res) => {
    try {
      await dbSaveHistoryItem(req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to save history item' });
    }
  });

  app.delete('/api/history/:id', async (req, res) => {
    try {
      await dbDeleteHistoryItem(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete history item' });
    }
  });
`;

if (!code.includes("app.get('/api/history'")) {
  code = code.replace("app.get('/api/health'", routes + "\n  app.get('/api/health'");
  fs.writeFileSync('server.ts', code);
  console.log('Routes added successfully');
} else {
  console.log('Routes already exist');
}
