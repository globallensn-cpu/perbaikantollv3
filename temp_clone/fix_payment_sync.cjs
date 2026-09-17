const fs = require('fs');

let code = fs.readFileSync('src/lib/payment.ts', 'utf8');

// Replace fetch('/api/transactions/approve')
code = code.replace(/fetch\('\/api\/transactions\/approve'[\s\S]*?\}\);/g, "setDoc(doc(db, 'transactions', trxId), approvedTrx).catch(console.error);");

// Replace fetch('/api/transactions/reject')
code = code.replace(/fetch\('\/api\/transactions\/reject'[\s\S]*?\}\);/g, "setDoc(doc(db, 'transactions', trxId), rejectedTrx).catch(console.error);");

// Ensure submit/upload proof fetch is gone
code = code.replace(/fetch\('\/api\/transactions'[\s\S]*?\}\)\.catch\(\(\) => \{\}\);/g, "setDoc(doc(db, 'transactions', newTrx.id), newTrx).catch(console.error);");

fs.writeFileSync('src/lib/payment.ts', code);
