import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  Link as LinkIcon, 
  Clipboard, 
  Search, 
  Tag, 
  Target, 
  Layers, 
  Share2, 
  Flame, 
  Camera, 
  Film, 
  CheckCircle2, 
  HelpCircle,
  Package,
  ShieldCheck,
  FileText,
  Clock,
  Scissors,
  MessageSquare,
  Video,
  Lightbulb,
  Download,
  ListFilter,
  Cpu,
  Megaphone,
  Hash,
  Wand2,
  Image as ImageIcon,
  RefreshCw,
  Link2,
  FlaskConical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { saveHistoryItem } from '../../lib/history';
import { getAntiLimitHeaders } from '../../lib/antiLimit';
import { learningSync } from '../../lib/learningSync';
import { safeParseJson } from '../../lib/apiHelper';
import EngagingLoadingState from '../common/EngagingLoadingState';
import { useAccessGate } from '../../hooks/useAccessGate';
import { useGenerationLog } from '../../hooks/useGenerationLog';
import { reportActiveGenerationStatus } from '../../events/generationEvent';
import BatchPhotoPromptModal, { ClipSummaryItem } from '../modals/BatchPhotoPromptModal';
import { ProductToVideoOutputView } from './ProductToVideoOutputView';

export interface IdeaClipSegment {
  id: number;
  timeRange: string;
  title: string;
  actionAndVO: string;
  aiPrompt: string;
}

export interface TikTokShopIdea {
  id: number;
  title: string;
  queryAcuan?: string;
  angle?: string;
  targetAudience?: string;
  aeoQueryMapping?: string;
  alasanRelevansi?: string;
  atomicAnswerSummary?: string;
  consensusTrigger?: string;
  visualAudioGuide?: string;
  visualHook?: string;
  tosHook?: string;
  voHook?: string;
  scenePrompts: string;
  clips: IdeaClipSegment[];
  cta?: string;
  audioStyle?: string;
  visualStyle?: string;
  caption?: string;
  hashtags?: string;
  rawBlock?: string;
}

export const parseClipSegmentsFromScenePrompts = (text: string): IdeaClipSegment[] => {
  if (!text) return [];

  const clips: IdeaClipSegment[] = [];

  // 1. First attempt: check for the strict timeline breakdown format (e.g., "0–2 detik", "0-2 detik", "2–3,8 detik")
  const timelineSegmentRegex = /(?:^|\n)\s*(\d+(?:[.,]\d+)?\s*[–\-—]\s*\d+(?:[.,]\d+)?\s*(?:detik|dtk|s))\s*\n+([\s\S]*?)(?=(?:\n\s*\d+(?:[.,]\d+)?\s*[–\-—]\s*\d+(?:[.,]\d+)?\s*(?:detik|dtk|s)|\n\s*-\s*\*\*AEO|\n\s*-\s*\*\*Call|\n\s*-\s*\*\*Draft|\n\s*-\s*\*\*Caption|\n\s*-\s*\*\*Hashtag|\n\s*-\s*\*\*Rekomendasi|$))/gi;

  let timelineMatch;
  let timelineIdx = 1;

  while ((timelineMatch = timelineSegmentRegex.exec(text)) !== null) {
    const rawTime = timelineMatch[1].trim();
    const body = timelineMatch[2].trim();

    // Extract Visual, Aksi, voice over / Subteks
    const visualMatch = body.match(/Visual:\s*([^\n]+(?:\n(?!\s*(?:Aksi|voice over|Voice Over|Subteks):)[^\n]+)*)/i);
    const aksiMatch = body.match(/Aksi:\s*([^\n]+(?:\n(?!\s*(?:Visual|voice over|Voice Over|Subteks):)[^\n]+)*)/i);
    const voMatch = body.match(/(?:voice over|Voice Over):\s*([^\n]+(?:\n(?!\s*(?:Visual|Aksi|Subteks):)[^\n]+)*)/i);
    const subteksMatch = body.match(/Subteks:\s*([^\n]+(?:\n(?!\s*(?:Visual|Aksi|voice over|Voice Over):)[^\n]+)*)/i);

    const visualText = visualMatch ? visualMatch[1].trim() : '';
    const aksiText = aksiMatch ? aksiMatch[1].trim() : '';
    const speechOrSub = voMatch ? `voice over: ${voMatch[1].trim().replace(/^["']|["']$/g, '')}` : subteksMatch ? `Subteks: ${subteksMatch[1].trim().replace(/^["']|["']$/g, '')}` : '';

    const combinedActionVO = [
      aksiText ? `Aksi: ${aksiText}` : '',
      speechOrSub,
    ].filter(Boolean).join('\n') || body;

    const combinedAiPrompt = [
      visualText ? `Visual: ${visualText}` : '',
      aksiText ? `Aksi: ${aksiText}` : '',
      speechOrSub,
    ].filter(Boolean).map(s => {
      const trimmed = s.trim();
      return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
    }).join(' ') || body;

    clips.push({
      id: timelineIdx,
      timeRange: rawTime,
      title: `Segmen ${timelineIdx} (${rawTime})`,
      actionAndVO: combinedActionVO,
      aiPrompt: combinedAiPrompt,
    });
    timelineIdx++;
  }

  if (clips.length > 0) {
    return clips;
  }

  // 2. Second attempt: Match pattern like: - **[00:00 - 00:05] Klip 1 (Hook)**: ... or standard brackets
  const clipRegex = /(?:^|\n)\s*(?:-\s*)?(?:\*\*)?\[(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})\](?:\*\*)?\s*(?:-?\s*)(?:\*\*)?([^\*:\n]+)(?:\*\*)?:?([\s\S]*?)(?=(?:\n\s*(?:-\s*)?(?:\*\*)?\[\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\]|\n\s*-\s*\*\*AEO|\n\s*-\s*\*\*Call|\n\s*-\s*\*\*Draft|\n\s*-\s*\*\*Caption|\n\s*-\s*\*\*Hashtag|\n\s*-\s*\*\*Rekomendasi|$))/gi;

  let match;
  let index = 1;

  while ((match = clipRegex.exec(text)) !== null) {
    const timeRange = match[1].trim();
    const rawTitle = match[2].trim();
    const contentBlock = match[3].trim();

    // Extract Aksi & Dialog/VO
    let actionAndVO = '';
    const actMatch = contentBlock.match(/(?:\*Aksi & Dialog\/VO\*|\*Aksi & VO\*|\*Aksi\*|Aksi & Dialog\/VO:|Aksi:)\s*([\s\S]*?)(?=(?:\n\s*-\s*\*Prompt AI Video\*|\n\s*-\s*\*Prompt|```|\[Style\]:|$))/i);
    if (actMatch) {
      actionAndVO = actMatch[1].trim().replace(/^\[|\]$/g, '');
    } else {
      const cutoffMatch = contentBlock.match(/^([\s\S]*?)(?=(?:```|\[Style\]:|\*Prompt AI Video\*))/i);
      actionAndVO = cutoffMatch ? cutoffMatch[1].trim() : contentBlock;
    }

    // Extract Prompt AI Video
    let aiPrompt = '';
    const codeMatch = contentBlock.match(/```(?:text)?\n?([\s\S]*?)```/i);
    if (codeMatch) {
      aiPrompt = codeMatch[1].trim();
    } else {
      const tagMatch = contentBlock.match(/(\[Style\]:[\s\S]*?)$/i);
      if (tagMatch) {
        aiPrompt = tagMatch[1].trim();
      } else {
        const promptMatch = contentBlock.match(/(?:\*Prompt AI Video\*|\*Prompt AI\*|\*Prompt\*|Prompt AI Video:)\s*([\s\S]*?)$/i);
        if (promptMatch) {
          aiPrompt = promptMatch[1].replace(/[`]/g, '').trim();
        }
      }
    }

    clips.push({
      id: index++,
      timeRange,
      title: rawTitle || `Klip ${index - 1}`,
      actionAndVO,
      aiPrompt,
    });
  }

  // Fallback parsing if non-standard list formatting
  if (clips.length === 0 && text.includes('Klip')) {
    const blocks = text.split(/(?=\n\s*-\s*\*+\[?0\d:|\n\s*-\s*\*+Klip)/gi).filter(Boolean);
    blocks.forEach((b, i) => {
      const timeMatch = b.match(/\[(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\]/);
      const codeMatch = b.match(/```(?:text)?\n?([\s\S]*?)```/i);
      const actMatch = b.match(/(?:\*Aksi[^\*]*\*):\s*([^\n]+)/i);

      clips.push({
        id: i + 1,
        timeRange: timeMatch ? timeMatch[1] : `Segmen ${i + 1}`,
        title: `Klip ${i + 1}`,
        actionAndVO: actMatch ? actMatch[1].trim() : b.replace(/```[\s\S]*?```/g, '').replace(/[\*#]/g, '').trim(),
        aiPrompt: codeMatch ? codeMatch[1].trim() : '',
      });
    });
  }

  return clips;
};

interface TikTokShopToIdeasToolProps {
  initialProductUrl?: string;
  initialResult?: string;
  onSendToPhotoPrompt?: (
    text: string,
    options?: {
      negativePrompt?: string;
      referenceImage?: File;
      autoGenerate?: boolean;
      aspectRatio?: string;
      photoStyle?: string;
      targetGenerator?: string;
    }
  ) => void;
  onSendToVideoPrompt?: (text: string) => void;
}

function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  React.useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
}

export default function TikTokShopToIdeasTool({
  initialProductUrl,
  initialResult,
  onSendToPhotoPrompt,
  onSendToVideoPrompt,
}: TikTokShopToIdeasToolProps) {
  const accessGate = useAccessGate();
  const { logGeneration } = useGenerationLog();

  const [shopUrl, setShopUrl] = usePersistentState<string>('tts_shopUrl', '');
  const [numIdeas, setNumIdeas] = usePersistentState<number>('tts_numIdeas', 1);
  const [totalDuration, setTotalDuration] = usePersistentState<string>('tts_totalDuration', '60');
  const [promptSplitSec, setPromptSplitSec] = usePersistentState<string>('tts_promptSplitSec', '10');
  const [aeoTargetMode, setAeoTargetMode] = usePersistentState<'both' | 'short' | 'long'>('tts_aeoTargetMode', 'both');
  const [enableBigSound, setEnableBigSound] = usePersistentState<boolean>('tts_enableBigSound', true);
  const [enableTextOverlay, setEnableTextOverlay] = usePersistentState<boolean>('tts_enableTextOverlay', true);
  const [enableGrounding, setEnableGrounding] = usePersistentState<boolean>('tts_enableGrounding', true);
  const [analysisMode, setAnalysisMode] = usePersistentState<'deep' | 'fast'>('tts_analysisMode', 'deep');
  const [selectedModel, setSelectedModel] = usePersistentState<string>('tts_selectedModel', 'gemini-3.8-flash');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultText, setResultText] = usePersistentState<string | null>('tts_resultText', null);

  useEffect(() => {
    if (initialProductUrl) {
      setShopUrl(initialProductUrl);
    }
    if (initialResult) {
      setResultText(initialResult);
    }
  }, [initialProductUrl, initialResult]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [copiedClipKey, setCopiedClipKey] = useState<string | null>(null);
  const [copiedHookId, setCopiedHookId] = useState<number | null>(null);
  const [copiedScenesId, setCopiedScenesId] = useState<number | null>(null);
  const [copiedIdeaId, setCopiedIdeaId] = useState<number | null>(null);
  const [copiedPanduanId, setCopiedPanduanId] = useState<number | null>(null);
  const [copiedCaptionId, setCopiedCaptionId] = useState<number | null>(null);
  const [copiedHashtagId, setCopiedHashtagId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = usePersistentState<'analysis' | 'queries' | 'ideas' | 'raw'>('tts_activeTab', 'ideas');
  const [viewMode, setViewMode] = usePersistentState<'cards' | 'raw'>('tts_viewMode', 'cards');

  // Batch Photo Prompt Modal State
  const [isBatchPhotoModalOpen, setIsBatchPhotoModalOpen] = useState(false);
  const [batchModalData, setBatchModalData] = useState<{
    conceptTitle: string;
    clips: ClipSummaryItem[];
  } | null>(null);

  // Reference Product Image Upload State
  const [refImageFile, setRefImageFile] = useState<File | null>(null);
  const [refPreviewUrl, setRefPreviewUrl] = useState<string | null>(null);
  const [isRefDragging, setIsRefDragging] = useState<boolean>(false);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Gagal mengonversi file gambar'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const isAllowed = accessGate.isAllowed('idea_konten');
  const accessReason = accessGate.getReason('idea_konten');

  const downloadIdeaAsTxt = (idea: any) => {
    const textContent = `==================================================
IDE KONTEN PRODUK TO VIDEO #${idea.id}: ${idea.title.toUpperCase()}
==================================================

[METADATA KONTEN]
• Tipe & Angle: ${idea.angle || 'Soft Selling & Unboxing'}
• Target Audience: ${idea.targetAudience || 'Audiens FYP TikTok'}
• AEO Query Mapping: ${idea.aeoQueryMapping || idea.queryAcuan || ''}
• Alasan Relevansi: ${idea.alasanRelevansi || ''}
• Atomic Answer Summary: ${idea.atomicAnswerSummary || ''}
• Consensus Trigger: ${idea.consensusTrigger || ''}

[PANDUAN VISUAL & AUDIO]
${idea.visualAudioGuide || idea.visualHook || idea.voHook || 'Presenter membawakan review produk secara kasual & interaktif.'}

[RINCIAN ADEGAN VIDEO & PROMPT AI PER SEGMEN]
${idea.scenePrompts || 'Lihat klip breakdown'}

[CALL TO ACTION]
${idea.cta || 'Klik keranjang kuning sekarang!'}

[DRAFT CAPTION TIKTOK SHOP]
${idea.caption || ''}

[HASHTAG RELEVAN]
${idea.hashtags || ''}
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ide_Produk_to_Video_${idea.id}_${idea.title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllIdeasAsTxt = () => {
    if (!resultText) return;
    const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Paket_Ide_Produk_to_Video_Lengkap_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyIdea = (idea: any) => {
    const ideaText = `### IDE #${idea.id}: ${idea.title}\n\n` +
      `**Tipe & Angle**: ${idea.angle || ''}\n` +
      `**Target Audience**: ${idea.targetAudience || ''}\n` +
      `**AEO Query Mapping**: ${idea.aeoQueryMapping || idea.queryAcuan || ''}\n` +
      `**Panduan Visual & Audio**: ${idea.visualAudioGuide || idea.visualHook || ''}\n\n` +
      `**Scene Breakdown**:\n${idea.scenePrompts || ''}\n\n` +
      `**Caption**: ${idea.caption || ''}\n` +
      `**Hashtags**: ${idea.hashtags || ''}`;
    navigator.clipboard.writeText(ideaText);
    setCopiedIdeaId(idea.id);
    setTimeout(() => setCopiedIdeaId(null), 2000);
  };

  const copyPanduan = (idea: any) => {
    const text = idea.visualAudioGuide || `Visual: ${idea.visualHook || ''}\nVO: ${idea.voHook || ''}\nAudio: ${idea.audioStyle || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedPanduanId(idea.id);
    setTimeout(() => setCopiedPanduanId(null), 2000);
  };

  const copyCaption = (idea: any) => {
    navigator.clipboard.writeText(idea.caption || '');
    setCopiedCaptionId(idea.id);
    setTimeout(() => setCopiedCaptionId(null), 2000);
  };

  const copyHashtags = (idea: any) => {
    navigator.clipboard.writeText(idea.hashtags || '');
    setCopiedHashtagId(idea.id);
    setTimeout(() => setCopiedHashtagId(null), 2000);
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setShopUrl(text);
        setError(null);
      }
    } catch (e) {
      setError('Gagal mengakses clipboard. Silakan tempel secara manual.');
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
    learningSync.track('prompt_copied', { key, length: text.length });
  };

  const copyClipOnly = (ideaId: number, clip: IdeaClipSegment) => {
    const textToCopy = clip.aiPrompt ? clip.aiPrompt.trim() : (clip.actionAndVO ? clip.actionAndVO.trim() : clip.title);
    navigator.clipboard.writeText(textToCopy);
    const key = `${ideaId}_${clip.id}`;
    setCopiedClipKey(key);
    setTimeout(() => setCopiedClipKey(null), 2000);
    learningSync.track('prompt_copied', {
      type: 'tiktok_shop_clip_segment',
      ideaId,
      clipId: clip.id,
      text: textToCopy,
    });
  };

  const copyHookOnly = (idea: any) => {
    const hookText = `TOS: "${idea.tosHook || ''}"\nVO: "${idea.voHook || ''}"\nVisual Action: ${idea.visualHook || ''}`;
    navigator.clipboard.writeText(hookText);
    setCopiedHookId(idea.id);
    setTimeout(() => setCopiedHookId(null), 2000);
  };

  const copyScenesOnly = (idea: any) => {
    let scenesText = idea.scenePrompts;
    if (idea.clips && idea.clips.length > 0) {
      scenesText = idea.clips.map((c: IdeaClipSegment) => `[${c.timeRange}] - ${c.title}\n${c.actionAndVO}\n\n${c.aiPrompt}`).join('\n\n---\n\n');
    }
    navigator.clipboard.writeText(scenesText);
    setCopiedScenesId(idea.id);
    setTimeout(() => setCopiedScenesId(null), 2000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isAllowed) {
      setError(accessReason || 'Akses ditolak. Silakan perpanjang paket Anda.');
      return;
    }

    if (!shopUrl.trim() && !refImageFile) {
      setError('Masukkan link produk TikTok Shop atau unggah foto produk referensi.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    const startTime = Date.now();
    const activeId = `gen_shop_${Date.now()}`;
    reportActiveGenerationStatus(activeId, 'generating', `Analisis Produk to Video (${numIdeas} Ide, ${totalDuration}s)`);

    try {
      let referenceImageBase64 = '';
      let referenceImageMimeType = '';
      if (refImageFile) {
        try {
          referenceImageBase64 = await fileToBase64(refImageFile);
          referenceImageMimeType = refImageFile.type || 'image/jpeg';
        } catch (imgErr) {
          console.warn('Gagal membaca gambar produk referensi:', imgErr);
        }
      }

      const response = await fetch('/api/generate-tiktok-shop-ideas', {
        method: 'POST',
        headers: getAntiLimitHeaders(),
        body: JSON.stringify({
          shopUrl: shopUrl.trim(),
          numIdeas,
          totalDuration,
          promptSplitSec,
          aeoTargetMode,
          enableBigSound,
          enableTextOverlay,
          analysisMode,
          referenceImageBase64,
          referenceImageMimeType,
          model: selectedModel || undefined,
        }),
      });

      const data = await safeParseJson(response);

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses ide produk to video.');
      }

      const generatedResult = data.result || data.text;
      if (!generatedResult) {
        throw new Error('Hasil generasi ide produk to video kosong. Silakan coba lagi.');
      }

      setResultText(generatedResult);
      setActiveTab('ideas');

      const primarySource = shopUrl.trim() || refImageFile?.name || 'Foto Produk';
      const latencyMs = Date.now() - startTime;
      logGeneration({
        tool: 'idea_konten',
        topic: primarySource,
        durationRequested: parseInt(totalDuration, 10) || 60,
        segmentSplit: parseInt(promptSplitSec, 10) || 10,
        modelUsed: data.modelUsed || selectedModel,
        latencyMs,
        outcome: 'success',
      });

      saveHistoryItem({
        category: 'tiktok_shop_ideas',
        title: `Produk to Video (${totalDuration}s): ${primarySource.slice(0, 35)}...`,
        subtitle: `Durasi: ${totalDuration}s (Pecah ${promptSplitSec}s) • ${numIdeas} Ide`,
        data: {
          prompt: data.result,
          contentIdeasResult: data.result,
          modelUsed: data.modelUsed || selectedModel,
          sourceText: primarySource,
        },
      });

      learningSync.track('content_ideas_generated', {
        topic: primarySource,
        maxDuration: totalDuration,
        segmentDuration: promptSplitSec,
      });

      reportActiveGenerationStatus(activeId, 'completed');
    } catch (err: any) {
      console.error('TikTok Shop Ideas Generator error:', err);
      setError(err.message || 'Terjadi kesalahan jaringan/server. Silakan coba lagi.');
      reportActiveGenerationStatus(activeId, 'completed');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseAnalysisSection = (raw: string) => {
    if (!raw) return null;
    const match = raw.match(/## 📦 BAGIAN 1: AI ANALISIS PRODUK[\s\S]*?([\s\S]*?)(?=---|\n## 🔍 BAGIAN 2|$)/i);
    if (!match) return null;

    const block = match[1];

    const category = block.match(/- \*\*Kategori & Positioning\*\*:\s*([^\n]+)/i)?.[1] || '';
    const ingredients = block.match(/- \*\*Bahan \/ Key Ingredients [^\*]*\*\*:\s*([^\n]+)/i)?.[1] || '';
    const problemSolved = block.match(/- \*\*Pain Points [^\*]*\*\*:\s*([^\n]+)/i)?.[1] || '';
    const benefit = block.match(/- \*\*Benefit \/ Claim [^\*]*\*\*:\s*([^\n]+)/i)?.[1] || '';
    const targetUser = block.match(/- \*\*Target User [^\*]*\*\*:\s*([^\n]+)/i)?.[1] || '';

    const priceRating = block.match(/- \*\*Estimasi Harga [^\*]*\*\*:\s*([^\n]+)/i)?.[1] || '';
    const bpom = block.match(/- \*\*BPOM [^\*]*\*\*:\s*([^\n]+)/i)?.[1] || '';
    const usp = block.match(/- \*\*Unique Selling Point [^\*]*\*\*:\s*([^\n]+)/i)?.[1] || '';
    const moodTone = block.match(/- \*\*Mood & Tone [^\*]*\*\*:\s*([^\n]+)/i)?.[1] || '';

    const summaryMatch = block.match(/### 📝 Ringkasan Eksekutif Produk\s*([\s\S]*?)(?=---|$)/i);
    const summaryParagraph = summaryMatch ? summaryMatch[1].trim() : '';

    return { category, ingredients, problemSolved, benefit, targetUser, priceRating, bpom, usp, moodTone, summaryParagraph };
  };

  const parseQueryMapping = (raw: string) => {
    if (!raw) return [];
    const match = raw.match(/## 🔍 BAGIAN 2: MAPPING QUERY SEO TIKTOK[\s\S]*?([\s\S]*?)(?=---|\n## 🚀 BAGIAN 3|$)/i);
    if (!match) return [];

    const block = match[1];
    const sections: { title: string; queries: string[] }[] = [];

    const categoryBlocks = block.split(/(?=\d+\.\s+\*\*Berdasarkan)/i);

    categoryBlocks.forEach((catBlock) => {
      const titleMatch = catBlock.match(/\d+\.\s+\*\*([^*]+)\*\*/);
      if (titleMatch) {
        const title = titleMatch[1].trim();
        const queries: string[] = [];
        const lines = catBlock.split('\n');
        lines.forEach((line) => {
          const qMatch = line.match(/^\s*-\s*"([^"]+)"/) || line.match(/^\s*-\s*(.+)/);
          if (qMatch && !line.includes('**Berdasarkan')) {
            const cleanQ = qMatch[1].replace(/^["'`]/, '').replace(/["'`]$/, '').trim();
            if (cleanQ && !cleanQ.startsWith('[')) queries.push(cleanQ);
          }
        });
        if (queries.length > 0) {
          sections.push({ title, queries });
        }
      }
    });

    if (sections.length === 0) {
      const allMatches = block.match(/"([^"]+)"/g);
      if (allMatches) {
        const queries = allMatches.map(m => m.replace(/"/g, '')).filter(q => q.length > 3 && !q.includes('Query SEO'));
        if (queries.length > 0) {
          sections.push({ title: 'Kata Kunci SEO TikTok Popular', queries });
        }
      }
    }

    return sections;
  };

  const parseIdeas = (raw: string) => {
    if (!raw) return [];
    const match = raw.match(/## 🚀 BAGIAN 3: GENERATE[\s\S]*?([\s\S]*)/i);
    const ideasBlock = match ? match[1] : raw;

    const rawIdeas = ideasBlock.split(/### 💡 IDE /i).slice(1);

    return rawIdeas.map((block, idx) => {
      const lines = block.split('\n');
      const titleLine = lines[0] || `Ide ${idx + 1}`;
      const title = titleLine.replace(/^\d+:\s*/, '').replace(/[\*\_#]/g, '').trim();

      const getSection = (key: string): string => {
        const regex = new RegExp(`\\*\\*${key}\\*\\*:\\s*(.+)`, 'i');
        const match = block.match(regex);
        return match ? match[1].trim() : '';
      };

      const queryAcuan = getSection('Query SEO Acuan') || getSection('Query Pencarian Acuan') || getSection('AEO Query Mapping');
      const angle = getSection('Sudut Pandang / Angle') || getSection('Tipe & Angle Konten') || getSection('Angle');
      const targetAudience = getSection('Target Audience') || getSection('Target');
      const aeoQueryMapping = getSection('AEO Query Mapping') || (queryAcuan ? `Short → \`${queryAcuan.slice(0, 20)}\`, Long → \`${queryAcuan}\`` : '');
      const alasanRelevansi = getSection('Alasan Relevansi') || getSection('Keunggulan / Benefit');
      const atomicAnswerSummary = getSection('Atomic Answer Summary') || getSection('Atomic Answer Summary (LLM Citation Ready)') || getSection('Ringkasan Produk');
      const consensusTrigger = getSection('Consensus Trigger') || getSection('Consensus Trigger (Tier 2 Validation)') || getSection('Unique Selling Point');
      
      const visualAudioGuide = getSection('Panduan Visual & Audio') || getSection('Visual & Audio');

      const visualHook = block.match(/\*Visual\*:\s*([^\n]+)/i)?.[1] || '';
      const tosHook = block.match(/\*Text On Screen \(TOS\)\*:\s*([^\n]+)/i)?.[1] || '';
      const voHook = block.match(/\*Voice Over \(VO\)\*:\s*([^\n]+)/i)?.[1] || block.match(/\*Voice Over \/ Narasi\*:\s*([^\n]+)/i)?.[1] || '';
      const cta = getSection('Call To Action') || block.match(/- \*\*Call To Action [^\*]*\*\*:\s*([^\n]+)/i)?.[1] || '';
      
      let caption = block.match(/(?:- \*\*(?:AEO Caption SEO|Draft Caption TikTok Shop|Caption Relevan Persuasif|Caption Relevan|Caption)\*\*:?|Draft Caption TikTok Shop)\s*([\s\S]*?)(?=- \*\*Hashtag|- \*\*Call To Action|$)/i)?.[1]?.trim() || '';
      if (caption) {
        caption = caption.replace(/^"""[a-z]*\n?/i, '').replace(/\n?"""$/i, '').replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
      }

      let hashtags = block.match(/- \*\*(?:Hashtag Relevan High-Traffic|Hashtag Relevan|Hashtag)\*\*:\s*([^\n]+)/i)?.[1] || '';
      if (!hashtags) {
        const hashArray = block.match(/#[\w_]+/g);
        if (hashArray) hashtags = hashArray.join(' ');
      }
      
      // Enforce strictly max 5 hashtags in UI and filter generic spam tags
      if (hashtags) {
        const hashMatches = hashtags.match(/#[\w\u0590-\u05ff\u0600-\u06ff\u0e00-\u0e7f_]+/g);
        if (hashMatches) {
          const BANNED_SPAM = new Set(['fyp', 'fypシ', 'fypviral', 'foryou', 'foryoupage', 'racuntiktok', 'racuntiktokshop', 'viral', 'viralvideo', 'trending', 'beranda', 'fyppage', 'foryourpage']);
          const filteredTags = hashMatches.filter((t: string) => !BANNED_SPAM.has(t.replace('#', '').toLowerCase()));
          const finalTags = (filteredTags.length > 0 ? filteredTags : hashMatches).slice(0, 5);
          hashtags = finalTags.join(' ');
        }
      }

      // Sanitize caption from spam phrases
      if (caption) {
        caption = caption
          .replace(/\b(racun\s*tik\s*tok|racun\s*tiktok)\b/gi, 'rekomendasi produk pilihan')
          .replace(/\b(for\s*your\s*page|f\s*y\s*p|fyp)\b/gi, 'pencarian sosial media')
          .replace(/\b(viral\s*di\s*tiktok|viral\s*tiktok)\b/gi, 'banyak dicari');
      }

      const scenePromptsMatch = block.match(/(?:- \*\*Rincian Adegan Video.*?\*\*:\s*|- \*\*Breakdown Per Clip.*?\*\*:\s*|- \*\*Script Outline Singkat\*\*:\s*)([\s\S]*?)(?=\n\s*-\s*\*\*AEO|\n\s*-\s*\*\*Call|\n\s*-\s*\*\*Draft|\n\s*-\s*\*\*Caption|\n\s*-\s*\*\*Hashtag|\n\s*-\s*\*\*Rekomendasi|$)/i);
      const scenePrompts = scenePromptsMatch ? scenePromptsMatch[1].trim() : '';

      const clips = parseClipSegmentsFromScenePrompts(block);

      const audioStyle = block.match(/\*Audio \/ Sound\*:\s*([^\n]+)/i)?.[1] || '';
      const visualStyle = block.match(/\*Visual Style\*:\s*([^\n]+)/i)?.[1] || '';

      return {
        id: idx + 1,
        title,
        queryAcuan,
        angle,
        targetAudience,
        aeoQueryMapping,
        alasanRelevansi,
        atomicAnswerSummary,
        consensusTrigger,
        visualAudioGuide,
        visualHook,
        tosHook,
        voHook,
        scenePrompts,
        clips,
        cta,
        audioStyle,
        visualStyle,
        caption,
        hashtags,
        rawBlock: `### IDE ${idx + 1}: ${title}\n` + block.trim(),
      };
    });
  };

  const analysisData = resultText ? parseAnalysisSection(resultText) : null;
  const querySections = resultText ? parseQueryMapping(resultText) : [];
  const parsedIdeas = resultText ? parseIdeas(resultText) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* INPUT FORM CARD */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 lg:p-9 shadow-xs space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* LINK PRODUK (TIKTOK SHOP) */}
          <div className="space-y-2">
            <label className="text-[11px] sm:text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-pink-50 text-pink-500 inline-flex items-center justify-center shrink-0">
                <Link2 className="w-4 h-4 rotate-[-45deg]" />
              </span>
              <span>LINK PRODUK (TIKTOK SHOP)</span>
            </label>

            <div className="relative flex items-center">
              <input
                type="url"
                placeholder="https://vt.tiktok.com/... atau https://shop.tiktok.com/..."
                value={shopUrl}
                onChange={(e) => {
                  setShopUrl(e.target.value);
                  setError(null);
                }}
                className="w-full h-12 sm:h-13 pl-4 pr-28 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-[#5b50e5]/20 focus:border-[#5b50e5] outline-none bg-white text-slate-900 font-medium transition-all placeholder:text-slate-400"
              />

              <button
                type="button"
                onClick={handlePasteUrl}
                className="absolute right-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                title="Tempel Link dari Clipboard"
              >
                <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                <span>Tempel</span>
              </button>
            </div>
          </div>

          {/* CONFIGURATIONS ROW: TOTAL DURATION, PROMPT SPLIT */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-start">
            
            {/* TOTAL DURATION (Cols 1-7) */}
            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>TOTAL DURATION</span>
                </label>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-md shadow-2xs">
                  {totalDuration} Detik
                </span>
              </div>

              <div className="h-11 p-1 bg-slate-100/90 border border-slate-200/70 rounded-xl flex items-center justify-between gap-1">
                {[10, 20, 30, 40, 50, 60, 70].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTotalDuration(String(sec))}
                    className={`flex-1 h-full rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                      totalDuration === String(sec)
                        ? 'bg-[#5b50e5] text-white shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* PROMPT SPLIT (Cols 8-12) */}
            <div className="md:col-span-5 space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-slate-400" />
                <span>PROMPT SPLIT</span>
              </label>
              <select
                value={promptSplitSec}
                onChange={(e) => setPromptSplitSec(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 focus:border-[#5b50e5] focus:ring-2 focus:ring-[#5b50e5]/20 text-slate-900 text-xs font-medium focus:outline-none cursor-pointer transition-all"
              >
                <option value="10">Tiap 10 Detik per Klip</option>
                <option value="4">Tiap 4 Detik per Klip</option>
                <option value="6">Tiap 6 Detik per Klip</option>
                <option value="8">Tiap 8 Detik per Klip</option>
                <option value="15">Tiap 15 Detik per Klip</option>
                <option value="auto">Pecah Otomatis Sesuai Adegan</option>
              </select>
            </div>
          </div>

          {/* ROW: TEXT OVERLAY & REFERENCE IMAGE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            
            {/* LEFT: TEXT OVERLAY / HOOK TEKS */}
            <div className="flex flex-col justify-between">
              <div className="h-full p-5 rounded-2xl border border-slate-200/90 bg-white flex items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <MessageSquare className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Text Overlay / Hook Teks</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Sertakan narasi teks besar on-screen penahan retensi penonton
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={enableTextOverlay} 
                    onChange={(e) => setEnableTextOverlay(e.target.checked)} 
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5b50e5]"></div>
                </label>
              </div>
            </div>

            {/* RIGHT: FOTO REFERENSI PRODUK */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  FOTO REFERENSI PRODUK
                </label>
                <span className="text-[10px] font-bold text-[#5b50e5] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                  Cegah Flicker Identitas
                </span>
              </div>

              {!refImageFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsRefDragging(true); }}
                  onDragLeave={() => setIsRefDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsRefDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setRefImageFile(file);
                      setRefPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  onClick={() => refFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[110px] ${
                    isRefDragging ? 'border-[#5b50e5] bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-[#5b50e5] hover:bg-slate-50/60'
                  }`}
                >
                  <ImageIcon className="w-5 h-5 text-[#5b50e5] mb-1.5" />
                  <p className="text-xs font-bold text-slate-800">Unggah Foto Produk Referensi (Opsional)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Klik atau seret file gambar JPG/PNG ke sini</p>
                  <input
                    type="file"
                    ref={refFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setRefImageFile(file);
                        setRefPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 min-h-[110px]">
                  <div className="flex items-center gap-3 overflow-hidden h-full">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative border border-slate-200">
                      <img src={refPreviewUrl!} alt="Ref" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">Foto Referensi Aktif</p>
                      <p className="text-[11px] text-slate-500 truncate">{refImageFile.name}</p>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Identity Anchor Siap
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRefImageFile(null);
                      if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
                      setRefPreviewUrl(null);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors text-xs shrink-0 cursor-pointer"
                    title="Hapus Foto Referensi"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* GOOGLE SEARCH LIVE GROUNDING CARD */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">Google Search Live Grounding</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200/80 uppercase tracking-wider">
                    Real-Time Data
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Ambil riset tren pasar terkini, competitor angle, & kata kunci pencarian actual saat ini
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={enableGrounding} 
                onChange={(e) => setEnableGrounding(e.target.checked)} 
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5b50e5]"></div>
            </label>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isProcessing || (!shopUrl.trim() && !refImageFile)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#6d5dfc] to-[#5543ec] hover:from-[#6251f8] hover:to-[#4a36e0] text-white font-bold text-sm shadow-md hover:shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50 min-h-[48px] active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menganalisis Produk & Merancang Video...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4 text-white" />
                  <span>Generate Ide & Script Video</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* ENGAGING LOADING STATE */}
      <AnimatePresence>
        {isProcessing && (
          <div className="pt-2">
            <EngagingLoadingState
              title="Meracik Ide & Script Video TikTok Shop"
              subtitle="AI sedang membedah produk, menyusun strategi hook, dan merancang naskah konversi tinggi..."
              badgeText="TIKTOK SHOP AI ENGINE"
              icon={ShoppingBag}
              steps={[
                'Ekstraksi informasi produk & USP utama',
                'Analisis 5 pilar konversi & target audiens',
                'Riset keyword SEO & TikTok search intent',
                'Generate naskah video & breakdown klip prompt'
              ]}
              estimatedSeconds={14}
            />
          </div>
        )}
      </AnimatePresence>

      {/* RESULTS DISPLAY AREA */}
      {!isProcessing && resultText && (
        <ProductToVideoOutputView
          parsedIdeas={parsedIdeas}
          rawResult={resultText}
          totalDuration={totalDuration}
          promptSplitSec={promptSplitSec}
          targetAI="GENERAL"
          analysisData={analysisData}
          querySections={querySections}
          refImageFile={refImageFile}
          onSendToPhotoPrompt={onSendToPhotoPrompt}
          onSendToVideoPrompt={onSendToVideoPrompt}
          onOpenBatchPhotoModal={(data) => {
            setBatchModalData({
              conceptTitle: data.conceptTitle,
              clips: data.clips,
            });
            setIsBatchPhotoModalOpen(true);
          }}
        />
      )}

      {/* Batch Photo Prompt Configuration Modal */}
      {batchModalData && (
        <BatchPhotoPromptModal
          isOpen={isBatchPhotoModalOpen}
          onClose={() => setIsBatchPhotoModalOpen(false)}
          conceptTitle={batchModalData.conceptTitle}
          clips={batchModalData.clips}
          onConfirm={(opts) => {
            const clipsBatchText = `KONSEP TIKTOK SHOP BATCH PROMPT FOTO (${batchModalData.clips.length} KLIP):\n` +
              `Produk/Judul: ${batchModalData.conceptTitle}\n\n` +
              batchModalData.clips.map((c, idx) => `### [${c.timeRange || `00:0${idx * 5} - 00:0${(idx + 1) * 5}`}] Klip ${c.id}: ${c.title}\nDeskripsi Adegan Visual & Voice Over:\n${c.actionAndVO || ''}\n${c.aiPrompt ? `\nPrompt Visual Dasar:\n${c.aiPrompt}` : ''}`).join('\n\n---\n\n');

            if (onSendToPhotoPrompt) {
              onSendToPhotoPrompt(clipsBatchText, {
                autoGenerate: true,
                aspectRatio: opts.aspectRatio,
                photoStyle: opts.photoStyle,
                targetGenerator: opts.targetGenerator,
                negativePrompt: opts.negativePrompt,
              });
            }
            setIsBatchPhotoModalOpen(false);
          }}
        />
      )}

    </div>
  );
}
