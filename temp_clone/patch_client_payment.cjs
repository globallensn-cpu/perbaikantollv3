const fs = require('fs');

const path = 'src/lib/payment.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("saveClients(updated);", "updated.forEach(c => saveClient(c));");
code = code.replace("saveClients(clients);", "clients.forEach(c => saveClient(c));");
code = code.replace("import { getClients, saveClients } from './admin/clients';", "import { getClients, saveClient } from './admin/clients';");

fs.writeFileSync(path, code);
