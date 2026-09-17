const text = `
- **Rincian Adegan Video & Prompt AI per Segmen (10 Detik)**:
  - **[00:00 - 00:05] Klip 1 (Hook)**:
    - *Aksi & Dialog/VO*: Presenter tersenyum ramah.
    - *Prompt AI Video*:
\`\`\`text
[Style]: Bright
\`\`\`
  - **[00:05 - 00:10] Klip 2**:
    - *Aksi & Dialog/VO*: Presenter menampilkan detail produk.
    - *Prompt AI Video*:
\`\`\`text
[Style]: Clean
\`\`\`
- **AEO Caption SEO**:
  Ini captionnya
- **Hashtag Relevan**: #fyp
`;
const clipRegex = /(?:^|\n)\s*-\s*\*\*\[(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\]\s*([^\*:]+)\*\*:?([\s\S]*?)(?=(?:\n\s*-\s*\*\*\[\d{2}:\d{2}|$))/gi;

let match;
const clips = [];
while ((match = clipRegex.exec(text)) !== null) {
  const contentBlock = match[3].trim();
  console.log("CONTENT BLOCK:\n", contentBlock);

  // Extract Aksi & Dialog/VO
  let actionAndVO = '';
  const actMatch = contentBlock.match(/(?:\*Aksi & Dialog\/VO\*|\*Aksi & VO\*|\*Aksi\*):\s*([\s\S]*?)(?=(?:\n\s*-\s*\*Prompt AI Video\*|\n\s*-\s*\*Prompt|```|\[Style\]:|$))/i);
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
    const fallbackMatch = contentBlock.match(/(?:\*Prompt AI Video\*|\*Prompt\*):\s*([\s\S]*?)$/i);
    if (fallbackMatch) aiPrompt = fallbackMatch[1].trim();
  }
  
  clips.push({ actionAndVO, aiPrompt });
}
console.log(clips);
