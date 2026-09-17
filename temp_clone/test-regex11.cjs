const text = `
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

const clipRegex = /(?:^|\n)\s*(?:-\s*)?(?:\*\*)?\[(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})\](?:\*\*)?\s*(?:-?\s*)(?:\*\*)?([^\*:\n]+)(?:\*\*)?:?([\s\S]*?)(?=(?:\n\s*(?:-\s*)?(?:\*\*)?\[\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\]|\n\s*-\s*\*\*AEO|\n\s*-\s*\*\*Call|\n\s*-\s*\*\*Draft|\n\s*-\s*\*\*Caption|\n\s*-\s*\*\*Hashtag|\n\s*-\s*\*\*Rekomendasi|$))/gi;

let match;
const clips = [];
while ((match = clipRegex.exec(text)) !== null) {
  clips.push({
    time: match[1],
    title: match[2].trim(),
    content: match[3].trim()
  });
}
console.log(clips);
