const fs = require('fs');
let file = 'src/views/admin/PaymentVerificationPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /try\s*\{\s*const\s*res\s*=\s*await\s*fetch\('\/api\/transactions'\);[\s\S]*?\}\s*catch\s*\(e\)\s*\{\s*\}/g;
code = code.replace(regex, '');

// If it's a try-catch block with console.warn or something
const regex2 = /try\s*\{\s*const\s*res\s*=\s*await\s*fetch\('\/api\/transactions'\);[\s\S]*?\}\s*catch\s*\(e\)\s*\{[\s\S]*?\}/g;
code = code.replace(regex2, '');

fs.writeFileSync(file, code);
