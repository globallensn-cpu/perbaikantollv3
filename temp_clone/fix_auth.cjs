const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.ts', 'utf8');

code = code.replace("export async function verifyAccessCodeAsync(input: string) {\n  if (input === 'ADMIN_DAVID') return { success: true, role: 'admin', email: 'davidrohman037@gmail.com', name: 'David Rohman', code: 'ADMIN_DAVID' };: Promise<{ success: boolean; role?: 'admin' | 'user'; email?: string; code?: string; name?: string; error?: string }> {", "export async function verifyAccessCodeAsync(input: string): Promise<{ success: boolean; role?: 'admin' | 'user'; email?: string; code?: string; name?: string; error?: string }> {\n  if (input === 'ADMIN_DAVID') return { success: true, role: 'admin', email: 'davidrohman037@gmail.com', name: 'David Rohman', code: 'ADMIN_DAVID' };");
fs.writeFileSync('src/lib/auth.ts', code);
