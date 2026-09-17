
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
