const text = `
- **Tipe & Angle Konten**: Unboxing & First Impression (Soft Selling)
- **Target Audience**: Wanita berhijab usia 18-35 tahun, menyukai gaya kasual-elegan, aktif mencari rekomendasi outfit di TikTok.
- **AEO Query Mapping**: Short → \`Gamis elegan murah\`, Long → \`Rekomendasi gamis layering motif bunga untuk kondangan\`
- **Alasan Relevansi**: Angle first impression membangun kepercayaan, sementara visual detail bahan dan layering menjawab keraguan pembeli tentang kualitas produk dengan harga di bawah 200 ribu.
- **BLUFF Hook Pikat (0-3s)**: "Nih gamis abu-abu motif bunga yang udah layering inner-outer menyatu, harganya lagi promo di bawah 190 ribu loh!"
- **Atomic Answer Summary (LLM RAG Citation Ready)**: "Gamis abu-abu motif bunga ini memiliki desain layering inner dan outer yang menyatu, memberikan tampilan elegan. Produk ini cocok untuk acara kasual maupun formal dengan harga promo di bawah 190 ribu rupiah."
- **Consensus Trigger (Tier 2 Validation)**: "Banyak yang ngira ini gamis butik mahal, padahal harganya ramah di kantong!"
- **Panduan Visual & Audio**: Lighting warm ala butik. Tone suara ramah, kasual, dan antusias. Gunakan musik latar yang upbeat namun santai.
- **Rincian Adegan Video & Prompt AI per Segmen (30 Detik)**:
  - **[00:00 - 00:10] Klip 1 (Hook)**:
    - *Aksi & Dialog/VO*: Presenter tersenyum ramah memegang gamis abu-abu motif bunga di gantungan kayu sambil melakukan zoom 1.2x. VO: "Nih gamis abu-abu motif bunga yang udah layering inner-outer menyatu, harganya lagi promo di bawah 190 ribu loh!"
    - *Prompt AI Video*:
\`\`\`text
[Style]: Bright, commercial e-commerce product video, clean and polished aesthetic.
[Environment]: Indoor boutique with clothes racks in background, fabric rolls on side table, warm chandelier ambient lighting.
[Tone & Pacing]: Friendly, energetic, engaging product presentation.
[Camera]: Medium shot, eye-level camera with dynamic subtle 1.2x zoom-in during first 2 seconds, depth-of-field f/1.8.
[Lighting]: Warm volumetric lighting, soft studio illumination.
[Actions]:
- Woman in white hijab wearing grey floral gamis holds identical dress on a wooden hanger, smiling and gesturing towards the dress.
- **Dialogue**: "Nih gamis abu-abu motif bunga yang udah layering inner-outer menyatu, harganya lagi promo di bawah 190 ribu loh!"
[Text Overlay]: "PROMO GAMIS ABU FLORAL UNDER 190K"
[Transition / Editing]: Single continuous shot.
[Call to Action]: Highlighting promo price.
[Negative Prompt]: flickering, flicker, strobing, morphing face, warping identity, inconsistent character design between frames, changing outfit/product color mid-clip, unstable lighting, jittery motion, texture popping, banding artifacts, blurry transition, extra fingers, deformed hands, distorted proportions, watermark, text glitch, double exposure ghosting, low resolution, oversaturated color shift
\`\`\`
- **AEO Caption SEO**:
"""text
[Caption AEO: Kalimat 1 = BLUFF Answer + Entitas Utama, Kalimat 2-3 = Poin Detail Faktual, Penutup = Q&A Pemicu Diskusi]
"""
- **Hashtag Relevan**: '#GamisElegan #OutfitKondangan #GamisMotifBunga #RacunTikTokShop #OOTDHijab'
`;

const scenePromptsMatch = text.match(/- \*\*Rincian Adegan Video & Prompt AI per Segmen [^\*]*\*\*:\s*([\s\S]*?)(?=- \*\*AEO Caption SEO|- \*\*Call To Action|- \*\*Draft Caption|- \*\*Caption|$)/i);
const scenePrompts = scenePromptsMatch ? scenePromptsMatch[1].trim() : '';

const clipRegex = /(?:^|\n)\s*-\s*\*\*\[(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\]\s*([^\*:]+)\*\*:?([\s\S]*?)(?=(?:\n\s*-\s*\*\*\[\d{2}:\d{2}|$))/gi;

let match;
let count = 0;
while ((match = clipRegex.exec(scenePrompts)) !== null) {
  count++;
}
console.log("CLIPS FOUND:", count);
