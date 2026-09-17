const fs = require('fs');
let code = fs.readFileSync('src/db/dbService.ts', 'utf8');

// Replace everything with dummies because the frontend will use the new firestore Client SDK natively
const replacement = `
// Backend stub for dbService to prevent Node.js crashes
// All Real DB operations have been moved to the React frontend

export const dbGetClients = async () => [];
export const dbGetPackages = async () => [];
export const dbGetTransactions = async () => [];
export const dbGetAuditLogs = async () => [];
export const dbGetTrackingEvents = async () => [];
export const dbGetLearningQueue = async () => [];
export const dbGetAccessCodes = async () => [];
export const dbGetAiAgents = async () => [];
export const dbGetSystemMemory = async () => ({});
export const dbSaveSystemMemory = async () => {};
export const testFirestoreHealth = async () => ({ ok: true, status: 'MOCKED' });
export const initDbSeed = async () => {};

export const dbGetCategoryTaxonomy = async () => [];
export const dbSaveCategoryTaxonomyItem = async () => {};
export const dbGetCategoryProposals = async () => [];
export const dbSaveCategoryProposal = async () => {};

export const dbGetPendingSchemaChanges = async () => [];
export const dbSavePendingSchemaChange = async () => {};

export const dbGetHistory = async () => [];
export const dbSaveHistoryItem = async () => {};
export const dbDeleteHistoryItem = async () => {};

export const dbGetBannedDevices = async () => [];
export const dbSaveBannedDevice = async () => {};
export const dbDeleteBannedDevice = async () => {};

export const dbSaveClient = async () => {};
export const dbDeleteClient = async () => {};
export const dbSavePackage = async () => {};
export const dbDeletePackage = async () => {};
export const dbSaveTransaction = async () => {};
export const dbDeleteTransaction = async () => {};

export const dbGetQrisConfig = async () => ({});
export const dbSaveQrisConfig = async () => {};
export const dbGetContactSettings = async () => ({});
export const dbSaveContactSettings = async () => {};
export const dbGetLoginUiSettings = async () => ({});
export const dbSaveLoginUiSettings = async () => {};
export const dbGetUserUiSettings = async () => ({});
export const dbSaveUserUiSettings = async () => {};
export const dbSaveAiAgent = async () => {};
export const dbDeleteAiAgent = async () => {};
`;

fs.writeFileSync('src/db/dbService.ts', replacement);
console.log('Stubbed backend dbService successfully.');
