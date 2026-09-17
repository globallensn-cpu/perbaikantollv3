const text = `
- [00:00 - 00:10] Klip 1 (Hook):
  - *Aksi & Dialog/VO*: Presenter tersenyum.
  - *Prompt AI Video*:
\`\`\`text
[Style]: Bright
\`\`\`
**[00:10 - 00:20]** Klip 2:
  - *Aksi & Dialog/VO*: Detail produk.
  - *Prompt AI Video*:
\`\`\`text
[Style]: Clean
\`\`\`
`;

const clipRegex = /(?:^|\n)\s*(?:-\s*)?(?:\*\*)?\[(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})\](?:\*\*)?\s*(?:-?\s*)(?:\*\*)?([^\*:\n]+)(?:\*\*)?:?([\s\S]*?)(?=(?:\n\s*(?:-\s*)?(?:\*\*)?\[\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\]|$))/gi;

let match;
while ((match = clipRegex.exec(text)) !== null) {
  console.log("MATCH 1:", match[1]);
  console.log("MATCH 2:", match[2]);
  console.log("MATCH 3 length:", match[3].length);
}
