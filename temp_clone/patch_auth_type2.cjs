const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.ts', 'utf8');

code = code.replace("role: 'admin',", "role: 'admin' as const,");

fs.writeFileSync('src/lib/auth.ts', code);
