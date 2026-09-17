const fs = require('fs');
const path = 'src/views/admin/ClientMonitoringPanel.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("import { \n  getClients, \n  saveClients,", "import { \n  getClients, \n  saveClient,");
code = code.replace("saveClients(updated);", "updated.forEach(c => saveClient(c));");
code = code.replace("saveClients(clients);", "clients.forEach(c => saveClient(c));");
fs.writeFileSync(path, code);
