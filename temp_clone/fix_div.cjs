const fs = require('fs');
let lines = fs.readFileSync('src/components/views/LoginView.tsx', 'utf8').split('\n');

// Find the line that has '</div>' right above '<div className="relative">'
let idx = lines.findIndex(l => l.includes('<div className="relative">'));
if (idx > 0 && lines[idx-1].trim() === '') idx--;
if (idx > 0 && lines[idx-1].includes('</div>')) {
    console.log("Removing stray </div>");
    lines.splice(idx-1, 1);
}

fs.writeFileSync('src/components/views/LoginView.tsx', lines.join('\n'));
