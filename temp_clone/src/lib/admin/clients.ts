
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';


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


export const LOCAL_STORAGE_CLIENTS_KEY = 'satset_clients_v2';
export const DEFAULT_CLIENTS: ClientItem[] = [];

export function getClients(): ClientItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLIENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export const syncClientsAsync = async (): Promise<{ success: boolean }> => {
  try {
    const snapshot = await getDocs(collection(db, 'clients'));
    const data = snapshot.docs.map(doc => doc.data() as ClientItem);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(data));
      window.dispatchEvent(new Event('satset_clients_updated'));
    }
    return { success: true };
  } catch (e) {
    console.warn('Failed to sync clients from Firestore', e);
    return { success: false };
  }
};

export async function saveClientAsync(client: ClientItem) {
  try {
    await setDoc(doc(db, 'clients', client.id), client);
    await syncClientsAsync();
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed' };
  }
}

export async function deleteClientAsync(id: string) {
  try {
    await deleteDoc(doc(db, 'clients', id));
    await syncClientsAsync();
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed' };
  }
}

export function calculateClientStatus(expiryDateStr: string, currentStatus?: string): 'active' | 'expiring_soon' | 'expired' | 'suspended' {
  if (currentStatus === 'suspended') return 'suspended';
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
  if (diffDays <= 0) return 'expired';
  if (diffDays <= 7) return 'expiring_soon';
  return 'active';
}

export function saveClient(client: ClientItem): ClientItem[] {
  saveClientAsync(client);
  const current = getClients();
  const index = current.findIndex(c => c.id === client.id);
  let updated = [...current];
  if (index >= 0) updated[index] = client; else updated = [client, ...updated];
  localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteClient(id: string): ClientItem[] {
  deleteClientAsync(id);
  const current = getClients();
  const updated = current.filter(c => c.id !== id);
  localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(updated));
  return updated;
}


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
