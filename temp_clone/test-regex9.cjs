const text = `
- **Rincian Adegan Video & Prompt AI per Segmen (10 Detik)**:
  - **[00:00 - 00:05] Klip 1 (Hook)**:
    - *Aksi & Dialog/VO*: Presenter tes.
    - *Prompt AI Video*:
\`\`\`text
[Style]: Bright
\`\`\`
- **Call To Action (CTA)**:
  "Beli sekarang"
- **Rekomendasi Audio & Visual Style**:
`;

const scenePromptsMatch = text.match(/- \*\*Rincian Adegan Video & Prompt AI per Segmen [^\*]*\*\*:\s*([\s\S]*?)(?=- \*\*Call To Action|- \*\*Draft Caption|- \*\*Caption|$)/i);
console.log("MATCH:", scenePromptsMatch ? "YES" : "NO");
if (scenePromptsMatch) {
  console.log("SCENE PROMPTS:\n", scenePromptsMatch[1].trim());
}
