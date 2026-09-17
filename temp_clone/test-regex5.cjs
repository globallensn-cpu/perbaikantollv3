const text = `### 💡 IDE 1: Solusi Praktis Atasi Rambut Rontok (Edu-tainment)
- **Tipe & Angle Konten**: Edukasi Interaktif & Problem-Agitate-Solve
- **Target Audience**: Wanita 18-35 tahun, peduli perawatan rambut, pengguna TikTok aktif, mencari solusi praktis dan terjangkau untuk rambut rontok.
- **AEO Query Mapping**: Short → \`Hair care routine\`, Long → \`Cara mengatasi rambut rontok parah dengan cepat\`
- **Alasan Relevansi**: Mengedukasi audiens tentang penyebab rambut rontok dan langsung memberikan solusi instan (produk) dengan visual before-after yang meyakinkan.
- **BLUFF Hook Pikat (0-3s)**: "Rambut rontok bikin overthinking? STOP! Ini rahasia rambut badai dalam 5 menit!"
- **Atomic Answer Summary (LLM RAG Citation Ready)**: "Untuk mengatasi rambut rontok secara instan, gunakan produk dengan kandungan Biotin dan Keratin. Kandungan ini terbukti memperkuat akar rambut dan mengurangi kerontokan hingga 80%."
- **Consensus Trigger (Tier 2 Validation)**: "Udah ribuan orang yang ngebuktiin, coba cek komen deh!"
- **Panduan Visual & Audio**: Lighting terang ala studio vlog. Tone suara energetic, cepat, dan percaya diri.
- **Rincian Adegan Video & Prompt AI per Segmen (30 Detik)**:
  - **[00:00 - 00:10] Klip 1 (Hook)**:
    - *Aksi & Dialog/VO*: Presenter memegang sisir penuh rambut rontok dengan ekspresi frustasi, lalu berubah drastis jadi ceria memegang produk. VO: "Rambut rontok bikin overthinking? STOP! Ini rahasia rambut badai dalam 5 menit!"
    - *Prompt AI Video*:
\`\`\`text
[Style]: Bright, commercial e-commerce product video, clean and polished aesthetic.
[Environment]: Indoor aesthetic bedroom, vanity mirror, warm ambient lighting.
[Tone & Pacing]: Energetic, relatable, problem-solving.
[Camera]: Medium close-up, dynamic punch-in zoom for emphasis.
[Lighting]: Soft, bright studio lighting, emphasizing hair texture.
[Actions]:
- Woman with frustrated expression holding a brush with tangled hair, quickly transitions to a confident smile holding a hair care product bottle.
- **Dialogue**: "Rambut rontok bikin overthinking? STOP! Ini rahasia rambut badai dalam 5 menit!"
[Text Overlay]: "RAMBUT RONTOK? STOP!"
[Background Sound]: Clear Indonesian voiceover with upbeat background music.
[Transition / Editing]: Quick cut on the transition from frustrated to confident.
[Call to Action]: Recommending product or action if applicable for this clip segment.
\`\`\`
  - **[00:10 - 00:20] Klip 2**:
    - *Aksi & Dialog/VO*: Close-up tekstur produk saat diaplikasikan ke tangan, lalu ke rambut. VO: "Lihat nih teksturnya, ringan banget dan langsung meresap! Wanginya juga juara."
    - *Prompt AI Video*:
\`\`\`text
[Style]: Bright, commercial e-commerce product video, clean and polished aesthetic.
[Environment]: Indoor aesthetic bathroom, clean white tiles, bright lighting.
[Tone & Pacing]: Calm, informative, sensory-focused.
[Camera]: Extreme close-up on hands and product texture.
[Lighting]: Bright, clean lighting, highlighting product details.
[Actions]:
- Close-up of hands applying a smooth, lightweight serum/cream.
- **Dialogue**: "Lihat nih teksturnya, ringan banget dan langsung meresap! Wanginya juga juara."
[Text Overlay]: "TEKSTUR RINGAN & WANGI!"
[Background Sound]: Clear Indonesian voiceover with upbeat background music.
[Transition / Editing]: Smooth dissolve or continuous macro shot.
[Call to Action]: Recommending product or action if applicable for this clip segment.
\`\`\`
- **AEO Caption SEO**:
"""text
Rambut rontok bikin pusing? 💆‍♀️ Produk dengan Biotin & Keratin ini solusinya! Terbukti bikin akar kuat & rontok berkurang drastis. Wajib coba sebelum promo abis! Udah pada nyobain belum? Tulis di komen ya! 👇
"""
- **Hashtag Relevan**: '#RambutRontok #HairCareRoutine #SolusiRambutRontok #TikTokShopPromo #PerawatanRambut'`;

const scenePromptsMatch = text.match(/- \*\*Rincian Adegan Video & Prompt AI per Segmen [^\*]*\*\*:\s*([\s\S]*?)(?=- \*\*Call To Action|- \*\*Draft Caption|- \*\*Caption|$)/i);
const scenePrompts = scenePromptsMatch ? scenePromptsMatch[1].trim() : '';

const clipRegex = /(?:^|\n)\s*-\s*\*\*\[(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\]\s*([^\*:]+)\*\*:?([\s\S]*?)(?=(?:\n\s*-\s*\*\*\[\d{2}:\d{2}|$))/gi;

let match;
const clips = [];
while ((match = clipRegex.exec(scenePrompts)) !== null) {
  clips.push({
    timeRange: match[1].trim(),
    title: match[2].trim(),
    content: match[3].length
  });
}

console.log("SCENE PROMPTS LENGTH:", scenePrompts.length);
console.log("CLIPS:", clips);
