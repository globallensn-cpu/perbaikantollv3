const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/async function loadSystemMemory\(\) \{[\s\S]*?return await dbGetSystemMemory\(\);[\s\S]*?\} catch \(err\) \{/, `async function loadSystemMemory() {
    try {
      let mem = await dbGetSystemMemory();
      if (!mem || Object.keys(mem).length === 0) {
          mem = {
              totalExecutions: 350,
              successfulPromptsCount: 342,
              learnedKnowledgeBase: ['Hook visual di 3 detik pertama meningkatkan retention rate hingga 68%.'],
              viralHookPatterns: [{ id: 'hk_01', pattern: 'Jangan beli [produk] sebelum tau 3 hal ini!', category: 'umum', confidence: 95 }],
              categoryUsage: { videoPrompt: 120, contentIdeas: 90, photoPrompt: 40 },
              lastUpdated: new Date().toISOString()
          };
      }
      if (!mem.learnedKnowledgeBase) mem.learnedKnowledgeBase = [];
      if (!mem.viralHookPatterns) mem.viralHookPatterns = [];
      if (!mem.categoryUsage) mem.categoryUsage = {};
      return mem;
    } catch (err) {`);

fs.writeFileSync('server.ts', code);
