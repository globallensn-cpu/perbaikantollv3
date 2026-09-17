const fs = require('fs');

let code = fs.readFileSync('src/lib/payment.ts', 'utf8');

// Replace syncTransactionsFromServer body
code = code.replace(/export async function syncTransactionsFromServer\(\): Promise<Transaction\[\]> \{[\s\S]*?return getAllTransactions\(\);\s*\}/, `export async function syncTransactionsFromServer(): Promise<Transaction[]> {
  return getAllTransactions();
}`);

// Replace fetchTransactionById body
code = code.replace(/export async function fetchTransactionById\(trxId: string\): Promise<Transaction \| null> \{[\s\S]*?return local;\s*\}/, `export async function fetchTransactionById(trxId: string): Promise<Transaction | null> {
  return getTransactionById(trxId);
}`);

fs.writeFileSync('src/lib/payment.ts', code);
