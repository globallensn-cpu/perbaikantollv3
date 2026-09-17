import React, { useState } from 'react';
import { Copy, Check, Sparkles, Layers, FileText, ChevronDown, ChevronUp, Share2, Clapperboard, Camera, Hash, MessageSquareText, Flame, CheckCheck, TrendingUp } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { learningSync } from '../../../lib/learningSync';
import BatchPhotoPromptModal from '../../modals/BatchPhotoPromptModal';

interface SplitPromptViewerProps {
  rawPrompt: string;
  segmentDuration: string;
  targetAI: string;
  sourceCaption?: string;
  onSendToPhotoPrompt?: (
    text: string,
    options?: {
      autoGenerate?: boolean;
      aspectRatio?: string;
      photoStyle?: string;
      targetGenerator?: string;
      negativePrompt?: string;
    }
  ) => void;
}

export interface ClipSegment {
  id: number;
  title: string;
  timestamp: string;
  masterPrompt: string;
  content: string;
}

export interface SeoCaptionInfo {
  caption: string;
  hashtags: string;
}

export function parseSeoCaptionAndHashtags(rawText: string): SeoCaptionInfo | null {
  if (!rawText) return null;

  // Check for caption & hashtag section
  const sectionMatch = rawText.match(/(?:###|\*\*)\s*(?:📱|🔥|✨)?\s*CAPTION\s*(?:&|DAN)?\s*HASHTAG[\s\S]*$/i);
  const targetText = sectionMatch ? sectionMatch[0] : rawText;

  // Match Caption
  const captionMatch = targetText.match(/\*\*Caption[^\n]*\*\*[:\s]*\n*([\s\S]*?)(?=\n*\*\*(?:Hashtags?|Tag|Hashtag Viral)|$)/i)
    || targetText.match(/(?:Caption SEO|Caption FYP|Caption)[:\s]*\n*([\s\S]*?)(?=\n*(?:#|Hashtag|\*\*Hashtag)|$)/i);

  // Match Hashtags
  const hashtagsMatch = targetText.match(/\*\*Hashtags?[^\n]*\*\*[:\s]*\n*([\s\S]*?)(?=\n*---|\n*###|$)/i)
    || targetText.match(/(?:Hashtags?|Hashtag Viral|Tags?)[:\s]*\n*([\s\S]*?)(?=\n*---|\n*###|$)/i)
    || targetText.match(/((?:#[\w\u0590-\u05ff\u0600-\u06ff\u0e00-\u0e7f_]+\s*){2,})/i);

  let caption = captionMatch ? captionMatch[1].trim() : '';
  let hashtags = hashtagsMatch ? hashtagsMatch[1].trim() : '';

  // Clean markdown quotes or backticks if any
  caption = caption.replace(/^>+\s*/gm, '').replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  hashtags = hashtags.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

  // If hashtags was captured in caption, split them cleanly
  if (!hashtags && caption.includes('#')) {
    const hashIdx = caption.indexOf('#');
    hashtags = caption.slice(hashIdx).trim();
    caption = caption.slice(0, hashIdx).trim();
  }

  // Clean spam phrasing from caption
  if (caption) {
    caption = caption
      .replace(/\b(racun\s*tik\s*tok|racun\s*tiktok)\b/gi, 'rekomendasi produk pilihan')
      .replace(/\b(for\s*your\s*page|f\s*y\s*p|fyp)\b/gi, 'pencarian sosial media')
      .replace(/\b(viral\s*di\s*tiktok|viral\s*tiktok)\b/gi, 'banyak dicari');
  }

  // Ensure maximum 5 hashtags strictly & filter generic spam tags
  if (hashtags) {
    const tagList = hashtags.match(/#[\w\u0590-\u05ff\u0600-\u06ff\u0e00-\u0e7f_]+/g);
    if (tagList) {
      const BANNED_SPAM = new Set(['fyp', 'fypシ', 'fypviral', 'foryou', 'foryoupage', 'racuntiktok', 'racuntiktokshop', 'viral', 'viralvideo', 'trending', 'beranda', 'fyppage', 'foryourpage']);
      const filtered = tagList.filter(t => !BANNED_SPAM.has(t.replace('#', '').toLowerCase()));
      const finalTags = (filtered.length > 0 ? filtered : tagList).slice(0, 5);
      hashtags = finalTags.join(' ');
    }
  }

  if (caption || hashtags) {
    return {
      caption,
      hashtags,
    };
  }

  return null;
}

export function parseClipSegments(rawText: string): ClipSegment[] {
  if (!rawText) return [];

  // Buang bagian caption/hashtag di akhir jika ada
  const clipsPart = rawText.split(/(?:###|\*\*)\s*(?:📱|🔥|✨)?\s*CAPTION\s*(?:&|DAN)?\s*HASHTAG/i)[0];

  const segments: ClipSegment[] = [];

  // Format baru: "0–2 detik" atau "0-2 detik" atau "0 – 2 detik"
  const timelineRegex = /(?:^|\n)\s*(\d+(?:[.,]\d+)?)\s*[–\-—]\s*(\d+(?:[.,]\d+)?)\s*(?:detik|s|sec)?\s*\n([\s\S]*?)(?=(?:\n\s*\d+(?:[.,]\d+)?\s*[–\-—]\s*\d+(?:[.,]\d+)?\s*(?:detik|s|sec)?)|$)/gi;

  let match;
  let count = 0;

  while ((match = timelineRegex.exec(clipsPart)) !== null) {
    count++;
    const start = match[1].replace(',', '.');
    const end = match[2].replace(',', '.');
    const body = match[3].trim();

    // Ambil Visual, Aksi, voice over / Subteks
    const visualMatch = body.match(/Visual\s*:\s*([\s\S]*?)(?=\n\s*Aksi\s*:|$)/i);
    const aksiMatch = body.match(/Aksi\s*:\s*([\s\S]*?)(?=\n\s*(?:voice\s*over|voiceover|vo|subteks)\s*:|$)/i);
    const thirdFieldMatch = body.match(/(?:voice\s*over|voiceover|vo|subteks)\s*:\s*([\s\S]*?)$/i);

    const visual = visualMatch ? visualMatch[1].trim() : '';
    const aksi = aksiMatch ? aksiMatch[1].trim() : '';
    const thirdFieldText = thirdFieldMatch ? thirdFieldMatch[1].trim() : '';
    const thirdFieldLabel = thirdFieldMatch && /voice/i.test(thirdFieldMatch[0]) ? 'voice over' : 'Subteks';

    // Gabungkan jadi masterPrompt yang rapi
    const masterPrompt = [
      visual ? `Visual: ${visual}` : '',
      aksi ? `Aksi: ${aksi}` : '',
      thirdFieldText ? `${thirdFieldLabel}: ${thirdFieldText}` : ''
    ].filter(Boolean).join('\n\n');

    segments.push({
      id: count,
      title: `Klip ${count}`,
      timestamp: `${start}–${end} detik`,
      masterPrompt: masterPrompt || body,
      content: body,
    });
  }

  // Fallback: jika format baru tidak ketemu, pakai parser lama (KLIP / SEGMEN)
  if (segments.length === 0) {
    const headerSplitter = /(?=(?:^|\n)#{2,4}\s*(?:🎬|🎥|📹)?\s*(?:KLIP|SEGMEN|CLIP|PART|\d+\.)\b)/gi;
    const blocks = clipsPart.split(headerSplitter);

    for (const block of blocks) {
      if (!block.trim()) continue;
      const headerMatch = block.match(/(?:^|\n)#{2,4}\s*(?:🎬|🎥|📹)?\s*(?:KLIP|SEGMEN|CLIP|PART|\d+\.)\s*([^\n]+)/i);
      if (headerMatch) {
        count++;
        const fullHeader = headerMatch[1].trim();
        let timestamp = '';
        const timeMatch = fullHeader.match(/\(Timestamp:?\s*([^\)]+)\)/i) || block.match(/Timestamp:?\s*([0-9:\s\-]+)/i) || fullHeader.match(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/);
        timestamp = timeMatch ? timeMatch[1].trim() : `Segmen ${count}`;

        let masterPrompt = '';
        const codeBlockMatch = block.match(/```(?:text|prompt)?\n([\s\S]*?)\n```/i);
        if (codeBlockMatch) {
          masterPrompt = codeBlockMatch[1].trim();
        } else {
          const promptLineMatch = block.match(/(?:Master Prompt|Prompt AI|Prompt Klip)[^\n]*\n+([\s\S]+?)(?=\n---|#{2,4}|$)/i);
          if (promptLineMatch) masterPrompt = promptLineMatch[1].replace(/```/g, '').trim();
        }

        segments.push({
          id: count,
          title: `Klip ${count}`,
          timestamp,
          masterPrompt: masterPrompt || block.trim(),
          content: block.trim(),
        });
      }
    }
  }

  return segments;
}

export default function SplitPromptViewer({ rawPrompt, segmentDuration, targetAI, sourceCaption, onSendToPhotoPrompt }: SplitPromptViewerProps) {
  const [copiedClipId, setCopiedClipId] = useState<number | null>(null);
  const [copiedAllPrompts, setCopiedAllPrompts] = useState(false);
  const [copiedFullReport, setCopiedFullReport] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [copiedAllCaptionTags, setCopiedAllCaptionTags] = useState(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'raw'>('cards');
  const [expandedClip, setExpandedClip] = useState<number | null>(null);
  const [isBatchPhotoModalOpen, setIsBatchPhotoModalOpen] = useState(false);

  const segments = parseClipSegments(rawPrompt);
  const seoData = parseSeoCaptionAndHashtags(rawPrompt);

  const handleCopyClipPrompt = (segment: ClipSegment) => {
    const textToCopy = segment.masterPrompt || segment.content;
    navigator.clipboard.writeText(textToCopy);
    setCopiedClipId(segment.id);

    learningSync.track('prompt_clip_copied', {
      type: 'video_clip_prompt',
      clipIndex: segment.id,
      promptSnippet: textToCopy.slice(0, 100),
      segmentDuration,
      targetAI,
      text: textToCopy,
    });

    setTimeout(() => setCopiedClipId(null), 2000);
  };

  const handleCopyAllPrompts = () => {
    let textToCopy = rawPrompt;
    if (segments.length === 0) {
      navigator.clipboard.writeText(rawPrompt);
    } else {
      const allPromptsText = segments
        .map((s, idx) => `[KLIP ${idx + 1} (${s.timestamp})]\n${s.masterPrompt}\n`)
        .join('\n---\n\n');
      textToCopy = allPromptsText;
      navigator.clipboard.writeText(allPromptsText);
    }
    setCopiedAllPrompts(true);

    learningSync.track('prompt_copied', {
      type: 'video_clip_prompt_all',
      text: textToCopy,
    });

    setTimeout(() => setCopiedAllPrompts(false), 2000);
  };

  const handleCopyFullReport = () => {
    navigator.clipboard.writeText(rawPrompt);
    setCopiedFullReport(true);

    learningSync.track('prompt_copied', {
      type: 'video_prompt_full_report',
      text: rawPrompt,
    });

    setTimeout(() => setCopiedFullReport(false), 2000);
  };

  const handleCopyCaption = () => {
    if (!seoData?.caption) return;
    navigator.clipboard.writeText(seoData.caption);
    setCopiedCaption(true);
    learningSync.track('seo_caption_copied', {
      type: 'seo_caption_only',
      text: seoData.caption,
      snippet: seoData.caption.slice(0, 100),
    });
    learningSync.track('prompt_copied', {
      type: 'seo_caption_only',
      text: seoData.caption,
    });
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyHashtags = () => {
    if (!seoData?.hashtags) return;
    navigator.clipboard.writeText(seoData.hashtags);
    setCopiedHashtags(true);
    learningSync.track('hashtags_copied', {
      type: 'seo_hashtags_only',
      text: seoData.hashtags,
      snippet: seoData.hashtags.slice(0, 100),
    });
    learningSync.track('prompt_copied', {
      type: 'seo_hashtags_only',
      text: seoData.hashtags,
    });
    setTimeout(() => setCopiedHashtags(false), 2000);
  };

  const handleCopyAllCaptionTags = () => {
    if (!seoData) return;
    const combined = `${seoData.caption}\n\n${seoData.hashtags}`.trim();
    navigator.clipboard.writeText(combined);
    setCopiedAllCaptionTags(true);
    learningSync.track('seo_caption_copied', {
      type: 'seo_caption_and_hashtags_all',
      text: combined,
      snippet: combined.slice(0, 100),
    });
    learningSync.track('prompt_copied', {
      type: 'seo_caption_and_hashtags_all',
      text: combined,
    });
    setTimeout(() => setCopiedAllCaptionTags(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* SEO CAPTION & VIRAL HASHTAGS CARD */}
      {seoData && (seoData.caption || seoData.hashtags) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-indigo-900 via-[#1e1b4b] to-slate-900 text-white p-5 sm:p-6 shadow-md border border-indigo-500/20 relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 space-y-4">
            {/* Header Badge & Action Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-xs">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Caption & Hashtag SEO Viral
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      FYP Boosted
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/80 mt-0.5">
                    {sourceCaption
                      ? 'Ditingkatkan dari caption asli sumber TikTok agar lebih relevan & berbobot SEO tinggi.'
                      : 'Dirumuskan khusus berdasarkan visual & konteks video untuk optimasi algoritma pencarian.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCopyAllCaptionTags}
                  className="px-3.5 py-1.5 rounded-xl bg-[#5b50e5] hover:bg-[#4f46e5] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer border border-indigo-400/30"
                >
                  {copiedAllCaptionTags ? <CheckCheck className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAllCaptionTags ? 'Semua Tersalin!' : 'Salin Caption + Hashtag'}</span>
                </button>
              </div>
            </div>

            {/* Caption Block */}
            {seoData.caption && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquareText className="w-3.5 h-3.5 text-amber-400" />
                    Caption SEO TikTok / Reels / Shorts
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="text-[11px] font-semibold text-indigo-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10"
                  >
                    {copiedCaption ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCaption ? 'Tersalin' : 'Salin Caption'}</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 text-xs sm:text-sm text-slate-100 leading-relaxed font-sans select-all whitespace-pre-wrap">
                  {seoData.caption}
                </div>
              </div>
            )}

            {/* Hashtags Block */}
            {seoData.hashtags && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-purple-400" />
                    Hashtag Relevan & SEO Search (Max 5 Tag)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHashtags}
                    className="text-[11px] font-semibold text-indigo-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10"
                  >
                    {copiedHashtags ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHashtags ? 'Tersalin' : 'Salin Hashtag'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-xs font-mono text-amber-200/90 leading-relaxed select-all">
                  {seoData.hashtags}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5b50e5] shrink-0">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Hasil Split Prompt Video</h3>
              {segments.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {segments.length} Klip Siap Salin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {segmentDuration !== 'auto'
                ? `Dipecah per ${segmentDuration} detik • Target: ${targetAI.toUpperCase()}`
                : `Analisis Penuh Durasi Video • Target: ${targetAI.toUpperCase()}`}
            </p>
          </div>
        </div>

        {/* View Toggle & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {segments.length > 0 && (
            <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium mr-1">
              <button
                type="button"
                onClick={() => setActiveTab('cards')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'cards' ? 'bg-[#5b50e5] text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kartu Klip ({segments.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'raw' ? 'bg-[#5b50e5] text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Teks Utuh</span>
              </button>
            </div>
          )}

          {segments.length > 0 && onSendToPhotoPrompt && (
            <button
              type="button"
              onClick={() => {
                setIsBatchPhotoModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-purple-500/20 active:scale-95 cursor-pointer"
              title="Pilih rasio aspek dan generate otomatis seluruh prompt foto untuk semua klip dalam video ini sekaligus"
            >
              <Camera className="w-3.5 h-3.5 text-purple-200" />
              <span>📸 Generate Semua Prompt Foto ({segments.length} Klip)</span>
            </button>
          )}

          {segments.length > 0 && (
            <button
              type="button"
              onClick={handleCopyAllPrompts}
              className="px-3.5 py-1.5 rounded-xl bg-[#5b50e5] hover:bg-[#4f46e5] text-white font-medium text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {copiedAllPrompts ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAllPrompts ? 'Semua Tersalin!' : `Salin Semua ${segments.length} Prompt`}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyFullReport}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            {copiedFullReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedFullReport ? 'Laporan Tersalin!' : 'Salin Laporan'}</span>
          </button>
        </div>
      </div>

      {/* Content Rendering */}
      {activeTab === 'cards' && segments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {segments.map((segment) => {
            const isExpanded = expandedClip === segment.id;
            return (
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl bg-white border border-slate-200/80 hover:border-[#5b50e5]/50 overflow-hidden transition-all shadow-sm"
              >
                {/* Clip Card Header */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-[#5b50e5] flex items-center justify-center font-bold text-xs shrink-0">
                      #{segment.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">Segmen Prompt Klip {segment.id}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#5b50e5] border border-indigo-100 text-[11px] font-mono font-semibold">
                          {segment.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Dioptimalkan untuk {targetAI.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {onSendToPhotoPrompt && (
                      <button
                        type="button"
                        onClick={() => {
                          const text = segment.masterPrompt || segment.content;
                          learningSync.track('prompt_sent_to_photo', {
                            clipIndex: segment.id,
                            promptSnippet: text.slice(0, 100),
                            segmentDuration,
                            targetAI,
                          });
                          onSendToPhotoPrompt(text);
                        }}
                        className="px-3 py-1.5 rounded-xl font-medium text-xs transition-all flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs cursor-pointer"
                        title="Kirim deskripsi visual klip ini ke Prompt Foto AI Generator"
                      >
                        <Camera className="w-3.5 h-3.5 text-purple-600" />
                        <span>Ke Prompt Foto</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyClipPrompt(segment)}
                      className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                        copiedClipId === segment.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#5b50e5] hover:bg-[#4f46e5] text-white'
                      }`}
                    >
                      {copiedClipId === segment.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedClipId === segment.id ? 'Prompt Klip Tersalin!' : 'Salin Prompt Klip'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedClip(isExpanded ? null : segment.id)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 cursor-pointer"
                      title={isExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian Detail'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Master Prompt Highlights Box */}
                {segment.masterPrompt && (
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#5b50e5] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Master Prompt AI Klip {segment.id} (Siap Copy)
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/80 font-mono text-xs text-slate-800 leading-relaxed select-all">
                      {segment.masterPrompt}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 bg-white border-t border-slate-100 overflow-hidden"
                    >
                      <div className="prose prose-slate max-w-none text-xs leading-relaxed">
                        <Markdown>{segment.content}</Markdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Full Markdown Output */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 relative shadow-sm">
          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed">
            <Markdown>{rawPrompt}</Markdown>
          </div>
        </div>
      )}

      {/* Batch Photo Prompt Modal */}
      {segments.length > 0 && (
        <BatchPhotoPromptModal
          isOpen={isBatchPhotoModalOpen}
          onClose={() => setIsBatchPhotoModalOpen(false)}
          conceptTitle={`Ekstrak Prompt Video Split (${segments.length} Klip Segmen)`}
          clips={segments.map(s => ({
            id: s.id,
            title: s.title,
            timeRange: s.timestamp,
            actionAndVO: s.masterPrompt || s.content,
          }))}
          onConfirm={(opts) => {
            const batchClipsText = `KONSEP EKSTRAK PROMPT VIDEO BATCH PROMPT FOTO (${segments.length} KLIP):\n` +
              segments.map(s => `### [${s.timestamp}] Klip ${s.id}: ${s.title}\nDeskripsi Adegan Visual:\n${s.masterPrompt || s.content}`).join('\n\n---\n\n');

            learningSync.track('prompt_copied', {
              type: 'batch_photo_prompts_send',
              totalClips: segments.length,
              segmentDuration,
              targetAI,
              aspectRatio: opts.aspectRatio,
            });

            if (onSendToPhotoPrompt) {
              onSendToPhotoPrompt(batchClipsText, {
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
