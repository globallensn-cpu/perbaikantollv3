const fs = require('fs');
let code = fs.readFileSync('src/lib/payment.ts', 'utf8');

const importFirestore = "import { collection, query, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';\nimport { db } from './firebase';\n";

if (!code.includes('firebase/firestore')) {
  code = importFirestore + code;
}

const snapshotCode = `
let unsubscribeTransactions: (() => void) | null = null;

export function subscribeToTransactions() {
  if (unsubscribeTransactions) return;
  if (!db) return;
  try {
    const trxRef = collection(db, 'transactions');
    unsubscribeTransactions = onSnapshot(trxRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Transaction);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_TRX_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event('transactions-updated'));
      }
    }, (error) => {
      console.warn('[Transactions] Firestore subscription error:', error);
    });
  } catch (e) {
    console.warn('[Transactions] Error setting up onSnapshot:', e);
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => subscribeToTransactions(), 2000);
}
`;

if (!code.includes('subscribeToTransactions')) {
  code = code + '\n' + snapshotCode;
}

fs.writeFileSync('src/lib/payment.ts', code);
