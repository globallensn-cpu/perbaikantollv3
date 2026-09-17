const fs = require('fs');
let code = fs.readFileSync('src/lib/admin/clients.ts', 'utf8');

const additions = `
export function updateClientStatus(id: string, newStatus: 'active' | 'expiring_soon' | 'expired' | 'suspended'): ClientItem[] {
  const current = getClients();
  const index = current.findIndex(c => c.id === id);
  if (index >= 0) {
    const updated = [...current];
    updated[index] = { ...updated[index], status: newStatus };
    saveClientAsync(updated[index]);
    localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function extendClientExpiry(id: string, daysToAdd: number): ClientItem[] {
  const current = getClients();
  const index = current.findIndex(c => c.id === id);
  if (index >= 0) {
    const updated = [...current];
    const client = updated[index];
    const expiry = new Date(client.expiryDate);
    expiry.setDate(expiry.getDate() + daysToAdd);
    client.expiryDate = expiry.toISOString();
    client.status = calculateClientStatus(client.expiryDate, client.status);
    saveClientAsync(client);
    localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function updateClientPackage(
  id: string,
  packageId: string,
  packageName: string,
  price: number,
  durationDays: number,
  maxDailyTokens: number,
  allowedFeatures: string[]
): ClientItem[] {
  const current = getClients();
  const index = current.findIndex(c => c.id === id);
  if (index >= 0) {
    const updated = [...current];
    const client = updated[index];
    client.packageId = packageId;
    client.packageName = packageName;
    client.price = price;
    client.maxDailyTokens = maxDailyTokens;
    client.allowedFeatures = allowedFeatures;
    client.startDate = new Date().toISOString();
    
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);
    client.expiryDate = expiry.toISOString();
    client.status = 'active';
    
    saveClientAsync(client);
    localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(updated));
    return updated;
  }
  return current;
}
`;

code = code + '\n' + additions;
fs.writeFileSync('src/lib/admin/clients.ts', code);
