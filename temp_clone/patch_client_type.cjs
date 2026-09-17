const fs = require('fs');
let code = fs.readFileSync('src/lib/admin/clients.ts', 'utf8');

const replacement = `
export interface ClientItem {
  id: string;
  accessCode: string;
  name: string;
  email?: string;
  role: 'admin' | 'user';
  packageId: string;
  packageName?: string;
  price?: number;
  startDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'suspended' | 'expiring_soon';
  allowedFeatures: string[];
  maxDailyTokens: number;
  usageCount: number;
  createdAt?: string;
  type?: string;
  whatsapp?: string;
  customFeatures?: string[];
  toolUsage?: any;
  lastLoginAt?: number;
}
`;

code = code.replace(/export interface ClientItem \{[\s\S]*?createdAt\?: string;\n\}/, replacement);

fs.writeFileSync('src/lib/admin/clients.ts', code);
