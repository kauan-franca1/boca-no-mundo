// Redis de mentira (só os comandos que a API usa), para testar localmente o código real de /api.
const db = new Map(); // chave -> {t:'s'|'h'|'set'|'z', v}
const pega = (k, t, novo) => { let e = db.get(k); if (!e && novo) { e = { t, v: t === 'h' || t === 'z' ? new Map() : t === 'set' ? new Set() : '0' }; db.set(k, e); } return e; };
function exec([cmd, ...a]) {
  switch (cmd.toUpperCase()) {
    case 'INCR': { const e = pega(a[0], 's', true); e.v = String(Number(e.v) + 1); return Number(e.v); }
    case 'EXPIRE': return 1;
    case 'HSET': { const e = pega(a[0], 'h', true); let n = 0; for (let i = 1; i < a.length; i += 2) { if (!e.v.has(a[i])) n++; e.v.set(a[i], String(a[i + 1])); } return n; }
    case 'HGETALL': { const e = pega(a[0]); if (!e) return []; return [...e.v].flat(); }
    case 'SADD': { const e = pega(a[0], 'set', true); let n = 0; a.slice(1).forEach(m => { if (!e.v.has(m)) { e.v.add(m); n++; } }); return n; }
    case 'SREM': { const e = pega(a[0]); if (!e) return 0; let n = 0; a.slice(1).forEach(m => { if (e.v.delete(m)) n++; }); return n; }
    case 'SMEMBERS': { const e = pega(a[0]); return e ? [...e.v] : []; }
    case 'SISMEMBER': { const e = pega(a[0]); return e && e.v.has(a[1]) ? 1 : 0; }
    case 'SMOVE': { const s = pega(a[0]); if (!s || !s.v.has(a[2])) return 0; s.v.delete(a[2]); pega(a[1], 'set', true).v.add(a[2]); return 1; }
    case 'ZADD': { const e = pega(a[0], 'z', true); let i = 1, nx = false; if (String(a[1]).toUpperCase() === 'NX') { nx = true; i = 2; } let n = 0; for (; i < a.length; i += 2) { if (nx && e.v.has(a[i + 1])) continue; if (!e.v.has(a[i + 1])) n++; e.v.set(a[i + 1], Number(a[i])); } return n; }
    case 'ZINCRBY': { const e = pega(a[0], 'z', true); const v = (e.v.get(a[2]) || 0) + Number(a[1]); e.v.set(a[2], v); return String(v); }
    case 'ZSCORE': { const e = pega(a[0]); return e && e.v.has(a[1]) ? String(e.v.get(a[1])) : null; }
    case 'ZREM': { const e = pega(a[0]); return e && e.v.delete(a[1]) ? 1 : 0; }
    case 'DEL': { let n = 0; a.forEach(k => { if (db.delete(k)) n++; }); return n; }
    default: throw new Error('comando não suportado no teste: ' + cmd);
  }
}
module.exports = cmds => cmds.map(c => { try { return { result: exec(c) }; } catch (e) { return { error: e.message }; } });
