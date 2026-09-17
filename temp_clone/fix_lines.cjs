const fs = require('fs');
let code = fs.readFileSync('src/components/views/LoginView.tsx', 'utf8');
let lines = code.split('\n');

// let's look for ATAU KODE AKSES
let toDelete = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ATAU KODE AKSES')) {
        console.log("Found at line: ", i + 1);
    }
}

// Just slice out lines 242 to 247 (0-indexed 241 to 246)
lines.splice(242, 5); 

fs.writeFileSync('src/components/views/LoginView.tsx', lines.join('\n'));
