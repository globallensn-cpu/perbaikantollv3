const fs = require('fs');
const path = 'src/components/layouts/UserLayout.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace("role: 'admin',", "role: 'admin' as const, allowedFeatures: [], maxDailyTokens: 999, usageCount: 0,");
fs.writeFileSync(path, code);
