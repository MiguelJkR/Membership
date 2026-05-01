// Vercel Function: recibe respuestas del cuestionario y crea una pagina en la
// database "Entrevistas de Validacion" (Notion). Infiere automaticamente los
// campos derivados (nivel de dolor, receptividad, proximo paso, etc.).

const NOTION_API_URL = 'https://api.notion.com/v1/pages';
const NOTION_VERSION = '2022-06-28';
const FALLBACK_DATABASE_ID = 'a5de9526-4375-41f4-bc7d-475dc16f0264';

const CATEGORY_MAP = {
  ac_hvac: 'A/C & HVAC',
  pool: 'Pool service',
  lawn: 'Lawn care',
  pest: 'Pest control',
  roof: 'Roof maintenance',
  pressure: 'Pressure washing',
  gutter: 'Gutter cleaning',
  exterior: 'Exterior cleaning',
  hurricane: 'Hurricane prep',
  handyman: 'Handyman',
  generator: 'Generator service',
  tree: 'Tree service',
};

const VALID_CITIES = new Set([
  'Cape Coral', 'Fort Myers', 'Naples', 'Bonita Springs',
  'Estero', 'Lehigh Acres', 'Otro',
]);

const VALID_SOURCES = new Set([
  'Referido', 'NextDoor', 'Facebook Group', 'Walk-in', 'Google Maps', 'Otro',
]);

const PAIN_KEYWORDS = [
  'horrible', 'desesperante', 'terrible', 'imposible', 'frustrante',
  'dificil', 'difícil', 'duro', 'pesadilla', 'odio', 'agotador',
  'estresante', 'caotico', 'caótico', 'insufrible', 'nightmare',
  'awful', 'terrible', 'frustrating', 'impossible', 'hard',
  'stressful', 'exhausting', 'hate', 'painful',
];

function safeText(value, max = 2000) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  return str.length > max ? str.slice(0, max) : str;
}

function richText(value, max = 2000) {
  const content = safeText(value, max);
  if (!content) return [];
  return [{ type: 'text', text: { content } }];
}

function title(value, max = 200) {
  const content = safeText(value, max) || 'Sin nombre';
  return [{ type: 'text', text: { content } }];
}

function selectOpt(value, allowed) {
  const v = safeText(value);
  if (!v) return null;
  if (allowed && !allowed.has(v)) return null;
  return { name: v };
}

function multiSelectOpts(values) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const result = [];
  for (const v of values) {
    const mapped = CATEGORY_MAP[v] || (Object.values(CATEGORY_MAP).includes(v) ? v : null);
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped);
      result.push({ name: mapped });
    }
  }
  return result;
}

function inferPainLevel(payload) {
  let score = 5;
  const dolor = safeText(payload.dolor_principal).toLowerCase();
  for (const kw of PAIN_KEYWORDS) {
    if (dolor.includes(kw)) { score += 1; break; }
  }
  if (dolor.length > 200) score += 1;
  if (dolor.length > 500) score += 1;

  const yesAnswers = [
    payload.problemas_facturacion,
    payload.dificultad_clientes,
    payload.proveedores_confiables,
    payload.olvidos_dano,
  ];
  for (const ans of yesAnswers) {
    const a = safeText(ans).toLowerCase();
    if (a === 'si' || a === 'sí' || a === 'yes' || a.startsWith('mucho') || a.startsWith('a lot')) score += 1;
    if (a === 'no' || a.startsWith('nada') || a.startsWith('none')) score -= 1;
  }

  const molestia = parseInt(payload.molestia_coordinacion, 10);
  if (!Number.isNaN(molestia)) {
    if (molestia >= 8) score += 2;
    else if (molestia >= 5) score += 1;
    else if (molestia <= 2) score -= 1;
  }

  const baja = safeText(payload.baja_temporada).toLowerCase();
  if (baja.includes('mucho') || baja.includes('a lot') || /[4-9]\d?%|\b[4-9]\b/.test(baja)) score += 1;

  return Math.max(1, Math.min(10, score));
}

function inferReceptivity(payload) {
  const r = parseInt(payload.receptividad_membresia, 10);
  if (Number.isNaN(r)) return 5;
  return Math.max(1, Math.min(10, r));
}

function inferDominantCategory(payload) {
  const list = payload.tipo === 'proveedor'
    ? payload.categorias_proveedor
    : payload.categorias_actuales;
  if (!Array.isArray(list) || list.length === 0) return null;
  const mapped = CATEGORY_MAP[list[0]] || list[0];
  return Object.values(CATEGORY_MAP).includes(mapped) ? mapped : null;
}

function inferBundleDisposition(payload) {
  if (payload.tipo === 'proveedor') {
    const ans = safeText(payload.disposicion_bundles).toLowerCase();
    if (ans.startsWith('si') || ans.startsWith('sí') || ans.includes('definit') || ans.startsWith('yes')) return 'Alta';
    if (ans.startsWith('tal vez') || ans.startsWith('quiz') || ans.startsWith('maybe') || ans.includes('depende')) return 'Media';
    if (ans.startsWith('no') || ans.startsWith('nada')) return 'Baja';
    return 'Media';
  }
  const interes = Array.isArray(payload.categorias_interes) ? payload.categorias_interes.length : 0;
  if (interes >= 4) return 'Alta';
  if (interes >= 2) return 'Media';
  if (interes === 1) return 'Baja';
  return 'No aplica';
}

function inferHurricaneInterest(payload) {
  const ans = safeText(payload.interes_hurricane).toLowerCase();
  if (ans.includes('mucho') || ans.includes('alto') || ans.startsWith('si') || ans.startsWith('sí') || ans.includes('very')) return 'Alto';
  if (ans.includes('algo') || ans.includes('medio') || ans.includes('quiz') || ans.includes('some')) return 'Medio';
  if (ans.includes('nada') || ans.includes('bajo') || ans.startsWith('no') || ans.includes('not')) return 'Bajo';
  return 'No aplica';
}

function inferCommitment(payload) {
  const ans = safeText(payload.compromiso_piloto).toLowerCase();
  if (ans.startsWith('si') || ans.startsWith('sí') || ans.startsWith('yes')) return 'Si';
  if (ans.startsWith('quiz') || ans.startsWith('tal vez') || ans.startsWith('maybe')) return 'Quizas';
  if (ans.startsWith('no')) return 'No';
  return 'Pendiente';
}

function inferNextStep(receptivity, commitment) {
  if (commitment === 'Si' && receptivity >= 6) return 'Pasar a piloto';
  if (receptivity >= 7) return 'Pasar a piloto';
  if (receptivity >= 4) return 'Volver a contactar';
  if (receptivity > 0) return 'Descartar';
  return 'Sin accion';
}

function buildKeyPhrase(payload) {
  const dolor = safeText(payload.dolor_principal, 500);
  return dolor || safeText(payload.notas, 500);
}

function buildProperties(payload) {
  const isProvider = payload.tipo === 'proveedor';
  const today = new Date().toISOString().slice(0, 10);

  const receptivity = inferReceptivity(payload);
  const commitment = inferCommitment(payload);
  const dominant = inferDominantCategory(payload);

  const providerCats = isProvider ? multiSelectOpts(payload.categorias_proveedor) : [];
  const interestCats = isProvider
    ? []
    : multiSelectOpts(payload.categorias_interes);
  const currentCats = !isProvider ? multiSelectOpts(payload.categorias_actuales) : [];
  const totalCats = isProvider ? providerCats.length : currentCats.length;

  const props = {
    'Entrevistado': { title: title(payload.nombre || payload.negocio) },
    'Tipo': { select: { name: isProvider ? 'Proveedor' : 'Cliente' } },
    'Estado': { status: { name: 'Listo' } },
    'Fecha': { date: { start: today } },
    'Cantidad de categorias': { number: totalCats },
    'Nivel de dolor': { number: inferPainLevel(payload) },
    'Receptividad al concepto': { number: receptivity },
    'Disposicion bundles': { select: { name: inferBundleDisposition(payload) } },
    'Precio aceptable mensual': { rich_text: richText(payload.precio_aceptable) },
    'Compromiso piloto': { select: { name: commitment } },
    'Interes hurricane prep': { select: { name: inferHurricaneInterest(payload) } },
    'Frase textual clave': { rich_text: richText(buildKeyPhrase(payload), 500) },
    'Notas principales': { rich_text: richText(payload.notas) },
    'Referidos obtenidos': { rich_text: richText(payload.referidos) },
    'Proximo paso': { select: { name: inferNextStep(receptivity, commitment) } },
  };

  const ciudad = selectOpt(payload.ciudad, VALID_CITIES);
  if (ciudad) props['Ciudad'] = { select: ciudad };

  const fuente = selectOpt(payload.fuente, VALID_SOURCES);
  if (fuente) props['Fuente del contacto'] = { select: fuente };

  const tel = safeText(payload.telefono);
  if (tel) props['Telefono'] = { phone_number: tel };

  const email = safeText(payload.email);
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    props['Email'] = { email };
  }

  if (providerCats.length > 0) {
    props['Categorias del proveedor'] = { multi_select: providerCats };
  }

  if (interestCats.length > 0) {
    props['Categorias de interes'] = { multi_select: interestCats };
  } else if (currentCats.length > 0) {
    props['Categorias de interes'] = { multi_select: currentCats };
  }

  if (dominant) {
    props['Categoria dominante'] = { select: { name: dominant } };
  }

  return props;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID || FALLBACK_DATABASE_ID;

  if (!token) {
    console.error('Falta NOTION_TOKEN en variables de entorno');
    res.status(500).json({ ok: false, error: 'Servidor sin configurar' });
    return;
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch (err) {
    res.status(400).json({ ok: false, error: 'JSON invalido' });
    return;
  }

  if (!payload || (payload.tipo !== 'proveedor' && payload.tipo !== 'cliente')) {
    res.status(400).json({ ok: false, error: 'Tipo de entrevista requerido' });
    return;
  }

  if (!safeText(payload.nombre) && !safeText(payload.negocio)) {
    res.status(400).json({ ok: false, error: 'Nombre requerido' });
    return;
  }

  let properties;
  try {
    properties = buildProperties(payload);
  } catch (err) {
    console.error('Error construyendo properties:', err);
    res.status(500).json({ ok: false, error: 'Error procesando datos' });
    return;
  }

  try {
    const notionResponse = await fetch(NOTION_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });

    const result = await notionResponse.json();

    if (!notionResponse.ok) {
      console.error('Notion API error:', notionResponse.status, result);
      res.status(502).json({
        ok: false,
        error: 'No se pudo guardar en Notion',
        detail: result?.message || result?.code || 'unknown',
      });
      return;
    }

    res.status(200).json({ ok: true, id: result.id });
  } catch (err) {
    console.error('Error llamando a Notion:', err);
    res.status(500).json({ ok: false, error: 'Error de red contactando Notion' });
  }
}
