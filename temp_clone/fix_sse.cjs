const fs = require('fs');
let code = fs.readFileSync('src/lib/sseManager.ts', 'utf8');

code = code.replace("import { hydrateDataFromServer } from './realtimeSync';", "import { syncClientsAsync } from './admin/clients';\nimport { syncHistoryAsync } from './history';\nfunction hydrateDataFromServer() { syncClientsAsync(); syncHistoryAsync(); }");

fs.writeFileSync('src/lib/sseManager.ts', code);
