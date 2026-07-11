/**
 * POST /api/event — telemetría liviana del embudo (cuestionario v2).
 * Payload: { session_id, ev|event, form?|role?, step?, lang?, ref?, utm? }
 * - Acepta application/json y text/plain (sendBeacon).
 * - Si hay KV (KV_REST_API_URL + KV_REST_API_TOKEN): contadores agregados por día,
 *   sin PII. Sin KV: console.log estructurado '[funnel]' (visible en logs de Vercel).
 * - Responde 204 SIEMPRE que sea posible: la telemetría jamás rompe la UX.
 */

const KV_URL = process.env.KV_REST_API_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || '';
const KV_ON = Boolean(KV_URL && KV_TOKEN);

/* ── CORS (mismo criterio que /api/submit) ── */
const STATIC_ORIGINS = ['https://investigacion.maclorianxgroup.com'];
const PREVIEW_RE = /^https:\/\/project-6lklw-[a-z0-9-]+(-migueljkrs-projects)?\.vercel\.app$/;
const LOCAL_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const EXTRA_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

function originAllowed(origin) {
  if (!origin) return true;
  if (STATIC_ORIGINS.includes(origin)) return true;
  if (EXTRA_ORIGINS.includes(origin)) return true;
  if (PREVIEW_RE.test(origin)) return true;
  if (process.env.NODE_ENV !== 'production' && LOCAL_RE.test(origin)) return true;
  return false;
}

/* ── allowlists ── */
const EVENTS = [
  'view', 'start',
  'step_1', 'step_2', 'step_3', 'step_4', 'step_5', 'step_6', 'step_7', 'step_8',
  'submit_partial', 'submit', 'screened_out',
  'share_click', 'share_click_copy', 'share_click_wa', 'share_click_native'
];
const ROLES = ['provider', 'homeowner'];
const RX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RX_REF = /^[\w.\-]{1,60}$/;

/* ── rate limit best-effort en memoria: 120/IP/10min ── */
const memRl = new Map();
function rateLimited(ip) {
  const now = Date.now();
  if (memRl.size > 5000) {
    for (const [k, v] of memRl) if (v.reset < now) memRl.delete(k);
  }
  const cur = memRl.get(ip);
  if (!cur || cur.reset < now) {
    memRl.set(ip, { n: 1, reset: now + 600000 });
    return false;
  }
  cur.n += 1;
  return cur.n > 120;
}

async function kvPipeline(cmds) {
  try {
    const r = await fetch(`${KV_URL}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmds.map(c => c.map(String))),
      signal: AbortSignal.timeout(2000)
    });
    return r.ok;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  const corsOk = originAllowed(origin);
  if (origin && corsOk) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') return res.status(corsOk ? 204 : 403).end();
  if (!corsOk) return res.status(403).end();
  if (req.method !== 'POST') return res.status(204).end();

  try {
    const xf = req.headers['x-forwarded-for'];
    const ip = (typeof xf === 'string' && xf ? xf.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown').slice(0, 45);
    if (rateLimited(ip)) return res.status(204).end();

    // body: JSON u objeto ya parseado; sendBeacon manda text/plain
    let body = req.body;
    if (Buffer.isBuffer(body)) body = body.toString('utf8');
    if (typeof body === 'string') {
      if (body.length > 4096) return res.status(204).end();
      try { body = JSON.parse(body); } catch { return res.status(204).end(); }
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(204).end();

    // validación (silenciosa: lo inválido se descarta, siempre 204)
    const ev = typeof body.ev === 'string' ? body.ev : body.event;
    if (typeof ev !== 'string' || !EVENTS.includes(ev)) return res.status(204).end();

    let role = typeof body.form === 'string' ? body.form : body.role;
    if (role === 'client' || role === 'cliente') role = 'homeowner';
    if (role === 'proveedor') role = 'provider';
    if (!ROLES.includes(role)) role = '-';

    const lang = body.lang === 'en' ? 'en' : (body.lang === 'es' ? 'es' : '-');
    let step = Number(body.step);
    step = Number.isFinite(step) ? Math.max(1, Math.min(8, Math.round(step))) : null;
    const sid = typeof body.session_id === 'string' && RX_UUID.test(body.session_id.trim())
      ? body.session_id.trim() : null;
    const ref = typeof body.ref === 'string' && RX_REF.test(body.ref) ? body.ref : null;

    if (KV_ON) {
      const day = new Date().toISOString().slice(0, 10);
      const ttl = 90 * 86400;
      const k1 = `evt:${day}:${ev}:${role}`;
      const k2 = `evt:${day}:${ev}:${role}:${lang}`;
      await kvPipeline([
        ['INCR', k1], ['EXPIRE', k1, ttl],
        ['INCR', k2], ['EXPIRE', k2, ttl]
      ]);
    } else {
      // log estructurado: suficiente para diagnosticar el embudo en logs de Vercel
      console.log('[funnel]', JSON.stringify({
        t: new Date().toISOString(),
        ev, role, lang,
        ...(step !== null ? { step } : {}),
        ...(sid ? { sid } : {}),
        ...(ref ? { ref } : {})
      }));
    }
  } catch (err) {
    console.error('[event] error:', err && err.message);
  }
  return res.status(204).end();
}
