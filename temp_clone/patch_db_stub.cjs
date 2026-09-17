const fs = require('fs');

let code = fs.readFileSync('src/db/dbService.ts', 'utf8');

const additionalStubs = `
export const dbGetApiKeys = async () => [];
export const dbSaveApiKeys = async () => {};
export const dbAddApiKeyLog = async () => {};
export const dbAddAuditLog = async () => {};
export const dbSaveAccessCode = async () => {};
export const dbDeleteAccessCode = async () => {};
export const dbGetApiKeyLogs = async () => [];
export const dbSaveApiKeyLogs = async () => {};
export const dbGetGrowthState = async () => ({});
export const dbSaveGrowthState = async () => {};
export const dbGetActiveGenerations = async () => ({});
export const dbSaveActiveGenerations = async () => {};
export const dbAddTrackingEvent = async () => {};
export const dbSaveLearningQueueItem = async () => {};
export const dbSaveAnnouncement = async () => {};
export const dbDeleteAnnouncement = async () => {};
export const dbGetAnnouncements = async () => [];
export const dbGetFormulas = async () => [];
export const dbSaveFormula = async () => {};
export const dbDeleteFormula = async () => {};
export const dbGetAffiliates = async () => [];
export const dbSaveAffiliate = async () => {};
export const dbDeleteAffiliate = async () => {};
`;

fs.writeFileSync('src/db/dbService.ts', code + '\n' + additionalStubs);
console.log('Added missing stubs to dbService.ts');
