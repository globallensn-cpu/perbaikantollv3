const fs = require('fs');
let code = fs.readFileSync('src/lib/admin/clients.ts', 'utf8');

const importStr = "import { collection, query, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';";
code = code.replace("import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';", importStr);

const snapshotCode = `
let unsubscribeClients: (() => void) | null = null;

export function subscribeToClients() {
  if (unsubscribeClients) return;
  if (!db) return;
  try {
    const clientsRef = collection(db, 'clients');
    unsubscribeClients = onSnapshot(clientsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as ClientItem);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event('satset_clients_updated'));
      }
    }, (error) => {
      console.warn('[Clients] Firestore subscription error:', error);
    });
  } catch (e) {
    console.warn('[Clients] Error setting up onSnapshot:', e);
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => subscribeToClients(), 2000);
}
`;

code = code + '\n' + snapshotCode;
fs.writeFileSync('src/lib/admin/clients_patched.ts', code);
