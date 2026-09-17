const fs = require('fs');

function removeFetchTryBlock(filepath, regexStr) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, 'utf8');
  const tryFetchRegex = new RegExp(regexStr, 'g');
  code = code.replace(tryFetchRegex, '');
  fs.writeFileSync(filepath, code);
  console.log(`Patched ${filepath}`);
}

// Fix PackagePricingPanel.tsx
removeFetchTryBlock('src/views/admin/PackagePricingPanel.tsx', `try \\{\\s*const res = await fetch\\('/api/packages'\\);[\\s\\S]*?\\} catch \\(e\\) \\{\\s*console.warn[\\s\\S]*?\\}`);

// Fix PaymentVerificationPanel.tsx
removeFetchTryBlock('src/views/admin/PaymentVerificationPanel.tsx', `try \\{\\s*const res = await fetch\\('/api/transactions'\\);[\\s\\S]*?\\} catch \\(e\\) \\{\\s*console.warn[\\s\\S]*?\\}`);

// Fix CustomAccessPanel.tsx
removeFetchTryBlock('src/views/admin/CustomAccessPanel.tsx', `try \\{\\s*const session = getUserSession\\(\\);[\\s\\S]*?fetch\\('/api/admin/clients'[\\s\\S]*?\\}\\s*\\} catch \\(e\\) \\{[\\s\\S]*?\\}`);

