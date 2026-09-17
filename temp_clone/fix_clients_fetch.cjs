const fs = require('fs');

function patchFile(filepath, apiEndpoint) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, 'utf8');
  
  // Replace fetch block with nothing, or just leave it since we're replacing the whole try block
  // A simpler regex:
  const tryFetchRegex = new RegExp(`try \\{\\s*const session = getUserSession\\(\\);[\\s\\S]*?fetch\\('${apiEndpoint}'[\\s\\S]*?\\}\\s*\\} catch \\(e\\) \\{[\\s\\S]*?\\}`, 'g');
  code = code.replace(tryFetchRegex, '');
  
  fs.writeFileSync(filepath, code);
  console.log(`Patched ${filepath}`);
}

patchFile('src/views/admin/ClientMonitoringPanel.tsx', '/api/admin/clients');
