const fs = require('fs');
let code = fs.readFileSync('src/lib/admin/packages.ts', 'utf8');

const importFirestore = `
import { collection, doc, setDoc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
`;

code = code.replace("import { getUserSession } from '../auth';", "import { getUserSession } from '../auth';" + importFirestore);

const syncCode = `
let unsubscribePackages: (() => void) | null = null;

export function subscribeToPackages() {
  if (unsubscribePackages) return;
  if (!db) return;
  
  try {
    const packagesRef = collection(db, 'packages');
    unsubscribePackages = onSnapshot(packagesRef, (snapshot) => {
      const pkgs: PackageItem[] = [];
      snapshot.forEach(doc => {
        pkgs.push(doc.data() as PackageItem);
      });
      
      if (pkgs.length > 0) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_PACKAGES_KEY, JSON.stringify(pkgs));
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('satset_packages_updated'));
        }
      } else {
        // If empty, initialize with default?
      }
    }, (error) => {
      console.warn('[Packages] Firestore subscription error:', error);
    });
  } catch(e) {
    console.warn('[Packages] Error setting up onSnapshot:', e);
  }
}

// Ensure it's called
if (typeof window !== 'undefined') {
  setTimeout(() => subscribeToPackages(), 2000);
}
`;

code = code + '\n' + syncCode;

// Let's also patch savePackagesAsync to save to Firestore directly if admin?
// Wait, currently savePackages calls /api/admin/packages which maybe writes to a local json? Or does the backend already write to firestore?
fs.writeFileSync('src/lib/admin/packages_patched.ts', code);
