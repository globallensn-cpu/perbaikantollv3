const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/viralHookPatterns: \[\{ id: 'hk_01', pattern: 'Jangan beli \[produk\] sebelum tau 3 hal ini!', category: 'umum', confidence: 95 \}\]/g, "viralHookPatterns: ['Jangan beli [produk] sebelum tau 3 hal ini!']");

fs.writeFileSync('server.ts', code);
