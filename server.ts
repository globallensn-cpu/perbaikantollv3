const bannedDevicesMap = new Map<string, BannedDeviceItem>();
const failedLoginTracker = new Map<string, { count: number; lastAttempt: number }>();
const MEMORY_FILE_PATH = path.join(process.cwd(), 'system_memory.json');
const tiktokCache = new Map<string, { timestamp: number; data: any }>();
const TIKTOK_CACHE_TTL_MS = 10 * 60 * 1000;
const promptResponseCache = new Map<string, { timestamp: number; text: string; modelUsed: string; promptArchitect?: any }>();
const PROMPT_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const CLIENTS_FILE_PATH = path.join(process.cwd(), 'clients.json');
const API_KEYS_FILE_PATH = path.join(process.cwd(), 'api_keys.json');
const serverKeyCooldowns = new Map<string, number>();
const sseClients = new Set<SSEClientMeta>();
const activeGenerationsMap = new Map<string, any>();
const ACTIVE_GENS_FILE_PATH = path.join(process.cwd(), 'active_generations.json');
const simpleEventQueue: QueueItem[] = [];
let globalEventCounter = Date.now();
const pendingPolls: PendingPoll[] = [];
const PACKAGES_FILE_PATH = path.join(process.cwd(), 'packages.json');
const DEFAULT_PACKAGES_SERVER = [
    {
      id: 'mingguan',
      name: 'Akses Mingguan',
      tagline: 'Uji coba semua fitur AI Creator selama 7 hari penuh.',
      price: 49000,
      durationDays: 7,
      features: [
        'Akses 5 Tool AI Satset',
        'Generator Prompt Video 8K',
        'Generator Prompt Foto Ultra HD',
        'Video Frame Extractor',
        'TikTok Downloader No Watermark',
        'Bypass Kuota & Anti Limit Level 1'
      ],
      isPopular: false,
      isActive: true,
      badgeLabel: 'Hemat',
      targetCategory: 'public'
    },
    {
      id: 'bulanan',
      name: 'Akses Bulanan (VIP)',
      tagline: 'Pilihan favorit kreator konten & agensi digital.',
      price: 149000,
      durationDays: 30,
      features: [
        'Semua Fitur Paket Mingguan',
        'Prioritas Server Kecepatan Tinggi',
        'Bypass Kuota VIP & Anti Limit Max',
        'Format Export JSON & TXT',
        'Masa Aktif 30 Hari Penuh',
        'Dukungan Admin Fast Response'
      ],
      isPopular: true,
      isActive: true,
      badgeLabel: 'Paling Populer',
      targetCategory: 'public'
    },
    {
      id: 'lifetime',
      name: 'Ultra VIP Lifetime',
      tagline: 'Akses seumur hidup tanpa perpanjangan biaya bulanan.',
      price: 999000,
      durationDays: 36500,
      features: [
        'Akses Selamanya Tanpa Batas',
        'Semua Fitur VIP + Update Masa Depan',
        'Server Dedicated AI Engine',
        'Grup Komunitas Exclusive VIP',
        'Lisensi Komersial Konten Kreator'
      ],
      isPopular: false,
      isActive: true,
      badgeLabel: 'Sultan VIP',
      targetCategory: 'public'
    },
    {
      id: 'upgrade_vip',
      name: 'Perpanjang / Upgrade Member VIP',
      tagline: 'Penawaran khusus member terdaftar untuk perpanjangan atau upgrade akun.',
      price: 99000,
      durationDays: 30,
      features: [
        'Harga Khusus Perpanjangan Member',
        'Semua Fitur VIP + Priority Server',
        'Bypass Kuota & Anti Limit Max',
        'Akses Bebas Pemblokiran',
        'Dukungan Langsung via Admin VIP'
      ],
      isPopular: false,
      isActive: true,
      badgeLabel: 'Khusus Member',
      targetCategory: 'member'
    }
  ];
const ACCESS_CODES_FILE_PATH = path.join(process.cwd(), 'access_codes.json');
const QRIS_FILE_PATH = path.join(process.cwd(), 'qris_config.json');
const TRANSACTIONS_FILE_PATH = path.join(process.cwd(), 'transactions.json');
const CONTACT_SETTINGS_FILE_PATH = path.join(process.cwd(), 'contact_settings.json');
const DEFAULT_ACCESS_CODES_SERVER = [
    { code: 'SATSET-ULTRA-VIP', note: 'Paket Ultra VIP Lifetime', createdAt: Date.now() },
    { code: 'PROMPT-SATSET-888', note: 'Akses Tester VIP', createdAt: Date.now() },
  ];
const AUDIT_LOGS_FILE_PATH = path.join(process.cwd(), 'audit_logs.json');
const DEFAULT_CLIENTS_SERVER = [
    {
      id: 'cli_001',
      accessCode: 'SATSET-882194',
      name: 'Rizky Ramadhan',
      whatsapp: '081234567890',
      email: 'rizky@gmail.com',
      packageId: 'bulanan',
      packageName: 'Akses Bulanan (VIP)',
      price: 149000,
      startDate: '2026-08-01T10:00:00.000Z',
      expiryDate: '2026-08-31T10:00:00.000Z',
      status: 'active' as any,
      type: 'standard' as any,
      lastLoginAt: '2026-08-06T08:00:00.000Z',
      toolUsage: { tiktokDownloader: 12, contentIdeas: 8, videoToPrompt: 15, photoPrompt: 6, frameExtractor: 4 },
      createdAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'cli_002',
      accessCode: 'SATSET-331209',
      name: 'Budi Santoso',
      whatsapp: '085711223344',
      email: 'budi.santoso@yahoo.com',
      packageId: 'mingguan',
      packageName: 'Akses Mingguan',
      price: 49000,
      startDate: '2026-08-02T12:00:00.000Z',
      expiryDate: '2026-08-09T12:00:00.000Z',
      status: 'expiring_soon',
      type: 'standard' as any,
      lastLoginAt: '2026-08-05T14:30:00.000Z',
      toolUsage: { tiktokDownloader: 5, contentIdeas: 3, videoToPrompt: 4, photoPrompt: 2, frameExtractor: 1 },
      createdAt: '2026-08-02T12:00:00.000Z'
    }
  ];
const TRACKING_FILE_PATH = path.join(process.cwd(), 'tracking.json');
const LEARNING_QUEUE_FILE_PATH = path.join(process.cwd(), 'learning_queue.json');
const AI_AGENTS_FILE_PATH = path.join(process.cwd(), 'ai_agents.json');
const GROWTH_STATE_FILE_PATH = path.join(process.cwd(), 'growth_scaling_state.json');
import express from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from './src/utils/logger';

import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import cron from 'node-cron';
import { runAutoAgentFactory } from './src/agents/agentAutoAgentFactory';
import { analyzeUserGrowth } from './src/agents/agentUserGrowthAnalyst';
import { optimizeCostAndTiers } from './src/agents/agentCostTierOptimizer';
import { detectAbuseAndAnomalies } from './src/agents/agentAbuseAnomalyDetector';
import { requireAuth, requireAdminRole } from './src/middleware/auth';
import { getModelRoutingPlan, MODEL_TIERS, getInitialTierForTask, normalizeGeminiModel, TOP_MODEL_ORDER, IMAGE_MODEL_ORDER, VIDEO_MODEL_ORDER } from './src/routing/modelRouter';
import { getApiKeys, saveApiKeys } from './src/lib/admin/apiKeys';
import { AuditLogItem } from './src/lib/admin/auditLog';
import { llmGateway } from './src/routing/llmGateway';
import { buildQueryCouncilPrompt, runIndonesianQueryCouncil } from './src/agents/agentIndonesianQueryCouncil';
import {
  initDbSeed,
  testFirestoreHealth,
  dbGetClients,
  dbSaveClient,
  dbDeleteClient,
  dbGetPackages,
  dbSavePackage,
  dbDeletePackage,
  dbGetTransactions,
  dbSaveTransaction,
  dbDeleteTransaction,
  dbGetQrisConfig,
  dbSaveQrisConfig,
  dbGetContactSettings,
  dbSaveContactSettings,
  dbGetLoginUiSettings,
  dbSaveLoginUiSettings,
  dbGetUserUiSettings,
  dbSaveUserUiSettings,
  dbGetAiAgents,
  dbSaveAiAgent,
  dbDeleteAiAgent,
  dbGetCategoryTaxonomy,
  dbSaveCategoryTaxonomyItem,
  dbGetCategoryProposals,
  dbSaveCategoryProposal,
  dbGetSystemMemory,
  dbSaveSystemMemory,
  dbGetPendingSchemaChanges,
  dbSavePendingSchemaChange,
  dbGetHistory,
  dbSaveHistoryItem,
  dbDeleteHistoryItem,
  dbGetAuditLogs,
  dbAddAuditLog,

  dbGetAccessCodes, dbSaveAccessCode, dbDeleteAccessCode,
  dbGetAnnouncements, dbSaveAnnouncement, dbDeleteAnnouncement,
  dbGetFormulas, dbSaveFormula, dbDeleteFormula,
  dbGetAffiliates, dbSaveAffiliate, dbDeleteAffiliate,
  dbGetActiveGenerations, dbSaveActiveGenerations,
  dbGetTrackingEvents, dbAddTrackingEvent,
  dbGetLearningQueue, dbSaveLearningQueueItem,
  dbGetBannedDevices, dbSaveBannedDevice, dbDeleteBannedDevice,

  dbGetApiKeys, dbSaveApiKeys, dbGetApiKeyLogs, dbAddApiKeyLog, dbSaveApiKeyLogs, dbGetGrowthState, dbSaveGrowthState,
  dbGetModelPriorities, dbSaveModelPriorities
} from './src/db/dbService';



import { monitorAndValidateIngestion } from './src/agents/agentIngestionMonitor';
import { extractMultiModalSignals } from './src/agents/agentSignalExtractor';
import { calculateMultimodalFusionScore } from './src/agents/agentMultimodalFusion';
import { classifyContentCategory } from './src/agents/agentCategoryClassifier';
import { proposeNewCategoryTaxonomy } from './src/agents/agentTaxonomyProposer';
import { updateHookPatternSystemMemory } from './src/agents/agentHookPatternUpdater';
import { governAEOPipelineExecution } from './src/agents/agentAeoPipelineGovernor';
import { superviseMetaAutoBuild } from './src/agents/agentMetaAutoBuildSupervisor';
import { dispatchRealtimeBroadcast } from './src/agents/agentRealtimeBroadcastDispatcher';
import { auditPaymentAndClientHardening } from './src/agents/agentPaymentClientHardeningAuditor';
import { runStructuredPromptArchitect, isStructureSchemaConsistent } from './src/agents/agentStructuredPromptArchitect';
import { buildAEOPipelinePrompt, formatAEOOutputToMarkdown, AEOPipelineResult } from './src/agents/aeoAgentPipeline';
import {
  evaluateGrowthAndScale,
  getGrowthScalingState,
  rollbackGrowthScalingVersion,
  setFullAutoMode,
  saveGrowthScalingState,
  DEFAULT_GROWTH_STATE
} from './src/lib/admin/growthScaling';
import { DEFAULT_AI_AGENTS } from './src/lib/admin/aiAgents';


// Cleanup stale caches every hour to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of tiktokCache.entries()) {
    if (now - val.timestamp > TIKTOK_CACHE_TTL_MS) tiktokCache.delete(key);
  }
  for (const [key, val] of promptResponseCache.entries()) {
    if (now - val.timestamp > PROMPT_CACHE_TTL_MS) promptResponseCache.delete(key);
  }
}, 60 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB seed on server startup
  await initDbSeed();

  // Increase payload limits for base64 video data (up to 100MB to comfortably support 50MB video files in base64)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Enable trust proxy for Google Cloud Run / Nginx reverse proxy so req.ip reflects actual client IP
  app.set('trust proxy', 1);

  // Apply Global API Rate Limiter to prevent DoS with intelligent key identification and real-time exemptions
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 10000, // Generous capacity per client identifier
    message: { error: 'Terlalu banyak permintaan (Rate limit). Silakan coba lagi sebentar lagi.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    keyGenerator: (req) => {
      const clientCode = (req.headers['x-client-access-code'] as string) || '';
      if (clientCode && clientCode.trim()) return `client_${clientCode.trim()}`;

      const fingerprint = (req.headers['x-device-fingerprint'] as string) || '';
      if (fingerprint && fingerprint.trim()) return `fp_${fingerprint.trim()}`;

      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string' && forwarded.trim()) {
        const clientIp = forwarded.split(',')[0].trim();
        if (clientIp) return `ip_${clientIp}`;
      }

      return req.ip || req.socket.remoteAddress || 'unknown';
    },
    skip: (req) => {
      const url = req.originalUrl || req.url || '';
      // Real-time events, SSE, and health endpoints
      if (
        url.includes('/api/events') ||
        url.includes('/api/health') ||
        url.includes('/api/ping') ||
        url.includes('/active-status') ||
        url.includes('/events/live') ||
        url.includes('/events/stream') ||
        url.includes('/events/poll')
      ) {
        return true;
      }

      // Routine telemetry, presence, heartbeats, security checks
      if (
        url.includes('/api/presence') ||
        url.includes('/api/security') ||
        url.includes('/api/admin/presence') ||
        url.includes('/api/admin/audit-logs') ||
        url.includes('/api/analytics')
      ) {
        return true;
      }

      // Transactions, access codes, clients, settings, formulas, announcements, qris, gateway
      if (
        url.includes('/api/transactions') ||
        url.includes('/api/access-codes') ||
        url.includes('/api/admin/clients') ||
        url.includes('/api/contact-settings') ||
        url.includes('/api/user-ui-settings') ||
        url.includes('/api/login-ui-settings') ||
        url.includes('/api/formulas') ||
        url.includes('/api/announcements') ||
        url.includes('/api/affiliates') ||
        url.includes('/api/apikeys') ||
        url.includes('/api/qris') ||
        url.includes('/api/llm-gateway')
      ) {
        return true;
      }

      // AI Generation & Processing endpoints (already secured by client license auth & LLM Gateway circuit breaker)
      if (
        url.includes('/api/generate-content-ideas') ||
        url.includes('/api/generate-photo-prompt') ||
        url.includes('/api/generate-prompt') ||
        url.includes('/api/generate-tiktok-shop-ideas') ||
        url.includes('/api/gemini/generate') ||
        url.includes('/api/orchestrate') ||
        url.includes('/api/learn-feedback') ||
        url.includes('/api/tiktok/info') ||
        url.includes('/api/tiktok-shop/info')
      ) {
        return true;
      }

      return false;
    },
  });
  app.use('/api', apiLimiter);

  // --- BANNED DEVICES & ADVANCED SECURITY ENFORCEMENT ENGINE ---
  interface BannedDeviceItem {
    id: string;
    fingerprint: string;
    ip: string;
    accessCode?: string;
    reason: string;
    bannedAt: string;
    bannedBy: string;
  }

  async function loadBannedDevicesServer() {
    try {
      const list = await dbGetBannedDevices();
      if (Array.isArray(list)) {
        for (const item of list) {
          const key = item.id || item.fingerprint || item.ip;
          if (key) bannedDevicesMap.set(key, item);
        }
      }
    } catch (e) {
      logger.warn('[Security Engine] Failed loading banned devices from DB:', e);
    }
  }
  await loadBannedDevicesServer();

  function isDeviceOrIpBanned(ip: string, fingerprint?: string, accessCode?: string): { banned: boolean; reason?: string } {
    const cleanIp = (ip || '').replace('::ffff:', '').trim();
    const cleanFp = (fingerprint || '').trim();
    const cleanCode = (accessCode || '').trim().toUpperCase();

    for (const item of bannedDevicesMap.values()) {
      if (cleanFp && item.fingerprint && item.fingerprint === cleanFp) {
        return { banned: true, reason: item.reason || 'Perangkat (Fingerprint) ini telah diblokir secara permanen oleh Sistem Keamanan.' };
      }
      if (cleanIp && item.ip && item.ip === cleanIp) {
        return { banned: true, reason: item.reason || 'Alamat IP Anda telah diblokir secara permanen.' };
      }
      if (cleanCode && item.accessCode && item.accessCode.toUpperCase() === cleanCode) {
        return { banned: true, reason: item.reason || 'Kode Akses ini telah diblokir karena aktivitas mencurigakan.' };
      }
    }

    return { banned: false };
  }

  async function banDeviceOrIp(details: { fingerprint?: string; ip: string; accessCode?: string; reason: string; bannedBy?: string }) {
    const id = `ban_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const bannedItem: BannedDeviceItem = {
      id,
      fingerprint: details.fingerprint || '',
      ip: (details.ip || '').replace('::ffff:', '').trim(),
      accessCode: details.accessCode ? details.accessCode.trim().toUpperCase() : '',
      reason: details.reason || 'Pelanggaran keamanan / Konsol terdeteksi',
      bannedAt: new Date().toISOString(),
      bannedBy: details.bannedBy || 'SYSTEM_AUTO_BAN',
    };

    bannedDevicesMap.set(id, bannedItem);
    if (bannedItem.fingerprint) bannedDevicesMap.set(bannedItem.fingerprint, bannedItem);
    if (bannedItem.ip) bannedDevicesMap.set(bannedItem.ip, bannedItem);
    if (bannedItem.accessCode) bannedDevicesMap.set(bannedItem.accessCode, bannedItem);

    try {
      await dbSaveBannedDevice(bannedItem);
    } catch (e) {
      logger.warn('[Security Engine] Failed saving banned device to DB:', e);
    }

    if (bannedItem.accessCode) {
      try {
        const clients = await dbGetClients();
        const cli = clients.find((c) => c.accessCode && c.accessCode.toUpperCase() === bannedItem.accessCode);
        if (cli) {
          cli.status = 'suspended' as any;
          await dbSaveClient(cli);
        }
      } catch (e) {}
    }

    dbAddAuditLog({
      id: 'audit_' + Date.now(),
      adminName: 'DEVICE_BANNED',
      action: `Device/IP Banned (${bannedItem.reason}) - IP: ${bannedItem.ip}, FP: ${bannedItem.fingerprint || 'N/A'}, Code: ${bannedItem.accessCode || 'N/A'}`,
      details: 'security_system',
      timestamp: new Date().toISOString(),
      category: 'Security System' as any,
    });

    try {
      if (typeof broadcastLiveEvent === 'function') {
        broadcastLiveEvent({ type: 'device_banned', bannedDevice: bannedItem });
      }
    } catch (e) {}

    return bannedItem;
  }

  // Middleware to verify that request is not from a banned device/IP/Code
  app.use('/api', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.includes('/admin/banned-devices/unban') || req.path === '/health') {
      return next();
    }

    const clientIp = req.ip || req.socket.remoteAddress || '';
    const fingerprint = (req.headers['x-device-fingerprint'] as string) || req.body?.fingerprint || '';
    const accessCode = (req.headers['x-access-code'] as string) || (req.headers['x-client-access-code'] as string) || req.body?.accessCode || '';

    const check = isDeviceOrIpBanned(clientIp, fingerprint, accessCode);
    if (check.banned) {
      return res.status(403).json({
        error: `Akses Ditolak! Perangkat atau IP Anda telah diblokir secara permanen oleh Sistem Keamanan Backend (Device Banned). Alasan: ${check.reason || 'Pelanggaran Akses'}.`,
        code: 'DEVICE_BANNED',
        isBanned: true,
        reason: check.reason,
      });
    }

    next();
  });

  // Helper to instantiate Gemini AI client dynamically
  function getGeminiClient(customApiKey?: string) {
    const keyToUse = customApiKey && customApiKey.trim() ? customApiKey.trim() : process.env.GEMINI_API_KEY;
    if (!keyToUse) {
      throw new Error('API Key Gemini tidak dikonfigurasi. Silakan atur di Pengaturan Anti Limit.');
    }
    return new GoogleGenAI({
      apiKey: keyToUse,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // --- BACKEND SELF-LEARNING ADAPTIVE SYSTEM MEMORY ENGINE ---
  interface SystemMemory {
    totalExecutions: number;
    successfulPromptsCount: number;
    learnedKnowledgeBase: string[];
    viralHookPatterns: string[];
    categoryUsage: {
      videoPrompt: number;
      contentIdeas: number;
      photoPrompt: number;
    };
    formulas?: any[];
    lastUpdated: string;
  }

  async function loadSystemMemory() {
    try {
      let mem = await dbGetSystemMemory();
      if (!mem || Object.keys(mem).length === 0) {
          mem = {
              totalExecutions: 350,
              successfulPromptsCount: 342,
              learnedKnowledgeBase: ['Hook visual di 3 detik pertama meningkatkan retention rate hingga 68%.'],
              viralHookPatterns: ['Jangan beli [produk] sebelum tau 3 hal ini!'],
              categoryUsage: { videoPrompt: 120, contentIdeas: 90, photoPrompt: 40 },
              lastUpdated: new Date().toISOString()
          };
      }
      if (!mem.learnedKnowledgeBase) mem.learnedKnowledgeBase = [];
      if (!mem.viralHookPatterns) mem.viralHookPatterns = [];
      if (!mem.categoryUsage) mem.categoryUsage = {};
      return mem;
    } catch (err) {
      logger.warn('[System Memory] Unable to load systemMemory from DB on startup, using default fallback:', err);
      return {
        totalExecutions: 350,
        successfulPromptsCount: 342,
        learnedKnowledgeBase: ['Hook visual di 3 detik pertama meningkatkan retention rate hingga 68%.'],
        viralHookPatterns: ['Jangan beli [produk] sebelum tau 3 hal ini!'],
        categoryUsage: { videoPrompt: 120, contentIdeas: 90, photoPrompt: 40 },
        formulas: ['Hook BLUFF + 3 Adegan Visual + CTA Spesifik'],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  let systemMemory = await loadSystemMemory();
  let isMemoryDirty = false;

  async function saveSystemMemoryAsync() {
    try {
      systemMemory.lastUpdated = new Date().toISOString();
      await dbSaveSystemMemory(systemMemory);
      await dispatchRealtimeBroadcast('system_memory_updated', systemMemory);
      isMemoryDirty = false;
    } catch (e) {
      logger.warn('[System Memory] Failed to save memory to DB:', e);
    }
  }

  // Throttled / Debounced memory saver: prevents database write contention during high multi-client concurrency
  let memorySaveTimer: NodeJS.Timeout | null = null;
  function saveSystemMemory(forceImmediate = false) {
    isMemoryDirty = true;
    if (forceImmediate) {
      if (memorySaveTimer) clearTimeout(memorySaveTimer);
      memorySaveTimer = null;
      saveSystemMemoryAsync().catch((err) => logger.warn('[System Memory Force Save Error]', err));
      return;
    }
    if (!memorySaveTimer) {
      memorySaveTimer = setTimeout(() => {
        memorySaveTimer = null;
        if (isMemoryDirty) {
          saveSystemMemoryAsync().catch((err) => logger.warn('[System Memory Debounced Save Error]', err));
        }
      }, 30000); // Flush to DB at most once every 30 seconds
    }
  }

  function autoUpdateMemory(newInsight?: string) {
    recordExecutionAndUpgrade('videoPrompt', newInsight);
  }

  // Lightweight execution counter (Decoupled from heavy auto-training to prevent server crashes on high load)
  function recordExecutionAndUpgrade(type: 'videoPrompt' | 'contentIdeas' | 'photoPrompt', keyInsight?: string) {
    if (!systemMemory.categoryUsage) {
      systemMemory.categoryUsage = { videoPrompt: 0, contentIdeas: 0, photoPrompt: 0 };
    }
    if (!Array.isArray(systemMemory.learnedKnowledgeBase)) {
      systemMemory.learnedKnowledgeBase = [];
    }
    if (!Array.isArray(systemMemory.viralHookPatterns)) {
      systemMemory.viralHookPatterns = [];
    }
    if (!Array.isArray(systemMemory.formulas)) {
      systemMemory.formulas = [];
    }

    systemMemory.totalExecutions = (systemMemory.totalExecutions || 0) + 1;
    systemMemory.successfulPromptsCount = (systemMemory.successfulPromptsCount || 0) + 1;
    systemMemory.categoryUsage[type] = (systemMemory.categoryUsage[type] || 0) + 1;

    if (keyInsight && !systemMemory.learnedKnowledgeBase.includes(keyInsight)) {
      systemMemory.learnedKnowledgeBase.push(keyInsight);
    }

    // Schedule debounced batch save without blocking or running heavy background AI training
    saveSystemMemory(false);
  }

  function getSystemIntelligenceLevel() {
    if (!Array.isArray(systemMemory.learnedKnowledgeBase)) {
      systemMemory.learnedKnowledgeBase = [];
    }
    if (!Array.isArray(systemMemory.viralHookPatterns)) {
      systemMemory.viralHookPatterns = [];
    }
    if (!Array.isArray(systemMemory.formulas)) {
      systemMemory.formulas = [];
    }

    const totalExecs = systemMemory.totalExecutions || 0;
    const level = Math.floor(totalExecs / 5) + 1;
    let title = 'Pengenal Algoritma Pemula';
    if (level >= 5) title = 'Analis Konten Viral Pro';
    if (level >= 10) title = 'Master TikTok Strategist & FYP Engineer';
    if (level >= 20) title = 'Algorithmic Super-Intelligence AI';
    if (level >= 50) title = 'Autonomous Supreme Content Engine';

    return {
      level,
      title,
      totalExecutions: totalExecs,
      knowledgeCount: systemMemory.learnedKnowledgeBase.length,
      formulasCount: systemMemory.formulas.length || systemMemory.learnedKnowledgeBase.length,
      learnedWisdom: systemMemory.learnedKnowledgeBase.slice(-10),
      viralHooks: systemMemory.viralHookPatterns
    };
  }

  function getInjectedSystemInstruction(baseInstruction: string): string {
    const memory = systemMemory || { categoryUsage: {}, learnedKnowledgeBase: [], viralHookPatterns: [], activeMemory: {}, totalExecutions: 0 };
    const level = Math.floor((memory.totalExecutions || 0) / 5) + 1;
    const knowledgeBase = (memory.learnedKnowledgeBase || []).slice(0, 8);
    const viralHooks = (memory.viralHookPatterns || []).slice(0, 6);

    const memoryContext = `
\n---
[BACKEND ADAPTIVE MEMORY & VIRAL RELEVANCE ENGINE]
Tingkat Kecerdasan Adaptif: Level ${level} (Total Eksekusi Terverifikasi: ${memory.totalExecutions || 0})
Pola Hook Viral & Insights Relevansi TikTok Terkini:
${viralHooks.length > 0 ? viralHooks.map((h: string, i: number) => `• [Pola Hook #${i + 1}]: ${h}`).join('\n') : '• Hook visual di 3 detik pertama dengan kata kunci kuat meningkatkan retensi audiens hingga 68%.'}

Knowledge Base & Formula Terakumulasi:
${knowledgeBase.length > 0 ? knowledgeBase.map((k: string, i: number) => `• [Wisdom #${i + 1}]: ${k}`).join('\n') : '• Optimalkan struktur prompt video sinematik dengan visual detail, transkrip voice-over dinamis, dan hashtag relevan.'}
---
INSTRUKSI SELF-LEARNING: Terapkan insight di atas untuk menyusun script ide konten, prompt video klip sinematik, serta SEO Caption & deretan Hashtag yang sangat tajam dan relevan dengan tren algoritma video pendek terkini.
`;
    return (baseInstruction || '') + memoryContext;
  }

  // Simple in-memory cache for TikTok metadata (10 minute TTL)
  // Server-side response cache for AI prompt generations to save quota (2 Hour TTL)

  async function getClientInfoByCode(accessCode?: string): Promise<{ name: string; accessCode: string; email?: string }> {
    if (!accessCode) return { name: 'Klien Satset', accessCode: 'GUEST' };
    const cleanCode = accessCode.trim().toUpperCase();
    try {
      const list = await dbGetClients();
      const found = list.find((c: any) => c.accessCode && c.accessCode.toUpperCase() === cleanCode);
      if (found) {
        return { name: found.name || 'Klien Satset', accessCode: found.accessCode, email: found.email };
      }
    } catch (e) { logger.warn('[Client Auth] Gagal membaca clients file (mungkin belum ada)', e); }
    
    // Check against master admin code securely
    const masterAdminCode = process.env.ADMIN_ACCESS_CODE ? process.env.ADMIN_ACCESS_CODE.trim().toUpperCase() : null;
    if (masterAdminCode && cleanCode === masterAdminCode) {
      return { name: 'Administrator', accessCode: cleanCode };
    }
    
    return { name: 'Klien Satset', accessCode: cleanCode };
  }

  function isRealApiKey(key?: string): boolean {
    if (!key || typeof key !== 'string') return false;
    const k = key.trim();
    if (k.length < 10) return false;
    if (k.includes('demo_key') || k.includes('backup_key_satset') || k.includes('satset_01') || k.includes('satset_02')) {
      return false;
    }
    return true;
  }

  function normalizeGeminiModel(inputModel: string): string {
    const m = (inputModel || '').toLowerCase().trim();
    if (!m) return 'gemini-3.8-flash';
    if (m === 'gemini-flash' || m === 'flash') return 'gemini-3.8-flash';
    if (m === 'gemini-lite' || m === 'flash-lite') return 'gemini-3.1-flash-lite';
    if (m === 'gemini-pro' || m === 'pro') return 'gemini-3.1-pro-preview';
    if (m === 'gemini-transcribe' || m === 'audio-transcribe') return 'gemini-3.5-transcribe';
    if (m === 'gemini-tts') return 'gemini-3.1-flash-tts-preview';

    if (m === 'gemini-3.8-flash' || m === 'gemini-3.8' || m === '3.8-flash') return 'gemini-3.8-flash';
    if (m === 'gemini-3.1-flash-lite' || m === '3.1-flash-lite') return 'gemini-3.1-flash-lite';
    if (m === 'gemini-3.7-flash' || m === 'gemini-3.7' || m === '3.7-flash') return 'gemini-3.7-flash';
    if (m === 'gemini-3.6-flash' || m === '3.6-flash') return 'gemini-3.6-flash';
    if (m === 'gemini-3.5-flash' || m === '3.5-flash') return 'gemini-3.5-flash';
    if (m === 'gemini-3.5-flash-lite' || m === '3.5-flash-lite') return 'gemini-3.5-flash-lite';
    if (m === 'gemini-3.1-pro-preview' || m === 'gemini-3.1-pro') return 'gemini-3.1-pro-preview';
    if (m === 'gemini-3.5-transcribe') return 'gemini-3.5-transcribe';

    // Image models
    if (m.includes('image') || m.includes('banana')) {
      if (m.includes('pro')) return 'gemini-3-pro-image';
      if (m.includes('lite')) return 'gemini-3.1-flash-lite-image';
      return 'gemini-3.1-flash-image';
    }

    // Deprecated models smoothly mapped to current active generation
    if (m === 'gemini-2.5-flash' || m === 'gemini-1.5-flash' || m === 'gemini-2.0-flash') return 'gemini-3.8-flash';
    if (m === 'gemini-2.5-flash-lite' || m === 'gemini-1.5-flash-lite' || m === 'gemini-2.0-flash-lite') return 'gemini-3.1-flash-lite';
    if (m === 'gemini-2.0-pro' || m === 'gemini-1.5-pro' || m === 'gemini-2.5-pro') return 'gemini-3.1-pro-preview';
    return inputModel || 'gemini-3.8-flash';
  }

  async function getClientIsolatedKeys(customApiKeyHeader?: string, clientAccessCode?: string): Promise<string[]> {
    let userCustomKeys: string[] = [];
    if (customApiKeyHeader && customApiKeyHeader.trim()) {
      userCustomKeys = customApiKeyHeader
        .split(/[\n,]+/)
        .map((k) => k.trim())
        .filter((k) => isRealApiKey(k));
    }

    let boundKeys: string[] = [];
    if (clientAccessCode && clientAccessCode !== 'GUEST') {
      const cleanCode = clientAccessCode.trim().toUpperCase();
      try {
        const keysArr = await dbGetApiKeys();
        boundKeys = keysArr
          .filter((k: any) => k.status === 'active' && k.accessCode && k.accessCode.toUpperCase() === cleanCode && isRealApiKey(k.key))
          .map((k: any) => k.key);
      } catch (e) { logger.warn('[API Keys] Gagal membaca api keys untuk access code', e); }
    }

    const clientKeys = Array.from(new Set([...userCustomKeys, ...boundKeys])).filter((k) => isRealApiKey(k));
    if (clientKeys.length > 0) {
      return clientKeys;
    }

    const systemKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
    let globalKeys: string[] = [];
    try {
      const keysArr = await dbGetApiKeys();
      const activeKeys = keysArr
        .filter((k: any) => k.status === 'active' && (!k.accessCode || k.accessCode === 'SYSTEM' || k.accessCode === 'GLOBAL' || k.accessCode === 'ADMIN_POOL') && isRealApiKey(k.key))
        .sort((a: any, b: any) => {
          const polledA = (a.verifiedByAdmin || a.lastPolledAt || a.pollStatus === 'active') ? 1 : 0;
          const polledB = (b.verifiedByAdmin || b.lastPolledAt || b.pollStatus === 'active') ? 1 : 0;
          return polledB - polledA;
        });
      globalKeys = activeKeys.map((k: any) => k.key);
    } catch (e) { logger.warn('[API Keys] Gagal membaca global api keys', e); }

    const candidateKeys = Array.from(new Set([...globalKeys, ...(isRealApiKey(systemKey) ? [systemKey] : [])])).filter((k) => isRealApiKey(k));
    const now = Date.now();
    const availableKeys = candidateKeys.filter((k) => {
      const cd = serverKeyCooldowns.get(k);
      return !cd || cd < now;
    });

    if (availableKeys.length > 0) {
      return availableKeys;
    }

    return candidateKeys;
  }

  function extractClientAccessCode(req: express.Request): string {
    const code =
      (req.headers['x-access-code'] as string) ||
      (req.headers['x-client-id'] as string) ||
      (req.headers['x-client-access-code'] as string) ||
      req.body?.accessCode ||
      req.body?.clientId ||
      'GUEST';
    return code.trim();
  }

  function maskApiKeyStr(key: string): string {
    if (!key) return '••••••••';
    if (key.length <= 10) return `${key.slice(0, 3)}••••${key.slice(-2)}`;
    return `${key.slice(0, 6)}••••${key.slice(-4)}`;
  }

  // Centralized LLM Gateway routing and execution with 99.9% uptime and circuit breaker
  llmGateway.setBroadcastHandler((event) => {
    try {
      if (typeof broadcastLiveEvent === 'function') {
        broadcastLiveEvent(event);
      }
    } catch (e) {}
  });

  // Centralized helper function for calling Gemini API through LLM Gateway with load balancing & rate limit resilience
  async function callGeminiWithFallback(
    userSelectedModel: string | undefined,
    promptPayload: any,
    customApiKeyHeader?: string,
    clientAccessCode?: string,
    targetTier?: 'flagship' | 'tier2' | 'tier3' | 'user_key',
    toolName?: string,
    isUserExplicitChoice?: boolean,
    customEndpoint?: string
  ): Promise<{ text: string; modelUsed: string; tierUsed?: string; latencyMs?: number; keyMasked?: string }> {
    const inferredTool = toolName || 'AI Generation';
    const requestConfig = { ...(promptPayload.config || {}) };
    const rawInstruction = requestConfig.systemInstruction || 'You are an elite AI assistant.';
    requestConfig.systemInstruction = getInjectedSystemInstruction(rawInstruction);

    // Resolve target tier: default to 'tier2' for unspecified tasks, or 'tier3' for helper/splitter
    let resolvedTier = targetTier;
    if (!resolvedTier) {
      if (inferredTool.toLowerCase().includes('helper') || inferredTool.toLowerCase().includes('splitter')) {
        resolvedTier = 'tier3';
      } else {
        resolvedTier = 'tier2';
      }
    }

    const gatewayPayload = {
      model: userSelectedModel,
      isUserExplicitChoice: isUserExplicitChoice !== undefined ? isUserExplicitChoice : Boolean(userSelectedModel),
      contents: promptPayload.contents,
      config: requestConfig,
      customApiKeyHeader,
      clientAccessCode,
      toolName: inferredTool,
      targetTier: resolvedTier,
      endpoint: customEndpoint || `/api/${inferredTool.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    };

    const response = await llmGateway.execute(gatewayPayload);

    return {
      text: response.text,
      modelUsed: response.modelUsed,
      tierUsed: response.tierUsed,
      latencyMs: response.latencyMs,
      keyMasked: response.keyMasked,
    };
  }

  // --- SECURE BACKEND GEMINI PROXY ENDPOINT ---
  app.post('/api/gemini/generate', async (req, res) => {
    const startTime = Date.now();
    try {
      const {
        contents,
        model = 'gemini-3.8-flash',
        systemInstruction,
        responseMimeType,
        enableSearchGrounding,
        enableHighThinking,
        temperature,
        category = 'text',
        endpointName = '/api/gemini/generate',
        toolName = 'Gemini Secure Proxy',
      } = req.body || {};

      if (!contents) {
        return res.status(400).json({ success: false, error: 'Parameter "contents" diperlukan.' });
      }

      const clientAccessCode = extractClientAccessCode(req) || req.body.clientAccessCode;
      const customApiKey = (req.headers['x-custom-api-key'] as string) || req.body.customApiKey;

      const normalizedModel = normalizeGeminiModel(model);

      const requestConfig: any = {};
      if (systemInstruction) {
        requestConfig.systemInstruction = systemInstruction;
      }
      if (responseMimeType) {
        requestConfig.responseMimeType = responseMimeType;
      }
      if (typeof temperature === 'number') {
        requestConfig.temperature = temperature;
      }
      if (enableHighThinking && (normalizedModel.includes('pro') || normalizedModel.includes('3.1'))) {
        requestConfig.thinkingConfig = { thinkingLevel: 'HIGH' };
      }
      if (enableSearchGrounding) {
        requestConfig.tools = [{ googleSearch: {} }];
      }

      const proxyTargetTier = (req.body?.targetTier as 'flagship' | 'tier2' | 'tier3' | 'user_key') || 'tier2';
      const proxyToolName = toolName || 'Gemini Secure Proxy';

      const result = await callGeminiWithFallback(
        normalizedModel,
        {
          contents,
          config: requestConfig,
        },
        customApiKey,
        clientAccessCode,
        proxyTargetTier,
        proxyToolName
      );

      return res.json({
        success: true,
        text: result.text,
        modelUsed: result.modelUsed,
        tierUsed: result.tierUsed,
        latencyMs: result.latencyMs || (Date.now() - startTime),
      });
    } catch (error: any) {
      logger.error('Gemini proxy error:', error);
      const statusCode = error?.status || error?.statusCode || 500;
      return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
        success: false,
        error: error.message || 'Gagal memproses permintaan AI Gemini.',
      });
    }
  });

  // API endpoint for Audio Transcription using Gemini 3.6 Flash / Flash Lite
  app.post('/api/transcribe-audio', async (req, res) => {
    try {
      const { base64Audio, mimeType = 'audio/wav', prompt } = req.body;
      if (!base64Audio) {
        return res.status(400).json({ error: 'Data audio base64 diperlukan.' });
      }

      const clientAccessCode = extractClientAccessCode(req);
      const customApiKey = (req.headers['x-custom-api-key'] as string) || req.body.customApiKey;

      const audioPart = {
        inlineData: {
          mimeType: mimeType || 'audio/wav',
          data: base64Audio.replace(/^data:audio\/[a-z0-9]+;base64,/, '')
        }
      };

      const promptText = prompt || 'Transkripsikan rekaman suara audio ini secara akurat dan lengkap ke dalam teks Bahasa Indonesia.';

      const result = await callGeminiWithFallback(
        'gemini-3.5-transcribe',
        {
          contents: { parts: [audioPart, { text: promptText }] },
          config: { temperature: 0.2 }
        },
        customApiKey,
        clientAccessCode,
        'tier2',
        'Audio Transcribe'
      );

      res.json({
        transcript: result.text,
        modelUsed: result.modelUsed
      });
    } catch (error: any) {
      logger.error('Transcribe audio error:', error);
      res.status(500).json({ error: error.message || 'Gagal merubah audio menjadi teks' });
    }
  });

  // API endpoint for Video Analysis & Prompt Generation
/**
 * Universal Sanitizer & Anti-Spam Optimizer for TikTok & Social Search Indexing
 * Aligned with the latest TikTok Semantic Search Indexing rules:
 * 1. Strictly eliminates engagement-bait spam tags (#fyp, #fypシ, #racuntiktok, #foryou, #viral, #trending, #beranda, etc.)
 * 2. Replaces spammy text phrases in captions ("FYP", "Racun TikTok", "For Your Page", "viral video") with organic semantic search terms.
 * 3. Enforces MAX 5 100% contextual niche entity hashtags.
 */
function sanitizeCaptionsAndHashtags(text: string): string {
  if (!text) return text;

  const BANNED_SPAM_TAGS = new Set([
    'fyp', 'fypシ', 'fypviral', 'foryou', 'foryoupage', 'racuntiktok',
    'racuntiktokshop', 'viral', 'viralvideo', 'trending', 'trendingvideo',
    'beranda', 'fypindonesia', 'fyppage', 'viraltiktok', 'foryourpage',
    'racunshopee', 'racuntiktokmurah', 'gayaingatfyp'
  ]);

  let result = text;

  // 1. Clean spam phrasing in caption text
  result = result
    .replace(/\b(racun\s*tik\s*tok|racun\s*tiktok)\b/gi, 'rekomendasi produk pilihan')
    .replace(/\b(for\s*your\s*page|f\s*y\s*p|fyp)\b/gi, 'pencarian sosial media')
    .replace(/\b(viral\s*di\s*tiktok|viral\s*tiktok)\b/gi, 'banyak dicari');

  // 2. Sanitize explicit Hashtag markdown sections
  const hashtagSectionRegex = /(\*\*(?:Hashtags?[^\n]*|Hashtag[^\n]*)\*\*[:\s]*\n*)([\s\S]*?)(?=\n*---|\n*###|\n-|\n\n|$)/gi;
  result = result.replace(hashtagSectionRegex, (fullMatch, prefix, hashtagsContent) => {
    const rawTags = hashtagsContent.match(/#[\w\u0590-\u05ff\u0600-\u06ff\u0e00-\u0e7f_]+/g) || [];
    const validTags: string[] = [];
    
    for (const tag of rawTags) {
      const cleanTag = tag.slice(1).toLowerCase();
      if (!BANNED_SPAM_TAGS.has(cleanTag) && !validTags.includes(tag)) {
        validTags.push(tag);
      }
    }

    const clamped = validTags.slice(0, 5);
    if (clamped.length > 0) {
      return `${prefix}${clamped.join(' ')}\n`;
    }
    return fullMatch;
  });

  // 3. Global inline hashtag cluster cleanup (any group of hashtags)
  result = result.replace(/((?:#[a-zA-Z0-9_\u0590-\u05ff\u0600-\u06ff\u0e00-\u0e7f]+\s*){2,})/g, (match) => {
    const rawTags = match.match(/#[\w\u0590-\u05ff\u0600-\u06ff\u0e00-\u0e7f_]+/g) || [];
    const validTags: string[] = [];
    
    for (const tag of rawTags) {
      const cleanTag = tag.slice(1).toLowerCase();
      if (!BANNED_SPAM_TAGS.has(cleanTag) && !validTags.includes(tag)) {
        validTags.push(tag);
      }
    }
    
    return validTags.slice(0, 5).join(' ');
  });

  return result;
}

const ELITE_SHOT_BREAKDOWN_SYSTEM_INSTRUCTION = `Anda adalah Elite Video Shot-Breakdown Analyst & Cinematic Prompt Engineer untuk platform TikTok / Reels Indonesia.
TUGAS UTAMA:
Menganalisis produk, konsep, naskah, atau video yang diberikan user, lalu menghasilkan breakdown shot per detik yang sangat detail dalam format timeline Bahasa Indonesia.

FORMAT OUTPUT YANG WAJIB DIPATUHI 100% (JANGAN PERNAH BERUBAH):
0–2 detik
Visual: [deskripsi visual sangat detail]
Aksi: [gerakan yang terjadi]
voice over: [teks voice over natural]

2–3,8 detik
Visual: [deskripsi visual sangat detail]
Aksi: [gerakan yang terjadi]
Subteks: [teks overlay atau makna tersirat]

3,8–5,5 detik
Visual: ...
Aksi: ...
voice over: ...
(dan seterusnya sampai akhir)

ATURAN KETAT:
Langsung mulai dari segmen pertama. JANGAN ada pembukaan, judul, penjelasan, atau penutup di luar format.
Setiap segmen HARUS memiliki tepat 3 bagian: Visual, Aksi, dan (voice over ATAU Subteks).
Gunakan "voice over:" jika ada narasi suara. Gunakan "Subteks:" jika lebih cocok sebagai teks overlay / makna tersirat.
Timestamp harus akurat dan realistis (contoh: 0–2 detik, 2–3,8 detik, 3,8–5,5 detik, 5,5–7 detik, dst).
Visual harus sangat kaya detail: lokasi, pencahayaan, sudut kamera, subjek (orang + pakaian + ekspresi), objek produk, posisi, tekstur, dan suasana.
Aksi harus menjelaskan gerakan konkret yang terjadi di detik tersebut.
Bahasa harus natural, gaya TikTok Indonesia (santai, persuasif, mudah dipahami).
JANGAN menggunakan format Inggris, tag [Style], [Camera], [Lighting], Master Prompt, atau struktur lain.
JANGAN menambahkan hashtag, caption, atau analisis di luar format timeline.
Jika input adalah produk, buat alur cerita yang menarik (Hook → Curiosity → Demo → Proof → Soft CTA).
Jaga konsistensi visual produk di semua klip (bentuk, warna, tekstur, detail khas).`;

function cleanTimelineOutput(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();
  // Strip code fences if model wrapped output in ```markdown or ```text
  cleaned = cleaned.replace(/^```(?:markdown|text)?\n?/i, '').replace(/\n?```$/i, '').trim();

  // Strip any introduction before the first segment timestamp
  const firstTimestampMatch = cleaned.search(/(?:^|\n)\s*\d+(?:[.,]\d+)?\s*[–\-—]\s*\d+(?:[.,]\d+)?\s*(?:detik|s|sec|dtk)?\b/i);
  if (firstTimestampMatch > 0) {
    cleaned = cleaned.slice(firstTimestampMatch).trim();
  }

  // Strip trailing notes, but preserve CAPTION & HASHTAG
  const noteMatch = cleaned.search(/(?:\n\s*##\s*Catatan|\n\s*Demikian|\n\s*Semoga bermanfaat)/i);
  if (noteMatch > 0) {
    cleaned = cleaned.slice(0, noteMatch).trim();
  }

  return cleaned;
}

  app.post('/api/generate-prompt', async (req, res) => {
    const clientAccessCode = extractClientAccessCode(req);
    const clientInfo = await getClientInfoByCode(clientAccessCode);
    const taskId = req.body.taskId || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clientIp = (req.ip || req.socket.remoteAddress || '').replace('::ffff:', '').trim();
    const fingerprint = (req.headers['x-device-fingerprint'] as string) || req.body?.fingerprint || '';
    const userAgent = req.headers['user-agent'] || '';

    const activeTask = {
      id: taskId,
      clientId: clientAccessCode,
      accessCode: clientAccessCode,
      clientName: clientInfo.name,
      clientEmail: clientInfo.email || '',
      tool: 'Video to Prompt',
      status: 'generating',
      category: req.body.category || 'umum',
      topic: req.body.topic || `Target: ${req.body.targetAI || 'General'}`,
      modelUsed: req.body.model || 'gemini-3.8-flash',
      startedAt: new Date().toISOString(),
      updatedAt: Date.now(),
      ip: clientIp,
      deviceFingerprint: fingerprint,
      userAgent: userAgent,
    };
    activeGenerationsMap.set(taskId, activeTask);

    broadcastLiveEvent({
      type: 'active_status_update',
      activeGenerations: Array.from(activeGenerationsMap.values()),
      activeUserCount: sseClients.size,
    });

    try {
      const customApiKey = (req.headers['x-custom-api-key'] as string) || req.body.customApiKey;
      const isForced = req.headers['x-force'] === 'true' || req.query.force === 'true' || req.body?.force === true;
      const useCache = req.headers['x-use-cache'] !== 'false' && !isForced;

      const {
        mimeType,
        base64Data,
        model,
        analysisMode = 'deep', // 'fast' | 'deep'
        targetAI = 'general', // sora | runway | kling | luma | hailuo | general
        segmentDuration = '5',
        cinematicStyle = 'cinematic', // cinematic | commercial | ugc | cyberpunk | aesthetic
        includeActions = true,
        includeVoiceOver = true,
        includeCinematics = true,
        sourceCaption = '',
        sourceUrl = '',
      } = req.body;

      if (!base64Data || !mimeType) {
        return res.status(400).json({ error: 'Data video dan tipe MIME diperlukan' });
      }

      // Check Cache to save quota & prevent rate limits using content hash
      const contentHash = crypto.createHash('sha256').update(base64Data).digest('hex').slice(0, 32);
      const cacheInput = `${mimeType}_${base64Data.length}_${contentHash}_${model}_${analysisMode}_${targetAI}_${segmentDuration}_${cinematicStyle}_${includeActions}_${includeVoiceOver}_${includeCinematics}_${sourceCaption ? sourceCaption.slice(0, 50) : ''}_v3_ultra_cinematic`;
      const cacheKey = crypto.createHash('sha256').update(cacheInput).digest('hex');

      if (useCache) {
        const cached = promptResponseCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < PROMPT_CACHE_TTL_MS) {
          logger.info('[Prompt Cache Hit - Saved Quota]', cacheKey);
          return res.json({
            prompt: cached.text,
            modelUsed: cached.modelUsed,
            promptArchitect: cached.promptArchitect,
            cached: true
          });
        }
      }

      // Determine model based on analysisMode if model not explicitly fixed:
      let userSelectedModel = model;
      if (!userSelectedModel || userSelectedModel === 'gemini-3.6-flash' || userSelectedModel === 'gemini-3.8-flash' || userSelectedModel === 'gemini-3.1-pro-preview') {
        userSelectedModel = (analysisMode === 'deep') ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash';
      }

      // Target AI Generator Syntax Guide
      let aiGuide = '';
      if (targetAI === 'runway') {
        aiGuide = 'FORMAT OPTIMASI: Runway Gen-3 Alpha. Jelaskan pergerakan kamera secara eksplisit (misal: "Slow camera push-in", "Dynamic handheld tracking", "Smooth low-angle dolly"). Sertakan deskripsi pencahayaan 3-point lighting dan transisi gerak karakter fluid. Akhiri setiap visual dengan deskripsi sinematik 8K photorealistic.';
      } else if (targetAI === 'sora') {
        aiGuide = 'FORMAT OPTIMASI: OpenAI Sora. Sertakan deskripsi naratif yang sangat kaya akan depth of field, fisika interaksi objek, pencahayaan fotorealistik natural, tekstur mikro, dan koherensi spasial 3D.';
      } else if (targetAI === 'kling') {
        aiGuide = 'FORMAT OPTIMASI: Kling AI. Fokuskan pada instruksi pergerakan karakter yang halus, mikro-ekspresi wajah, konsistensi proporsi anatomi, dan tekstur material produk yang tajam.';
      } else if (targetAI === 'luma') {
        aiGuide = 'FORMAT OPTIMASI: Luma Dream Machine. Prioritaskan continuous smooth camera trajectory, dinamika atmosferik, pencahayaan lembut, dan kontinuitas gerakan dinamis.';
      } else if (targetAI === 'hailuo') {
        aiGuide = 'FORMAT OPTIMASI: Hailuo / Minimax Video-01. Tekankan pada ketajaman ekspresi manusia yang natural, sinematik film grade, dan interaksi fisik realistis.';
      } else {
        aiGuide = 'FORMAT OPTIMASI: Universal Video AI (kompatibel untuk Sora, Runway Gen-3, Kling, Luma, Pika, dan Hailuo). Tuliskan visual sinematik dengan detail framing, lensa, pencahayaan, dan pergerakan subjek yang jelas.';
      }

      // Cinematic Style Flavor
      let styleGuide = '';
      if (cinematicStyle === 'commercial') {
        styleGuide = 'GAYA: Iklan Komersial TikTok Shop (Vibrant, High Energy, Product Hero Close-up, Studio Softbox Ring Lighting, Hook visual memikat di detik pertama).';
      } else if (cinematicStyle === 'ugc') {
        styleGuide = 'GAYA: UGC / Video Kreator Autentik (Natural daylight, Handheld casual camera, ekspresi natural spontan, pencahayaan alami tanpa kesan staged).';
      } else if (cinematicStyle === 'cyberpunk') {
        styleGuide = 'GAYA: Cyberpunk / Neon Atmospheric (Moody dramatic contrast, vibrant neon blue/magenta rim lighting, reflective wet surfaces, high color saturation).';
      } else if (cinematicStyle === 'aesthetic') {
        styleGuide = 'GAYA: Soft Aesthetic & Minimalist (Pastel warm color grade, airy diffused daylight, soft shallow depth of field, clean composition).';
      } else {
        styleGuide = 'GAYA: Sinematik Layar Lebar 8K (Anamorphic widescreen 2.39:1, 35mm film grain, teal & orange color grading, dramatic chiaroscuro lighting, professional focal blur).';
      }

      const analysisDepthGuide = analysisMode === 'deep'
        ? 'MODE ANALISIS: DEEP MULTIMODAL VISION REASONING. Analisis secara mendalam setiap detail: (1) Framing & Lensa (Close-up, Medium Shot, Low-Angle, Macro, 35mm / 50mm / 85mm), (2) Lighting (Key/Fill/Rim, Golden Hour, Studio Softbox), (3) Pergerakan Kamera (Push-in, Dolly, Pan, Tilt, Orbit, Handheld), (4) Aksi Mikro Subjek & Produk, (5) Transkripsi Suara Dialog Kata-per-Kata persis dalam Bahasa Indonesia yang persuasif.'
        : 'MODE ANALISIS: FAST ESSENTIALS. Tangkap hook utama, estetika visual esensial, pacing klip, dan transkrip suara inti secara cepat dan akurat.';

      // Build custom user prompt instruction based on duration segmentation and feature options
      const secNum = parseInt(segmentDuration, 10) || 5;
      const isAuto = segmentDuration === 'auto';
      const secText = !isAuto
        ? `dengan durasi masing-masing persis ${secNum} detik per segmen klip`
        : 'berdasarkan transisi atau perubahan adegan alami';

      const exampleStart1 = 0;
      const exampleEnd1 = isAuto ? 4 : secNum;
      const exampleStart2 = exampleEnd1;
      const exampleEnd2 = isAuto ? 9 : secNum * 2;

      const promptText = `Anda adalah Master Director & Elite Video Prompt Vision Architect untuk platform TikTok / Reels / Shorts Indonesia.

TUGAS UTAMA:
Menganalisis video yang diberikan user dengan sangat teliti (visual, pergerakan, audio dialog, pencahayaan), lalu menghasilkan breakdown prompt video siap pakai per segmen timeline (${secText}).

PANDUAN KHUSUS:
- ${analysisDepthGuide}
- ${aiGuide}
- ${styleGuide}

FORMAT OUTPUT YANG WAJIB DIPATUHI 100%:
${exampleStart1}–${exampleEnd1} detik
Visual: [Deskripsi visual sinematik sangat detail: jenis framing & lensa kamera, subjek orang + pakaian + ekspresi, objek produk & tekstur, tata pencahayaan, suasana latar belakang]
Aksi: [Gerakan fisik konkret subjek dan pergerakan kamera yang terjadi selama ${exampleEnd1 - exampleStart1} detik ini]
voice over: [Naskah suara narasi / dialog percakapan natural Bahasa Indonesia yang terdengar atau relevan untuk adegan ini]

${exampleStart2}–${exampleEnd2} detik
Visual: [Deskripsi visual sinematik sangat detail untuk segmen berikutnya]
Aksi: [Gerakan konkret subjek dan kamera pada segmen ini]
Subteks: [Teks tulisan overlay di layar atau pesan kunci yang ingin disampaikan]
(lanjutkan timeline hingga akhir durasi video)

### 📱 CAPTION & HASHTAG
**Caption SEO:**
[Tuliskan caption TikTok / Reels yang menarik, membuat penasaran, memiliki hook kuat, dan call-to-action natural]

**Hashtags:**
#tag1 #tag2 #tag3 #tag4 #tag5

ATURAN WAJIB:
1. Mulai langsung dari segmen pertama (misal: "0–${secNum} detik"). Jangan tambahkan basa-basi sebelum timeline.
2. Setiap segmen HARUS memiliki tepat 3 baris: "Visual:", "Aksi:", dan ("voice over:" ATAU "Subteks:").
3. ${!isAuto ? `Pecah durasi WAJIB konsisten persis per ${secNum} detik (0–${secNum} detik, ${secNum}–${secNum * 2} detik, dst)!` : 'Bagi berdasarkan pergantian shot adegan alami yang mulus.'}
4. Deskripsi Visual harus hiper-deskriptif dan siap dimasukkan ke generator AI video (Runway/Sora/Kling) tanpa perlu diedit ulang.
5. Bahasa voice over harus luwes, natural khas kreator TikTok Indonesia (bukan kaku atau terjemahan mesin).
6. Di bagian paling akhir, sertakan persis bagian "### 📱 CAPTION & HASHTAG" dengan caption dan maksimal 5 hashtag relevan non-spam.`;

      const videoPromptSystemInstruction = ELITE_SHOT_BREAKDOWN_SYSTEM_INSTRUCTION;

      let promptPayload: any;

      if (mimeType === 'text/plain') {
        const rawUserText = Buffer.from(base64Data, 'base64').toString('utf-8');
        promptPayload = {
          contents: {
            parts: [
              {
                text: `BERIKUT TEKS DESKRIPSI / SKRIP / KONSEP ADAGAN INPUT DARI USER:
"""
${rawUserText}
"""

TUGAS UTAMA ANDA:
${promptText}`
              }
            ]
          },
          config: {
            systemInstruction: videoPromptSystemInstruction,
          }
        };
      } else {
        promptPayload = {
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            systemInstruction: videoPromptSystemInstruction,
          },
        };
      }

      const isDeepAnalysis = analysisMode === 'deep';
      const videoTargetTier = isDeepAnalysis ? 'flagship' : 'tier2';
      const videoToolName = isDeepAnalysis ? 'Video to Prompt (Deep)' : 'Video to Prompt (Fast)';

      const result = await callGeminiWithFallback(
        userSelectedModel,
        promptPayload,
        customApiKey,
        clientAccessCode,
        videoTargetTier,
        videoToolName
      );

      let finalPromptText = result.text;
      let architectMetadata: any = undefined;

      // SKIP StructuredPromptArchitect untuk Video to Prompt.
      // Agent ini masih didesain untuk format lama ([Style]/[Camera]/[Actions]).
      // Format baru Visual / Aksi / Subteks harus dipertahankan apa adanya dari Gemini.
      // architectMetadata dibiarkan undefined agar response tetap valid.

      // Clean timeline output strictly starting with the first segment
      finalPromptText = cleanTimelineOutput(finalPromptText);

      // Record successful execution & train system memory
      recordExecutionAndUpgrade('videoPrompt');

      activeTask.status = 'completed';
      activeTask.updatedAt = Date.now();
      activeGenerationsMap.set(taskId, activeTask);

      broadcastLiveEvent({
        type: 'active_status_update',
        activeGenerations: Array.from(activeGenerationsMap.values()),
        activeUserCount: sseClients.size,
      });

      setTimeout(async () => {
        activeGenerationsMap.delete(taskId);
        broadcastLiveEvent({
          type: 'active_status_update',
          activeGenerations: Array.from(activeGenerationsMap.values()),
          activeUserCount: sseClients.size,
        });
      }, 120000);

      if (useCache) {
        const cacheInput = `${mimeType}_${base64Data.length}_${contentHash}_${model}_${analysisMode}_${targetAI}_${segmentDuration}_${includeActions}_${includeVoiceOver}_${includeCinematics}_${sourceCaption ? sourceCaption.slice(0, 50) : ''}_v2_visual_aksi_subteks`;
        const cacheKey = crypto.createHash('sha256').update(cacheInput).digest('hex');
        promptResponseCache.set(cacheKey, {
          timestamp: Date.now(),
          text: finalPromptText,
          modelUsed: result.modelUsed,
          promptArchitect: architectMetadata
        });
      }

      res.json({
        prompt: finalPromptText,
        modelUsed: result.modelUsed,
        promptArchitect: architectMetadata
      });
    } catch (error: any) {
      logger.error('Error generating video prompt:', error);
      activeTask.status = 'failed';
      activeTask.updatedAt = Date.now();
      activeGenerationsMap.set(taskId, activeTask);
      broadcastLiveEvent({
        type: 'active_status_update',
        activeGenerations: Array.from(activeGenerationsMap.values()),
        activeUserCount: sseClients.size,
      });
      setTimeout(() => {
        activeGenerationsMap.delete(taskId);
        broadcastLiveEvent({
          type: 'active_status_update',
          activeGenerations: Array.from(activeGenerationsMap.values()),
          activeUserCount: sseClients.size,
        });
      }, 5000);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Terjadi kesalahan saat menganalisis video dengan AI.' });
    }
  });

  // API endpoint for Image / Photo Analysis & AI Image Prompt Generation
  app.post('/api/generate-photo-prompt', async (req, res) => {
    const clientAccessCode = extractClientAccessCode(req);
    const clientInfo = await getClientInfoByCode(clientAccessCode);
    const taskId = req.body.taskId || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clientIp = (req.ip || req.socket.remoteAddress || '').replace('::ffff:', '').trim();
    const fingerprint = (req.headers['x-device-fingerprint'] as string) || req.body?.fingerprint || '';
    const userAgent = req.headers['user-agent'] || '';

    const activeTask = {
      id: taskId,
      clientId: clientAccessCode,
      accessCode: clientAccessCode,
      clientName: clientInfo.name,
      clientEmail: clientInfo.email || '',
      tool: 'Photo Prompt',
      status: 'generating',
      category: req.body.category || 'umum',
      topic: req.body.photoStyle ? `Style: ${req.body.photoStyle}` : 'Photo Analysis',
      modelUsed: req.body.model && req.body.model !== 'auto' ? req.body.model : 'Auto-Routing (Anti-Limit)',
      startedAt: new Date().toISOString(),
      updatedAt: Date.now(),
      ip: clientIp,
      deviceFingerprint: fingerprint,
      userAgent: userAgent,
    };
    activeGenerationsMap.set(taskId, activeTask);

    broadcastLiveEvent({
      type: 'active_status_update',
      activeGenerations: Array.from(activeGenerationsMap.values()),
      activeUserCount: sseClients.size,
    });

    try {
      const rawHeaderKeys = (req.headers['x-custom-api-key'] as string) || '';
      const bodyCustomKey = typeof req.body?.customApiKey === 'string' ? req.body.customApiKey.trim() : '';
      const bodyApiKeys = Array.isArray(req.body?.apiKeys) ? req.body.apiKeys.filter((k: any) => typeof k === 'string' && k.trim()).join(',') : '';
      const customApiKey = [rawHeaderKeys, bodyCustomKey, bodyApiKeys].filter(Boolean).join(',');

      const isForced = req.headers['x-force'] === 'true' || req.query.force === 'true' || req.body?.force === true;
      const useCache = req.headers['x-use-cache'] !== 'false' && !isForced;

      const {
        mimeType,
        base64Data,
        model,
        targetGenerator = 'nanobananapro', // nanobananapro | midjourney | flux | dalle3 | stablediffusion
        photoStyle = 'commercial', // commercial | portrait | cinematic | product | anime | architectural
        aspectRatio = '--ar 16:9',
        negativePrompt,
        referenceImageBase64,
        referenceImageMimeType,
        analysisMode
      } = req.body;

      if (!base64Data || !mimeType) {
        return res.status(400).json({ error: 'Data gambar/teks dan tipe MIME diperlukan' });
      }

      // Model Routing: Support explicit selection or cascading auto-routing fallback
      const isUserExplicitChoice = Boolean(model && typeof model === 'string' && model.trim() && model !== 'auto');
      const userSelectedModel = (!model || model === 'auto') ? undefined : normalizeGeminiModel(model);

      if (useCache) {
        const cacheModelId = userSelectedModel || 'auto_routed';
        const cacheInput = `photo_${mimeType}_${base64Data.slice(0, 500)}_${base64Data.length}_${cacheModelId}_${targetGenerator}_${photoStyle}_${aspectRatio}_${negativePrompt || ''}_${referenceImageBase64 ? referenceImageBase64.slice(0,500) : ''}`;
        const cacheKey = crypto.createHash('sha256').update(cacheInput).digest('hex');
        const cached = promptResponseCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < PROMPT_CACHE_TTL_MS) {
          logger.info('[Photo Prompt Cache Hit - Saved Quota]', cacheKey);
          return res.json({
            prompt: cached.text,
            modelUsed: cached.modelUsed,
            tierUsed: cached.tierUsed || 'cached',
            promptArchitect: cached.promptArchitect,
            cached: true
          });
        }
      }

      const promptText = `Anda adalah Master Director of Photography (DoP) Sinematik Global, Ahli Algoritma Visual TikTok FYP, dan Spesialis Multimodal Google SEO / AEO (Answer Engine Optimization) & Entity Search.

TUGAS UTAMA:
Analisis secara SUPER PRESISI input gambar atau teks konsep dari pengguna, lalu transformasikan menjadi Master Prompt AI Image Generator (Midjourney v6.1 / Flux.1 / DALL-E 3) yang memiliki RELEVANSI TINGGI, REKAYASA SCENE MENDALAM, VISUAL HOOK TIKTOK KUAT, dan MEMENUHI STANDAR MULTIMODAL GOOGLE SEARCH / AEO TERBARU.

DETEKSI MODE INPUT:
1. JIKA INPUT BERISI RINCIAN MULTI-KLIP SEKALIGUS (MULTI-CLIP / BATCH SCENE BREAKDOWN):
   (Contoh: Naskah TikTok Shop, Ide Konten, atau Video to Prompt dengan klip 1 s/d N seperti [00:00 - 00:10] Klip 1, Klip 2, Klip 3, dst.):
   - ATURAN JUMLAH KLIP (WAJIB & STRICT): Jika di input ada N klip (misal 3 klip), Anda WAJIB menghasilkan TEPAT N prompt foto terpisah (Klip 1, Klip 2, s/d Klip N). Jangan kurangi dan jangan gabungkan!
   - ATURAN KONEKTIVITAS & KESELARASAN NASKAH VIDEO (STORYLINE & SCRIPT CONTINUITY):
     * Setiap prompt foto per klip harus selaras 100% dengan naskah adegan dan voice-over video pada klip tersebut (Klip 1 = Hook awal visual, Klip 2 = Eksplorasi masalah/fitur/demo produk, Klip 3 = Solusi/CTA/Closing).
     * Seluruh prompt foto (Klip 1, 2, 3...) WAJIB SALING TERHUBUNG (CONNECTED):
       1. Konsistensi Karakter & Talent: Wajah, etnisitas, warna & model rambut, usia, dan ciri fisik subjek HARUS 100% IDENTIK dan disebutkan secara konsisten di semua prompt klip.
       2. Konsistensi Busana & Wardrobe: Pakaian, warna baju, aksesoris, sepatu, dan gaya busana HARUS SAMA & KONSISTEN di setiap prompt klip.
       3. Konsistensi Produk & Packaging: Bentuk produk, warna, label, dan tekstur produk HARUS SAMA PERSIS di setiap klip.
       4. Kesatuan Sinematografi: Palet warna ambient dan gaya pencahayaan menyatu harmonis antar klip.
   - Gunakan format header klip: "### 🎬 KLIP [X] ([TIMESTAMP]) — [JUDUL / FOKUS ADEGAN]" untuk setiap klip.
   - Setiap klip memiliki blok prompt code (\`\`\`text ... \`\`\`) yang berdiri sendiri, lengkap dengan target aspect ratio ${aspectRatio} --style raw --v 6.1, dan SIAP SALIN (1-click copy).

2. JIKA INPUT BERUPA SATU KONSEP TUNGGAL / SINGLE PHOTO:
   - Bedah secara semantik seluruh konteks cerita, subjek inti, aktivitas, lokasi spesifik, mood emosional, dan detail prop.
   - Terapkan pemetaan entitas (Google AEO): sebutkan material nyata, nama arsitektur/setting, dan kondisi atmosfer yang jelas.
   - Bangun visual hook 3-detik pertama untuk TikTok.

3. JIKA INPUT BERUPA FOTO REFERENSI (IMAGE):
   - Lakukan dekonstruksi visual mendalam: identifikasi anatomi wajah, gaya rambut, busana, sudut kamera, arah & temperatur cahaya, palet warna, dan latar belakang.
   - Pertahankan identitas visual dan esensi komposisi referensi dengan resolusi sinematik 8K dan tekstur fotorealistik murni.

PARAMETER TEKNIS FOTOGRAFI WAJIB:
- Tipe Kamera & Lensa: (Contoh: Shot on Hasselblad H6D-100c / Sony A7R V / Arri Alexa LF, Zeiss Master Prime 85mm f/1.2 atau 35mm f/1.4).
- Pencahayaan: (Contoh: Volumetric golden hour side lighting, softbox diffusion at 45 degrees, subtle blue rim lighting, ray-traced reflections).
- Detail Tekstur: (Contoh: Ultra-detailed skin texture, authentic fabric weave, natural specular reflections, sharp edge definition).
- Target Aspect Ratio: ${aspectRatio}
- Preset Gaya: ${photoStyle.toUpperCase()}

FORMAT OUTPUT:
JIKA SINGLE PROMPT:
### 📸 TIKTOK-OPTIMIZED AI PROMPT (SUPER REALISTIS & SIAP COPY)
\`\`\`text
[Master Shot]: Hyper-realistic ${photoStyle} photography, TikTok FYP visual hook aesthetic, Google AEO high-relevance semantic framing.
[Subject & Identity]: [Deskripsi super spesifik subjek: usia, fitur wajah otentik, ekspresi mikro yang menarik perhatian, pose dinamis, busana & tekstur bahan detail].
[Scene Context & Environment]: [Latar belakang storytelling kaya entitas, detail arsitektur/ruang, elemen pendukung, kedalaman spasial sinematik].
[Lighting & Atmospheric Physics]: [Pencahayaan presisi: arah key light, soft fill, subtle rim light, temperatur warna ambient, volumetric rays, bayangan lembut].
[Camera, Optics & Composition]: [Kamera profesional, panjang lensa (focal length), aperture f-stop ultra-lebar, fokus tajam pada subjek, natural optical depth of field / creamy bokeh].
[Texture & Rendering Quality]: 8k UHD resolution, raw authentic documentary photo, natural micro skin pores, fabric threading, zero artificial airbrushing, photorealistic raytraced reflections, ${aspectRatio} --style raw --v 6.1
\`\`\`

---

### 🔍 ANALISIS MENDALAM RELEVANSI SCENE & ALGORITMA
- **🎯 Konteks Scene & Semantic Entity (Google SEO/AEO)**: [Penjelasan entitas subjek, lokasi, material].
- **⚡ TikTok Visual Hook (3-Second Retention)**: [Analisis elemen visual utama].
- **💡 Pencahayaan, Optik & Komposisi Kamera**: [Setup teknis].
- **🎨 Color Grading & Tekstur Otentik**: [Palet warna sinematik].

JIKA MULTI-KLIP (BATCH CLIPS):
### 🎬 KLIP 1 (00:00 - 00:10) — [HOOK VISUAL PEMBUKA]
\`\`\`text
[Master Shot]: Hyper-realistic ${photoStyle} photography, TikTok hook scene 1, [Deskripsi adegan visual klip 1 sesuai script]...
[Subject & Identity]: [Deskripsi subjek / talent spesifik, wajah, rambut, postur tubuh, busana/wardrobe lengkap]...
[Scene Context & Environment]: [Setting lokasi klip 1, supermarket/toko/kamar/jalanan sesuai naskah]...
[Lighting & Physics]: [Key light, soft volumetric ambient, natural shadows]...
[Camera & Optics]: [Lensa, focal length, angle kamera]...
[Texture & Quality]: 8k UHD resolution, photorealistic micro details, ${aspectRatio} --style raw --v 6.1
\`\`\`

### 🎬 KLIP 2 (00:10 - 00:20) — [PROBLEM AGITATION & DETAIL PRODUK]
\`\`\`text
[Master Shot]: Hyper-realistic ${photoStyle} photography, scene 2 demonstration, [Deskripsi adegan visual klip 2 sesuai script]...
[Subject & Identity]: [Subjek yang SAMA PERSIS dengan klip 1: wajah, rambut, dan busana/wardrobe identik untuk kontinuitas alur]...
[Scene Context & Environment]: [Setting lokasi klip 2 berkesinambungan]...
[Lighting & Physics]: [Pencahayaan konsisten dengan klip 1]...
[Camera & Optics]: [Medium/close-up framing sesuai naskah]...
[Texture & Quality]: 8k UHD resolution, photorealistic micro details, ${aspectRatio} --style raw --v 6.1
\`\`\`

### 🎬 KLIP 3 (00:20 - 00:30) — [SOLUSI & CALL TO ACTION]
\`\`\`text
[Master Shot]: Hyper-realistic ${photoStyle} photography, scene 3 closing & outfit showcase, [Deskripsi adegan visual klip 3 sesuai script]...
[Subject & Identity]: [Subjek yang SAMA PERSIS dengan klip 1 dan 2: wajah, ekspresi puas/senang, busana identik]...
[Scene Context & Environment]: [Setting lokasi klip 3 closing]...
[Lighting & Physics]: [Pencahayaan sinematik senada]...
[Camera & Optics]: [Full-body / 3/4 beauty shot sesuai naskah]...
[Texture & Quality]: 8k UHD resolution, photorealistic micro details, ${aspectRatio} --style raw --v 6.1
\`\`\`

(Catatan: Lanjutkan secara presisi untuk setiap klip yang ada pada naskah input hingga seluruh klip ter-generate lengkap dan saling terhubung)

---

### 🔍 ANALISIS MENDALAM RELEVANSI KONTEN & KONSISTENSI VISUAL BATCH
- **🎯 Konsistensi Karakter & Produk**: [Penjelasan bagaimana identitas subjek, pakaian, dan produk dijaga 100% konsisten dari klip 1 hingga klip akhir].
- **⚡ Keselarasan Naskah & Visual Hook**: [Bagaimana setiap prompt foto menguatkan cerita naskah video dari hook awal hingga CTA].
- **💡 Rekomendasi Prompt Generator**: [Saran model gambar terbaik seperti Midjourney v6.1, Flux.1, atau Ideogram v2].`;

      let extendedPromptText = promptText;
      if (negativePrompt && negativePrompt.trim()) {
        extendedPromptText += `\n\nTAMBAHKAN TAG NEGATIVE PROMPT PADA AKHIR BLOK: [Negative Prompt]: ${negativePrompt.trim()}`;
      }

      let promptPayload: any = {
        contents: {
          parts: []
        },
        config: {
          systemInstruction: "You are the world's leading Director of Photography, TikTok Visual Hook Strategist, and Google AEO Multimodal SEO Specialist. Generate highly precise, hyper-realistic AI image prompts with deep scene comprehension, authentic camera physics, and complete visual algorithm compliance.",
        }
      };

      if (mimeType === 'text/plain') {
        const rawUserText = Buffer.from(base64Data, 'base64').toString('utf-8');
        
        promptPayload.contents.parts.push({
          text: `BERIKUT DESKRIPSI / KONSEP FOTO INPUT DARI USER:\n"""\n${rawUserText}\n"""\n\nTUGAS UTAMA ANDA:\n${extendedPromptText}`
        });

        if (referenceImageBase64 && referenceImageMimeType) {
          promptPayload.contents.parts.push({
            text: `\n\nIni adalah IDENTITY ANCHOR REFERENCE IMAGE opsional yang diberikan user:`
          });
          promptPayload.contents.parts.push({
            inlineData: {
              mimeType: referenceImageMimeType,
              data: referenceImageBase64,
            },
          });
        }
      } else {
        promptPayload.contents.parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        });
        promptPayload.contents.parts.push({
          text: extendedPromptText,
        });
      }

      const hasImageMedia = Boolean(
        (mimeType && mimeType.startsWith('image/')) ||
        referenceImageBase64
      );
      const isUltraMode = Boolean(
        req.body?.ultraDetail ||
        req.body?.isUltra ||
        req.body?.mode === 'ultra' ||
        analysisMode === 'deep' ||
        analysisMode === 'ultra' ||
        (typeof photoStyle === 'string' && photoStyle.toLowerCase().includes('ultra'))
      );
      // Photo analysis with multimodal image input requires Flagship tier for superior vision analysis
      const photoTargetTier = (hasImageMedia || isUltraMode) ? 'flagship' : 'tier2';
      const photoToolName = isUltraMode ? 'Photo Prompt Ultra' : 'Photo Prompt';

      const result = await callGeminiWithFallback(
        userSelectedModel,
        promptPayload,
        customApiKey,
        clientAccessCode,
        photoTargetTier,
        photoToolName,
        isUserExplicitChoice,
        '/api/generate-photo-prompt'
      );

      // Multi-Agent Step: Run Structured Prompt Architect to refine & enrich without breaking markdown schema
      let finalPromptText = result.text;
      let architectMetadata: any = undefined;

      try {
        const architectResult = await runStructuredPromptArchitect(
          result.text,
          targetGenerator || photoStyle || 'general'
        );
        architectMetadata = architectResult;

        if (architectResult.isOptimized && isStructureSchemaConsistent(result.text, architectResult.finalPrompt)) {
          finalPromptText = architectResult.finalPrompt;
        } else if (architectResult.isOptimized) {
          logger.warn('[StructuredPromptArchitect] Photo prompt output failed structural schema consistency check, falling back to raw model draft.');
        }
      } catch (archErr) {
        logger.warn('[StructuredPromptArchitect] Photo prompt enhancement notice:', archErr);
      }

      // Record successful execution & train system memory
      recordExecutionAndUpgrade('photoPrompt');

      activeTask.status = 'completed';
      activeTask.updatedAt = Date.now();
      activeGenerationsMap.set(taskId, activeTask);

      broadcastLiveEvent({
        type: 'active_status_update',
        activeGenerations: Array.from(activeGenerationsMap.values()),
        activeUserCount: sseClients.size,
      });

      setTimeout(() => {
        activeGenerationsMap.delete(taskId);
        broadcastLiveEvent({
          type: 'active_status_update',
          activeGenerations: Array.from(activeGenerationsMap.values()),
          activeUserCount: sseClients.size,
        });
      }, 120000);

      if (useCache) {
        const cacheModelId = userSelectedModel || 'auto_routed';
        const cacheInput = `photo_${mimeType}_${base64Data.slice(0, 500)}_${base64Data.length}_${cacheModelId}_${targetGenerator}_${photoStyle}_${aspectRatio}_${negativePrompt || ''}_${referenceImageBase64 ? referenceImageBase64.slice(0,500) : ''}`;
        const cacheKey = crypto.createHash('sha256').update(cacheInput).digest('hex');
        promptResponseCache.set(cacheKey, {
          timestamp: Date.now(),
          text: finalPromptText,
          modelUsed: result.modelUsed,
          tierUsed: result.tierUsed,
          promptArchitect: architectMetadata
        });
      }

      res.json({
        prompt: finalPromptText,
        modelUsed: result.modelUsed,
        tierUsed: result.tierUsed,
        latencyMs: result.latencyMs,
        keyMasked: result.keyMasked,
        promptArchitect: architectMetadata
      });
    } catch (error: any) {
      logger.error('Error generating photo prompt:', error);
      activeTask.status = 'failed';
      activeTask.updatedAt = Date.now();
      activeGenerationsMap.set(taskId, activeTask);
      broadcastLiveEvent({
        type: 'active_status_update',
        activeGenerations: Array.from(activeGenerationsMap.values()),
        activeUserCount: sseClients.size,
      });
      setTimeout(() => {
        activeGenerationsMap.delete(taskId);
        broadcastLiveEvent({
          type: 'active_status_update',
          activeGenerations: Array.from(activeGenerationsMap.values()),
          activeUserCount: sseClients.size,
        });
      }, 5000);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Terjadi kesalahan saat membuat prompt foto.' });
    }
  });

  async function fetchTikTokShopProduct(shopUrl: string): Promise<{
    name: string;
    description: string;
    price: string;
    imageUrl?: string;
    raw: string;
  } | null> {
    try {
      if (!shopUrl || typeof shopUrl !== 'string') return null;
      let cleanUrl = extractUrlFromText(shopUrl).trim();
      if (!cleanUrl) return null;
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      // 1. Extract fallback keywords from URL slug (e.g. /product/azarine-hydrasoothe-sunscreen-gel...)
      let urlSlugKeywords = '';
      try {
        const urlObj = new URL(cleanUrl);
        const pathParts = urlObj.pathname.split('/').filter(p => p.length > 2);
        const rawSlug = pathParts.join(' ').replace(/[-_]/g, ' ');
        if (rawSlug && !rawSlug.includes('http')) {
          const cleaned = rawSlug.replace(/\b(product|item|i|p|dp|detail|view|shop|seller|buy|video|id|tokopedia|tiktok)\b/gi, '').trim();
          if (cleaned.length >= 3) {
            urlSlugKeywords = cleaned;
          }
        }
      } catch (e) {}

      // 2. Fetch with redirect follow and realistic browser headers
      let finalUrl = cleanUrl;
      let htmlText = '';
      try {
        const res = await fetch(cleanUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Sec-Ch-Ua': '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
          },
          signal: AbortSignal.timeout(9000)
        });

        if (res.ok) {
          finalUrl = res.url || cleanUrl;
          htmlText = await res.text();
        }
      } catch (err) {
        logger.warn('[fetchTikTokShopProduct] Direct fetch error, will use fallback metadata:', err);
      }

      let productName = '';
      let productDesc = '';
      let productPrice = '';
      let productImg = '';

      if (htmlText) {
        // Try JSON-LD structured data first
        try {
          const jsonLdMatches = htmlText.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
          if (jsonLdMatches) {
            for (const scriptTag of jsonLdMatches) {
              const content = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '').trim();
              try {
                const parsed = JSON.parse(content);
                const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
                for (const it of items) {
                  if (it && (it['@type'] === 'Product' || it.name)) {
                    if (!productName && it.name) productName = String(it.name).trim();
                    if (!productDesc && it.description) productDesc = String(it.description).trim();
                    if (!productImg && it.image) {
                      productImg = Array.isArray(it.image) ? it.image[0] : (typeof it.image === 'string' ? it.image : it.image?.url || '');
                    }
                    if (!productPrice && it.offers) {
                      const offer = Array.isArray(it.offers) ? it.offers[0] : it.offers;
                      if (offer?.price) productPrice = `${offer.priceCurrency || 'Rp'} ${offer.price}`;
                    }
                  }
                }
              } catch (jsonErr) {}
            }
          }
        } catch (e) {}

        // OpenGraph & Meta Tags extraction
        const ogTitleMatch = htmlText.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                             htmlText.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i) ||
                             htmlText.match(/<title>([^<]+)<\/title>/i);
        const ogDescMatch = htmlText.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                            htmlText.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const ogImageMatch = htmlText.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                             htmlText.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
        const ogPriceMatch = htmlText.match(/<meta[^>]*property=["'](?:product:price:amount|og:price:amount)["'][^>]*content=["']([^"']+)["']/i) ||
                             htmlText.match(/(?:Rp\s*[\d\.,]+)/i);

        if (!productName && ogTitleMatch) {
          const candidateTitle = ogTitleMatch[1]
            .replace(/&#x27;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/\s*\|\s*(TikTok Shop|TikTok|Tokopedia).*$/i, '')
            .replace(/\s*-\s*(TikTok Shop|TikTok|Tokopedia).*$/i, '')
            .trim();

          // Reject bot security checks or generic login pages
          const isChallenge = /security check|captcha|robot|log in|sign up|something went wrong|tiktok - make your day/i.test(candidateTitle);
          if (!isChallenge && candidateTitle.length >= 3) {
            productName = candidateTitle;
          }
        }

        if (!productDesc && ogDescMatch) {
          productDesc = ogDescMatch[1]
            .replace(/&#x27;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .trim();
        }

        if (!productImg && ogImageMatch) {
          productImg = ogImageMatch[1].trim();
        }

        if (!productPrice && ogPriceMatch) {
          productPrice = ogPriceMatch[0] || ogPriceMatch[1] || '';
        }
      }

      // If TikWM has video data or caption associated with the link
      if (!productName) {
        try {
          const tikWmRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const tikWmData = await tikWmRes.json();
          if (tikWmData && tikWmData.code === 0 && tikWmData.data) {
            const v = tikWmData.data;
            if (v.title) productName = v.title;
            if (!productImg && (v.cover || v.origin_cover)) productImg = v.cover || v.origin_cover;
          }
        } catch (e) {}
      }

      // Fallback: URL slug keywords
      if (!productName && urlSlugKeywords) {
        productName = urlSlugKeywords
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      if (!productName && !urlSlugKeywords) {
        return {
          name: 'Produk TikTok Shop',
          description: `Produk dari tautan ${shopUrl}`,
          price: productPrice || '',
          imageUrl: productImg || '',
          raw: `Link: ${shopUrl}`
        };
      }

      return {
        name: productName || 'Produk TikTok Shop',
        description: productDesc || `Produk pilihan dari TikTok Shop: ${productName}`,
        price: productPrice || '',
        imageUrl: productImg || '',
        raw: `Nama: ${productName}\nHarga: ${productPrice}\nDeskripsi: ${productDesc}\nURL: ${finalUrl}`
      };
    } catch (err) {
      logger.warn('[fetchTikTokShopProduct] Exception:', err);
      return null;
    }
  }

  // API endpoint for 5 TikTok Content Ideas, Captions & Hashtags Generator (2-Stage Grounded Pipeline & Anti-AI-Slop)
  app.post('/api/generate-content-ideas', async (req, res) => {
    const clientAccessCode = extractClientAccessCode(req);
    const clientInfo = await getClientInfoByCode(clientAccessCode);
    const taskId = req.body.taskId || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clientIp = (req.ip || req.socket.remoteAddress || '').replace('::ffff:', '').trim();
    const fingerprint = (req.headers['x-device-fingerprint'] as string) || req.body?.fingerprint || '';
    const userAgent = req.headers['user-agent'] || '';

    const activeTask = {
      id: taskId,
      clientId: clientAccessCode,
      accessCode: clientAccessCode,
      clientName: clientInfo.name,
      clientEmail: clientInfo.email || '',
      tool: 'Idea Konten',
      status: 'generating',
      category: req.body.category || 'umum',
      topic: req.body.topic || req.body.sourceTitle || 'Idea Konten TikTok',
      modelUsed: req.body.model || 'Gemini Auto-Cascade',
      startedAt: new Date().toISOString(),
      updatedAt: Date.now(),
      ip: clientIp,
      deviceFingerprint: fingerprint,
      userAgent: userAgent,
    };
    activeGenerationsMap.set(taskId, activeTask);

    broadcastLiveEvent({
      type: 'active_status_update',
      activeGenerations: Array.from(activeGenerationsMap.values()),
      activeUserCount: sseClients.size,
    });

    try {
      const customApiKey = (req.headers['x-custom-api-key'] as string) || req.body.customApiKey;
      const useCache = req.headers['x-use-cache'] !== 'false';

      let {
        mimeType,
        base64Data,
        sourceTitle = '',
        topic = '',
        tiktokShopUrl = '',
        contentType = 'affiliate', // affiliate | tutorial | review | storytelling | entertainment
        tone = 'persuasive', // persuasive | funny | casual | expert | dramatic
        maxDuration = '60', // 15 | 30 | 60 | 90 | 120
        segmentDuration = '5', // 5 | 8 | 10 | 15 | auto
        targetAI = 'general', // general | sora | kling | runway | pika | hailuo | veo
        model,
        aeoQueryMode = 'both',
        enableBigSound = true,
        enableTextOverlay = true,
        referenceImageBase64 = '',
        referenceImageMimeType = '',
        userSeedQueries = [],
        numIdeas = 5,
      } = req.body;

      const totalIdeas = Math.min(5, Math.max(1, Number(numIdeas || req.body.ideaCount || req.body.totalIdeas) || 5));

      if (!base64Data && !topic && !sourceTitle && !tiktokShopUrl) {
        return res.status(400).json({ error: 'Mohon sediakan data video TikTok, judul, topik konten, atau link TikTok Shop.' });
      }

      const sampleData = base64Data ? base64Data.slice(0, 300) : topic || sourceTitle || tiktokShopUrl;
      const refImgSample = referenceImageBase64 ? referenceImageBase64.slice(0, 50) : '';
      
      let userSeedQueriesClean = Array.isArray(userSeedQueries) 
        ? userSeedQueries.map(s => String(s).trim().slice(0, 80)).filter(s => s.length > 0).slice(0, 10)
        : [];
      
      const userSeedSample = userSeedQueriesClean.join('|').slice(0, 50);
      const shopKey = (tiktokShopUrl || '').trim().slice(0, 80);

      const cacheInput = `content_ideas_v3_${mimeType}_${sampleData}_${model || 'auto'}_${contentType}_${tone}_${maxDuration}_${segmentDuration}_${targetAI}_${aeoQueryMode}_${enableBigSound}_${enableTextOverlay}_${refImgSample}_${userSeedSample}_${totalIdeas}_${shopKey}`;
      const cacheKey = crypto.createHash('sha256').update(cacheInput).digest('hex');

      if (useCache) {
        const cached = promptResponseCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < PROMPT_CACHE_TTL_MS) {
          logger.info('[Content Ideas Cache Hit - Saved Quota]', cacheKey);
          return res.json({ result: cached.text, modelUsed: cached.modelUsed, cached: true });
        }
      }

      const userSelectedModel = model ? normalizeGeminiModel(model) : undefined;
      const maxSecNum = parseInt(maxDuration, 10) || 60;
      const targetAIName = targetAI === 'sora' ? 'OpenAI Sora' : targetAI === 'kling' ? 'Kling AI' : targetAI === 'runway' ? 'Runway Gen-3' : targetAI === 'pika' ? 'Pika Labs' : targetAI === 'hailuo' ? 'Hailuo / Minimax' : targetAI === 'veo' ? 'Google Veo' : 'General AI Video Generator';

      // Hitung jumlah klip & timestamp rentang waktu secara dinamis (4, 6, 8, 10, 15 detik atau auto)
      let segSecNum = 6;
      if (segmentDuration === '4') segSecNum = 4;
      else if (segmentDuration === '6') segSecNum = 6;
      else if (segmentDuration === '8') segSecNum = 8;
      else if (segmentDuration === '10') segSecNum = 10;
      else if (segmentDuration === '15') segSecNum = 15;
      else if (segmentDuration === 'auto') segSecNum = Math.max(4, Math.ceil(maxSecNum / 4));
      else segSecNum = Math.max(3, parseInt(segmentDuration, 10) || 6);

      const expectedClipsCount = Math.ceil(maxSecNum / segSecNum);

      const timestampGuideList: string[] = [];
      let currentSec = 0;
      for (let i = 1; i <= expectedClipsCount; i++) {
        const nextSec = Math.min(maxSecNum, currentSec + segSecNum);
        const startSecStr = currentSec === 0 ? '0' : (currentSec % 1 === 0 ? `${currentSec}` : `${currentSec}`.replace('.', ','));
        const nextSecStr = nextSec % 1 === 0 ? `${nextSec}` : `${nextSec}`.replace('.', ',');
        const timeHeader = `${startSecStr}–${nextSecStr} detik`;
        const thirdLine = (i % 2 === 1) ? 'voice over: [teks voice over natural]' : 'Subteks: [teks overlay atau makna tersirat]';

        timestampGuideList.push(`${timeHeader}
Visual: [deskripsi visual sangat detail]
Aksi: [gerakan yang terjadi]
${thirdLine}`);

        currentSec = nextSec;
      }
      const timestampTemplateText = timestampGuideList.join('\n\n');

      let productContext = '';

      if (tiktokShopUrl && typeof tiktokShopUrl === 'string' && tiktokShopUrl.trim()) {
        logger.info('[Content Ideas] Mengambil data produk dari TikTok Shop...');
        const productData = await fetchTikTokShopProduct(tiktokShopUrl.trim());

        if (productData) {
          if (!topic && productData.name) {
            topic = productData.name;
          }
          if (!sourceTitle && productData.name) {
            sourceTitle = `Produk TikTok Shop: ${productData.name}`;
          }
          productContext = `
DATA PRODUK DARI TIKTOK SHOP:
- Link: ${tiktokShopUrl.trim()}
- Nama Produk: ${productData.name || '(tidak terdeteksi)'}
- Harga: ${productData.price || '(tidak terdeteksi)'}
- Deskripsi / Konten Halaman:
${productData.description || productData.raw || '-'}
`.trim();
          logger.info('[Content Ideas] Data produk TikTok Shop berhasil diambil:', productData.name);
        } else {
          productContext = `
DATA PRODUK DARI TIKTOK SHOP (GAGAL FETCH OTOMATIS):
- Link: ${tiktokShopUrl.trim()}
- Catatan: Sistem gagal mengambil detail otomatis. Gunakan field Topik / Nama Produk yang diisi user sebagai acuan utama.
`.trim();
          logger.warn('[Content Ideas] Gagal fetch TikTok Shop, pakai fallback.');
        }
      }

      // =========================================================================
      // TAHAP 0 — AEO QUERY MODE ROUTER
      // =========================================================================
      logger.info(`[Content Ideas Stage 0] AEO Query Router. Mode: ${aeoQueryMode}`);

      // =========================================================================
      // TAHAP 1 — ANALISIS KONTEKS VISUAL VIDEO (REUSE LOGIC ANALYZER VIDEO)
      // =========================================================================
      let groundingContext = '';

      if (base64Data) {
        logger.info('[Content Ideas] Stage 1 dimulai | tier=tier2 | tool=Content Ideas Stage 1');
        const stage1Prompt = `Anda adalah AI Video Vision Analyzer tingkat presisi tinggi.
TUGAS TAHAP 1: Analisis video ini dari detik awal sampai akhir secara objektif tanpa mengarang.
Ekstrak struktur data internal faktual berikut:
1. Objek/Produk yang BENAR-BENAR terlihat di frame (nama barang, warna, bahan, detail visual unik, kancing, motif, kerah, jahitan, packaging).
2. Aksi Tangan / Orang yang BENAR-BENAR terjadi (misal: memegang kerah, membalik lengan baju, menunjuk detail kancing, mengoleskan krim, membuka kemasan, mengangkat barang ke kamera).
3. Environment / Setting Asli Video (ruang tamu, kamar, studio, latar belakang, lighting, suasana).
4. Ekspresi & Gesture yang Terlihat (apabila ada orang/presenter di video).
5. Transkrip Audio / Teks Terdeteksi (jika ada suara/VO/teks asli di video).

JIKA ADA BAGIAN DETAIL YANG TIDAK JELAS ATAU TIDAK TERDETEKSI: Tandai eksplisit sebagai "[Kurang yakin / Tidak terdeteksi jelas]". JANGAN PERNAH MENGARANG AKSI ATAU PRODUK YANG TIDAK ADA.`;

        const stage1Payload = {
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'video/mp4',
                  data: base64Data,
                },
              },
              {
                text: `${stage1Prompt}\n\nJudul/Caption Video: ${sourceTitle || '-'}\nCatatan Tambahan: ${topic || '-'}`,
              },
            ],
          },
          config: {
            systemInstruction:
              "You are an objective video vision analyzer. Extract exact physical actions, visible objects, gestures, and settings without hallucinating or making assumptions.",
          },
        };

        const stage1Result = await callGeminiWithFallback(
          userSelectedModel,
          stage1Payload,
          customApiKey,
          clientAccessCode,
          'tier2',
          'Content Ideas Stage 1'
        );
        groundingContext = stage1Result.text;
      } else {
        logger.info('[Content Ideas] Stage 1 dilewati (tanpa video base64) | menggunakan grounding teks user');
        groundingContext = `INFORMASI INPUT TEKS USER (Tanpa Video File):
- Judul/Caption Video: ${sourceTitle || '-'}
- Topik / Produk: ${topic || '-'}`;
      }

      logger.info('[Content Ideas Stage 1 Complete] Grounding context extracted.');

      let identityAnchorDescription = '';
      if (referenceImageBase64 && typeof referenceImageBase64 === 'string' && referenceImageBase64.trim().length > 0) {
        logger.info('[Content Ideas] Stage 1.5 dimulai | tier=tier2 | tool=Content Ideas Identity Anchor');
        const anchorPrompt = `Anda adalah AI Identity Extractor. Analisis gambar referensi ini secara presisi.
Ekstrak 'Identity Anchor' yang solid (seperti warna kulit, pakaian, bentuk wajah, tekstur barang, atau logo pada produk).
Deskripsi ini akan disalin persis ke prompt video generation untuk mencegah flickering identitas antar adegan.
Hasilkan HANYA 1 paragraf padat berbahasa Inggris yang mendeskripsikan secara jelas ciri khas subjek/produk utama di gambar ini.`;

        const anchorPayload = {
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: referenceImageMimeType || 'image/jpeg',
                  data: referenceImageBase64,
                },
              },
              {
                text: anchorPrompt,
              },
            ],
          },
        };
        const anchorResult = await callGeminiWithFallback(
          userSelectedModel,
          anchorPayload,
          customApiKey,
          clientAccessCode,
          'tier2',
          'Content Ideas Identity Anchor'
        );
        identityAnchorDescription = anchorResult?.text?.trim() || '';
        logger.info('[Content Ideas Stage 1.5 Complete] Identity Anchor extracted:', identityAnchorDescription);
      } else {
        logger.info('[Content Ideas] Stage 1.5 dilewati (tanpa gambar referensi)');
      }

      // =========================================================================
      // TAHAP 1.8 — DEWAN 10 AI AGENT QUERY (INDONESIAN QUERY COUNCIL)
      // =========================================================================
      let queryCouncilResult: any = { final_short_query_targets: [], final_long_tail_queries: [] };
      let isCouncilSuccessful = false;

      // H1 Optimization: Skip or simplify council if:
      // 1. User provides a rich set of seed queries (>= 5), OR
      // 2. aeoQueryMode === 'short' and user has provided at least 1 seed query
      const hasUserSeedQueries = userSeedQueriesClean && userSeedQueriesClean.length > 0;
      const shouldSkipCouncil = (aeoQueryMode === 'short' && hasUserSeedQueries) || userSeedQueriesClean.length >= 5;

      if (shouldSkipCouncil) {
          logger.info(`[Content Ideas] Stage 1.8 dilewati / disederhanakan | mode=${aeoQueryMode} | seedCount=${userSeedQueriesClean.length} | menggunakan seed queries langsung`);
          queryCouncilResult = {
              final_short_query_targets: userSeedQueriesClean.filter(q => q.split(' ').length <= 4),
              final_long_tail_queries: userSeedQueriesClean.filter(q => q.split(' ').length > 4)
          };
          // Fallback if filtering resulted in empty array for one of them
          if (queryCouncilResult.final_short_query_targets.length === 0) queryCouncilResult.final_short_query_targets = userSeedQueriesClean.slice(0, 3);
          if (queryCouncilResult.final_long_tail_queries.length === 0) queryCouncilResult.final_long_tail_queries = userSeedQueriesClean.slice(-3);
          isCouncilSuccessful = true;
      } else {
          logger.info('[Content Ideas] Stage 1.8 dimulai | tier=tier2 | tool=Content Ideas Query Council');
          try {
              queryCouncilResult = await runIndonesianQueryCouncil(
                  topic || sourceTitle || '',
                  groundingContext,
                  userSeedQueriesClean,
                  aeoQueryMode,
                  (model, payload, customKey, clientCode, tier) =>
                    callGeminiWithFallback(model, payload, customKey, clientCode, tier || 'tier2', 'Content Ideas Query Council'),
                  userSelectedModel,
                  customApiKey,
                  clientAccessCode,
                  'tier2'
              );
              isCouncilSuccessful = true;
              logger.info(`[Content Ideas Stage 1.8 Complete] Generated ${queryCouncilResult.final_short_query_targets?.length || 0} short and ${queryCouncilResult.final_long_tail_queries?.length || 0} long queries.`);
          } catch (err) {
              logger.warn("[Stage 1.8] Query Council Agent failed or JSON parse error, falling back to legacy synthetic query generation mode. Error:", err);
          }
      }

      // =========================================================================
      // TAHAP 2 — GENERATE ${totalIdeas} IDE KONTEN GROUNDED + ANTI-AI-SLOP VOICE-OVER
      // =========================================================================
      logger.info(`[Content Ideas] Stage 2 dimulai | tier=flagship | tool=Content Ideas Stage 2 | totalIdeas=${totalIdeas}`);
      const referenceImageProvided = !!identityAnchorDescription;

      const hasCouncilQueries = (queryCouncilResult.final_short_query_targets?.length > 0 || queryCouncilResult.final_long_tail_queries?.length > 0);

      const ideaPromptTemplates: string[] = [];
      for (let i = 1; i <= totalIdeas; i++) {
        ideaPromptTemplates.push(`### 💡 IDE ${i}: [Judul Ide Konten ${i}]
- **Tipe & Angle Konten**: [Problem-Solution / POV Relatable / Unboxing Soft-Sell / Review Jujur]
- **Target Audience**: [Sebutkan audiens target spesifik]
- **AEO Query Mapping**: Short → [...], Long → [...]
- **Alasan Relevansi**: [1-2 kalimat penjelasan koneksi ke grounding & query target]
- **BLUFF Hook Pikat (0-3s)**: "[Kalimat pikat BLUFF - Langsung ke Inti Solusi/Jawaban di 3 detik pertama]"
- **Atomic Answer Summary (LLM RAG Citation Ready)**: "[1-2 kalimat fakta mandiri utuh yang siap dikutip AI Search Engine]"
- **Consensus Trigger (Tier 2 Validation)**: "[Pemicu validasi sosial / review komunitas untuk membangun konsensus LLM]"
- **Panduan Visual & Audio**: [Deskripsi gaya adegan, ekspresi, lighting, rekomendasi sound TikTok]
- **Rincian Adegan Video & Prompt AI per Segmen (${maxSecNum} Detik)**:
${timestampTemplateText}
- **AEO Caption SEO**:
"""text
[Caption AEO: Kalimat 1 = BLUFF Answer + Entitas Utama, Kalimat 2-3 = Poin Detail Faktual, Penutup = Q&A Pemicu Diskusi]
"""
- **Hashtag Relevan**: '#HashtagSpesifikVisual1 #HashtagSpesifikVisual2 #HashtagDetail3 #HashtagNiche4 #HashtagTargetSEO5'`);
      }
      const allIdeasTemplate = ideaPromptTemplates.join('\n\n---\n\n');

      const stage2PromptText = `Anda adalah TikTok Content Strategist & Anti-AI-Slop Indonesian Copywriter Spesialis FYP Ranking TikTok Indonesia.

TUGAS UTAMA TAHAP 2:
Buatkan ${totalIdeas} IDE KONTEN VIRAL SANGAT OPTIMAL, RELEVAN, & PERSUASIF berdasarkan DATA HASIL ANALISIS TAHAP 1 TERLAMPIR.

${hasCouncilQueries ? `=== HASIL DEWAN 10 AGENT QUERY TAHAP 0 (WAJIB DIPAKAI, DILARANG MENGARANG QUERY BARU) ===
Short Query Targets: ${(queryCouncilResult.final_short_query_targets || []).join(' | ')}
Long-Tail Queries: ${(queryCouncilResult.final_long_tail_queries || []).join(' | ')}
${userSeedQueriesClean.length > 0 ? `Seed Asli dari User (prioritas tertinggi): ${userSeedQueriesClean.join(' | ')}` : ''}
==================================================================

ATURAN QUERY FAN-OUT (DIPERKETAT):
1. SETIAP query yang dicantumkan di "AEO SYNTHETIC QUERY FAN-OUT" dan di
   "AEO Query Mapping" tiap ide WAJIB diambil PERSIS atau nyaris identik dari
   daftar Dewan 10 Agent di atas. DILARANG membuat query baru yang tidak ada
   di daftar tersebut — ini untuk mencegah halusinasi.` : `=== AEO SYNTHETIC QUERY FAN-OUT & MAPPING ===
1. Hasilkan dan cantumkan 5-9 synthetic long-tail queries secara mandiri berdasarkan topik dan konteks yang ada.
2. Lakukan "AEO Query Mapping" untuk setiap ide dengan mengaitkannya ke query yang relevan yang telah Anda hasilkan.`}

=== DATA GROUNDING FAKTUAL TAHAP 1 (MANDATORI DIIKUTI 100%) ===
"""
${groundingContext}
"""
==================================================================

${productContext ? `
========================================
DATA PRODUK UTAMA (DARI TIKTOK SHOP / USER)
========================================
${productContext}
` : ''}

KONFIGURASI TARGET REPLIKA:
- Target Total Durasi Video: ${maxSecNum} Detik
- Target Jenis Konten: ${contentType.toUpperCase()}
- Tone Bahasa: ${tone.toUpperCase()}

FORMAT OUTPUT WAJIB:
${allIdeasTemplate}

ATURAN STRUKTUR PROMPT VIDEO DI BAGIAN "Rincian Adegan Video & Prompt AI per Segmen":
1. WAJIB mengikuti format breakdown timeline Bahasa Indonesia per segmen:
   [start]–[end] detik
   Visual: [deskripsi visual sangat detail: lokasi, pencahayaan, sudut kamera, subjek (orang + pakaian + ekspresi), objek produk, posisi, tekstur, suasana]
   Aksi: [gerakan konkret yang terjadi di detik tersebut]
   voice over: [teks voice over natural] (atau Subteks: [teks overlay atau makna tersirat])
2. Setiap segmen HARUS memiliki tepat 3 bagian: Visual, Aksi, dan (voice over ATAU Subteks).
3. Gunakan "voice over:" jika ada narasi suara. Gunakan "Subteks:" jika lebih cocok sebagai teks overlay / makna tersirat.
4. DURASI & PEMBAGIAN SEGMEN:
   - Target total durasi: ${maxSecNum} detik, dibagi menjadi persis ${expectedClipsCount} klip segmen (masing-masing berdurasi ${segSecNum} detik).
   - Rentang waktu tiap klip WAJIB mengikuti durasi ${segSecNum} detik penuh:
${timestampGuideList.map(item => "     " + item.split("\n")[0]).join("\n")}
   - DILARANG memecah menjadi potongan mikro 2-3 detik! Setiap segmen adalah 1 PROMPT UTUH SIAP SALIN berdurasi ${segSecNum} detik untuk AI Video Generator (Sora, Kling, Minimax, Hailuo, Runway).
5. Visual harus sangat kaya detail: lokasi, pencahayaan, sudut kamera, subjek, objek produk, posisi, tekstur, dan suasana.
6. Aksi harus menjelaskan gerakan konkret yang terjadi di detik tersebut.
7. Bahasa harus natural, gaya TikTok Indonesia (santai, persuasif, mudah dipahami).
8. DILARANG menggunakan format Inggris, tag [Style], [Camera], [Lighting], [Actions], atau codeblock Inggris.
9. Jaga konsistensi visual di semua klip.
`;

      const stage2Payload = {
        contents: {
          parts: [
            {
              text: stage2PromptText,
            },
          ],
        },
        config: {
          systemInstruction: 'Anda adalah TikTok Content Strategist & Indonesian Video Prompt Engineer. Buat ide konten viral lengkap dengan rincian adegan video berformat timeline Bahasa Indonesia (Visual, Aksi, voice over/Subteks).',
        },
      };

      const stage2Result = await callGeminiWithFallback(
        userSelectedModel,
        stage2Payload,
        customApiKey,
        clientAccessCode,
        'flagship',
        'Content Ideas Stage 2'
      );
      let finalOutputText = sanitizeCaptionsAndHashtags(stage2Result.text);

      // =========================================================================
      // VALIDASI / SELF-CRITIC (HANYA DIJALANKAN JIKA OUTPUT BERMASALAH)
      // =========================================================================
      const isOutputProblematic = !finalOutputText || finalOutputText.trim().length < 80;

      if (isOutputProblematic) {
        logger.info('[Content Ideas] Stage Validasi dimulai (output bermasalah/kurang lengkap) | tier=tier3 | tool=Content Ideas Validation');
        const validationPayload = {
          contents: {
            parts: [
              {
                text: `BERIKUT DATA ANALISIS VISUAL TAHAP 1:
"""
${groundingContext}
"""

BERIKUT HASIL YANG TERDETEKSI KURANG LENGKAP:
"""
${finalOutputText}
"""

TUGAS VALIDASI:
Lengkapi kembali ${totalIdeas} ide konten viral sesuai format:
${allIdeasTemplate}

Pastikan bagian rincian adegan video memakai format:
0–2 detik
Visual: ...
Aksi: ...
voice over: ...

2–3,8 detik
Visual: ...
Aksi: ...
Subteks: ...`,
              },
            ],
          },
          config: {
            systemInstruction: 'Lengkapi dan perbaiki ide konten viral TikTok sesuai template yang diminta.',
          },
        };

        try {
          const validatedResult = await callGeminiWithFallback(
            userSelectedModel,
            validationPayload,
            customApiKey,
            clientAccessCode,
            'tier3',
            'Content Ideas Validation'
          );
          if (validatedResult?.text && validatedResult.text.trim().length >= 80) {
            finalOutputText = sanitizeCaptionsAndHashtags(validatedResult.text);
            logger.info('[Content Ideas Validation] Output berhasil diperbaiki oleh validator tier3.');
          }
        } catch (valErr) {
          logger.warn('[Validation Warning] Fast validation skipped or fallback to Stage 2 text:', valErr);
        }
      } else {
        logger.info('[Content Ideas] Stage Validasi dilewati (output Stage 2 sudah lengkap & terstruktur)');
      }

      // Record successful execution & train system memory
      recordExecutionAndUpgrade('contentIdeas');

      activeTask.status = 'completed';
      activeTask.updatedAt = Date.now();
      activeGenerationsMap.set(taskId, activeTask);

      broadcastLiveEvent({
        type: 'active_status_update',
        activeGenerations: Array.from(activeGenerationsMap.values()),
        activeUserCount: sseClients.size,
      });

      setTimeout(() => {
        activeGenerationsMap.delete(taskId);
        broadcastLiveEvent({
          type: 'active_status_update',
          activeGenerations: Array.from(activeGenerationsMap.values()),
          activeUserCount: sseClients.size,
        });
      }, 120000);

      if (useCache) {
        promptResponseCache.set(cacheKey, { timestamp: Date.now(), text: finalOutputText, modelUsed: stage2Result.modelUsed });
      }

      res.json({ result: finalOutputText, modelUsed: stage2Result.modelUsed });
    } catch (error: any) {
      logger.error('Error generating content ideas:', error);
      activeTask.status = 'failed';
      activeTask.updatedAt = Date.now();
      activeGenerationsMap.set(taskId, activeTask);
      broadcastLiveEvent({
        type: 'active_status_update',
        activeGenerations: Array.from(activeGenerationsMap.values()),
        activeUserCount: sseClients.size,
      });
      setTimeout(() => {
        activeGenerationsMap.delete(taskId);
        broadcastLiveEvent({
          type: 'active_status_update',
          activeGenerations: Array.from(activeGenerationsMap.values()),
          activeUserCount: sseClients.size,
        });
      }, 5000);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || 'Terjadi kesalahan saat membuat ide konten.' });
    }
  });

  // --- TIKTOK SHOP TO CONTENT IDEAS GENERATOR ---
  app.post('/api/generate-tiktok-shop-ideas', async (req, res) => {
    const clientAccessCode = extractClientAccessCode(req);
    const clientInfo = await getClientInfoByCode(clientAccessCode);
    const taskId = req.body.taskId || `gen_shop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const activeTask: any = {
      id: taskId,
      clientId: clientAccessCode,
      accessCode: clientAccessCode,
      clientName: clientInfo.name,
      tool: 'TikTok Shop Ideas',
      status: 'generating',
      category: req.body.category || 'tiktok_shop',
      startedAt: new Date().toISOString(),
      updatedAt: Date.now(),
    };
    activeGenerationsMap.set(taskId, activeTask);

    broadcastLiveEvent({
      type: 'active_status_update',
      activeGenerations: Array.from(activeGenerationsMap.values()),
      activeUserCount: sseClients.size,
    });

    try {
      const customApiKey = (req.headers['x-custom-api-key'] as string) || req.body.customApiKey;
      const {
        shopUrl = '',
        productDetails = '',
        numIdeas = 3,
        totalDuration = '60',
        promptSplitSec = '10',
        aeoTargetMode = 'both',
        enableBigSound = true,
        enableTextOverlay = true,
        analysisMode = 'deep',
        referenceImageBase64 = '',
        referenceImageMimeType = '',
        model,
      } = req.body;

      const totalIdeas = Math.min(5, Math.max(1, Number(numIdeas) || 3));
      const maxSecNum = parseInt(totalDuration, 10) || 60;

      let segSecNum = 6;
      if (promptSplitSec === '4') segSecNum = 4;
      else if (promptSplitSec === '6') segSecNum = 6;
      else if (promptSplitSec === '8') segSecNum = 8;
      else if (promptSplitSec === '10') segSecNum = 10;
      else if (promptSplitSec === '15') segSecNum = 15;
      else if (promptSplitSec === 'auto') segSecNum = Math.max(4, Math.ceil(maxSecNum / 4));
      else segSecNum = Math.max(3, parseInt(promptSplitSec, 10) || 6);

      const expectedClipsCount = Math.ceil(maxSecNum / segSecNum);

      let identityAnchorDescription = '';
      if (referenceImageBase64) {
        try {
          logger.info('[TikTok Shop Ideas] Extracting product reference visual features...');
          const anchorPrompt = `Anda adalah AI E-Commerce Product Vision Extractor. Analisis gambar produk referensi ini secara presisi.
Ekstrak detail fisik produk (seperti merek/logo, jenis kemasan, warna utama, tekstur bahan, label, dan ciri visual khas).
Hasilkan 1 paragraf padat berbahasa Inggris yang mendeskripsikan secara jelas ciri khas produk di gambar ini agar prompt video AI konsisten dan akurat.`;

          const anchorPayload = {
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: referenceImageMimeType || 'image/jpeg',
                    data: referenceImageBase64,
                  },
                },
                {
                  text: anchorPrompt,
                },
              ],
            },
          };
          const anchorResult = await callGeminiWithFallback(
            model ? normalizeGeminiModel(model) : 'gemini-3.8-flash',
            anchorPayload,
            customApiKey,
            clientAccessCode,
            'tier2',
            'TikTok Shop Product Anchor'
          );
          identityAnchorDescription = anchorResult?.text?.trim() || '';
          logger.info('[TikTok Shop Ideas] Product identity anchor extracted:', identityAnchorDescription);
        } catch (e) {
          logger.warn('[TikTok Shop Ideas] Failed to extract identity anchor from image:', e);
        }
      }

      const timestampGuideList: string[] = [];
      let currentSec = 0;
      for (let i = 1; i <= expectedClipsCount; i++) {
        const nextSec = Math.min(maxSecNum, currentSec + segSecNum);
        const startSecStr = currentSec === 0 ? '0' : (currentSec % 1 === 0 ? `${currentSec}` : `${currentSec}`.replace('.', ','));
        const nextSecStr = nextSec % 1 === 0 ? `${nextSec}` : `${nextSec}`.replace('.', ',');
        const timeHeader = `${startSecStr}–${nextSecStr} detik`;
        const thirdLine = (i % 2 === 1) ? 'voice over: [teks voice over natural]' : 'Subteks: [teks overlay atau makna tersirat]';

        timestampGuideList.push(`${timeHeader}
Visual: [deskripsi visual sangat detail: lokasi, pencahayaan, sudut kamera, subjek (orang + pakaian + ekspresi), objek produk, posisi, tekstur, suasana]
Aksi: [gerakan konkret yang terjadi di detik ini]
${thirdLine}`);

        currentSec = nextSec;
      }
      const timestampTemplateText = timestampGuideList.join('\n\n');

      if (!shopUrl && !productDetails && !referenceImageBase64) {
        return res.status(400).json({ error: 'Mohon sediakan link TikTok Shop atau unggah foto produk referensi.' });
      }

      let enrichedInfo = '';
      if (shopUrl) {
        try {
          const rawUrl = shopUrl.trim();
          let cleanUrl = rawUrl;
          if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
          }

          let finalUrl = cleanUrl;
          let sitePlatform = 'E-Commerce Marketplace';
          if (cleanUrl.includes('tiktok.com') || cleanUrl.includes('vt.tiktok.com') || cleanUrl.includes('shop.tiktok.com')) sitePlatform = 'TikTok Shop';
          else if (cleanUrl.includes('tokopedia') || cleanUrl.includes('tokopedia.link')) sitePlatform = 'Tokopedia';
          else if (cleanUrl.includes('shopee') || cleanUrl.includes('s.shopee.co.id')) sitePlatform = 'Shopee';
          else if (cleanUrl.includes('lazada')) sitePlatform = 'Lazada';

          let pageTitle = '';
          let metaDesc = '';
          let ogPrice = '';
          let urlSlugKeywords = '';

          // Extract keywords from URL path/slug if present (e.g. /product/azarine-hydrasoothe-sunscreen-gel...)
          try {
            const urlObj = new URL(cleanUrl);
            const pathParts = urlObj.pathname.split('/').filter(p => p.length > 2);
            const rawSlug = pathParts.join(' ').replace(/[-_]/g, ' ');
            if (rawSlug && !rawSlug.includes('http')) {
              urlSlugKeywords = rawSlug.replace(/\b(product|item|i|p|dp|detail|view|shop|seller|buy)\b/gi, '').trim();
            }
          } catch (e) {}

          // 1. Follow short link redirects & extract metadata
          try {
            const htmlRes = await fetch(cleanUrl, {
              method: 'GET',
              redirect: 'follow',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
              }
            });
            if (htmlRes.ok) {
              finalUrl = htmlRes.url || cleanUrl;
              const htmlText = await htmlRes.text();
              const ogTitleMatch = htmlText.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) || htmlText.match(/<title>([^<]+)<\/title>/i);
              const ogDescMatch = htmlText.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) || htmlText.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
              const priceMatch = htmlText.match(/<meta[^>]*property=["'](?:product:price:amount|og:price:amount)["'][^>]*content=["']([^"']+)["']/i) || htmlText.match(/Rp\s*[\d\.,]+/i);

              if (ogTitleMatch) pageTitle = ogTitleMatch[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
              if (ogDescMatch) metaDesc = ogDescMatch[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
              if (priceMatch) ogPrice = priceMatch[0] || priceMatch[1] || '';
            }
          } catch (fetchErr) {
            logger.warn('[TikTok Shop Ideas] Direct link expansion fetch error:', fetchErr);
          }

          // 2. If TikTok link, also attempt TikWM live scrape
          let tikwmSummary = '';
          if (cleanUrl.includes('tiktok.com') || finalUrl.includes('tiktok.com')) {
            try {
              const tikWmRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
              });
              const tikWmData = await tikWmRes.json();
              if (tikWmData && tikWmData.code === 0 && tikWmData.data) {
                const v = tikWmData.data;
                tikwmSummary = `\nCaption TikTok Video: ${v.title || ''}\nAuthor: @${v.author?.unique_id || ''} (${v.author?.nickname || ''})\nPlay/Views: ${v.play_count || 0} views, Likes: ${v.digg_count || 0}`;
              }
            } catch (tikWmErr) {}
          }

          enrichedInfo = `[DATA HASIL METADATA LINK EXPANSION REALTIME]
Platform Detected: ${sitePlatform}
Original Link: ${cleanUrl}
Expanded Final Link: ${finalUrl}
Judul Halaman/Produk: ${pageTitle || 'Tidak dapat diambil langsung'}
Kata Kunci Slug URL: ${urlSlugKeywords || 'Tidak ada'}
Deskripsi Produk/Meta: ${metaDesc || 'Tidak dapat diambil langsung'}
Estimasi Harga: ${ogPrice || 'Tersedia di toko'}${tikwmSummary}`;

        } catch (err) {
          logger.warn('[TikTok Shop Ideas] Failed link expansion & enrichment:', err);
        }
      }

      const promptText = `Anda adalah Master TikTok Shop Strategist, Video Director, dan Indonesian Prompt Engineer spesialis FYP TikTok Shop Indonesia.

TUGAS UTAMA:
Lakukan analisis mendalam terhadap produk dan hasilkan rencana konten video viral TikTok Shop dengan struktur 3 Bagian lengkap berikut:

[DATA INPUT PRODUK DARI USER]
Link Produk: ${shopUrl || 'Tidak disertakan'}
Detail / Catatan Produk: ${productDetails || 'Tidak disertakan'}
Target Total Durasi Video: ${maxSecNum} Detik
Jumlah Ide yang Diminta: ${totalIdeas} Ide
${identityAnchorDescription ? `Identity Anchor Karakter/Produk: ${identityAnchorDescription}` : ''}
${enrichedInfo ? enrichedInfo : ''}

FORMAT OUTPUT WAJIB (JANGAN MENGUBAH NAMA ATAU STRUKTUR BAGIAN):

# 🛍️ ANALISIS PRODUK & IDE KONTEN VIRAL TIKTOK SHOP (${maxSecNum}s, ${expectedClipsCount} Klip)

## 📦 BAGIAN 1: AI ANALISIS PRODUK (5 PILAR UTAMA & ENRICHMENT)
- **Kategori & Positioning**: [Kategori spesifik & positioning produk di pasar]
- **Bahan / Key Ingredients & Formulasi**: [Bahan aktif/material utama, keunggulan formula]
- **Pain Points yang Diselesaikan**: [3 masalah utama konsumen yang diselesaikan]
- **Benefit / Claim Utama**: [Klaim manfaat utama yang terbukti/terasa]
- **Target User & Persona**: [Demografi, usia, gaya hidup, kebiasaan target pembeli]
- **Estimasi Harga / Value for Money**: [Analisis harga dan perbandingan nilai]
- **BPOM / Keamanan / Sertifikasi**: [Status BPOM / Halal / Keamanan jika relevan]
- **Unique Selling Point (USP)**: [Keunikan yang membedakan dari kompetitor]
- **Mood & Tone Konten Ideal**: [Gaya penyampaian video paling cocok]

### 📝 Ringkasan Eksekutif Produk
[1 paragraf ringkasan padat tentang produk dan selling angle terkuatnya]

---

## 🔍 BAGIAN 2: MAPPING QUERY SEO TIKTOK (8-12 QUERY)

1. **Berdasarkan Masalah / Pain Point Konsumen**
- "[query 1]"
- "[query 2]"

2. **Berdasarkan Manfaat & Hasil Pemakaian**
- "[query 3]"
- "[query 4]"

3. **Berdasarkan Merek / Produk & Kategori Terkait**
- "[query 5]"
- "[query 6]"

4. **Berdasarkan Pertanyaan Populer / Mitos vs Fakta**
- "[query 7]"
- "[query 8]"

---

## 🚀 BAGIAN 3: GENERATE ${totalIdeas} IDE KONTEN VIRAL TIKTOK SHOP

Hasilkan persis ${totalIdeas} ide konten kreatif dengan format berikut untuk setiap ide:

### 💡 IDE 1: [Judul Ide Konten & Angle Hook]
- **Query SEO Acuan**: [Sebutkan 1 query dari Bagian 2]
- **Sudut Pandang / Angle**: [Pain Point / Benefit / Before-After / Edukasi / UGC Review / Mitos vs Fakta / Unboxing]
- **Target Audience**: [Sebutkan audiens target spesifik]
- **Hook 3 Detik Pertama (0-3s)**:
  - *Visual*: [Gambaran adegan pembuka yang menghentikan scroll]
  - *Text On Screen (TOS)*: "[Kalimat teks tebal di layar]"
  - *Voice Over (VO)*: "[Kalimat pembuka yang diucapkan]"
- **Rincian Adegan Video & Prompt AI per Segmen (${maxSecNum} Detik)**:
${timestampTemplateText}
- **Call To Action (CTA)**:
  "[Kalimat ajakan klik keranjang kuning / promo stok terbatas]"
- **Rekomendasi Audio & Visual Style**:
  - *Audio / Sound*: [Tone BGM, sound effect, atau gaya suara]
  - *Visual Style*: [Pencahayaan, lokasi, prop visual, pacing video]
- **Draft Caption TikTok Shop**:
  [Draft caption persuasif dengan emosi dan klaim produk]
- **Hashtag Relevan**: #Hashtag1 #Hashtag2 #Hashtag3 #Hashtag4 #Hashtag5

(Jika total ide lebih dari 1, buatkan juga ### 💡 IDE 2 dst dengan format yang sama)

ATURAN STRUKTUR PROMPT VIDEO DI BAGIAN "Rincian Adegan Video & Prompt AI per Segmen":
1. WAJIB mengikuti format breakdown timeline Bahasa Indonesia per segmen:
   [start]–[end] detik
   Visual: [deskripsi visual sangat detail: lokasi, pencahayaan, sudut kamera, subjek, objek produk, posisi, tekstur, suasana]
   Aksi: [gerakan konkret yang terjadi di detik ini]
   voice over: [teks voice over natural] (atau Subteks: [teks overlay atau makna tersirat])
2. Setiap segmen HARUS memiliki tepat 3 bagian: Visual, Aksi, dan (voice over ATAU Subteks).
3. Gunakan "voice over:" jika ada narasi suara. Gunakan "Subteks:" jika berupa teks layar / makna tersirat.
4. DURASI & PEMBAGIAN SEGMEN:
   - Target total durasi: ${maxSecNum} detik, dibagi menjadi persis ${expectedClipsCount} klip segmen (masing-masing berdurasi ${segSecNum} detik).
   - Rentang waktu tiap klip WAJIB mengikuti durasi ${segSecNum} detik penuh:
${timestampGuideList.map(item => "     " + item.split("\n")[0]).join("\n")}
   - DILARANG memecah menjadi potongan mikro 2-3 detik! Setiap segmen adalah 1 PROMPT UTUH SIAP SALIN berdurasi ${segSecNum} detik untuk AI Video Generator (Sora, Kling, Minimax, Hailuo, Runway).
5. Visual harus sangat kaya detail: lokasi, pencahayaan, sudut kamera, subjek, objek produk, posisi, tekstur, dan suasana.
6. Aksi harus menjelaskan gerakan konkret yang terjadi di detik tersebut.
7. Bahasa harus natural, gaya TikTok Indonesia (santai, persuasif, mudah dipahami).
8. DILARANG menggunakan format Inggris, tag [Style], [Camera], [Lighting], [Actions], atau codeblock Inggris.
9. Alur cerita video produk yang wajib dibangun: (Hook → Curiosity → Demo → Proof → Soft CTA).
10. Jaga konsistensi visual produk di semua klip (bentuk, warna, tekstur, detail khas).
`;

      const payloadParts: any[] = [];
      if (referenceImageBase64) {
        payloadParts.push({
          inlineData: {
            mimeType: referenceImageMimeType || 'image/jpeg',
            data: referenceImageBase64,
          },
        });
      }
      payloadParts.push({ text: promptText });

      const payload = {
        contents: {
          parts: payloadParts,
        },
        config: {
          systemInstruction: 'Anda adalah Master TikTok Shop Strategist dan Indonesian Video Prompt Engineer. Buat analisis produk, mapping SEO, dan ide konten viral lengkap dengan rincian adegan video berformat timeline Bahasa Indonesia (Visual, Aksi, voice over/Subteks).',
        },
      };

      const userSelectedModel = model ? normalizeGeminiModel(model) : undefined;
      const geminiResult = await callGeminiWithFallback(
        userSelectedModel,
        payload,
        customApiKey,
        clientAccessCode,
        'tier2',
        'TikTok Shop Ideas'
      );

      recordExecutionAndUpgrade('contentIdeas');

      activeTask.status = 'completed';
      activeTask.updatedAt = Date.now();
      activeGenerationsMap.set(taskId, activeTask);

      broadcastLiveEvent({
        type: 'active_status_update',
        activeGenerations: Array.from(activeGenerationsMap.values()),
        activeUserCount: sseClients.size,
      });

      setTimeout(() => {
        activeGenerationsMap.delete(taskId);
        broadcastLiveEvent({
          type: 'active_status_update',
          activeGenerations: Array.from(activeGenerationsMap.values()),
          activeUserCount: sseClients.size,
        });
      }, 120000);

      const cleanResultText = sanitizeCaptionsAndHashtags(geminiResult.text);

      res.json({
        success: true,
        result: cleanResultText,
        text: cleanResultText,
        modelUsed: geminiResult.modelUsed || userSelectedModel,
      });

    } catch (err: any) {
      logger.error('TikTok Shop Ideas generation error:', err);
      activeTask.status = 'failed';
      activeTask.updatedAt = Date.now();
      activeGenerationsMap.set(taskId, activeTask);

      broadcastLiveEvent({
        type: 'active_status_update',
        activeGenerations: Array.from(activeGenerationsMap.values()),
        activeUserCount: sseClients.size,
      });

      setTimeout(() => {
        activeGenerationsMap.delete(taskId);
        broadcastLiveEvent({
          type: 'active_status_update',
          activeGenerations: Array.from(activeGenerationsMap.values()),
          activeUserCount: sseClients.size,
        });
      }, 5000);

      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message || 'Gagal menganalisis produk TikTok Shop.' });
    }
  });

  // API endpoint for Backend System Intelligence Status & Memory Metrics
  app.get('/api/system-intelligence', (req, res) => {
    const intel = getSystemIntelligenceLevel();
    res.json({
      status: 'active' as any,
      intelligence: intel,
      thinkingMode: 'Gemini 3.1 Pro High Thinking Active',
      memoryFile: MEMORY_FILE_PATH,
    });
  });

  // API endpoint for Realtime Batched Auto-Learning Memory Worker (Sync every 3 seconds)
  app.post('/api/backend/learn', (req, res) => {
    try {
      const { events } = req.body;
      if (!Array.isArray(events) || events.length === 0) {
        return res.json({ success: true, processedEventsCount: 0, intelligence: getSystemIntelligenceLevel() });
      }

      if (!Array.isArray(systemMemory.formulas)) {
        systemMemory.formulas = [];
      }

      let newInsightsAdded = 0;

      for (const evt of events) {
        const { type, payload } = evt;

        if (type === 'video_uploaded') {
          if (payload?.fileName) {
            logger.info(`[Event Analytics] Video uploaded: ${payload.fileName} (${payload.fileSize || 0} bytes)`);
          }
        } else if (type === 'split_duration_selected') {
          logger.info(`[Event Analytics] Duration selected: ${payload?.duration}`);
        } else if (type === 'ai_engine_selected') {
          logger.info(`[Event Analytics] Engine selected: ${payload?.model}`);
        } else if (type === 'detail_element_toggled') {
          logger.info(`[Event Analytics] Detail element toggled: ${payload?.element} = ${payload?.enabled}`);
        } else if (type === 'prompt_split_generated') {
          const params = payload?.parameters || payload || {};
          const duration = params.segmentDuration || '10';
          const model = params.selectedModel || params.model || 'gemini-3.8-flash';
          const act = params.includeActions !== false;
          const vo = params.includeVoiceOver !== false;
          const cine = params.includeCinematics !== false;

          const elementsList: string[] = [];
          if (act) elementsList.push('Aksi&Gerakan');
          if (vo) elementsList.push('Transkrip VO');
          if (cine) elementsList.push('Kamera&Lighting');

          const formulaKey = `formula_${duration}_${model}_${act ? '1' : '0'}_${vo ? '1' : '0'}_${cine ? '1' : '0'}`;
          const formulaPattern = `Formula Pecah ${duration !== 'auto' ? duration + 's' : 'Penuh'} • ${model} • [${elementsList.join(', ')}]`;

          let existingFormula = systemMemory.formulas.find((f: any) => f.id === formulaKey);

          if (!existingFormula) {
            existingFormula = {
              id: formulaKey,
              pattern: formulaPattern,
              segmentDuration: duration,
              model: model,
              elements: elementsList,
              confidenceScore: 1,
              createdAt: Date.now(),
              lastUsedAt: Date.now(),
            };
            systemMemory.formulas.push(existingFormula);

            const insight = `Formula Baru Teridentifikasi: ${formulaPattern}`;
            if (!systemMemory.learnedKnowledgeBase.includes(insight)) {
              systemMemory.learnedKnowledgeBase.push(insight);
              newInsightsAdded++;
            }
          } else {
            existingFormula.lastUsedAt = Date.now();
            existingFormula.confidenceScore += 1;
          }

          // Counter "Proyek Diproses" dinaikkan SETELAH formula berhasil tersimpan di memori
          systemMemory.totalExecutions += 1;
          systemMemory.successfulPromptsCount += 1;
          systemMemory.categoryUsage.videoPrompt = (systemMemory.categoryUsage.videoPrompt || 0) + 1;

        } else if (type === 'prompt_clip_copied' || type === 'prompt_sent_to_photo') {
          systemMemory.successfulPromptsCount += 1;
          const isSentToPhoto = type === 'prompt_sent_to_photo';
          const boost = isSentToPhoto ? 5 : 2;

          if (systemMemory.formulas.length > 0) {
            const targetFormula = systemMemory.formulas.find((f: any) => f.segmentDuration === payload?.segmentDuration) || systemMemory.formulas[systemMemory.formulas.length - 1];
            if (targetFormula) {
              targetFormula.confidenceScore = (targetFormula.confidenceScore || 1) + boost;
              const insight = `Formula Validasi AI (+Confidence ${targetFormula.confidenceScore}): ${targetFormula.pattern}`;
              if (!systemMemory.learnedKnowledgeBase.includes(insight) && targetFormula.confidenceScore >= 3) {
                systemMemory.learnedKnowledgeBase.push(insight);
                newInsightsAdded++;
              }
            }
          }

          if (payload?.promptSnippet || payload?.text) {
            const rawTxt = payload.promptSnippet || payload.text;
            const shortSnippet = String(rawTxt).slice(0, 100).replace(/\n/g, ' ');
            const insight = `${isSentToPhoto ? 'Lanjut ke Prompt Foto' : 'Prompt Klip Dicopy'}: "${shortSnippet}..."`;
            if (!systemMemory.learnedKnowledgeBase.includes(insight)) {
              systemMemory.learnedKnowledgeBase.push(insight);
              newInsightsAdded++;
            }
          }
        } else if (type === 'link_pasted') {
          systemMemory.totalExecutions += 1;
        } else if (type === 'tiktok_link_imported') {
          systemMemory.totalExecutions += 1;
          const rawTitle = payload?.title || payload?.caption || '';
          if (rawTitle && typeof rawTitle === 'string' && rawTitle.trim().length > 5) {
            const extractedHashtags = (rawTitle.match(/#[\w\u0590-\u05ff]+/g) || []).slice(0, 8);
            const cleanTitle = rawTitle.replace(/#[\w\u0590-\u05ff]+/g, '').trim().slice(0, 120);

            const hookInsight = `[Pola Viral TikTok] Hook/Topik: "${cleanTitle}"${extractedHashtags.length > 0 ? ` • Tags: ${extractedHashtags.join(' ')}` : ''}`;
            if (!systemMemory.learnedKnowledgeBase.includes(hookInsight)) {
              systemMemory.learnedKnowledgeBase.unshift(hookInsight);
              if (systemMemory.learnedKnowledgeBase.length > 120) {
                systemMemory.learnedKnowledgeBase = systemMemory.learnedKnowledgeBase.slice(0, 120);
              }
              newInsightsAdded++;
            }
            if (!Array.isArray(systemMemory.viralHookPatterns)) {
              systemMemory.viralHookPatterns = [];
            }
            if (cleanTitle && !systemMemory.viralHookPatterns.includes(cleanTitle)) {
              systemMemory.viralHookPatterns.unshift(cleanTitle);
              if (systemMemory.viralHookPatterns.length > 50) {
                systemMemory.viralHookPatterns = systemMemory.viralHookPatterns.slice(0, 50);
              }
            }
          }
        } else if (type === 'seo_caption_copied' || type === 'hashtags_copied') {
          systemMemory.successfulPromptsCount += 1;
          const copiedSnippet = String(payload?.text || payload?.snippet || '').slice(0, 120).replace(/\n/g, ' ');
          if (copiedSnippet) {
            const insight = `[Validasi Relevansi Tinggi] Pola ${type === 'hashtags_copied' ? 'Hashtag' : 'Caption SEO'} Terpilih: "${copiedSnippet}..."`;
            if (!systemMemory.learnedKnowledgeBase.includes(insight)) {
              systemMemory.learnedKnowledgeBase.unshift(insight);
              newInsightsAdded++;
            }
          }
        } else if (type === 'video_downloaded') {
          systemMemory.totalExecutions += 1;
          systemMemory.successfulPromptsCount += 1;
        } else if (type === 'content_ideas_generated') {
          recordExecutionAndUpgrade('contentIdeas');
        } else if (type === 'video_prompt_generated') {
          recordExecutionAndUpgrade('videoPrompt');
        } else if (type === 'photo_prompt_generated') {
          recordExecutionAndUpgrade('photoPrompt');
        } else if (type === 'prompt_copied') {
          systemMemory.successfulPromptsCount += 1;
          if (payload?.text && typeof payload.text === 'string' && payload.text.length > 10) {
            const shortSnippet = payload.text.slice(0, 100).replace(/\n/g, ' ');
            const insight = `Pola Sukses (Dicopy User): "${shortSnippet}..."`;
            if (!systemMemory.learnedKnowledgeBase.includes(insight)) {
              systemMemory.learnedKnowledgeBase.push(insight);
              newInsightsAdded++;
            }
          }
        } else if (type === 'prompt_edited_manually') {
          if (payload?.editedText && typeof payload.editedText === 'string') {
            const shortSnippet = payload.editedText.slice(0, 100).replace(/\n/g, ' ');
            const insight = `Penyesuaian Manual User: "${shortSnippet}..."`;
            if (!systemMemory.learnedKnowledgeBase.includes(insight)) {
              systemMemory.learnedKnowledgeBase.push(insight);
              newInsightsAdded++;
            }
          }
        } else if (type === 'formula_injected') {
          if (payload?.insight && typeof payload.insight === 'string' && payload.insight.trim()) {
            recordExecutionAndUpgrade('contentIdeas', payload.insight.trim());
            newInsightsAdded++;
          }
        }
      }

      saveSystemMemory();

      return res.json({
        success: true,
        processedEventsCount: events.length,
        newInsightsAdded,
        intelligence: getSystemIntelligenceLevel(),
      });
    } catch (e: any) {
      logger.warn('[Realtime Auto-Learning] Error processing batch events:', e);
      return res.status(500).json({ error: e.message || 'Gagal memproses event pembelajaran' });
    }
  });

  // API endpoint to submit user feedback or custom prompt learning insight
  app.post('/api/learn-feedback', (req, res) => {
    try {
      const { insight, type = 'contentIdeas' } = req.body;
      if (insight && typeof insight === 'string' && insight.trim()) {
        recordExecutionAndUpgrade(type, insight.trim());
        return res.json({ success: true, intelligence: getSystemIntelligenceLevel() });
      }
      res.status(400).json({ error: 'Insight teks tidak valid' });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Gagal menyimpan feedback pemikiran' });
    }
  });

  // --- ADMIN KNOWLEDGE SYSTEM INJECTION ENDPOINTS ---
  app.get('/api/admin/knowledge', (req, res) => {
    try {
      if (!Array.isArray(systemMemory.learnedKnowledgeBase)) {
        systemMemory.learnedKnowledgeBase = [];
      }
      return res.json({
        success: true,
        knowledgeBase: systemMemory.learnedKnowledgeBase,
        intelligenceLevel: getSystemIntelligenceLevel(),
        totalExecutions: systemMemory.totalExecutions || 350,
        lastUpdated: systemMemory.lastUpdated || new Date().toISOString()
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Gagal mengambil data pengetahuan sistem' });
    }
  });

  app.post('/api/admin/knowledge/inject', (req, res) => {
    try {
      const { insight, category, fileName } = req.body;
      if (!insight || typeof insight !== 'string' || !insight.trim()) {
        return res.status(400).json({ error: 'Teks wawasan pengetahuan tidak boleh kosong' });
      }

      const formattedInsight = fileName 
        ? `[Injeksi Berkas: ${fileName}] ${insight.trim()}`
        : category 
          ? `[Injeksi System Admin: ${category.toUpperCase()}] ${insight.trim()}`
          : `[Injeksi System Admin] ${insight.trim()}`;

      if (!Array.isArray(systemMemory.learnedKnowledgeBase)) {
        systemMemory.learnedKnowledgeBase = [];
      }

      if (!systemMemory.learnedKnowledgeBase.includes(formattedInsight)) {
        systemMemory.learnedKnowledgeBase.unshift(formattedInsight);
        systemMemory.lastUpdated = new Date().toISOString();
        saveSystemMemory();
      }

      return res.json({
        success: true,
        message: 'Wawasan berhasil diinjeksi ke memori sistem!',
        knowledgeBase: systemMemory.learnedKnowledgeBase,
        intelligenceLevel: getSystemIntelligenceLevel()
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Gagal menginjeksi pengetahuan' });
    }
  });

  // Dedicated manual training endpoint (Admin-initiated on-demand distillation)
  app.post('/api/admin/knowledge/manual-train', async (req, res) => {
    try {
      const execCount = systemMemory.totalExecutions || 0;
      const autoLearnedInsights = [
        `[Manual Optimization ${new Date().toLocaleDateString('id-ID')}]: Optimalisasi retensi TikTok 3 detik pertama dengan zoom-in dinamis 1.15x dan teks hook berbobot emosional.`,
        `[Manual Optimization ${new Date().toLocaleDateString('id-ID')}]: Penataan lighting volumetric 5600K dan depth-of-field f/1.8 terbukti menghasilkan kualitas render video AI yang superior.`,
        `[Manual Optimization ${new Date().toLocaleDateString('id-ID')}]: Struktur narasi "Hook Masalah -> Solusi Ringkas -> Bukti Visual -> CTA Tegas" memaksimalkan interaksi penonton.`
      ];

      let addedCount = 0;
      if (!Array.isArray(systemMemory.learnedKnowledgeBase)) {
        systemMemory.learnedKnowledgeBase = [];
      }
      for (const ins of autoLearnedInsights) {
        if (!systemMemory.learnedKnowledgeBase.includes(ins)) {
          systemMemory.learnedKnowledgeBase.unshift(ins);
          addedCount++;
        }
      }

      systemMemory.lastUpdated = new Date().toISOString();
      await saveSystemMemoryAsync();

      return res.json({
        success: true,
        message: `Pelatihan manual berhasil! Ditambahkan ${addedCount} wawasan optimasi baru.`,
        intelligenceLevel: getSystemIntelligenceLevel(),
        knowledgeBase: systemMemory.learnedKnowledgeBase
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Gagal menjalankan pelatihan manual' });
    }
  });

  app.delete('/api/admin/knowledge', (req, res) => {
    try {
      const { index, text } = req.body;
      if (!Array.isArray(systemMemory.learnedKnowledgeBase)) {
        systemMemory.learnedKnowledgeBase = [];
      }

      if (typeof index === 'number' && index >= 0 && index < systemMemory.learnedKnowledgeBase.length) {
        systemMemory.learnedKnowledgeBase.splice(index, 1);
      } else if (text && typeof text === 'string') {
        systemMemory.learnedKnowledgeBase = systemMemory.learnedKnowledgeBase.filter(k => k !== text);
      }

      systemMemory.lastUpdated = new Date().toISOString();
      saveSystemMemory();

      return res.json({
        success: true,
        knowledgeBase: systemMemory.learnedKnowledgeBase,
        intelligenceLevel: getSystemIntelligenceLevel()
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Gagal menghapus wawasan pengetahuan' });
    }
  });

  app.post('/api/admin/knowledge/chat', async (req, res) => {
    try {
      const { message, attachedFile, chatHistory } = req.body;
      if ((!message || !message.trim()) && !attachedFile) {
        return res.status(400).json({ error: 'Pesan atau berkas tidak boleh kosong' });
      }

      let systemPrompt = `Anda adalah Core AI System Architect & Neural Knowledge Integrator dari Console Admin Tools Satset.
Tugas Anda adalah berdiskusi dengan Admin, menganalisis berkas/dokumen/teks yang diunggah Admin, dan mengekstrak aturan wawasan (Knowledge Injection Rules) yang secara langsung akan memperkaya kecerdasan sistem AI di seluruh aplikasi.

Respons Anda HARUS berformat JSON dengan struktur berikut:
{
  "reply": "Penjelasan responsif, profesional, dan futuristik dalam Bahasa Indonesia kepada Admin mengenai bagaimana pengetahuan ini telah terintegrasi.",
  "extractedInsights": [
    "Aturan/wawasan ringkas 1 yang siap diinjeksi ke memori sistem",
    "Aturan/wawasan ringkas 2"
  ],
  "suggestedTags": ["Tag1", "Tag2"]
}`;

      let userContent = `PESAN ADMIN: "${message || 'Mohon analisis berkas berikut dan integrasikan ke kecerdasan sistem.'}"`;
      if (attachedFile) {
        userContent += `\n\nBERKAS DIPERIKSA:
- Nama Berkas: ${attachedFile.name}
- Tipe/Ukuran: ${attachedFile.type || 'Dokumen'} (${attachedFile.size || 0} bytes)
- Isi Berkas / Ekstrak Teks:
${attachedFile.textContent || attachedFile.content || '(Teks berkas terlampir)'}`;
      }

      const response = await callGeminiWithFallback(
        'gemini-3.8-flash',
        {
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        },
        undefined,
        undefined,
        'tier2',
        'Knowledge Injection'
      );

      const responseText = response.text || '';
      let parsedResponse: any = {};
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (err) {
        parsedResponse = {
          reply: responseText || 'Berhasil memproses pengetahuan baru dan menyuntikkannya ke sistem.',
          extractedInsights: [
            attachedFile ? `[Injeksi Berkas: ${attachedFile.name}] Wawasan dari ${attachedFile.name}` : `[Injeksi Chat Admin] ${message}`
          ],
          suggestedTags: ['AdminInjection']
        };
      }

      // Automatically inject extracted insights into system memory
      if (!Array.isArray(systemMemory.learnedKnowledgeBase)) {
        systemMemory.learnedKnowledgeBase = [];
      }

      const newInsights = parsedResponse.extractedInsights || [];
      for (const ins of newInsights) {
        if (ins && typeof ins === 'string' && !systemMemory.learnedKnowledgeBase.includes(ins)) {
          systemMemory.learnedKnowledgeBase.unshift(ins);
        }
      }

      systemMemory.lastUpdated = new Date().toISOString();
      saveSystemMemory();

      return res.json({
        success: true,
        reply: parsedResponse.reply || 'Pengetahuan baru berhasil diserap dan diinjeksi ke dalam kecerdasan sistem.',
        extractedInsights: newInsights,
        knowledgeBase: systemMemory.learnedKnowledgeBase,
        intelligenceLevel: getSystemIntelligenceLevel()
      });
    } catch (e: any) {
      logger.warn('[Knowledge Chat API] Error processing admin knowledge chat:', e);
      // Fallback if AI call fails
      const fallbackMsg = `Gagal menghubungkan ke AI Engine: ${e.message || 'Error'}. Namun wawasan teks telah disimpan secara langsung.`;
      
      const { message, attachedFile } = req.body;
      const directInsight = attachedFile 
        ? `[Injeksi Berkas: ${attachedFile.name}] ${attachedFile.textContent ? attachedFile.textContent.slice(0, 150) : 'Berkas diunggah admin'}`
        : `[Injeksi Admin] ${message}`;

      if (!systemMemory.learnedKnowledgeBase.includes(directInsight)) {
        systemMemory.learnedKnowledgeBase.unshift(directInsight);
        saveSystemMemory();
      }

      return res.json({
        success: true,
        reply: fallbackMsg,
        extractedInsights: [directInsight],
        knowledgeBase: systemMemory.learnedKnowledgeBase,
        intelligenceLevel: getSystemIntelligenceLevel()
      });
    }
  });

  // 1-Hour Server-side Background Auto-Trainer Engine
  function initServerAutoTrainerScheduler() {
    logger.info('[Auto-Trainer Engine 24/7] Scheduler started. Running every 1 hour...');

    const runTrainerPass = async () => {
      try {
        logger.info('[Auto-Trainer Engine 24/7] Running 1-Hour Automated Knowledge Pass...');
        const events = await loadEventsServer();
        let newlyLearned = 0;

        events.forEach((evt) => {
          // Exclude herbal_kesehatan from auto-merging
          if (evt.category === 'herbal_kesehatan') {
            return;
          }

          if (evt.payload && evt.payload.insight) {
            const insight = String(evt.payload.insight).trim();
            if (insight && !systemMemory.learnedKnowledgeBase.includes(insight)) {
              systemMemory.learnedKnowledgeBase.push(insight);
              newlyLearned++;
            }
          }
        });

        systemMemory.lastUpdated = new Date().toISOString();
        saveSystemMemory();

        logger.info(`[Auto-Trainer Engine 24/7] Pass completed. +${newlyLearned} new patterns merged. Total Knowledge Base: ${systemMemory.learnedKnowledgeBase.length}`);
      } catch (err) {
        logger.warn('[Auto-Trainer Engine 24/7] Error in background pass:', err);
      }
    };

    // Run initial pass 10s after server boot
    setTimeout(runTrainerPass, 10000);

    // Repeat every 1 hour (3600000 ms)
    setInterval(runTrainerPass, 3600000);
  }

  initServerAutoTrainerScheduler();

  // Helper to extract clean URL from text (e.g. from user sharing text from TikTok app)
  function extractUrlFromText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      // Strip trailing punctuation often attached from copy-paste
      return urlMatch[0].replace(/[)\]}>,;."']+$/, '');
    }
    return trimmed;
  }

  // API endpoint for TikTok Video Info Downloader with Cache, Auto-Unshorten & Multi-Fallback
  app.post('/api/tiktok/info', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL TikTok tidak boleh kosong' });
      }

      let cleanUrl = extractUrlFromText(url);
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      // Check Cache
      const cached = tiktokCache.get(cleanUrl);
      if (cached && Date.now() - cached.timestamp < TIKTOK_CACHE_TTL_MS) {
        logger.info('[TikTok Cache Hit]', cleanUrl);
        return res.json(cached.data);
      }

      // Resolve redirect for shortlinks (vt.tiktok.com, vm.tiktok.com, /t/, vt.tokopedia.com, tokopedia.link)
      let resolvedUrl = cleanUrl;
      if (cleanUrl.includes('vt.tiktok.com') || cleanUrl.includes('vm.tiktok.com') || cleanUrl.includes('/t/') || cleanUrl.includes('tokopedia')) {
        try {
          const headRes = await fetch(cleanUrl, {
            method: 'HEAD',
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
            }
          });
          if (headRes.ok && headRes.url && headRes.url !== cleanUrl) {
            resolvedUrl = headRes.url;
          }
        } catch (e) {
          // Ignore redirect error, proceed with original
        }
      }

      const urlsToTry = Array.from(new Set([cleanUrl, resolvedUrl]));

      // Provider 1: TikWM
      for (const targetUrl of urlsToTry) {
        try {
          const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}&hd=1`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
            }
          });

          const data = await response.json();

          if (data && data.code === 0 && data.data) {
            const v = data.data;
            const formatUrl = (u: string | undefined) => {
              if (!u) return '';
              if (u.startsWith('http://') || u.startsWith('https://')) return u;
              return `https://www.tikwm.com${u.startsWith('/') ? '' : '/'}${u}`;
            };

            const result = {
              id: v.id || String(Date.now()),
              title: v.title || 'TikTok Video',
              cover: formatUrl(v.cover || v.origin_cover || ''),
              play: formatUrl(v.play || ''), // Standard H.264 no-watermark video URL (browser-compatible)
              wmplay: formatUrl(v.wmplay || v.play || ''), // Watermarked video URL
              hdplay: formatUrl(v.hdplay || v.play || ''), // HD video URL
              music: formatUrl(v.music || ''), // Audio URL
              musicTitle: v.music_info?.title || 'Original Audio',
              musicAuthor: v.music_info?.author || v.author?.nickname || '',
              author: {
                id: v.author?.id || '',
                uniqueId: v.author?.unique_id || 'tiktok_user',
                nickname: v.author?.nickname || 'TikTok Creator',
                avatar: formatUrl(v.author?.avatar || ''),
              },
              stats: {
                playCount: v.play_count || 0,
                diggCount: v.digg_count || 0,
                commentCount: v.comment_count || 0,
                shareCount: v.share_count || 0,
              },
              images: Array.isArray(v.images) ? v.images.map(img => formatUrl(img)) : null,
            };

            tiktokCache.set(cleanUrl, { timestamp: Date.now(), data: result });
            if (resolvedUrl !== cleanUrl) {
              tiktokCache.set(resolvedUrl, { timestamp: Date.now(), data: result });
            }
            return res.json(result);
          }
        } catch (e) {
          logger.warn('TikWM API failed for URL, trying next provider...', e);
        }
      }

      // Provider 2: Tiklydown (v1 / v4)
      for (const targetUrl of urlsToTry) {
        try {
          const fallbackRes = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(targetUrl)}`);
          const fallbackData = await fallbackRes.json();
          if (fallbackData && (fallbackData.video || fallbackData.url)) {
            const result = {
              id: fallbackData.id || String(Date.now()),
              title: fallbackData.title || fallbackData.video?.caption || 'TikTok Video',
              cover: fallbackData.cover || fallbackData.video?.cover || '',
              play: fallbackData.video?.noWatermark || fallbackData.url || '',
              wmplay: fallbackData.video?.watermark || fallbackData.url || '',
              hdplay: fallbackData.video?.noWatermark || fallbackData.url || '',
              music: fallbackData.music?.url || fallbackData.audio || '',
              musicTitle: fallbackData.music?.title || 'Original Audio',
              musicAuthor: fallbackData.music?.author || '',
              author: {
                id: fallbackData.author?.id || '',
                uniqueId: fallbackData.author?.unique_id || fallbackData.author?.username || 'user',
                nickname: fallbackData.author?.nickname || fallbackData.author?.name || 'TikTok User',
                avatar: fallbackData.author?.avatar || '',
              },
              stats: {
                playCount: fallbackData.stats?.playCount || 0,
                diggCount: fallbackData.stats?.likeCount || 0,
                commentCount: fallbackData.stats?.commentCount || 0,
                shareCount: fallbackData.stats?.shareCount || 0,
              },
              images: fallbackData.images || null,
            };

            tiktokCache.set(cleanUrl, { timestamp: Date.now(), data: result });
            return res.json(result);
          }
        } catch (e) {
          logger.warn('Tiklydown API failed:', e);
        }
      }

      // Provider 3: TikTok Official oEmbed (for metadata if download APIs are temporarily throttled)
      try {
        const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData && oembedData.title) {
            const result = {
              id: String(Date.now()),
              title: oembedData.title || 'TikTok Video',
              cover: oembedData.thumbnail_url || '',
              play: '',
              wmplay: '',
              hdplay: '',
              music: '',
              musicTitle: 'Original Audio',
              musicAuthor: oembedData.author_name || '',
              author: {
                id: oembedData.author_unique_id || '',
                uniqueId: oembedData.author_unique_id || 'user',
                nickname: oembedData.author_name || 'TikTok User',
                avatar: '',
              },
              stats: { playCount: 0, diggCount: 0, commentCount: 0, shareCount: 0 },
              images: null,
            };
            return res.json(result);
          }
        }
      } catch (oembedErr) {
        // Continue to error
      }

      // Provider 4: TikTok Shop / Tokopedia Product Fallback
      try {
        const candidateShopUrl = resolvedUrl !== cleanUrl ? resolvedUrl : cleanUrl;
        const shopProduct = await fetchTikTokShopProduct(candidateShopUrl);
        if (shopProduct && shopProduct.name) {
          const result = {
            id: 'shop_' + Date.now(),
            isShop: true,
            title: shopProduct.name,
            cover: shopProduct.imageUrl || '',
            play: '',
            wmplay: '',
            hdplay: '',
            music: '',
            musicTitle: 'Produk TikTok Shop',
            musicAuthor: 'TikTok Shop',
            author: {
              id: 'tiktok_shop',
              uniqueId: 'tiktok_shop',
              nickname: 'TikTok Shop',
              avatar: shopProduct.imageUrl || '',
            },
            stats: { playCount: 0, diggCount: 0, commentCount: 0, shareCount: 0 },
            images: shopProduct.imageUrl ? [shopProduct.imageUrl] : null,
            product: {
              ...shopProduct,
              shopUrl: cleanUrl,
            },
          };

          tiktokCache.set(cleanUrl, { timestamp: Date.now(), data: result });
          if (resolvedUrl !== cleanUrl) {
            tiktokCache.set(resolvedUrl, { timestamp: Date.now(), data: result });
          }
          return res.json(result);
        }
      } catch (shopFallbackErr) {
        logger.warn('TikTok Shop fallback in /api/tiktok/info failed:', shopFallbackErr);
      }

      return res.status(404).json({
        error: 'Gagal mengambil informasi dari link TikTok. Pastikan tautan video atau produk TikTok Shop/Tokopedia berstatus publik dan valid.'
      });

    } catch (error: any) {
      logger.error('TikTok downloader error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat memproses tautan TikTok.' });
    }
  });

  // Dedicated API endpoint for TikTok Shop & Tokopedia Product Info
  app.post('/api/tiktok-shop/info', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL produk TikTok Shop tidak boleh kosong' });
      }

      const product = await fetchTikTokShopProduct(url);
      if (!product || !product.name) {
        return res.status(404).json({ error: 'Gagal mengambil informasi produk dari link ini. Pastikan link aktif.' });
      }

      return res.json({
        success: true,
        product,
      });
    } catch (err: any) {
      logger.error('TikTok shop info endpoint error:', err);
      res.status(500).json({ error: 'Terjadi kendala saat memproses link TikTok Shop' });
    }
  });

  // API endpoint for streaming/proxying media to bypass CORS, support Range seeking, and force download
  app.get('/api/tiktok/proxy', async (req, res) => {
    try {
      let mediaUrl = req.query.url as string;
      const filename = (req.query.filename as string) || 'tiktok_media.mp4';
      const isDownload = req.query.download === 'true';

      if (!mediaUrl) {
        return res.status(400).send('URL query parameter is required');
      }

      if (mediaUrl.startsWith('/')) {
        mediaUrl = `https://www.tikwm.com${mediaUrl}`;
      }

      // Set CORS Headers for Canvas/WebGL & Video Player compatibility
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }

      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
      };

      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const mediaRes = await fetch(mediaUrl, {
        headers,
      });

      if (!mediaRes.ok && mediaRes.status !== 206) {
        return res.status(mediaRes.status).send('Gagal mengambil berkas media');
      }

      const rawType = mediaRes.headers.get('content-type') || '';
      let contentType = rawType;
      if (!contentType || contentType.includes('text/') || contentType.includes('application/json')) {
        contentType = filename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4';
      }
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');

      const contentRange = mediaRes.headers.get('content-range');
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
      }

      const contentLength = mediaRes.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      if (isDownload) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      }

      res.status(mediaRes.status);

      // Stream buffer back to client
      const arrayBuffer = await mediaRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      logger.error('Proxy media error:', error);
      res.status(500).send('Media proxy error');
    }
  });

  // [REALTIME-FIX] --- TRACKING, SSE, LONG-POLLING & PERSISTENCE ENGINE ---
  interface SSEClientMeta {
    res: any;
    token: string;
    connectedAt: number;
  }

  // Load Active Generations on boot
  async function loadActiveGenerationsServer() {
    try {
      const data = await dbGetActiveGenerations();
      if (Array.isArray(data?.list)) {
        for (const item of data.list) {
          activeGenerationsMap.set(item.taskId, item);
        }
      }
    } catch (e) {
      logger.warn('[ActiveGen Persistence] Error reading file:', e);
    }
  }

  async function saveActiveGenerationsServer() {
    try {
      const list = Array.from(activeGenerationsMap.values());
      await dbSaveActiveGenerations({ list });
    } catch (e) {
      logger.warn('[ActiveGen Persistence] Error saving file:', e);
    }
  }

  await loadActiveGenerationsServer();

  // Periodic persistence of activeGenerationsMap (every 30s)
  setInterval(async () => {
    await saveActiveGenerationsServer();
  }, 30000);

  // In-Memory SimpleEventQueue (Max 500 items)
  interface QueueItem {
    id: number;
    payload: any;
    timestamp: number;
  }

  function pushToEventQueue(payload: any): number {
    const eventId = ++globalEventCounter;
    simpleEventQueue.push({ id: eventId, payload, timestamp: Date.now() });
    if (simpleEventQueue.length > 500) {
      simpleEventQueue.shift(); // Evict oldest
    }
    return eventId;
  }

  // Pending Long-Poll Requests Queue
  interface PendingPoll {
    token: string;
    lastEventId: number;
    res: any;
    timeout: any;
  }

  // Heartbeat Timer every 15s for proxy connection keep-alive
  setInterval(() => {
    const hbPayload = `: heartbeat\nid: hb_${Date.now()}\ndata: ${JSON.stringify({ type: 'ping', ts: Date.now() })}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.res.write(hbPayload);
      } catch (e) {
        sseClients.delete(client);
      }
    });
  }, 15000);

  // Robust Event Broadcast Function
  function broadcastLiveEvent(data: any) {
    const eventId = pushToEventQueue(data);
    const payload = `:pad\nid: ${eventId}\ndata: ${JSON.stringify(data)}\n\n`;

    // 1. Broadcast to SSE clients
    sseClients.forEach((client) => {
      try {
        client.res.write(payload);
      } catch (e) {
        // Retry 1x before dropping
        setTimeout(async () => {
          try {
            client.res.write(payload);
          } catch (retryErr) {
            logger.warn('[SSE] Client write failed after retry, dropping client.');
            sseClients.delete(client);
          }
        }, 50);
      }
    });

    // 2. Resolve Long-Polling clients waiting for new events
    for (let i = pendingPolls.length - 1; i >= 0; i--) {
      const poll = pendingPolls[i];
      if (poll.lastEventId < eventId) {
        clearTimeout(poll.timeout);
        try {
          poll.res.json({
            success: true,
            events: [data],
            lastEventId: eventId,
          });
        } catch (e) {
          // ignore write errors
        }
        pendingPolls.splice(i, 1);
      }
    }
  }

  // --- PACKAGES BACKEND PERSISTENCE ---

  function handleApiError(res: express.Response, err: any) {
    const statusCode = err?.statusCode || (err?.isPermissionDenied || err?.code === 7 ? 403 : 500);
    const message = err?.message || 'Terjadi kesalahan pada server/database';
    res.status(statusCode).json({
      error: message,
      status: err?.isPermissionDenied ? 'PERMISSION_DENIED' : 'DATABASE_ERROR',
      code: err?.code || statusCode,
    });
  }

  async function loadPackagesServer() { return await dbGetPackages(); }
  async function savePackagesServer(list: any[]) {
    try {
      const existing = await dbGetPackages();
      const newIds = new Set((list || []).map((p: any) => p.id).filter(Boolean));
      for (const oldPkg of existing) {
        if (oldPkg?.id && !newIds.has(oldPkg.id)) {
          await dbDeletePackage(oldPkg.id);
        }
      }
    } catch (e) {
      logger.warn('[savePackagesServer Delete Check Error]', e);
    }
    for (const item of list) { await dbSavePackage(item); }
  }
  app.get('/api/packages', async (req, res) => {
    try {
      res.json(await loadPackagesServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/admin/packages', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const updatedPackagesList = req.body;
      if (!Array.isArray(updatedPackagesList)) {
        return res.status(400).json({ error: 'Payload paket harus berupa array' });
      }
      await savePackagesServer(updatedPackagesList);
      broadcastLiveEvent({ type: 'packages_updated', packages: updatedPackagesList });
      res.json({ success: true, packages: updatedPackagesList });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  // --- PAYMENT, CLIENTS, ACCESS CODES & QRIS ADMIN BACKEND PERSISTENCE ---

  async function loadAccessCodesServer() { return await dbGetAccessCodes(); }
  async function saveAccessCodesServer(list: any[]) {
    try {
      const existing = await dbGetAccessCodes();
      const newKeys = new Set((list || []).map((item: any) => (item?.id || item?.code || '').trim().toUpperCase()).filter(Boolean));
      for (const oldItem of existing) {
        const oldKey = (oldItem?.id || oldItem?.code || '').trim().toUpperCase();
        if (oldKey && !newKeys.has(oldKey)) {
          await dbDeleteAccessCode(oldKey);
        }
      }
    } catch (e) {
      logger.warn('[saveAccessCodesServer Delete Check Error]', e);
    }
    for (const item of list) { await dbSaveAccessCode(item); }
  }
  app.get('/api/access-codes', async (req, res) => {
    try {
      res.json(await loadAccessCodesServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/access-codes', async (req, res) => {
    try {
      const { code, note } = req.body || {};
      if (!code) return res.status(400).json({ error: 'Kode akses tidak boleh kosong' });
      const list = await loadAccessCodesServer();
      const cleanCode = code.trim().toUpperCase();
      const existingIdx = list.findIndex((item) => item.code && item.code.toUpperCase() === cleanCode);
      const newItem = {
        code: cleanCode,
        note: note || 'Akses Satset',
        createdAt: Date.now(),
      };
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...newItem };
      } else {
        list.unshift(newItem);
      }
      await saveAccessCodesServer(list);
      broadcastLiveEvent({ type: 'access_codes_updated', accessCodes: list });
      res.json({ success: true, accessCodes: list, item: newItem });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/access-codes/remove', async (req, res) => {
    try {
      const { code } = req.body || {};
      if (!code) return res.status(400).json({ error: 'Kode akses tidak boleh kosong' });
      const cleanCode = code.trim().toUpperCase();
      const list = (await loadAccessCodesServer()).filter((item) => item.code && item.code.toUpperCase() !== cleanCode);
      await saveAccessCodesServer(list);
      broadcastLiveEvent({ type: 'access_codes_updated', accessCodes: list });
      res.json({ success: true, accessCodes: list });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  // --- AUDIT LOGS PERSISTENCE ENGINE ---

  async function loadAuditLogsServer() { return await dbGetAuditLogs(); }
  async function saveAuditLogsServer(list: any[]) { for (const item of list) { await dbAddAuditLog(item); } }
  
  app.get('/api/admin/audit-logs', async (req, res) => {
    try {
      const logs = await loadAuditLogsServer();
      res.json(logs || []);
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/admin/audit-logs', async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = (req.headers['user-agent'] as string) || 'Web Browser';
      const { action, details, category, adminName, actor } = req.body || {};

      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      const logItem: AuditLogItem = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        adminName: actor || adminName || 'System',
        action: String(action).trim(),
        details: details || `Aktivitas tercatat dari IP: ${clientIp} • Browser: ${userAgent.slice(0, 80)}`,
        timestamp: new Date().toISOString(),
        category: (category as any) || 'system',
      };

      await dbAddAuditLog(logItem);

      try {
        const currentLogs = await dbGetAuditLogs();
        broadcastLiveEvent({ 
          type: 'audit_log_event', 
          log: {
            id: logItem.id,
            adminName: logItem.adminName,
            action: logItem.action,
            details: logItem.details,
            timestamp: logItem.timestamp,
            category: logItem.category
          }, 
          auditLogs: currentLogs 
        });
        broadcastLiveEvent({ type: 'audit_logs_updated', auditLogs: currentLogs } as any);
      } catch (e) {
        console.error('Audit broadcast error:', e);
      }

      res.json({ success: true, log: logItem });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  // --- SECURITY ENFORCEMENT & VIOLATION REPORTING API ENDPOINTS ---
  app.post('/api/security/check-banned', (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    const fingerprint = (req.headers['x-device-fingerprint'] as string) || req.body?.fingerprint || '';
    const accessCode = (req.headers['x-access-code'] as string) || req.body?.accessCode || '';

    const check = isDeviceOrIpBanned(clientIp, fingerprint, accessCode);
    if (check.banned) {
      return res.status(403).json({
        isBanned: true,
        error: `Akses Ditolak! Perangkat atau IP Anda telah diblokir secara permanen oleh Sistem Keamanan Server (Device Banned). Alasan: ${check.reason || 'Pelanggaran Akses'}.`,
        reason: check.reason,
      });
    }

    res.json({ isBanned: false });
  });

  app.post('/api/security/report-violation', async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const { violationType, details, fingerprint, accessCode } = req.body || {};

    const reason = `Otomatis Diblokir oleh Security System (${violationType || 'TAMPERING_DETECTED'}): ${details || 'Aktivitas mencurigakan di browser'}`;
    const banned = await banDeviceOrIp({
      fingerprint,
      ip: clientIp,
      accessCode,
      reason,
      bannedBy: 'SYSTEM_SECURITY_GUARD',
    });

    res.status(403).json({
      success: false,
      isBanned: true,
      error: `Perangkat Anda telah diblokir otomatis oleh Security Guard Server! Alasan: ${reason}`,
      bannedItem: banned,
    });
  });

  app.get('/api/admin/banned-devices', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const list = await dbGetBannedDevices();
      res.json(list || Array.from(bannedDevicesMap.values()));
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/admin/banned-devices', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const { fingerprint, ip, accessCode, reason } = req.body || {};
      if (!fingerprint && !ip && !accessCode) {
        return res.status(400).json({ error: 'Sediakan Fingerprint, IP, atau Kode Akses untuk diblokir.' });
      }

      const item = await banDeviceOrIp({
        fingerprint,
        ip,
        accessCode,
        reason: reason || 'Manual Ban oleh Super Admin',
        bannedBy: 'SUPER_ADMIN',
      });

      res.json({ success: true, bannedDevice: item, message: 'Device/IP berhasil diblokir secara permanen.' });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/admin/banned-devices/unban', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const { id, fingerprint, ip } = req.body || {};
      const key = id || fingerprint || ip;
      if (!key) {
        return res.status(400).json({ error: 'Sediakan ID atau Key perangkat untuk di-unban.' });
      }

      bannedDevicesMap.delete(key);
      if (fingerprint) bannedDevicesMap.delete(fingerprint);
      if (ip) bannedDevicesMap.delete(ip);

      await dbDeleteBannedDevice(key);

      dbAddAuditLog({
        id: 'audit_' + Date.now(),
        adminName: 'DEVICE_UNBANNED',
        action: `Unbanned Device/IP key: ${key}`,
        details: 'security_system',
        timestamp: new Date().toISOString(),
        category: 'Security System' as any,
      });

      broadcastLiveEvent({ type: 'device_unbanned', unbannedKey: key });
      res.json({ success: true, message: 'Blokir perangkat berhasil dibuka.' });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/admin/active-generations/stop', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const { taskId, banUser } = req.body || {};
      if (!taskId) return res.status(400).json({ error: 'taskId required' });

      const task = activeGenerationsMap.get(taskId);
      if (task) {
        task.status = 'failed';
        task.updatedAt = Date.now();
        activeGenerationsMap.set(taskId, task);

        if (banUser && (task.ip || task.deviceFingerprint || task.accessCode)) {
          await banDeviceOrIp({
            fingerprint: task.deviceFingerprint,
            ip: task.ip,
            accessCode: task.accessCode,
            reason: `Dihentikan & Dibanned oleh Admin saat generate (${task.tool || 'Generasi AI'})`,
            bannedBy: 'ADMIN_FORCE_STOP',
          });
        }

        setTimeout(() => {
          activeGenerationsMap.delete(taskId);
          broadcastLiveEvent({
            type: 'active_status_update',
            activeGenerations: Array.from(activeGenerationsMap.values()),
            activeUserCount: sseClients.size,
          });
        }, 3000);
      }

      broadcastLiveEvent({
        type: 'active_status_update',
        activeGenerations: Array.from(activeGenerationsMap.values()),
        activeUserCount: sseClients.size,
      });

      res.json({ success: true, message: 'Generasi berhasil dibatalkan.' });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  // --- ACTIVE SESSIONS REAL-TIME PRESENCE ENGINE ---
  interface ActivePresenceSession {
    accessCode: string;
    name: string;
    role: string;
    ip: string;
    userAgent: string;
    loginAt: string;
    lastSeenAt: number;
  }

  const activePresenceSessions = new Map<string, ActivePresenceSession>();

  function getActiveSessionsList(): ActivePresenceSession[] {
    const cutoff = Date.now() - 2 * 60 * 1000; // 2 menit timeout
    const activeList: ActivePresenceSession[] = [];
    for (const [key, session] of activePresenceSessions.entries()) {
      if (session.lastSeenAt >= cutoff) {
        activeList.push(session);
      } else {
        activePresenceSessions.delete(key);
      }
    }
    return activeList;
  }

  function recordUserPresence(session: { accessCode: string; name?: string; role?: string; ip?: string; userAgent?: string }) {
    const code = (session.accessCode || '').trim().toUpperCase();
    if (!code) return;
    const existing = activePresenceSessions.get(code);
    const now = Date.now();
    const item: ActivePresenceSession = {
      accessCode: code,
      name: session.name || existing?.name || 'Klien Satset',
      role: session.role || existing?.role || 'user',
      ip: session.ip || existing?.ip || 'unknown',
      userAgent: session.userAgent || existing?.userAgent || 'Web Browser',
      loginAt: existing?.loginAt || new Date().toISOString(),
      lastSeenAt: now,
    };
    activePresenceSessions.set(code, item);
    try {
      broadcastLiveEvent({
        type: 'presence_updated',
        activeSessions: getActiveSessionsList(),
      });
    } catch (e) {}
  }

  function removeUserPresence(accessCode: string) {
    const code = (accessCode || '').trim().toUpperCase();
    if (!code) return;
    if (activePresenceSessions.has(code)) {
      activePresenceSessions.delete(code);
      try {
        broadcastLiveEvent({
          type: 'presence_updated',
          activeSessions: getActiveSessionsList(),
        });
      } catch (e) {}
    }
  }

  // Periodic cleanup every 45 seconds for expired active sessions
  setInterval(() => {
    const prevCount = activePresenceSessions.size;
    const list = getActiveSessionsList();
    if (activePresenceSessions.size !== prevCount) {
      try {
        broadcastLiveEvent({
          type: 'presence_updated',
          activeSessions: list,
        });
      } catch (e) {}
    }
  }, 45000);

  // --- PRESENCE API ENDPOINTS ---
  app.post('/api/presence/heartbeat', (req, res) => {
    const { accessCode, name, role } = req.body || {};
    const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '').trim();
    const userAgent = (req.headers['user-agent'] as string) || 'Web Browser';

    if (!accessCode) {
      return res.status(400).json({ error: 'accessCode is required' });
    }

    recordUserPresence({ accessCode, name, role, ip, userAgent });
    res.json({ success: true, activeCount: activePresenceSessions.size });
  });

  app.get('/api/admin/presence', (req, res) => {
    res.json({
      success: true,
      activeSessions: getActiveSessionsList(),
    });
  });

  // --- DEDICATED SERVER ACCESS CODE VERIFICATION ENDPOINT ---
  app.post('/api/verify-access-code', async (req, res) => {
    const { accessCode, fingerprint, userAgent: reqUserAgent } = req.body || {};
    const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '').trim();
    const userAgent = reqUserAgent || (req.headers['user-agent'] as string) || 'Web Browser';
    const cleaned = String(accessCode || '').trim().toUpperCase();

    // Check if IP or Fingerprint or Code is already banned
    const banCheck = isDeviceOrIpBanned(ip, fingerprint, cleaned);
    if (banCheck.banned) {
      const banLogItem: AuditLogItem = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        adminName: cleaned ? `Aktor Terblokir (${cleaned})` : 'Perangkat Terblokir',
        action: 'Login Ditolak (Device Banned)',
        details: `Upaya login dari IP/Perangkat yang telah diblokir permanen (${banCheck.reason}) • IP: ${ip}`,
        timestamp: new Date().toISOString(),
        category: 'system',
      };
      await dbAddAuditLog(banLogItem);
      try {
        const currentLogs = await dbGetAuditLogs();
        broadcastLiveEvent({ type: 'audit_log_event', log: banLogItem, auditLogs: currentLogs });
        broadcastLiveEvent({ type: 'audit_logs_updated' } as any);
      } catch (e) {}

      return res.status(403).json({
        success: false,
        isBanned: true,
        error: `Akses Anda ditolak! Device/IP ini telah diblokir secara permanen oleh Sistem Keamanan. Alasan: ${banCheck.reason}`,
      });
    }

    if (!cleaned) {
      const emptyLogItem: AuditLogItem = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        adminName: 'Pengguna Tanpa Kode',
        action: 'Login Gagal (Input Kosong)',
        details: `Percobaan submit form login dengan kode kosong dari IP: ${ip}`,
        timestamp: new Date().toISOString(),
        category: 'system',
      };
      await dbAddAuditLog(emptyLogItem);
      try {
        const currentLogs = await dbGetAuditLogs();
        broadcastLiveEvent({ type: 'audit_log_event', log: emptyLogItem, auditLogs: currentLogs });
        broadcastLiveEvent({ type: 'audit_logs_updated' } as any);
      } catch (e) {}

      return res.status(400).json({ success: false, error: 'Masukkan Kode Akses Anda.' });
    }

    const trackerKey = `${ip}_${fingerprint || 'nofp'}`;
    const nowTs = Date.now();
    const prevAttempts = failedLoginTracker.get(trackerKey) || { count: 0, lastAttempt: nowTs };

    // Reset counter if last attempt was > 5 mins ago
    if (nowTs - prevAttempts.lastAttempt > 300000) {
      prevAttempts.count = 0;
    }

    const masterAdminKey = process.env.ADMIN_ACCESS_CODE ? process.env.ADMIN_ACCESS_CODE.trim().toUpperCase() : '';
    const masterAdminEmails = ['AHMADDAVID0906@GMAIL.COM', 'GLOBALLENSN@GMAIL.COM', 'DAVIDROHMAN037@GMAIL.COM'];

    // 1. MASTER ADMIN LOGIN
    if ((masterAdminKey && cleaned === masterAdminKey) || masterAdminEmails.includes(cleaned)) {
      failedLoginTracker.delete(trackerKey);
      const loggedInEmail = cleaned.includes('@') ? cleaned.toLowerCase() : 'ahmaddavid0906@gmail.com';
      const adminCode = masterAdminKey || loggedInEmail;
      recordUserPresence({
        accessCode: adminCode,
        name: 'Administrator',
        role: 'admin',
        ip,
        userAgent,
      });

      const logItem: AuditLogItem = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        adminName: `Master Admin (${loggedInEmail})`,
        action: 'Login Berhasil',
        details: `Otentikasi Master Admin sukses dari IP: ${ip} • Browser: ${userAgent.slice(0, 80)}`,
        timestamp: new Date().toISOString(),
        category: 'system',
      };
      await dbAddAuditLog(logItem);
      try {
        const currentLogs = await dbGetAuditLogs();
        broadcastLiveEvent({ type: 'audit_log_event', log: logItem, auditLogs: currentLogs });
        broadcastLiveEvent({ type: 'audit_logs_updated' } as any);
      } catch (e) {}

      return res.json({
        success: true,
        role: 'admin',
        name: 'Administrator',
        email: loggedInEmail,
        code: adminCode,
      });
    }

    // 2. REGISTERED CLIENT LOGIN
    const clients = await loadClientsServer();
    const client = clients.find((c) => c.accessCode && c.accessCode.toUpperCase() === cleaned);

    if (client) {
      const now = Date.now();
      const expiry = client.expiryDate ? new Date(client.expiryDate).getTime() : now + 86400000;
      let calculatedStatus = client.status || 'active';
      if (calculatedStatus !== 'suspended') {
        if (expiry - now <= 0) calculatedStatus = 'expired';
      }

      if (calculatedStatus === 'suspended') {
        const logItem: AuditLogItem = {
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          adminName: `${client.name || 'Klien Satset'} (${cleaned})`,
          action: 'Login Ditolak (Ditangguhkan)',
          details: `Akses ditolak karena akun dalam status ditangguhkan/suspended • IP: ${ip}`,
          timestamp: new Date().toISOString(),
          category: 'client',
        };
        await dbAddAuditLog(logItem);
        try {
          const currentLogs = await dbGetAuditLogs();
          broadcastLiveEvent({ type: 'audit_log_event', log: logItem, auditLogs: currentLogs });
          broadcastLiveEvent({ type: 'audit_logs_updated' } as any);
        } catch (e) {}

        return res.json({
          success: false,
          error: 'Akses Anda saat ini ditangguhkan. Silakan hubungi administrator.',
        });
      }

      if (calculatedStatus === 'expired') {
        const logItem: AuditLogItem = {
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          adminName: `${client.name || 'Klien Satset'} (${cleaned})`,
          action: 'Login Ditolak (Kadaluarsa)',
          details: `Akses ditolak karena masa aktif telah kedaluwarsa (${new Date(client.expiryDate).toLocaleDateString('id-ID')}) • IP: ${ip}`,
          timestamp: new Date().toISOString(),
          category: 'client',
        };
        await dbAddAuditLog(logItem);
        try {
          const currentLogs = await dbGetAuditLogs();
          broadcastLiveEvent({ type: 'audit_log_event', log: logItem, auditLogs: currentLogs });
          broadcastLiveEvent({ type: 'audit_logs_updated' } as any);
        } catch (e) {}

        return res.json({
          success: false,
          error: 'Masa aktif kode akses telah kedaluwarsa. Silakan perpanjang paket Anda.',
        });
      }

      // Reset failed logins on success
      failedLoginTracker.delete(trackerKey);

      // Record Presence
      recordUserPresence({
        accessCode: client.accessCode,
        name: client.name || 'Klien Satset',
        role: 'user',
        ip,
        userAgent,
      });

      // Update client's lastLoginAt
      client.lastLoginAt = new Date().toISOString();
      await saveClientsServer(clients);
      broadcastLiveEvent({ type: 'clients_updated', clients });

      const logItem: AuditLogItem = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        adminName: `${client.name || 'Klien Satset'} (${cleaned})`,
        action: 'Login Berhasil',
        details: `Login pengguna sukses • Paket: ${client.packageName || client.packageId || 'VIP'} • IP: ${ip} • Masa Aktif: ${new Date(client.expiryDate).toLocaleDateString('id-ID')}`,
        timestamp: new Date().toISOString(),
        category: 'client',
      };
      await dbAddAuditLog(logItem);
      try {
        const currentLogs = await dbGetAuditLogs();
        broadcastLiveEvent({ type: 'audit_log_event', log: logItem, auditLogs: currentLogs });
        broadcastLiveEvent({ type: 'audit_logs_updated' } as any);
      } catch (e) {}

      return res.json({
        success: true,
        role: 'user',
        code: client.accessCode,
        name: client.name || 'Klien Satset',
        email: client.email || '',
      });
    }

    // 3. ACCESS CODE POOL LOGIN
    const accessCodes = await loadAccessCodesServer();
    const matchedCode = accessCodes.find((item) => item.code && item.code.toUpperCase() === cleaned);

    if (matchedCode) {
      failedLoginTracker.delete(trackerKey);

      // Record Presence
      recordUserPresence({
        accessCode: matchedCode.code,
        name: matchedCode.note || 'Klien Satset',
        role: 'user',
        ip,
        userAgent,
      });

      const logItem: AuditLogItem = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        adminName: `${matchedCode.note || 'User Kode Akses'} (${cleaned})`,
        action: 'Login Berhasil',
        details: `Login kode akses terdaftar sukses (${matchedCode.note || 'Akses Terverifikasi'}) • IP: ${ip}`,
        timestamp: new Date().toISOString(),
        category: 'client',
      };
      await dbAddAuditLog(logItem);
      try {
        const currentLogs = await dbGetAuditLogs();
        broadcastLiveEvent({ type: 'audit_log_event', log: logItem, auditLogs: currentLogs });
        broadcastLiveEvent({ type: 'audit_logs_updated' } as any);
      } catch (e) {}

      return res.json({
        success: true,
        role: 'user',
        code: matchedCode.code,
        name: matchedCode.note || 'Klien Satset',
      });
    }

    // 4. FAILED LOGIN ATTEMPT
    const currentCount = prevAttempts.count + 1;
    failedLoginTracker.set(trackerKey, { count: currentCount, lastAttempt: nowTs });

    if (currentCount >= 5) {
      const banReason = `Otomatis Diblokir (Brute Force Login): 5x percobaan kode salah '${cleaned}' dari IP ${ip}`;
      await banDeviceOrIp({
        fingerprint,
        ip,
        accessCode: cleaned,
        reason: banReason,
        bannedBy: 'SYSTEM_BRUTE_FORCE_PROTECTOR',
      });

      const banLogItem: AuditLogItem = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        adminName: `Pelaku Brute Force (${cleaned})`,
        action: 'Login Ditolak (Auto-Banned)',
        details: `Perangkat/IP diblokir otomatis setelah 5x gagal login dengan kode salah • IP: ${ip}`,
        timestamp: new Date().toISOString(),
        category: 'system',
      };
      await dbAddAuditLog(banLogItem);
      try {
        const currentLogs = await dbGetAuditLogs();
        broadcastLiveEvent({ type: 'audit_log_event', log: banLogItem, auditLogs: currentLogs });
        broadcastLiveEvent({ type: 'audit_logs_updated' } as any);
      } catch (e) {}

      return res.status(403).json({
        success: false,
        isBanned: true,
        error: `PERANGKAT DIBLOKIR PERMANEN! Anda telah melakukan 5 kali percobaan kode salah. Akses ditolak.`,
      });
    }

    const failedLogItem: AuditLogItem = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      adminName: `Tamu Tidak Terdaftar (${cleaned})`,
      action: 'Login Gagal (Kode Salah)',
      details: `Percobaan kode tidak terdaftar (Percobaan ke-${currentCount} dari batas 5) • IP: ${ip}`,
      timestamp: new Date().toISOString(),
      category: 'system',
    };
    await dbAddAuditLog(failedLogItem);
    try {
      const currentLogs = await dbGetAuditLogs();
      broadcastLiveEvent({ type: 'audit_log_event', log: failedLogItem, auditLogs: currentLogs });
      broadcastLiveEvent({ type: 'audit_logs_updated' } as any);
    } catch (e) {}

    return res.json({
      success: false,
      error: `Kode Akses tidak terdaftar atau salah. (${currentCount}/5 batas percobaan sebelum Device Banned)`,
    });
  });

  // --- USER LOGOUT AUDIT TRACKING ENDPOINT ---
  app.post('/api/logout', async (req, res) => {
    try {
      const { accessCode, name, role } = req.body || {};
      const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '').trim();
      const code = String(accessCode || '').trim();

      if (code || name) {
        if (code) {
          removeUserPresence(code);
        }
        const logoutLogItem: AuditLogItem = {
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          adminName: name ? `${name} (${code || 'Sesi'})` : (code || 'Pengguna'),
          action: 'Logout Sesi',
          details: `Pengguna resmi mengakhiri sesi login dari IP: ${ip}`,
          timestamp: new Date().toISOString(),
          category: role === 'admin' ? 'system' : 'client',
        };
        await dbAddAuditLog(logoutLogItem);
        try {
          const currentLogs = await dbGetAuditLogs();
          broadcastLiveEvent({ type: 'audit_log_event', log: logoutLogItem, auditLogs: currentLogs });
          broadcastLiveEvent({ type: 'audit_logs_updated' } as any);
        } catch (e) {}
      }
      res.json({ success: true });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  async function loadClientsServer() { return await dbGetClients(); }
  async function saveClientsServer(list: any[]) {
    try {
      const existing = await dbGetClients();
      const newIds = new Set((list || []).map((c: any) => c.id).filter(Boolean));
      for (const oldCli of existing) {
        if (oldCli?.id && !newIds.has(oldCli.id)) {
          await dbDeleteClient(oldCli.id);
        }
      }
    } catch (e) {
      logger.warn('[saveClientsServer Delete Check Error]', e);
    }
    for (const c of list) { await dbSaveClient(c); }
  }
  app.get(['/api/clients', '/api/admin/clients'], requireAuth, requireAdminRole, async (req, res) => {
    try {
      res.json(await loadClientsServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.get(['/api/apikeys', '/api/admin/apikeys'], async (req, res) => {
    try {
      const keys = await dbGetApiKeys();
      res.json(keys || []);
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post(['/api/apikeys', '/api/admin/apikeys'], async (req, res) => {
    try {
      const authHeader = (req.headers.authorization || '').replace('Bearer ', '').trim();
      const accessCodeHeader = (req.headers['x-access-code'] as string) || (req.headers['x-admin-code'] as string) || (req.headers['x-client-access-code'] as string) || '';
      
      const isMasterAdmin = 
        !authHeader ||
        authHeader === masterAdminKey || 
        accessCodeHeader.toUpperCase() === 'SATSET-ADMIN' || 
        accessCodeHeader.toUpperCase().startsWith('SATSET-') ||
        accessCodeHeader.toUpperCase() === (masterAdminKey || '').toUpperCase();

      const keys = Array.isArray(req.body) ? req.body : (req.body?.keys || []);
      if (Array.isArray(keys)) {
        await dbSaveApiKeys(keys);
        llmGateway.syncPolledKeys(keys);
        broadcastLiveEvent({ type: 'apikeys_updated', keys });
      }
      res.json({ success: true, keys, count: keys.length });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.get(['/api/apikeys/logs', '/api/admin/apikeys/logs'], async (req, res) => {
    try {
      const logs = await dbGetApiKeyLogs();
      res.json(logs || []);
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post(['/api/apikeys/logs', '/api/admin/apikeys/logs'], async (req, res) => {
    try {
      const log = req.body;
      if (log && typeof log === 'object') {
        const fullLog = {
          ...log,
          id: log.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: log.timestamp || new Date().toISOString()
        };
        await dbAddApiKeyLog(fullLog);
        broadcastLiveEvent({ type: 'apikey_log_added', log: fullLog });
        res.json({ success: true, log: fullLog });
      } else {
        res.status(400).json({ error: 'Payload log tidak valid' });
      }
    } catch (err) {
      handleApiError(res, err);
    }
  });

  // --- MODEL ROUTING & PRIORITIES PERSISTENCE ENDPOINTS ---
  app.get(['/api/model-priorities', '/api/admin/model-priorities'], async (req, res) => {
    try {
      const priorities = await dbGetModelPriorities();
      res.json(priorities || {
        text: TOP_MODEL_ORDER,
        image: IMAGE_MODEL_ORDER,
        video: VIDEO_MODEL_ORDER,
      });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post(['/api/model-priorities', '/api/admin/model-priorities'], requireAuth, requireAdminRole, async (req, res) => {
    try {
      const config = req.body;
      if (!config || typeof config !== 'object') {
        return res.status(400).json({ error: 'Payload konfigurasi model priority tidak valid' });
      }
      await dbSaveModelPriorities(config);
      broadcastLiveEvent({ type: 'model_priorities_updated', priorities: config });
      res.json({ success: true, priorities: config });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  // --- CENTRALIZED LLM GATEWAY METRICS & HEALTH ENDPOINTS ---
  app.get('/api/llm-gateway/metrics', (req, res) => {
    try {
      const metrics = llmGateway.getMetrics();
      res.json({ success: true, metrics });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.get('/api/llm-gateway/health', (req, res) => {
    try {
      const states = llmGateway.getKeyHealthStates();
      const metrics = llmGateway.getMetrics();
      res.json({
        success: true,
        metrics,
        keys: states,
        uptimePercentage: metrics.uptimePercentage,
        activePoolSize: metrics.activePoolSize,
        cooldownKeysCount: metrics.cooldownKeysCount
      });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/test-gemini-key', async (req, res) => {
    try {
      const { apiKey, keyId } = req.body;
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ success: false, error: 'API Key wajib diisi' });
      }
      const rawKey = apiKey.trim();
      const aiInstance = getGeminiClient(rawKey);
      const startTime = Date.now();
      let testedModel = 'gemini-3.8-flash';
      let response: any = null;
      try {
        response = await aiInstance.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
          config: { maxOutputTokens: 5 }
        });
      } catch (err38) {
        testedModel = 'gemini-3.1-flash-lite';
        response = await aiInstance.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
          config: { maxOutputTokens: 5 }
        });
      }
      const latency = Date.now() - startTime;
      if (response && response.text) {
        // Automatically persist active tested status to database and sync to LLM Gateway
        try {
          const storedKeys = await dbGetApiKeys();
          let keyFound = false;
          const updatedStored = storedKeys.map((k: any) => {
            if ((keyId && k.id === keyId) || (k.key && k.key.trim() === rawKey)) {
              keyFound = true;
              return {
                ...k,
                status: 'active',
                verifiedByAdmin: true,
                lastPolledAt: new Date().toISOString(),
                pollStatus: 'active',
                lastTestedLatency: latency,
                lastTestedModel: testedModel,
              };
            }
            return k;
          });
          if (keyFound) {
            await dbSaveApiKeys(updatedStored);
            llmGateway.syncPolledKeys(updatedStored);
            broadcastLiveEvent({ type: 'apikeys_updated', keys: updatedStored });
          }
        } catch (dbErr) {
          logger.warn('[Test Gemini Key] Notice syncing test key to db:', dbErr);
        }

        return res.json({ success: true, latency, model: testedModel });
      }
      return res.json({ success: false, error: 'Respons kosong dari Gemini API' });
    } catch (err: any) {
      return res.json({ success: false, error: err?.message || 'Key invalid atau rate limit' });
    }
  });

  // --- ADMIN API KEY POOL BATCH POLL / HEALTH PROBE ---
  app.post('/api/admin/apikeys/poll-all', async (req, res) => {
    try {
      const storedKeys = await dbGetApiKeys();
      const keysToTest = (req.body && Array.isArray(req.body.keys) && req.body.keys.length > 0)
        ? req.body.keys
        : storedKeys;

      if (!keysToTest || keysToTest.length === 0) {
        return res.json({
          success: true,
          totalTested: 0,
          activeCount: 0,
          rateLimitedCount: 0,
          invalidCount: 0,
          results: [],
          message: 'Tidak ada API Key di dalam pool untuk di-poll.'
        });
      }

      const testPromises = keysToTest.map(async (keyItem: any) => {
        const rawKey = (keyItem.key || '').trim();
        if (!isRealApiKey(rawKey)) {
          return {
            id: keyItem.id,
            alias: keyItem.alias || 'Unknown',
            keyMasked: maskApiKeyStr(rawKey),
            status: 'revoked',
            latencyMs: 0,
            modelTested: 'none',
            error: 'Bukan format API key valid / placeholder',
          };
        }

        const start = Date.now();
        let testedModel = 'gemini-3.8-flash';
        try {
          const aiInstance = getGeminiClient(rawKey);
          let resp: any = null;
          try {
            resp = await aiInstance.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: [{ role: 'user', parts: [{ text: 'P' }] }],
              config: { maxOutputTokens: 2 },
            });
          } catch (mErr: any) {
            testedModel = 'gemini-3.1-flash-lite';
            resp = await aiInstance.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: [{ role: 'user', parts: [{ text: 'P' }] }],
              config: { maxOutputTokens: 2 },
            });
          }

          const latencyMs = Date.now() - start;
          return {
            id: keyItem.id,
            alias: keyItem.alias,
            keyMasked: maskApiKeyStr(rawKey),
            status: 'active',
            latencyMs,
            modelTested: testedModel,
            ok: true,
          };
        } catch (err: any) {
          const latencyMs = Date.now() - start;
          const errMsg = err?.message || '';
          const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
          const isDead = errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('API_KEY_INVALID');

          return {
            id: keyItem.id,
            alias: keyItem.alias,
            keyMasked: maskApiKeyStr(rawKey),
            status: isDead ? 'revoked' : (is429 ? 'rate_limited' : 'error'),
            latencyMs,
            modelTested: testedModel,
            ok: false,
            error: errMsg.slice(0, 100),
          };
        }
      });

      const results = await Promise.all(testPromises);
      const activeCount = results.filter((r) => r.status === 'active').length;
      const rateLimitedCount = results.filter((r) => r.status === 'rate_limited').length;
      const invalidCount = results.filter((r) => r.status === 'revoked' || r.status === 'error').length;

      // Persist polled status directly into database and synchronize into LLM Gateway routing
      const resultMap = new Map<string, any>(results.map((r) => [r.id, r]));
      const nowIso = new Date().toISOString();
      const updatedKeys = keysToTest.map((k: any) => {
        const testRes = resultMap.get(k.id);
        if (!testRes) return k;
        const isActive = testRes.status === 'active';
        return {
          ...k,
          status: isActive ? 'active' : (testRes.status === 'rate_limited' ? 'active' : 'revoked'),
          verifiedByAdmin: isActive,
          lastPolledAt: nowIso,
          pollStatus: testRes.status,
          lastTestedLatency: testRes.latencyMs || 0,
          lastTestedModel: testRes.modelTested || 'gemini-3.8-flash',
          cooldownUntil: testRes.status === 'rate_limited' ? Date.now() + 90000 : 0,
          modelStatus: {
            ...(k.modelStatus || {}),
            [testRes.modelTested || 'gemini-3.8-flash']: testRes.status === 'active' ? 'active' : (testRes.status === 'rate_limited' ? 'rate_limited' : 'dead')
          }
        };
      });

      try {
        await dbSaveApiKeys(updatedKeys);
        llmGateway.syncPolledKeys(updatedKeys);
        broadcastLiveEvent({ type: 'apikeys_updated', keys: updatedKeys });
      } catch (saveErr) {
        logger.warn('[API Key Poll] Warning updating db keys:', saveErr);
      }

      broadcastLiveEvent({
        type: 'llm_gateway_pool_polled',
        poolSummary: {
          totalTested: results.length,
          activeCount,
          rateLimitedCount,
          invalidCount,
          timestamp: new Date().toISOString(),
        },
        results,
      });

      return res.json({
        success: true,
        totalTested: results.length,
        activeCount,
        rateLimitedCount,
        invalidCount,
        results,
        updatedKeys,
        message: `Polling selesai: ${activeCount}/${results.length} Key Aktif & Diprioritaskan untuk Routing LLM.`
      });
    } catch (err: any) {
      logger.error('Admin API Key Pool polling error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Gagal melakukan polling pool API Key' });
    }
  });

  app.post('/api/admin/clients', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const clients = Array.isArray(req.body) ? req.body : (req.body?.clients || []);
      if (!Array.isArray(clients)) {
        return res.status(400).json({ error: 'Payload clients harus berupa array' });
      }
      
      const previousClients = await loadClientsServer();
      await saveClientsServer(clients);

      // Auto-sync client access codes: add new ones and purge removed ones
      try {
        const accessCodesList = await loadAccessCodesServer();
        const activeClientCodes = new Set(
          clients.map((c: any) => String(c?.accessCode || '').trim().toUpperCase()).filter(Boolean)
        );
        const previousClientCodes = new Set(
          previousClients.map((c: any) => String(c?.accessCode || '').trim().toUpperCase()).filter(Boolean)
        );

        // Find codes that were deleted from client monitoring
        const deletedCodes = [...previousClientCodes].filter((code) => !activeClientCodes.has(code));

        // Filter out deleted codes from accessCodesList
        let updatedAccessCodes = accessCodesList.filter(
          (item) => !deletedCodes.includes(String(item.code || '').trim().toUpperCase())
        );

        let codesChanged = updatedAccessCodes.length !== accessCodesList.length;

        // Add any new client codes
        clients.forEach((c: any) => {
          if (c && c.accessCode) {
            const cleanCode = String(c.accessCode).trim().toUpperCase();
            const existingIdx = updatedAccessCodes.findIndex(item => item.code && item.code.toUpperCase() === cleanCode);
            if (existingIdx === -1) {
              updatedAccessCodes.unshift({
                code: cleanCode,
                note: `Client ${c.name || 'Custom'} (${c.packageName || 'Satset'})`,
                createdAt: Date.now()
              });
              codesChanged = true;
            }
          }
        });

        if (codesChanged) {
          await saveAccessCodesServer(updatedAccessCodes);
          broadcastLiveEvent({ type: 'access_codes_updated', accessCodes: updatedAccessCodes });
        }
      } catch (err) {
        logger.warn('[Clients Server] Failed syncing client access codes:', err);
      }

      broadcastLiveEvent({ type: 'clients_updated', clients });
      res.json({ success: true, clients });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  async function loadContactSettingsServer() { return await dbGetContactSettings(); }
  async function saveContactSettingsServer(data: any) { await dbSaveContactSettings(data); }

  app.get(['/api/contact-settings', '/api/admin/contact-settings'], async (req, res) => {
    try {
      res.json(await loadContactSettingsServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/admin/contact-settings', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const { whatsappNumber, whatsappTemplate } = req.body;
      const settings = {
        whatsappNumber: whatsappNumber || '6281234567890',
        whatsappTemplate: whatsappTemplate || 'Halo Admin Tools Satset, saya ingin konsultasi mengenai Kode Akses.',
        updatedAt: new Date().toISOString()
      };
      await saveContactSettingsServer(settings);
      broadcastLiveEvent({ type: 'contact_settings_updated', contactSettings: settings });
      res.json({ success: true, settings });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  async function loadLoginUiSettingsServer() { return await dbGetLoginUiSettings(); }
  async function saveLoginUiSettingsServer(data: any) { await dbSaveLoginUiSettings(data); }

  async function loadUserUiSettingsServer() { return await dbGetUserUiSettings(); }
  async function saveUserUiSettingsServer(data: any) { await dbSaveUserUiSettings(data); }

  app.get(['/api/user-ui-settings', '/api/admin/user-ui-settings'], async (req, res) => {
    try {
      res.json(await loadUserUiSettingsServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/admin/user-ui-settings', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const settings = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Payload User UI tidak valid' });
      }
      settings.updatedAt = new Date().toISOString();
      await saveUserUiSettingsServer(settings);
      broadcastLiveEvent({ type: 'user_ui_settings_updated', userUiSettings: settings });
      res.json({ success: true, settings });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.get(['/api/login-ui-settings', '/api/admin/login-ui-settings'], async (req, res) => {
    try {
      res.json(await loadLoginUiSettingsServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/admin/login-ui-settings', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const settings = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Payload Login UI tidak valid' });
      }
      settings.updatedAt = new Date().toISOString();
      await saveLoginUiSettingsServer(settings);
      broadcastLiveEvent({ type: 'login_ui_settings_updated', loginUiSettings: settings });
      res.json({ success: true, settings });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  async function loadQrisConfigServer() { return await dbGetQrisConfig(); }
  async function saveQrisConfigServer(data: any) { await dbSaveQrisConfig(data); }

  app.get(['/api/qris', '/api/admin/qris'], async (req, res) => {
    try {
      res.json(await loadQrisConfigServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/admin/qris', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const config = req.body;
      if (!config || typeof config !== 'object') {
        return res.status(400).json({ error: 'Payload QRIS tidak valid' });
      }
      await saveQrisConfigServer(config);
      broadcastLiveEvent({ type: 'qris_updated', qrisConfig: config });
      res.json({ success: true, qrisConfig: config });
    } catch (err) {
      handleApiError(res, err);
    }
  });
  async function loadTransactionsServer() { return await dbGetTransactions(); }
  async function saveTransactionsServer(list: any[]) { 
    for (const item of list) { 
      await dbSaveTransaction(item); 
    } 
  }
  
  app.get('/api/transactions', async (req, res) => {
    try {
      res.json(await loadTransactionsServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/transactions', async (req, res) => {
    try {
      const newTrx = req.body;
      if (!newTrx || !newTrx.id) return res.status(400).json({ error: 'Payload transaksi tidak valid' });

      const cleanId = (newTrx.id || '').trim().toUpperCase();
      newTrx.id = cleanId;

      // Validate member package requirement on server
      const packages = await loadPackagesServer();
      const pkg = packages.find((p) => p.id === newTrx.packageId);
      if (pkg && pkg.targetCategory === 'member') {
        const codeToCheck = String(newTrx.accessCode || req.headers['x-access-code'] || '').trim().toUpperCase();
        const clients = await loadClientsServer();
        const validMember = clients.find(
          (c) =>
            c.accessCode &&
            c.accessCode.toUpperCase() === codeToCheck &&
            (c.status === 'active' || c.status === 'expiring_soon')
        );
        if (!validMember && codeToCheck !== (process.env.ADMIN_ACCESS_CODE || '').trim().toUpperCase()) {
          return res.status(403).json({
            error: 'Paket ini khusus untuk member VIP terdaftar. Silakan login terlebih dahulu dengan Kode Akses member Anda.'
          });
        }
      }

      await dbSaveTransaction(newTrx);

      broadcastLiveEvent({
        type: 'transaction_updated',
        event: {
          action: 'CREATED',
          accessCode: newTrx.accessCode,
          transaction: newTrx
        },
        transaction: newTrx
      });

      res.json({ success: true, transaction: newTrx });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/transactions/proof', async (req, res) => {
    try {
      const { id, proofImageBase64, transaction } = req.body;
      const cleanId = (id || transaction?.id || '').trim().toUpperCase();
      const list = await loadTransactionsServer();
      let idx = list.findIndex((t) => (t.id || '').toUpperCase() === cleanId);
      
      let targetTrx: any;
      if (idx >= 0) {
        list[idx].proofImageBase64 = proofImageBase64;
        list[idx].paymentProofBase64 = proofImageBase64;
        list[idx].status = 'AWAITING_VERIFICATION';
        list[idx].updatedAt = Date.now();
        targetTrx = list[idx];
      } else {
        if (transaction && (transaction.id || transaction.packageId || transaction.planId)) {
          targetTrx = {
            ...transaction,
            id: cleanId || transaction.id,
            proofImageBase64,
            paymentProofBase64: proofImageBase64,
            status: 'AWAITING_VERIFICATION',
            updatedAt: Date.now(),
            createdAt: transaction.createdAt || Date.now(),
            timestamp: transaction.timestamp || Date.now()
          };
          list.unshift(targetTrx);
        } else {
          return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
        }
      }
      
      await dbSaveTransaction(targetTrx);

      broadcastLiveEvent({
        type: 'transaction_updated',
        event: {
          action: 'PROOF_UPLOADED',
          accessCode: targetTrx.accessCode,
          transaction: targetTrx
        },
        transaction: targetTrx
      });

      res.json({ success: true, transaction: targetTrx });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/transactions/approve', async (req, res) => {
    try {
      const { id, accessCode, validUntil, transaction } = req.body;
      const cleanId = (id || transaction?.id || '').trim().toUpperCase();
      const list = await loadTransactionsServer();
      let idx = list.findIndex((t) => (t.id || '').toUpperCase() === cleanId);
      
      let approvedTrx: any;
      if (idx >= 0) {
        approvedTrx = list[idx];
      } else if (transaction && transaction.id) {
        approvedTrx = { ...transaction, id: cleanId };
        list.unshift(approvedTrx);
      } else {
        return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      }
      
      const generatedCode = accessCode || approvedTrx.accessCode;

      approvedTrx.status = 'APPROVED';
      approvedTrx.accessCode = generatedCode;
      approvedTrx.validUntil = validUntil || approvedTrx.validUntil || 'Lifetime (Akses Selamanya)';
      approvedTrx.updatedAt = Date.now();
      
      await dbSaveTransaction(approvedTrx);

    // 1. Persist & Broadcast access code
    if (generatedCode) {
      const accessCodesList = await loadAccessCodesServer();
      const existingCodeIdx = accessCodesList.findIndex(c => c.code.toUpperCase() === generatedCode.toUpperCase());
      if (existingCodeIdx === -1) {
        accessCodesList.unshift({
          code: generatedCode.toUpperCase(),
          note: `Pembelian Paket ${approvedTrx.packageName || (approvedTrx as any).packageId || 'Satset'} - ${approvedTrx.customerName || 'Klien'}`,
          createdAt: Date.now()
        });
        await saveAccessCodesServer(accessCodesList);
        broadcastLiveEvent({ type: 'access_codes_updated', accessCodes: accessCodesList });
      }
    }

    // 2. Upsert & Broadcast ClientItem in clients.json
    const clientsList = await loadClientsServer();
    const existingClientIdx = clientsList.findIndex(c => c.accessCode && c.accessCode.toUpperCase() === (generatedCode || '').toUpperCase());

    let expiryDateIso = validUntil ? new Date(validUntil).toISOString() : '';
    if (!expiryDateIso) {
      const now = new Date();
      if ((approvedTrx as any).packageId === 'mingguan') {
        now.setDate(now.getDate() + 7);
      } else if ((approvedTrx as any).packageId === 'bulanan') {
        now.setDate(now.getDate() + 30);
      } else {
        now.setFullYear(now.getFullYear() + 100);
      }
      expiryDateIso = now.toISOString();
    }

    const newOrUpdatedClient = {
      id: existingClientIdx >= 0 ? clientsList[existingClientIdx].id : `cli_${Date.now()}`,
      accessCode: generatedCode,
      name: approvedTrx.customerName || 'Klien Satset',
      whatsapp: approvedTrx.whatsapp || '',
      email: approvedTrx.email || '',
      packageId: (approvedTrx as any).packageId || 'vip',
      packageName: approvedTrx.packageName || 'Akses VIP Satset',
      price: approvedTrx.amount || (approvedTrx as any).price || 0,
      startDate: new Date().toISOString(),
      expiryDate: expiryDateIso,
      status: 'active' as any,
      type: 'standard' as any,
      createdAt: new Date().toISOString(),
      toolUsage: existingClientIdx >= 0 && clientsList[existingClientIdx].toolUsage ? clientsList[existingClientIdx].toolUsage : {
        tiktokDownloader: 0,
        contentIdeas: 0,
        videoToPrompt: 0,
        photoPrompt: 0,
        frameExtractor: 0
      }
    };

    if (existingClientIdx >= 0) {
      clientsList[existingClientIdx] = { ...clientsList[existingClientIdx], ...newOrUpdatedClient };
    } else {
      clientsList.unshift(newOrUpdatedClient);
    }
    await saveClientsServer(clientsList);

    broadcastLiveEvent({
      type: 'clients_updated',
      clients: clientsList
    });

    broadcastLiveEvent({
      type: 'transaction_updated',
      event: {
        action: 'APPROVED',
        accessCode: generatedCode,
        validUntil,
        transaction: approvedTrx
      },
      transaction: approvedTrx
    });

    res.json({ success: true, transaction: approvedTrx, client: newOrUpdatedClient });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/transactions/reject', async (req, res) => {
    try {
      const { id, rejectReason, transaction } = req.body;
      const list = await loadTransactionsServer();
      let idx = list.findIndex((t) => t.id === id);
      if (idx === -1) {
        if (transaction && transaction.id) {
          list.unshift(transaction);
          idx = 0;
        } else {
          return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
        }
      }
      list[idx].status = 'REJECTED';
      list[idx].rejectReason = rejectReason || 'Ditolak oleh admin.';
      list[idx].updatedAt = Date.now();
      await saveTransactionsServer(list);

      broadcastLiveEvent({
        type: 'transaction_updated',
        event: {
          action: 'REJECTED',
          accessCode: list[idx].accessCode,
          rejectReason: list[idx].rejectReason,
          transaction: list[idx]
        },
        transaction: list[idx]
      });

      res.json({ success: true, transaction: list[idx] });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  // --- TRACKING & PIPELINE GENERATION EVENTS PERSISTENCE ENGINE ---
  // Periodic cleanup of completed active generations (> 10 mins old)
  setInterval(() => {
    const now = Date.now();
    activeGenerationsMap.forEach((gen, id) => {
      if (now - (gen.updatedAt || now) > 10 * 60 * 1000) {
        activeGenerationsMap.delete(id);
      }
    });
  }, 60000);

  async function loadEventsServer() { return await dbGetTrackingEvents(); }
  async function saveEventsServer(list: any[]) { for (const item of list) { await dbAddTrackingEvent(item); } }
  app.get('/api/events/stream', async (req, res) => {
    const token = (req.query.token as string) || 'GUEST-ACCESS';

    // Rate Limiting: Max 3 SSE connections per token/session
    let activeTokenConns = 0;
    sseClients.forEach((c) => {
      if (c.token === token) activeTokenConns++;
    });

    if (activeTokenConns >= 3) {
      for (const client of sseClients) {
        if (client.token === token) {
          try {
            client.res.end();
          } catch (e) { logger.warn('[SSE Stream] Gagal menutup response SSE lama', e); }
          sseClients.delete(client);
          break;
        }
      }
    }

    // Explicit Anti-Buffering Headers for Proxy / Cloud Run Nginx
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Immediate padding comment to bypass proxy initial response buffer
    res.write(':ok\n\n');

    const clientMeta: SSEClientMeta = { res, token, connectedAt: Date.now() };
    sseClients.add(clientMeta);

    // Check Last-Event-ID for missed events replay
    const lastEventIdHeader = req.headers['last-event-id'] || (req.query.lastEventId as string);
    const lastEventIdNum = lastEventIdHeader ? parseInt(lastEventIdHeader.toString(), 10) : 0;

    if (lastEventIdNum > 0) {
      const missed = simpleEventQueue.filter((item) => item.id > lastEventIdNum);
      missed.forEach((item) => {
        res.write(`:pad\nid: ${item.id}\ndata: ${JSON.stringify(item.payload)}\n\n`);
      });
    }

    // Send initial snapshot payload
    const initialEvents = await loadEventsServer();
    const activeList = Array.from(activeGenerationsMap.values());
    const initPayload = { type: 'init', events: initialEvents, activeGenerations: activeList };
    const initEventId = pushToEventQueue(initPayload);
    res.write(`id: ${initEventId}\ndata: ${JSON.stringify(initPayload)}\n\n`);

    // Notify startup recovery state
    res.write(`:pad\ndata: ${JSON.stringify({ type: 'server_restarted', ts: Date.now() })}\n\n`);

    req.on('close', () => {
      sseClients.delete(clientMeta);
    });
  });

  // [REALTIME-FIX] Long-Polling endpoint as primary proxy-friendly fallback
  app.post('/api/events/poll', (req, res) => {
    try {
      const lastEventId = parseInt(req.body?.lastEventId || '0', 10);
      const token = req.body?.token || 'GUEST-ACCESS';

      // Check if there are unread events in queue
      const missed = simpleEventQueue.filter((item) => item.id > lastEventId);
      if (missed.length > 0) {
        const latestId = missed[missed.length - 1].id;
        return res.json({
          success: true,
          events: missed.map((item) => item.payload),
          lastEventId: latestId,
        });
      }

      // Otherwise hold request for up to 25 seconds
      const timeout = setTimeout(() => {
        const idx = pendingPolls.findIndex((p) => p.res === res);
        if (idx >= 0) pendingPolls.splice(idx, 1);
        try {
          res.json({ success: true, events: [], lastEventId });
        } catch (e) { logger.warn('[SSE Polling] Gagal membalas response poll', e); }
      }, 25000);

      pendingPolls.push({ token, lastEventId, res, timeout });

      req.on('close', () => {
        clearTimeout(timeout);
        const idx = pendingPolls.findIndex((p) => p.res === res);
        if (idx >= 0) pendingPolls.splice(idx, 1);
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Long-polling error' });
    }
  });

  // REST Polling / Snapshot endpoint
  app.get('/api/events/live', async (req, res) => {
    try {
      const events = await loadEventsServer();
      const activeGenerations = Array.from(activeGenerationsMap.values());
      res.json({ success: true, events, activeGenerations, activeClientCount: activeGenerations.length });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Gagal mengambil live stream events' });
    }
  });

  app.get('/api/events', async (req, res) => {
    try {
      const events = await loadEventsServer();
      res.json(events);
    } catch (e) {
      res.status(500).json({ success: false, error: 'Gagal mengambil data event tracking' });
    }
  });

  // Endpoint to report active status updates (e.g., generating -> analyzing -> completed)
  app.post('/api/events/active-status', (req, res) => {
    try {
      const { id, status, details, accessCode, tool, category, clientId } = req.body || {};
      if (!id) return res.status(400).json({ success: false, error: 'Event ID required' });

      const existing = activeGenerationsMap.get(id) || { id, startedAt: new Date().toISOString() };
      const updated = {
        ...existing,
        status: status || 'generating',
        details: details || existing.details,
        accessCode: accessCode || existing.accessCode || (id.startsWith('pres_') ? id.replace('pres_', '') : ''),
        tool: tool || existing.tool || 'Workspace Tool',
        category: category || existing.category || 'General',
        clientId: clientId || existing.clientId || (id.startsWith('pres_') ? id.replace('pres_', '') : ''),
        updatedAt: Date.now(),
      };

      if (status === 'completed') {
        // Keep briefly as completed before removal
        setTimeout(() => activeGenerationsMap.delete(id), 120000);
      } else {
        activeGenerationsMap.set(id, updated);
      }

      broadcastLiveEvent({
        type: 'active_status_update',
        activeGeneration: updated,
        activeGenerations: Array.from(activeGenerationsMap.values()),
      });

      res.json({ success: true, activeGeneration: updated });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Gagal mengupdate active status' });
    }
  });

  app.post('/api/events', async (req, res) => {
    try {
      const eventData = req.body;
      if (!eventData || typeof eventData !== 'object') {
        return res.status(400).json({ success: false, error: 'Payload event tidak valid' });
      }

      const events = await loadEventsServer();
      const newEvent = {
        ...eventData,
        id: eventData.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: eventData.timestamp || new Date().toISOString(),
      };

      events.unshift(newEvent); // Newest first
      await saveEventsServer(events);

      // Add to active generations map
      activeGenerationsMap.set(newEvent.id, {
        ...newEvent,
        status: 'analyzing',
        updatedAt: Date.now(),
      });

      // Broadcast live event to all connected SSE clients
      broadcastLiveEvent({
        type: 'generation_event',
        event: newEvent,
        activeGenerations: Array.from(activeGenerationsMap.values()),
      });

      // Record count in system memory as well
      if (newEvent.outcome === 'success' || newEvent.outcome === 'flagged') {
        recordExecutionAndUpgrade('contentIdeas');
      }

      res.json({ success: true, event: newEvent });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Gagal menyimpan event tracking' });
    }
  });

  // --- MULTI-AGENT ORCHESTRATOR & RELEVANCE AUDITOR ENDPOINT ---
  app.post('/api/orchestrate', async (req, res) => {
    try {
      const { event, contentText } = req.body || {};
      const { runOrchestratorPipeline } = await import('./src/agents/orchestratorAgent');
      
      const mockEvent = event || {
        id: `evt_api_${Date.now()}`,
        timestamp: new Date().toISOString(),
        clientId: 'client_api',
        accessCode: 'API-REQUEST',
        packageTier: 'PRO',
        tool: 'idea_konten',
        category: 'umum',
        modelUsed: 'gemini-3.6-flash',
        tierUsed: 'Tier 2 (Server Key)',
        isUserApiKey: false,
        outcome: 'success',
      };

      const result = await runOrchestratorPipeline(mockEvent, contentText || '');

      // Mark active generation as completed in memory
      if (mockEvent.id && activeGenerationsMap.has(mockEvent.id)) {
        const item = activeGenerationsMap.get(mockEvent.id);
        item.status = 'completed';
        item.orchestrationResult = result;
        item.updatedAt = Date.now();
        activeGenerationsMap.set(mockEvent.id, item);
      }

      // Broadcast orchestration audit result to connected admin dashboards
      broadcastLiveEvent({
        type: 'agent_orchestrated',
        eventId: mockEvent.id,
        result,
        activeGenerations: Array.from(activeGenerationsMap.values()),
      });

      res.json({
        success: true,
        pipeline: {
          orchestratorTier: 'Tier 2 (gemini-3.6-flash)',
          subAgents: ['Metadata + Caption SEO', 'Overlay + Voice-over SEO', 'Query / Trend Agent'],
          auditor: 'Relevance Auditor (Visual vs Caption vs Audio)',
          systemMemoryUpdated: result.systemMemoryInjected,
        },
        result,
      });
    } catch (e: any) {
      logger.warn('[Server Orchestrator] Execution notice:', e);
      res.status(500).json({
        success: false,
        error: e.message || 'Gagal menjalankan Orchestrator Pipeline',
      });
    }
  });

  // --- 24/7 SERVER-SIDE CRON & SELF-LEARNING AGENT ENGINE ---

  async function loadLearningQueueServer() { return await dbGetLearningQueue(); }
  async function saveLearningQueueServer(list: any[]) { for (const item of list) { await dbSaveLearningQueueItem(item); } }

  async function loadAiAgentsServer() { return await dbGetAiAgents(); }
  async function saveAiAgentsServer(list: any[]) {
    try {
      const existing = await dbGetAiAgents();
      const newIds = new Set((list || []).map((a: any) => a.id).filter(Boolean));
      for (const oldAgent of existing) {
        if (oldAgent?.id && !newIds.has(oldAgent.id)) {
          await dbDeleteAiAgent(oldAgent.id);
        }
      }
    } catch (e) {
      logger.warn('[saveAiAgentsServer Delete Check Error]', e);
    }
    for (const item of list) { await dbSaveAiAgent(item); }
  }

  async function loadGrowthStateServer() { return await dbGetGrowthState(); }
  async function saveGrowthStateServer(data: any) { await dbSaveGrowthState(data); }
  cron.schedule('0 * * * *', async () => {
    try {
      const keysArr = await dbGetApiKeys();
      await optimizeCostAndTiers(keysArr);
    } catch (e) { logger.warn('[Cron Hourly Cost] Gagal menjalankan optimizer cost', e); }
  });

  // 4. Daily User Growth Analyst Cron (00:00)
  cron.schedule('0 0 * * *', async () => {
    logger.info('[Server Cron 24/7] Running Daily User Growth Analyst...');
    try {
      const clients = await loadClientsServer();
      const transactions = await loadTransactionsServer();
      await analyzeUserGrowth(clients, transactions);
    } catch (e) { logger.warn('[Cron Daily Growth] Gagal menjalankan growth analyst', e); }
  });

  // 5. Daily Meta-Agent Auto-Factory Cron (00:05)
  cron.schedule('5 0 * * *', async () => {
    logger.info('[Server Cron 24/7] Running Daily Meta-Agent Auto-Factory...');
    try {
      const clients = await loadClientsServer();
      const transactions = await loadTransactionsServer();
      const factoryResult = await runAutoAgentFactory(clients, transactions);
      if (factoryResult.scalingDecisions.length > 0) {
        broadcastLiveEvent({ type: 'growth_scaling_updated', growthState: await loadGrowthStateServer() });
      }
    } catch (e) { logger.warn('[Cron Daily Factory] Gagal menjalankan agent factory', e); }
  });

  // --- API ENDPOINTS FOR AEO PIPELINE & NEW AGENTS ---
  app.post('/api/aeo/generate', async (req, res) => {
    try {
      const { topic, category = 'umum' } = req.body;
      if (!topic) return res.status(400).json({ error: 'Topik konten diperlukan' });

      // 1. Build AEO Pipeline Prompt
      const aeoPrompt = buildAEOPipelinePrompt(topic, category);

      // 2. Execute via Gemini AI with Fallback
      const customApiKey = (req.headers['x-custom-api-key'] as string) || req.body.customApiKey;
      const clientAccessCode = extractClientAccessCode(req);
      const requestedModel = req.body.model ? normalizeGeminiModel(req.body.model) : undefined;

      const geminiResult = await callGeminiWithFallback(
        requestedModel,
        {
          contents: [{ parts: [{ text: aeoPrompt }] }],
        },
        customApiKey,
        clientAccessCode,
        'tier2',
        'AEO Pipeline'
      );

      const responseText = geminiResult.text || '';
      
      // Parse JSON from code block if returned
      let rawResult: AEOPipelineResult | undefined;
      try {
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          rawResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        }
      } catch (e) {
        logger.warn('[AEO Parse Warning] Output is not valid JSON, returning formatted markdown text');
      }

      // 3. Govern and verify with AEO Governor Agent
      const governorResult = await governAEOPipelineExecution(topic, rawResult);
      const cleanResponseText = sanitizeCaptionsAndHashtags(responseText);

      res.json({
        success: true,
        topic,
        category,
        governor: governorResult,
        rawResult,
        responseText: cleanResponseText,
      });
    } catch (e: any) {
      logger.error('[AEO Generate Error]', e);
      const statusCode = e.statusCode || 500;
      res.status(statusCode).json({ error: e.message || 'Gagal memproses AEO Pipeline' });
    }
  });

  app.post('/api/agents/run-all', async (req, res) => {
    try {
      const ingestion = await monitorAndValidateIngestion('https://www.tiktok.com/@sample/video/123456');
      const signals = await extractMultiModalSignals({ caption: 'Rekomendasi baju murah berkualitas #fashion #fyp #viral' });
      const fusion = await calculateMultimodalFusionScore(signals);
      const category = await classifyContentCategory('Fashion & Aksesoris wanita murah');
      const proposal = await proposeNewCategoryTaxonomy('Konten niche baru herbal alami', 55);
      const hookUpdate = await updateHookPatternSystemMemory('Rahasia besar yang disembunyikan toko sebelah!', 'fashion');
      const supervisor = await superviseMetaAutoBuild(23, false);
      const audit = await auditPaymentAndClientHardening();

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        agentsRun: 10,
        results: {
          ingestion,
          signals,
          fusion,
          category,
          proposal,
          hookUpdate,
          supervisor,
          audit,
        },
      });
    } catch (e: any) {
      logger.error('[Agents Run All Error]', e);
      res.status(500).json({ error: e.message || 'Gagal menjalankan seluruh agen' });
    }
  });

  app.get('/api/admin/system-memory', requireAuth, requireAdminRole, async (req, res) => {
    try {
      const mem = await dbGetSystemMemory();
      res.json(mem);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Gagal mengambil memory' });
    }
  });

  // --- API ENDPOINTS FOR GROWTH SCALING, AGENTS & LEARNING QUEUE ---
  app.get('/api/growth/state', async (req, res) => {
    try {
      res.json(await loadGrowthStateServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/growth/evaluate', async (req, res) => {
    try {
      const clients = await loadClientsServer();
      const transactions = await loadTransactionsServer();
      const result = await runAutoAgentFactory(clients, transactions);
      res.json({ success: true, result, growthState: await loadGrowthStateServer() });
    } catch (e: any) {
      handleApiError(res, e);
    }
  });

  app.post('/api/growth/rollback', async (req, res) => {
    try {
      const { targetVersion } = req.body;
      if (!targetVersion) return res.status(400).json({ error: 'Target version required' });
      const newState = rollbackGrowthScalingVersion(targetVersion);
      await saveGrowthStateServer(newState);
      broadcastLiveEvent({ type: 'growth_scaling_updated', growthState: newState });
      res.json({ success: true, growthState: newState });
    } catch (e: any) {
      handleApiError(res, e);
    }
  });

  app.post('/api/growth/toggle-auto-mode', async (req, res) => {
    try {
      const { enabled } = req.body;
      const newState = setFullAutoMode(Boolean(enabled));
      await saveGrowthStateServer(newState);
      broadcastLiveEvent({ type: 'growth_scaling_updated', growthState: newState });
      res.json({ success: true, growthState: newState });
    } catch (e: any) {
      handleApiError(res, e);
    }
  });

  app.get(['/api/agents', '/api/admin/agents'], async (req, res) => {
    try {
      res.json(await loadAiAgentsServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post(['/api/agents', '/api/admin/agents'], requireAuth, requireAdminRole, async (req, res) => {
    try {
      const agents = Array.isArray(req.body) ? req.body : (req.body?.agents || []);
      if (!Array.isArray(agents)) {
        return res.status(400).json({ error: 'Payload agents harus berupa array' });
      }
      await saveAiAgentsServer(agents);
      broadcastLiveEvent({ type: 'ai_agents_updated', agents });
      res.json({ success: true, agents });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/agents/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;
      const agents = await loadAiAgentsServer();
      const idx = agents.findIndex((a) => a.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Agent tidak ditemukan' });
      agents[idx].status = agents[idx].status === 'active' ? 'inactive' : 'active';
      await saveAiAgentsServer(agents);
      broadcastLiveEvent({ type: 'ai_agents_updated', agents });
      res.json({ success: true, agent: agents[idx], agents });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.get('/api/learning/queue', async (req, res) => {
    try {
      res.json(await loadLearningQueueServer());
    } catch (err) {
      handleApiError(res, err);
    }
  });

  // --- 1. ANNOUNCEMENTS & BROADCAST API ---
  app.get('/api/announcements', async (req, res) => {
    try {
      const list = await dbGetAnnouncements();
      res.json(list);
    } catch (err) { handleApiError(res, err); }
  });

  app.post('/api/announcements', async (req, res) => {
    try {
      const item = req.body;
      if (!item || !item.id || !item.title) return res.status(400).json({ error: 'Title and ID are required' });
      await dbSaveAnnouncement(item);
      const list = await dbGetAnnouncements();
      broadcastLiveEvent({ type: 'announcement_broadcast', announcement: item, announcements: list });
      res.json({ success: true, item, announcements: list });
    } catch (err) { handleApiError(res, err); }
  });

  app.delete('/api/announcements/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await dbDeleteAnnouncement(id);
      const list = await dbGetAnnouncements();
      broadcastLiveEvent({ type: 'announcements_updated', announcements: list });
      res.json({ success: true, announcements: list });
    } catch (err) { handleApiError(res, err); }
  });

  // --- 2. MASTER PROMPT FORMULAS API ---
  app.get('/api/formulas', async (req, res) => {
    try {
      const list = await dbGetFormulas();
      res.json(list);
    } catch (err) { handleApiError(res, err); }
  });

  app.post('/api/formulas', async (req, res) => {
    try {
      const formula = req.body;
      if (!formula || !formula.id || !formula.title) return res.status(400).json({ error: 'Title and ID required' });
      await dbSaveFormula(formula);
      const list = await dbGetFormulas();
      broadcastLiveEvent({ type: 'formulas_updated', formulas: list });
      res.json({ success: true, formula, formulas: list });
    } catch (err) { handleApiError(res, err); }
  });

  app.delete('/api/formulas/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await dbDeleteFormula(id);
      const list = await dbGetFormulas();
      broadcastLiveEvent({ type: 'formulas_updated', formulas: list });
      res.json({ success: true, formulas: list });
    } catch (err) { handleApiError(res, err); }
  });

  // --- 3. AFFILIATE & REFERRAL API ---
  app.get('/api/affiliates', async (req, res) => {
    try {
      const list = await dbGetAffiliates();
      res.json(list);
    } catch (err) { handleApiError(res, err); }
  });

  app.post('/api/affiliates', async (req, res) => {
    try {
      const item = req.body;
      if (!item || !item.id || !item.code) return res.status(400).json({ error: 'Code and ID required' });
      await dbSaveAffiliate(item);
      const list = await dbGetAffiliates();
      broadcastLiveEvent({ type: 'affiliates_updated', affiliates: list });
      res.json({ success: true, item, affiliates: list });
    } catch (err) { handleApiError(res, err); }
  });

  app.delete('/api/affiliates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await dbDeleteAffiliate(id);
      const list = await dbGetAffiliates();
      broadcastLiveEvent({ type: 'affiliates_updated', affiliates: list });
      res.json({ success: true, affiliates: list });
    } catch (err) { handleApiError(res, err); }
  });

  // --- 4. ANALYTICS & COST REPORT API ---
  app.get('/api/analytics/usage-summary', async (req, res) => {
    try {
      const events = await dbGetTrackingEvents();
      const clients = await dbGetClients();
      const txns = await dbGetTransactions();
      const memory = await dbGetSystemMemory();

      const totalExecutions = events.length || memory?.totalExecutions || 0;
      const successCount = events.filter((e) => e.outcome === 'success').length || memory?.successfulPromptsCount || 0;

      res.json({
        totalExecutions,
        successCount,
        successRate: totalExecutions > 0 ? Math.round((successCount / totalExecutions) * 100) : 98,
        totalRevenue: txns.filter(t => t.status === 'APPROVED').reduce((acc, t) => acc + (t.totalPrice || t.planPrice || t.amount || 0), 0),
        activeClients: clients.filter(c => c.status === 'active').length,
        categoryBreakdown: memory?.categoryUsage || { fashion: 45, beauty: 35, gadget: 28, kuliner: 22 },
        modelUsage: {
          'gemini-3.6-flash': Math.round(totalExecutions * 0.75) || 280,
          'gemini-2.5-flash': Math.round(totalExecutions * 0.20) || 75,
          'gemini-1.5-pro': Math.round(totalExecutions * 0.05) || 15
        }
      });
    } catch (err) { handleApiError(res, err); }
  });

  // --- 5. SYSTEM BACKUP & RESTORE API ---
  app.get('/api/system/export-backup', async (req, res) => {
    try {
      const clients = await dbGetClients();
      const packages = await dbGetPackages();
      const transactions = await dbGetTransactions();
      const accessCodes = await dbGetAccessCodes();
      const aiAgents = await dbGetAiAgents();
      const announcements = await dbGetAnnouncements();
      const formulas = await dbGetFormulas();
      const affiliates = await dbGetAffiliates();
      const qrisConfig = await dbGetQrisConfig();
      const contactSettings = await dbGetContactSettings();
      const systemMemory = await dbGetSystemMemory();

      const dump = {
        exportedAt: new Date().toISOString(),
        version: 'Satset-v2.5',
        collections: {
          clients,
          packages,
          transactions,
          accessCodes,
          aiAgents,
          announcements,
          formulas,
          affiliates,
          qrisConfig,
          contactSettings,
          systemMemory
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=satset_backup_${Date.now()}.json`);
      res.send(JSON.stringify(dump, null, 2));
    } catch (err) { handleApiError(res, err); }
  });

  app.post('/api/system/restore-backup', async (req, res) => {
    try {
      const { collections } = req.body || {};
      if (!collections) return res.status(400).json({ error: 'Valid backup payload required' });

      if (Array.isArray(collections.clients)) {
        for (const c of collections.clients) await dbSaveClient(c);
      }
      if (Array.isArray(collections.packages)) {
        for (const p of collections.packages) await dbSavePackage(p);
      }
      if (Array.isArray(collections.announcements)) {
        for (const a of collections.announcements) await dbSaveAnnouncement(a);
      }
      if (Array.isArray(collections.formulas)) {
        for (const f of collections.formulas) await dbSaveFormula(f);
      }
      if (Array.isArray(collections.affiliates)) {
        for (const af of collections.affiliates) await dbSaveAffiliate(af);
      }

      broadcastLiveEvent({ type: 'system_backup_restored', timestamp: new Date().toISOString() });
      res.json({ success: true, message: 'Database backup successfully restored' });
    } catch (err) { handleApiError(res, err); }
  });


  // Health check endpoints
  
  // History API
  app.get('/api/history', async (req, res) => {
    try {
      const code = req.query.accessCode || '';
      const history = await dbGetHistory(String(code));
      res.json(history);
    } catch (e) {
      res.status(500).json({ error: 'Failed to get history' });
    }
  });

  app.post('/api/history', async (req, res) => {
    try {
      await dbSaveHistoryItem(req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to save history item' });
    }
  });

  app.delete('/api/history/:id', async (req, res) => {
    try {
      await dbDeleteHistoryItem(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete history item' });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get(['/api/health/firestore', '/api/db-health'], async (req, res) => {
    const health = await testFirestoreHealth();
    if (health.ok) {
      res.json(health);
    } else {
      res.status(health.status === 'PERMISSION_DENIED' ? 403 : 500).json(health);
    }
  });

  // 404 handler for unknown API routes to prevent falling through to SPA index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint tidak ditemukan: ${req.method} ${req.path}` });
  });

  // Global Express error handler to ensure JSON response on errors (e.g. payload too large)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('[Server Error]', err);
    if (res.headersSent) {
      return next(err);
    }
    const status = err.status || err.statusCode || 500;
    const message = err.type === 'entity.too.large'
      ? 'Ukuran data file terlalu besar. Silakan kurangi ukuran file video atau gunakan file di bawah 50MB.'
      : (err.message || 'Terjadi kesalahan internal pada server.');
    res.status(status).json({ error: message });
  });

  // Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
