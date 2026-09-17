const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import { syncHistoryAsync } from './lib/history';")) {
  code = code.replace("import { initCrossTabSync } from './lib/crossTabSync';", "import { initCrossTabSync } from './lib/crossTabSync';\nimport { syncHistoryAsync } from './lib/history';");
  
  code = code.replace("const cleanupCrossTab = initCrossTabSync();", "const cleanupCrossTab = initCrossTabSync();\n    syncHistoryAsync();");
  
  fs.writeFileSync('src/App.tsx', code);
  console.log('Patched App.tsx successfully');
}
