const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAuth.ts', 'utf8');

if (!code.includes("import { syncHistoryAsync } from '../lib/history';")) {
  code = code.replace("import {", "import { syncHistoryAsync } from '../lib/history';\nimport {");
  
  code = code.replace("setUserSession(newSession);\n          setSessionState(newSession);", "setUserSession(newSession);\n          setSessionState(newSession);\n          syncHistoryAsync(newSession.code);");
  
  fs.writeFileSync('src/hooks/useAuth.ts', code);
  console.log('Patched useAuth.ts successfully');
}
