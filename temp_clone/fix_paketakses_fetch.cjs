const fs = require('fs');
let code = fs.readFileSync('src/components/views/PaketAksesView.tsx', 'utf8');

const regex = /try \{\s*const res = await fetch\('\/api\/packages'\);[\s\S]*?\} catch \(e\) \{\s*console\.warn\('\[PaketAksesView\] Failed fetching \/api\/packages:', e\);\s*\}/;

code = code.replace(regex, '');
fs.writeFileSync('src/components/views/PaketAksesView.tsx', code);
console.log('Patched PaketAksesView.tsx');
