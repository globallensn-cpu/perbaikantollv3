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

export interface IdeaClipSegment {
  id: number;
  timeRange: string;
  title: string;
  actionAndVO: string;
  aiPrompt: string;
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
    ].filter(Boolean).join('\n') || body;

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

          {/* CONFIGURATIONS ROW: TOTAL DURATION, PROMPT SPLIT, TARGET MODE */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-start">
            
            {/* TOTAL DURATION (Cols 1-6) */}
            <div className="md:col-span-6 space-y-2">
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

            {/* PROMPT SPLIT (Cols 7-9) */}
            <div className="md:col-span-3 space-y-2">
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

            {/* TARGET MODE (Cols 10-12) */}
            <div className="md:col-span-3 space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>TARGET MODE</span>
              </label>
              <select
                value={aeoTargetMode}
                onChange={(e) => setAeoTargetMode(e.target.value as 'short' | 'long' | 'both')}
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 focus:border-[#5b50e5] focus:ring-2 focus:ring-[#5b50e5]/20 text-slate-900 text-xs font-medium focus:outline-none cursor-pointer transition-all"
              >
                <option value="both">Keduanya (Short & Long Tail)</option>
                <option value="short">Short Queries Saja</option>
                <option value="long">Long-Tail Queries Saja</option>
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
        <div className="space-y-4 sm:space-y-5">
          
          {/* TAB BUTTONS BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-slate-200/80 p-1.5 sm:p-2 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto scroll-smooth">
              <button
                type="button"
                onClick={() => setActiveTab('analysis')}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap min-h-[40px] ${
                  activeTab === 'analysis'
                    ? 'bg-[#5b50e5] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>1. Analisis Produk (5 Pilar)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('queries')}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap min-h-[40px] ${
                  activeTab === 'queries'
                    ? 'bg-[#5b50e5] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>2. Query SEO TikTok</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ideas')}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap min-h-[40px] ${
                  activeTab === 'ideas'
                    ? 'bg-[#5b50e5] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>3. Ide Konten ({parsedIdeas.length} Ide & Clip Breakdown)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(resultText, 'raw_all')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 min-h-[40px] active:scale-95"
            >
              {copiedIndex === 'raw_all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Semua Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Salin Semua Output</span>
                </>
              )}
            </button>
          </div>

          {/* TAB CONTENT PANELS */}
          <AnimatePresence mode="wait">
            
            {/* TAB 1: AI ANALISIS PRODUK */}
            {activeTab === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#5b50e5]" />
                    <span>5 Pilar Utama Analisis Produk & Grok Enrichment</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (analysisData) {
                        const text = `ANALISIS PRODUK:\nKategori: ${analysisData.category}\nBahan: ${analysisData.ingredients}\nPain Points: ${analysisData.problemSolved}\nBenefit: ${analysisData.benefit}\nTarget User: ${analysisData.targetUser}\nRingkasan: ${analysisData.summaryParagraph}`;
                        handleCopy(text, 'analysis_tab');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIndex === 'analysis_tab' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Ringkasan</span>
                  </button>
                </div>

                {analysisData ? (
                  <div className="space-y-6">
                    {/* 5 PILAR GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {analysisData.category && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 block">
                            📦 Kategori & Positioning
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                            {analysisData.category}
                          </p>
                        </div>
                      )}

                      {analysisData.ingredients && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 block">
                            🧪 Bahan & Key Ingredients
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                            {analysisData.ingredients}
                          </p>
                        </div>
                      )}

                      {analysisData.problemSolved && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 block">
                            ⚠️ Pain Points (Masalah Konsumen)
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                            {analysisData.problemSolved}
                          </p>
                        </div>
                      )}

                      {analysisData.benefit && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block">
                            ✨ Benefit & Claim Utama
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                            {analysisData.benefit}
                          </p>
                        </div>
                      )}
                    </div>

                    {analysisData.targetUser && (
                      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 block">
                          🎯 Target User & Demografi Ideal
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-indigo-950 leading-relaxed">
                          {analysisData.targetUser}
                        </p>
                      </div>
                    )}

                    {/* GROK ENRICHMENT EXTRA */}
                    {(analysisData.priceRating || analysisData.bpom || analysisData.usp || analysisData.moodTone) && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                          🌟 Grok Intelligence Enrichment
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                          {analysisData.priceRating && (
                            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 space-y-0.5">
                              <span className="text-[10px] font-bold text-amber-700 uppercase block">💰 Harga & Rating:</span>
                              <span className="font-semibold">{analysisData.priceRating}</span>
                            </div>
                          )}
                          {analysisData.bpom && (
                            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 space-y-0.5">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase block">🛡️ BPOM / Sertifikasi:</span>
                              <span className="font-semibold">{analysisData.bpom}</span>
                            </div>
                          )}
                          {analysisData.usp && (
                            <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200/80 text-cyan-950 space-y-0.5">
                              <span className="text-[10px] font-bold text-cyan-700 uppercase block">⚡ USP Khusus:</span>
                              <span className="font-semibold">{analysisData.usp}</span>
                            </div>
                          )}
                          {analysisData.moodTone && (
                            <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 text-purple-950 space-y-0.5">
                              <span className="text-[10px] font-bold text-purple-700 uppercase block">🎭 Mood & Tone:</span>
                              <span className="font-semibold">{analysisData.moodTone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* EXECUTIVE SUMMARY */}
                    {analysisData.summaryParagraph && (
                      <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2 border border-slate-800">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                          📝 Ringkasan Eksekutif Potensi Penjualan
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                          {analysisData.summaryParagraph}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-600 whitespace-pre-wrap">
                    {resultText}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: MAPPING QUERY SEO TIKTOK */}
            {activeTab === 'queries' && (
              <motion.div
                key="queries"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#5b50e5]" />
                      <span>Mapping Query SEO TikTok (8–12 Kata Kunci Pencarian)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Disusun berdasarkan pencarian alami audiens untuk menaikkan peringkat pencarian TikTok.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const allQueries = querySections.flatMap(s => s.queries).join('\n');
                      handleCopy(allQueries, 'queries_all');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedIndex === 'queries_all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Semua Query</span>
                  </button>
                </div>

                {querySections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {querySections.map((sec, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                        <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#5b50e5]" />
                          <span>{sec.title}</span>
                        </h4>

                        <div className="flex flex-wrap gap-1.5">
                          {sec.queries.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => handleCopy(q, `q_${idx}_${qIdx}`)}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-800 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer active:scale-95 group shadow-2xs"
                              title="Klik untuk salin query"
                            >
                              <span>"{q}"</span>
                              {copiedIndex === `q_${idx}_${qIdx}` ? (
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-600 whitespace-pre-wrap">
                    {resultText}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: DAFTAR IDE KONTEN VIRAL & CLIP BREAKDOWN */}
            {activeTab === 'ideas' && (
              <div className="space-y-6">
                
                {/* TOP HEADER CONTROL TOOLBAR */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                          {parsedIdeas.length > 0 ? `${parsedIdeas.length} Ide Konten TikTok & Hashtag SIAP PAKAI` : 'Ide Konten TikTok Shop'}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100 uppercase">
                          {selectedModel || 'gemini-3.8-flash'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pilih ide terbaik, salin prompt per segmen, caption & hashtag langsung untuk diposting
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap justify-end">
                    {/* VIEW MODE TOGGLE */}
                    <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setViewMode('cards')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-[#5b50e5]" />
                        <span>Kartu Per Ide</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('raw')}
                        className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          viewMode === 'raw' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                        <span>Markdown Lengkap</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={downloadAllIdeasAsTxt}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/80 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Unduh (.TXT)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(resultText, 'ideas_all')}
                      className="px-3.5 py-2 rounded-xl bg-[#5b50e5] hover:bg-[#4f46e5] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    >
                      {copiedIndex === 'ideas_all' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Semua</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AEO SYNTHETIC QUERY FAN-OUT OVERVIEW BANNER */}
                {querySections.length > 0 && (
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md p-5 rounded-2xl space-y-3 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        <Cpu className="w-4 h-4 text-cyan-300" />
                      </span>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">
                        AEO SYNTHETIC QUERY FAN-OUT (AI SEARCH ENGINE TARGETING)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Kueri sintetis long-tail hasil sintesis AEO Agent Engine untuk memicu sitasi penuh pada LLM Search:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {querySections.flatMap(s => s.queries).slice(0, 8).map((q, qIdx) => (
                        <span
                          key={qIdx}
                          className="text-xs font-mono bg-white/10 hover:bg-white/15 text-indigo-100 px-3 py-1 rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors cursor-default"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                          <span>#{q}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIEW MODE: CARDS vs RAW */}
                {viewMode === 'raw' ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
                    <div className="prose prose-slate prose-sm max-w-none overflow-x-auto bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <ReactMarkdown>{resultText}</ReactMarkdown>
                    </div>
                  </div>
                ) : parsedIdeas.length > 0 ? (
                  parsedIdeas.map((idea) => (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 space-y-5 shadow-xs hover:border-indigo-200 transition-all relative overflow-hidden"
                    >
                      {/* TOP DECORATIVE INDICATOR */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#5b50e5]" />

                      {/* IDEA HEADER */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-start gap-3">
                          <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-[#5b50e5] border border-indigo-100 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs mt-0.5">
                            #{idea.id}
                          </span>
                          <div className="space-y-1">
                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                              {idea.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Durasi: {totalDuration}s
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 text-[11px] font-medium flex items-center gap-1">
                                <Scissors className="w-3 h-3 text-cyan-600" />
                                Klip: {promptSplitSec === 'auto' ? 'Otomatis' : `${promptSplitSec}s`}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-pink-50 text-pink-800 border border-pink-200 text-[11px] font-medium flex items-center gap-1 uppercase">
                                <Video className="w-3 h-3 text-pink-600" />
                                AI: GENERAL
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => downloadIdeaAsTxt(idea)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/80 active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-600" />
                            <span>Unduh .TXT</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => copyIdea(idea)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#5b50e5] hover:bg-[#4f46e5] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          >
                            {copiedIdeaId === idea.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-amber-300" />
                                <span>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Paket Ide</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 6 METADATA GRID CARDS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* TIPE & ANGLE KONTEN */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-[#5b50e5]" /> TIPE & ANGLE KONTEN
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                            {idea.angle || 'Soft Selling & Unboxing TikTok Shop'}
                          </p>
                        </div>

                        {/* TARGET AUDIENCE */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                            <Megaphone className="w-3.5 h-3.5 text-emerald-600" /> TARGET AUDIENCE
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                            {idea.targetAudience || analysisData?.targetUser || 'Audiens FYP TikTok & Pencari Promo'}
                          </p>
                        </div>

                        {/* AEO QUERY MAPPING */}
                        <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200/50 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider flex items-center gap-1">
                            <Search className="w-3.5 h-3.5 text-indigo-500" /> AEO QUERY MAPPING
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-indigo-950 leading-relaxed">
                            {idea.aeoQueryMapping || (idea.queryAcuan ? `Short → \`${idea.queryAcuan.slice(0, 18)}\`, Long → \`${idea.queryAcuan}\`` : 'Targeting kata kunci SEO pencarian TikTok Shop')}
                          </p>
                        </div>

                        {/* ALASAN RELEVANSI */}
                        <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/50 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> ALASAN RELEVANSI
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed">
                            {idea.alasanRelevansi || 'Menyoroti keunggulan & penawaran produk yang paling diminati calon pembeli.'}
                          </p>
                        </div>

                        {/* ATOMIC ANSWER SUMMARY */}
                        <div className="p-3.5 rounded-xl bg-cyan-50/80 border border-cyan-200 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-cyan-900 tracking-wider flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-cyan-600" /> ATOMIC ANSWER SUMMARY (LLM CITATION READY)
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-cyan-950 leading-relaxed">
                            {idea.atomicAnswerSummary || analysisData?.summaryParagraph || idea.title}
                          </p>
                        </div>

                        {/* CONSENSUS TRIGGER */}
                        <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-purple-900 tracking-wider flex items-center gap-1">
                            <Share2 className="w-3.5 h-3.5 text-purple-600" /> CONSENSUS TRIGGER (TIER 2 VALIDATION)
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-purple-950 leading-relaxed">
                            {idea.consensusTrigger || analysisData?.usp || 'Memicu interaksi positif, komentar, dan pembelian lewat keranjang kuning.'}
                          </p>
                        </div>
                      </div>

                      {/* PANDUAN VISUAL & AUDIO */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2 relative">
                        <div className="flex items-center justify-between gap-2 border-b border-indigo-200/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md bg-purple-100 text-purple-700">
                              <Video className="w-4 h-4" />
                            </span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                              PANDUAN VISUAL & AUDIO
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyPanduan(idea)}
                            className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedPanduanId === idea.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-purple-700" />
                            )}
                            <span>Salin Panduan</span>
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium pt-1">
                          {idea.visualAudioGuide || (
                            <>
                              {idea.visualHook && <span><strong>Visual Action:</strong> {idea.visualHook}<br /></span>}
                              {idea.voHook && <span><strong>Voice-Over Tone:</strong> "{idea.voHook}"<br /></span>}
                              {idea.tosHook && <span><strong>Text On Screen:</strong> "{idea.tosHook}"</span>}
                              {!idea.visualHook && !idea.voHook && 'Presenter memperagakan fungsi produk secara lugas dengan lighting terang & ekspresi ramah.'}
                            </>
                          )}
                        </p>
                      </div>

                      {/* RINCIAN ADEGAN VIDEO & PROMPT AI PER SEGMEN (CLIP BREAKDOWN) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-cyan-50/50 border border-cyan-200 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-cyan-200/80">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700 border border-cyan-200">
                              <Scissors className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-cyan-900 uppercase tracking-wider">
                                RINCIAN ADEGAN VIDEO & PROMPT AI PER SEGMEN
                              </h4>
                              <span className="text-[11px] text-slate-600 font-medium">
                                Total {totalDuration}s • {idea.clips.length > 0 ? `${idea.clips.length} Klip Segmen` : `Segmen ${promptSplitSec}s`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                            {onSendToPhotoPrompt && idea.clips.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBatchModalData({
                                    conceptTitle: idea.title,
                                    clips: idea.clips.map(c => ({
                                      id: c.id,
                                      title: c.title,
                                      timeRange: c.timeRange,
                                      actionAndVO: c.actionAndVO,
                                      aiPrompt: c.aiPrompt,
                                    })),
                                  });
                                  setIsBatchPhotoModalOpen(true);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-purple-500/20 active:scale-95 cursor-pointer"
                                title="Pilih rasio aspek dan generate seluruh prompt foto untuk semua klip dalam ide ini sekaligus"
                              >
                                <Camera className="w-3.5 h-3.5 text-purple-200" />
                                <span>📸 Generate Semua Prompt Foto ({idea.clips.length} Klip)</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => copyScenesOnly(idea)}
                              className="px-3 py-1.5 rounded-xl bg-cyan-100 hover:bg-cyan-200 border border-cyan-300 text-cyan-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {copiedScenesId === idea.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-cyan-700" />
                              )}
                              <span>Salin Semua Klip</span>
                            </button>
                          </div>
                        </div>

                        {/* PER-CLIP CARDS GRID */}
                        {idea.clips.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3.5 pt-1">
                            {idea.clips.map((clip) => {
                              const clipKey = `${idea.id}_${clip.id}`;
                              const isCopied = copiedClipKey === clipKey;

                              return (
                                <div
                                  key={clip.id}
                                  className="p-3.5 sm:p-4 rounded-xl bg-white border border-cyan-200/80 hover:border-cyan-400 transition-all space-y-3 shadow-2xs"
                                >
                                  {/* CLIP CARD HEADER */}
                                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 font-mono font-bold text-[11px] border border-cyan-200">
                                        [{clip.timeRange}]
                                      </span>
                                      <span className="text-xs font-bold text-slate-900">
                                        {clip.title}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {onSendToVideoPrompt && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onSendToVideoPrompt(`[${clip.timeRange}] ${clip.aiPrompt || clip.actionAndVO}`);
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                          title="Kirim prompt klip ini ke Generator Prompt Video"
                                        >
                                          <Video className="w-3 h-3 text-indigo-600" />
                                          <span>Ke Prompt Video</span>
                                        </button>
                                      )}

                                      {onSendToPhotoPrompt && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const promptToPass = `Visual adegan klip TikTok Shop [${clip.timeRange}]: ${clip.aiPrompt || clip.actionAndVO}`;
                                            onSendToPhotoPrompt(promptToPass);
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                          title="Kirim deskripsi visual klip ini ke Generator Prompt Foto"
                                        >
                                          <Camera className="w-3 h-3 text-purple-600" />
                                          <span>Ke Prompt Foto</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => copyClipOnly(idea.id, clip)}
                                        className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                        title="Salin prompt klip ini siap paste ke AI Video"
                                      >
                                        {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                                        <span>{isCopied ? 'Tersalin' : 'Salin Prompt Klip'}</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* PROMPT AI VIDEO SIAP SALIN (UTAMA) */}
                                  {clip.aiPrompt ? (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] uppercase font-bold text-cyan-800 flex items-center gap-1.5 tracking-wider">
                                          <Film className="w-3.5 h-3.5 text-cyan-600" /> PROMPT AI VIDEO SIAP SALIN ({clip.timeRange}):
                                        </span>
                                      </div>
                                      <div className="p-3.5 rounded-xl bg-slate-900 text-cyan-300 font-mono text-[11px] sm:text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed relative border border-slate-800 selection:bg-cyan-900 selection:text-white shadow-inner">
                                        {clip.aiPrompt}
                                      </div>
                                    </div>
                                  ) : clip.actionAndVO ? (
                                    <div className="text-xs space-y-1">
                                      <span className="text-[10px] uppercase font-bold text-amber-700 flex items-center gap-1 tracking-wider">
                                        <MessageSquare className="w-3 h-3 text-amber-600" /> AKSI & DIALOG / VOICE-OVER:
                                      </span>
                                      <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 text-slate-800 font-medium text-xs leading-relaxed">
                                        {clip.actionAndVO}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-cyan-200 space-y-2 text-xs font-mono whitespace-pre-wrap text-slate-800">
                            {idea.scenePrompts}
                          </div>
                        )}
                      </div>

                      {/* CAPTION RELEVAN PERSUASIF */}
                      {idea.caption && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-md bg-emerald-100 text-emerald-700">
                                <MessageSquare className="w-4 h-4" />
                              </span>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                                CAPTION RELEVAN PERSUASIF
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyCaption(idea)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {copiedCaptionId === idea.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-emerald-700" />
                              )}
                              <span>Salin Caption</span>
                            </button>
                          </div>
                          <div className="p-3 sm:p-4 rounded-xl bg-white border border-emerald-200 text-xs sm:text-sm text-slate-800 font-mono leading-relaxed whitespace-pre-wrap">
                            {idea.caption}
                          </div>
                        </div>
                      )}

                      {/* HASHTAG RELEVAN HIGH-TRAFFIC */}
                      {idea.hashtags && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2">
                          <div className="flex items-center justify-between gap-2 border-b border-indigo-200/80 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-md bg-indigo-100 text-indigo-700">
                                <Hash className="w-4 h-4" />
                              </span>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                                HASHTAG RELEVAN HIGH-TRAFFIC
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyHashtags(idea)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 text-indigo-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {copiedHashtagId === idea.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-indigo-700" />
                              )}
                              <span>Salin Hashtag</span>
                            </button>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-indigo-200 text-xs sm:text-sm font-bold text-[#5b50e5] font-mono leading-relaxed">
                            {idea.hashtags}
                          </div>
                        </div>
                      )}

                      {/* BOTTOM FOOTER ACTION BAR */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => downloadIdeaAsTxt(idea)}
                          className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-600" />
                          <span>Simpan Ide #{idea.id} sebagai file .txt</span>
                        </button>

                        {onSendToPhotoPrompt && (
                          <button
                            type="button"
                            onClick={() => onSendToPhotoPrompt(`Foto Thumbnail TikTok Shop untuk ide: ${idea.title}. Visual: ${idea.visualHook || idea.title}`)}
                            className="text-[#5b50e5] hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer self-end sm:self-auto"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Buat Prompt Foto Thumbnail dari Ide Ini →</span>
                          </button>
                        )}
                      </div>

                    </motion.div>
                  ))
                ) : (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                    {resultText}
                  </div>
                )}
              </div>
            )}

          </AnimatePresence>

        </div>
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
