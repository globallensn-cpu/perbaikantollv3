const fs = require('fs');
let code = fs.readFileSync('src/components/views/LoginView.tsx', 'utf8');

// The button string starts with <button and ends with </div>
const btnRegex = /<button[\s\S]*?Login as Admin \(Google\)[\s\S]*?<\/button>\s*<div className="flex items-center gap-4 mb-6">[\s\S]*?<\/div>/g;
const matches = code.match(btnRegex);

if (matches && matches.length > 1) {
    // Keep only the first one
    let count = 0;
    code = code.replace(btnRegex, (match) => {
        count++;
        if (count === 1) return match;
        return '';
    });
    fs.writeFileSync('src/components/views/LoginView.tsx', code);
}
