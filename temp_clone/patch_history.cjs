const fs = require('fs');
let code = fs.readFileSync('src/lib/history.ts', 'utf8');

const syncFunction = `
export const syncHistoryAsync = async (userCode?: string): Promise<void> => {
  const session = getUserSession();
  const code = (userCode || session?.code || '').trim().toUpperCase();
  if (!code || code === 'GUEST') return;
  try {
    const res = await fetch(\`/api/history?accessCode=\${code}\`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const key = getHistoryStorageKey(code);
        localStorage.setItem(key, JSON.stringify(data.slice(0, MAX_HISTORY_ITEMS)));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('satset_history_updated', { detail: { accessCode: code } }));
        }
      }
    }
  } catch (e) {
    console.warn('Failed to sync history from server', e);
  }
};
`;

if (!code.includes('syncHistoryAsync')) {
  code = code.replace("export const getHistoryCount", syncFunction + "\nexport const getHistoryCount");
  
  // Patch saveHistoryItem
  code = code.replace("return newItem;\n  } catch (error)", `
    // Sync to backend
    if (activeCode !== 'GUEST') {
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      }).catch(e => console.warn('Failed to save history to backend', e));
    }
    return newItem;
  } catch (error)`);
  
  // Patch deleteHistoryItem
  code = code.replace("return updated;\n  } catch (error)", `
    if (userCode && userCode !== 'GUEST') {
      fetch(\`/api/history/\${id}\`, { method: 'DELETE' }).catch(e => console.warn('Failed to delete history on backend', e));
    } else {
       const session = getUserSession();
       const code = session?.code;
       if (code && code !== 'GUEST') {
          fetch(\`/api/history/\${id}\`, { method: 'DELETE' }).catch(e => console.warn('Failed to delete history on backend', e));
       }
    }
    return updated;
  } catch (error)`);

  fs.writeFileSync('src/lib/history.ts', code);
  console.log('Patched history.ts successfully');
}
