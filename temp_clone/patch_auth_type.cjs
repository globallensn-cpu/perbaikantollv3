const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.ts', 'utf8');

code = code.replace("name: result.user.displayName || 'David Rohman'", "name: result.user.displayName || 'David Rohman',\n        loginTime: Date.now()");

fs.writeFileSync('src/lib/auth.ts', code);
