const fs = require('fs');
let lines = fs.readFileSync('src/components/views/LoginView.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('<button') && lines.slice(lines.indexOf(l), lines.indexOf(l)+10).some(x => x.includes('Login as Admin (Google)')));
if (start !== -1) {
    let end = start;
    while (!lines[end].includes('ATAU KODE AKSES') && end < lines.length) {
        end++;
    }
    // go a bit further to include the bottom divider
    while (!lines[end].includes('</div>') && end < lines.length) {
        end++;
    }
    // splice it out
    console.log(`Removing from ${start} to ${end}`);
    lines.splice(start, end - start + 1);
    fs.writeFileSync('src/components/views/LoginView.tsx', lines.join('\n'));
} else {
    console.log("Not found");
}
