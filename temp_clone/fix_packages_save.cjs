const fs = require('fs');
let code = fs.readFileSync('src/lib/admin/packages.ts', 'utf8');

const regex = /export async function savePackagesAsync\([\s\S]*?return \{ success: false[\s\S]*?\};\n\}/;

const replacement = `export async function savePackagesAsync(packages: PackageItem[], retries = 3): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PACKAGES_KEY, JSON.stringify(packages));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('satset_packages_updated'));
    }
  } catch (e) {
    console.warn('[Packages Lib] Error saving to localStorage:', e);
  }

  try {
    const batch = writeBatch(db);
    packages.forEach(pkg => {
      const docRef = doc(db, 'packages', pkg.id);
      batch.set(docRef, pkg);
    });
    // Also we might want to delete removed packages, but simple batch set is enough for now 
    // to sync the current packages (or the frontend just overrides whatever is there).
    await batch.commit();
    return { success: true };
  } catch (err: any) {
    console.warn('[savePackagesAsync] Error saving to Firestore:', err);
    return { success: false, error: err.message || 'Gagal menyimpan ke Firestore' };
  }
}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/lib/admin/packages.ts', code);
