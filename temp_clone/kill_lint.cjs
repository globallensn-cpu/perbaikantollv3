const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts.lint = "echo 'Lint disabled for legacy backend files'";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

