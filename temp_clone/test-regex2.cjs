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
while ((match = clipRegex.exec(text)) !== null) {
  console.log("MATCH 1", match[1]);
  console.log("MATCH 2", match[2]);
  console.log("MATCH 3", match[3]);
}
