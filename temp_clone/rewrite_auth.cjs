const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.ts', 'utf8');

const replacement = `
import { loginWithGoogle, logoutGoogle } from './firebase';

export async function loginWithGoogleAdmin() {
  const result = await loginWithGoogle();
  if (result.success && result.user) {
    if (result.user.email === 'davidrohman037@gmail.com') {
      const session = {
        code: 'ADMIN_DAVID',
        role: 'admin',
        email: result.user.email,
        name: result.user.displayName || 'David Rohman'
      };
      setUserSession(session);
      return { success: true, session };
    }
  }
  return { success: false, error: 'Bukan admin atau login gagal' };
}
`;

if (!code.includes('loginWithGoogleAdmin')) {
  code = code.replace("export interface UserSession", replacement + "\nexport interface UserSession");
  
  // also patch verifyAccessCodeAsync to immediately succeed for ADMIN_DAVID
  code = code.replace("export async function verifyAccessCodeAsync(input: string)", "export async function verifyAccessCodeAsync(input: string) {\n  if (input === 'ADMIN_DAVID') return { success: true, role: 'admin', email: 'davidrohman037@gmail.com', name: 'David Rohman', code: 'ADMIN_DAVID' };");
  
  fs.writeFileSync('src/lib/auth.ts', code);
}
