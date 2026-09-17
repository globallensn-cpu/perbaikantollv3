const fs = require('fs');
let code = fs.readFileSync('src/lib/payment.ts', 'utf8');

// Replace submitTransaction fetch
code = code.replace(/fetch\('\/api\/transactions', \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(newTrx\),\s*\}\)\.catch\(\(\) => \{\}\);/g, "setDoc(doc(db, 'transactions', newTrx.id), newTrx).catch(console.error);");

// Replace uploadPaymentProof fetch
code = code.replace(/fetch\('\/api\/transactions\/proof', \{[\s\S]*?\}\);/g, "setDoc(doc(db, 'transactions', cleanId), targetTrx).catch(console.error);");

// Replace approveTransaction fetch
code = code.replace(/fetch\('\/api\/transactions\/approve', \{[\s\S]*?body: JSON\.stringify\(\{\s*id: trxId,[\s\S]*?\}\),\s*\}\);/g, "setDoc(doc(db, 'transactions', trxId), approvedTrx).catch(console.error);");

// Replace rejectTransaction fetch
code = code.replace(/fetch\('\/api\/transactions\/reject', \{[\s\S]*?body: JSON\.stringify\(\{\s*id: trxId,[\s\S]*?\}\),\s*\}\);/g, "setDoc(doc(db, 'transactions', trxId), rejectedTrx).catch(console.error);");

fs.writeFileSync('src/lib/payment_patched2.ts', code);
