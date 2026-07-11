/**
 * GET /api/stats?zip=<zip>  ·  GET /api/stats?ref=<slug>
 * Contadores del give-get (§fix #3). Vercel Function · cero dependencias.
 *
 * - CORS restringido, mismo criterio que /api/submit y /api/event.
 * - Lee de KV los contadores que /api/submit incrementa en el submit FINAL:
 *     stats:zip:<zip>   → cuántos vecinos del ZIP completaron
 *     stats:ref:<slug>  → cuántos entraron por ese enlace de referido
 * - Sin KV configurado (o clave inexistente): { count: 0 } SIN campo `n` →
 *   el front (fetchStat lee `j.n`) degrada al copy sin número, no rompe.
 * - Con KV: responde { n: <number>, count: <number> } (el front usa `n`).
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
  if (!origin) return true; // same-origin / server-to-server: sin header Origin
  if (STATIC_ORIGINS.includes(origin)) return true;
  if (EXTRA_ORIGINS.includes(origin)) return true;
  if (PREVIEW_RE.test(origin)) return true;
  if (process.env.NODE_ENV !== 'production' && LOCAL_RE.test(origin)) return true;
  return false;
}

/* ── validación de entrada (misma forma que submit/event) ── */
const RX_ZIP = /^\d{5}$/;
const RX_REF = /^[\w.\-]{1,60}$/;

async function kvGet(key) {
  if (!KV_ON) return null;
  try {
    const r = await fetch(KV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', String(key)]),
      signal: AbortSignal.timeout(2500)
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j && Object.prototype.hasOwnProperty.call(j, 'result') ? j.result : null;
  } catch {
    return null; // KV caído → degradar sin romper
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  const corsOk = originAllowed(origin);
  if (origin && corsOk) {
    res.setHeader('Access-Control-Allow-Origin', origin); // NUNCA '*'
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(corsOk ? 204 : 403).end();
  if (!corsOk) return res.status(403).json({ error: 'forbidden' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  // parámetros (query object de Vercel; fallback a parseo del URL)
  let q = req.query;
  if (!q || typeof q !== 'object') {
    try { q = Object.fromEntries(new URL(req.url, 'http://x').searchParams); } catch { q = {}; }
  }
  const pick = v => Array.isArray(v) ? v[0] : v;
  const zip = typeof pick(q.zip) === 'string' ? pick(q.zip).trim() : '';
  const ref = typeof pick(q.ref) === 'string' ? pick(q.ref).trim() : '';

  let key = null;
  if (zip && RX_ZIP.test(zip)) key = `stats:zip:${zip}`;
  else if (ref && RX_REF.test(ref)) key = `stats:ref:${ref}`;

  // sin KV o sin clave válida → {count:0} (el front degrada al copy sin número)
  if (!KV_ON || !key) return res.status(200).json({ count: 0 });

  const raw = await kvGet(key);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return res.status(200).json({ count: 0 });

  const count = Math.min(Math.round(n), 1e9);
  return res.status(200).json({ n: count, count });
}
