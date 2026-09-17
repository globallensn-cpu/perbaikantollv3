const text = `
### 💡 IDE 1: Unboxing Mewah
- **Tipe & Angle Konten**: Review
- **Rincian Adegan Video & Prompt AI per Segmen (10 Detik)**:
  - **[00:00 - 00:05] Klip 1 (Hook)**:
    - *Aksi & Dialog/VO*: Presenter tersenyum ramah.
    - *Prompt AI Video*:
\`\`\`text
[Style]: Bright
\`\`\`
- **AEO Caption SEO**:
  Ini captionnya
- **Hashtag Relevan**: #fyp
`;

let scenePromptsMatch = text.match(/- \*\*Rincian Adegan Video & Prompt AI per Segmen [^\*]*\*\*:\s*([\s\S]*?)(?=- \*\*Call To Action|- \*\*Draft Caption|- \*\*Caption|$)/i) ||
                            text.match(/- \*\*Breakdown Per Clip [^\*]*\*\*:\s*([\s\S]*?)(?=- \*\*Call To Action|- \*\*Draft Caption|- \*\*Caption|$)/i) ||
                            text.match(/- \*\*Script Outline Singkat\*\*:\s*([\s\S]*?)(?=- \*\*Call To Action|- \*\*Draft Caption|- \*\*Caption|$)/i);

console.log("SCENE PROMPT MATCH 1:", scenePromptsMatch ? scenePromptsMatch[1] : "NOT FOUND");
