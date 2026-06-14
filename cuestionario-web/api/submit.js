const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID || '6d4735de-69f4-4d8b-b5ce-89bfcdb9f475';

const NOTION_API_VERSION = '2022-06-28';
const NOTION_API_URL = 'https://api.notion.com/v1/pages';

const ALLOWED_CATEGORIES = [
  'A/C & HVAC', 'Pool service', 'Lawn care', 'Pest control',
  'Roof maintenance', 'Pressure washing', 'Gutter cleaning',
  'Exterior cleaning', 'Hurricane prep', 'Handyman',
  'Generator service', 'Tree service',
  'Barber & beauty', 'Pet services', 'Auto detailing',
  'Home cleaning', 'Spa & wellness', 'Personal fitness'
];

const OTHER_CATEGORY_VALUE = 'Otra (Personalizar)';

const CITY_MAP = {
  'Cape Coral': 'Cape Coral',
  'Fort Myers': 'Fort Myers',
  'Naples': 'Naples',
  'Bonita Springs': 'Bonita Springs',
  'Estero': 'Estero',
  'Lehigh Acres': 'Lehigh Acres',
  'Punta Gorda': 'Otro',
  'Otro': 'Otro',
  'Other': 'Otro'
};

function clamp(s, max = 2000) {
  if (!s) return '';
  return String(s).slice(0, max);
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null || v === '') return [];
  return [v];
}

function normalizeCity(city) {
  if (!city) return null;
  return CITY_MAP[city] || 'Otro';
}

function filterCategories(arr) {
  return asArray(arr).filter(c => ALLOWED_CATEGORIES.includes(c));
}

function inferProviderDominant(data) {
  const dom = data.q3_dominante;
  if (!dom) return null;
  const lower = dom.toLowerCase();
  if (lower.includes('a/c') || lower.includes('ac ') || lower.includes('hvac') || lower.includes('aire')) return 'A/C & HVAC';
  if (lower.includes('pool') || lower.includes('piscina')) return 'Pool service';
  if (lower.includes('lawn') || lower.includes('jardín') || lower.includes('jardin') || lower.includes('grass')) return 'Lawn care';
  if (lower.includes('pest') || lower.includes('plaga') || lower.includes('mosquito')) return 'Pest control';
  if (lower.includes('roof') || lower.includes('techo')) return 'Roof maintenance';
  if (lower.includes('pressure') || lower.includes('presión') || lower.includes('presion')) return 'Pressure washing';
  if (lower.includes('gutter') || lower.includes('canaleta')) return 'Gutter cleaning';
  if (lower.includes('exterior') || lower.includes('window')) return 'Exterior cleaning';
  if (lower.includes('hurricane') || lower.includes('huracán') || lower.includes('huracan')) return 'Hurricane prep';
  if (lower.includes('handyman') || lower.includes('handy')) return 'Handyman';
  if (lower.includes('generator') || lower.includes('generador')) return 'Generator service';
  if (lower.includes('tree') || lower.includes('árbol') || lower.includes('arbol') || lower.includes('poda')) return 'Tree service';
  if (lower.includes('barber') || lower.includes('beauty') || lower.includes('peluq')) return 'Barber & beauty';
  if (lower.includes('pet') || lower.includes('mascota') || lower.includes('grooming')) return 'Pet services';
  if (lower.includes('auto') || lower.includes('detail') || lower.includes('car wash')) return 'Auto detailing';
  if (lower.includes('home clean') || lower.includes('limpieza de hogar') || lower.includes('limpieza interior') || lower.includes('cleaning')) return 'Home cleaning';
  if (lower.includes('spa') || lower.includes('wellness') || lower.includes('massage') || lower.includes('masaje')) return 'Spa & wellness';
  if (lower.includes('fitness') || lower.includes('trainer') || lower.includes('entrenador')) return 'Personal fitness';
  return null;
}

function inferDolor(data, type) {
  if (type === 'provider') {
    const txt = (data.q8_problema_grande || '').toLowerCase();
    if (!txt) return null;
    if (txt.length < 20) return 3;
    if (txt.includes('terrible') || txt.includes('horrible') || txt.includes('me arruina') || txt.includes('imposible')) return 9;
    if (txt.includes('frustrante') || txt.includes('grande') || txt.includes('serio') || txt.includes('mucho')) return 7;
    if (txt.includes('a veces') || txt.includes('ocasional')) return 5;
    return 6;
  } else {
    const txt = (data.q6_frustracion || '').toLowerCase();
    if (!txt) return null;
    if (txt.length < 20) return 3;
    if (txt.includes('terrible') || txt.includes('horrible')) return 9;
    if (txt.includes('frustrante') || txt.includes('grande') || txt.includes('mucho')) return 7;
    if (txt.includes('a veces') || txt.includes('poco')) return 4;
    return 6;
  }
}

function inferReceptividad(data, type) {
  if (type === 'provider') {
    const txt = (data.q12_reaccion || '').toLowerCase();
    const piloto = data.q18_piloto;
    let score = 5;
    if (piloto === 'Sí' || piloto === 'Si') score = 8;
    else if (piloto === 'Quizás' || piloto === 'Quizas') score = 6;
    else if (piloto === 'No') score = 3;
    if (txt.includes('me encanta') || txt.includes('excelente') || txt.includes('genial')) score = Math.min(10, score + 2);
    if (txt.includes('no me convence') || txt.includes('no creo') || txt.includes('mal')) score = Math.max(1, score - 2);
    return score;
  } else {
    const txt = (data.q11_reaccion || '').toLowerCase();
    const subs = data.q12_suscribirse;
    let score = 5;
    if (subs === 'Sí' || subs === 'Si') score = 8;
    else if (subs === 'Tal vez') score = 5;
    else if (subs === 'No') score = 2;
    if (txt.includes('me gusta') || txt.includes('excelente')) score = Math.min(10, score + 2);
    if (txt.includes('confuso') || txt.includes('no me gusta')) score = Math.max(1, score - 2);
    return score;
  }
}

function inferDisposicionBundles(data, type) {
  if (type === 'provider') {
    const precio = (data.q14_precio_bundle || '').toLowerCase();
    const valor = (data.q15_valor_bundle || '').toLowerCase();
    if (!precio && !valor) return 'No aplica';
    if (precio.match(/\d/) && (valor.includes('sí') || valor.includes('si') || valor.includes('mejor'))) return 'Alta';
    if (precio.match(/\d/) || valor.includes('quizás') || valor.includes('depende')) return 'Media';
    if (valor.includes('no') && !valor.includes('no sé')) return 'Baja';
    return 'Media';
  } else {
    const precio = (data.q14_bundle_precio || '').toLowerCase();
    if (!precio) return 'No aplica';
    if (precio.match(/\d/) && !precio.includes('no')) return 'Alta';
    if (precio.includes('depende') || precio.includes('quizás') || precio.includes('quizas')) return 'Media';
    if (precio.includes('no')) return 'Baja';
    return 'Media';
  }
}

function inferInteresHurricane(data, type) {
  if (type !== 'client') return 'No aplica';
  const txt = (data.q17_hurricane || '').toLowerCase().trim();
  if (!txt) return 'Bajo';
  
  // Si dice explicitamente "no me interesa" o "no" sin numero
  if ((txt.includes('no me interesa') || txt.includes('no, gracias') || txt === 'no') && !txt.match(/\d/)) {
    return 'Bajo';
  }
  
  // Extraer cualquier numero de la respuesta
  const match = txt.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    // Numeros que suenan a precio anual razonable o entusiasta
    if (num >= 300) return 'Alto';
    if (num >= 100) return 'Medio';
    return 'Bajo';
  }
  
  // Si tiene texto positivo sin numero
  if (txt.includes('mucho') || txt.includes('definit') || txt.includes('me parece bien') || txt.includes('si me')) {
    return 'Alto';
  }
  if (txt.includes('quizas') || txt.includes('depende') || txt.includes('tal vez')) {
    return 'Medio';
  }
  return 'Bajo';
}

function buildPrecioAceptableMensual(data, type) {
  if (type === 'provider') {
    return clamp(data.q14_precio_bundle, 200);
  } else {
    const parts = [];
    if (data.q13_ac) parts.push(`A/C: ${data.q13_ac}`);
    if (data.q13_pool) parts.push(`Pool: ${data.q13_pool}`);
    if (data.q13_lawn) parts.push(`Lawn: ${data.q13_lawn}`);
    if (data.q13_pest) parts.push(`Pest: ${data.q13_pest}`);
    if (data.q14_bundle_precio) parts.push(`Bundle: ${data.q14_bundle_precio}`);
    return clamp(parts.join(' | '), 200);
  }
}

function buildFraseTextual(data, type) {
  const candidates = type === 'provider' 
    ? [data.q8_problema_grande, data.q11_cambio_uno, data.q12_reaccion, data.q17_frenos]
    : [data.q6_frustracion, data.q10_cambio_uno, data.q11_reaccion, data.q16_frenos];
  
  const valid = candidates.filter(c => c && c.length > 30 && c.length < 400);
  if (valid.length === 0) return '';
  
  return clamp(valid.sort((a, b) => b.length - a.length)[0], 400);
}

function buildNotasPrincipales(data, type) {
  const lines = [`Tipo: ${type === 'provider' ? 'Proveedor' : 'Cliente'} | Idioma: ${data.lang || 'es'}`];
  
  if (type === 'provider') {
    if (data.negocio) lines.push(`Negocio: ${data.negocio}`);
    if (data.anos) lines.push(`Años: ${data.anos}`);
    if (data.q1_mes_tipico) lines.push(`Mes típico: ${clamp(data.q1_mes_tipico, 200)}`);
    const cats = filterCategories(data.q2_categorias);
    if (cats.length) lines.push(`Categorías: ${cats.join(', ')}`);
    if (asArray(data.q2_categorias).includes(OTHER_CATEGORY_VALUE)) {
      if (data.q2_categoria_custom) lines.push(`Categoría custom: ${clamp(data.q2_categoria_custom, 200)}`);
      if (data.q2_llc_name) lines.push(`LLC: ${clamp(data.q2_llc_name, 200)}`);
    }
    if (data.q3_dominante) lines.push(`Dominante: ${data.q3_dominante}`);
    if (data.q4_lead_gen) lines.push(`Lead gen: ${clamp(data.q4_lead_gen, 200)}`);
    if (data.q5_estabilidad) lines.push(`Estabilidad: ${clamp(data.q5_estabilidad, 200)}`);
    if (data.q6_cobro) lines.push(`Cobro: ${clamp(data.q6_cobro, 200)}`);
    if (data.q7_recurrentes) lines.push(`Recurrentes: ${data.q7_recurrentes}`);
    if (data.q8_problema_grande) lines.push(`Problema grande: ${clamp(data.q8_problema_grande, 300)}`);
    if (data.q9_compartir_precios) lines.push(`Comparte precios: ${clamp(data.q9_compartir_precios, 200)}`);
    if (data.q10_pensado_mensual) lines.push(`Pensó en mensual: ${data.q10_pensado_mensual}`);
    if (data.q10_pensado_mensual_detalle) lines.push(`Detalle mensual: ${clamp(data.q10_pensado_mensual_detalle, 200)}`);
    if (data.q11_cambio_uno) lines.push(`Cambiaría: ${clamp(data.q11_cambio_uno, 200)}`);
    if (data.q12_reaccion) lines.push(`Reacción: ${clamp(data.q12_reaccion, 300)}`);
    if (data.q13_clientes_suscritos) lines.push(`Suscriptores estimados: ${data.q13_clientes_suscritos}`);
    if (data.q14_precio_bundle) lines.push(`Precio bundle: ${data.q14_precio_bundle}`);
    if (data.q15_valor_bundle) lines.push(`Valor bundle: ${clamp(data.q15_valor_bundle, 200)}`);
    if (data.q16_comision) lines.push(`Comisión 10%: ${data.q16_comision}`);
    if (data.q17_frenos) lines.push(`Frenos: ${clamp(data.q17_frenos, 200)}`);
    if (data.q18_piloto) lines.push(`Piloto: ${data.q18_piloto}`);
    if (data.q19_referidos) lines.push(`Referidos: ${clamp(data.q19_referidos, 300)}`);
    if (data.q20_avisar) lines.push(`Avisar: ${data.q20_avisar}`);
  } else {
    if (data.tipo_propiedad) lines.push(`Propiedad: ${data.tipo_propiedad}`);
    if (data.piscina) lines.push(`Piscina: ${data.piscina}`);
    if (data.anos_florida) lines.push(`Años en FL: ${data.anos_florida}`);
    const servs = filterCategories(data.q1_servicios);
    if (servs.length) lines.push(`Servicios: ${servs.join(', ')}`);
    if (asArray(data.q1_servicios).includes(OTHER_CATEGORY_VALUE) && data.q1_servicio_custom) {
      lines.push(`Servicio custom: ${clamp(data.q1_servicio_custom, 200)}`);
    }
    if (data.q2_lealtad) lines.push(`Lealtad: ${data.q2_lealtad}`);
    if (data.q3_handyman_confianza) lines.push(`Handyman confianza: ${clamp(data.q3_handyman_confianza, 200)}`);
    if (data.q4_gasto_mensual) lines.push(`Gasto/mes: ${data.q4_gasto_mensual}`);
    if (data.q5_emergencia) lines.push(`Emergencia: ${clamp(data.q5_emergencia, 200)}`);
    if (data.q6_frustracion) lines.push(`Frustración: ${clamp(data.q6_frustracion, 300)}`);
    if (data.q7_disponibilidad) lines.push(`Disponibilidad: ${clamp(data.q7_disponibilidad, 200)}`);
    if (data.q8_claridad_precios) lines.push(`Claridad precios: ${clamp(data.q8_claridad_precios, 200)}`);
    if (data.q9_sorpresa_precio) lines.push(`Sorpresa precio: ${clamp(data.q9_sorpresa_precio, 200)}`);
    if (data.q10_cambio_uno) lines.push(`Cambiaría: ${clamp(data.q10_cambio_uno, 200)}`);
    if (data.q11_reaccion) lines.push(`Reacción: ${clamp(data.q11_reaccion, 300)}`);
    if (data.q12_suscribirse) lines.push(`Suscribirse: ${data.q12_suscribirse}`);
    if (data.q12_suscribirse_porque) lines.push(`Por qué: ${clamp(data.q12_suscribirse_porque, 200)}`);
    if (data.q13_ac) lines.push(`A/C: ${data.q13_ac}`);
    if (data.q13_pool) lines.push(`Pool: ${data.q13_pool}`);
    if (data.q13_lawn) lines.push(`Lawn: ${data.q13_lawn}`);
    if (data.q13_pest) lines.push(`Pest: ${data.q13_pest}`);
    if (data.q14_bundle_precio) lines.push(`Bundle: ${data.q14_bundle_precio}`);
    if (data.q15_expectativa) lines.push(`Expectativa: ${clamp(data.q15_expectativa, 200)}`);
    if (data.q16_frenos) lines.push(`Frenos: ${clamp(data.q16_frenos, 200)}`);
    if (data.q17_hurricane) lines.push(`Hurricane: ${data.q17_hurricane}`);
    if (data.q18_referidos) lines.push(`Referidos: ${clamp(data.q18_referidos, 300)}`);
    if (data.q19_avisar) lines.push(`Avisar: ${data.q19_avisar}`);
  }
  
  return clamp(lines.join('\n'), 1990);
}

function buildProperties(data, type) {
  const props = {
    'Entrevistado': {
      title: [{ text: { content: clamp(data.nombre || 'Anónimo', 100) } }]
    },
    'Tipo': {
      select: { name: type === 'provider' ? 'Proveedor' : 'Cliente' }
    },
    'Estado': {
      status: { name: 'Listo' }
    },
    'Fecha': {
      date: { start: new Date().toISOString().split('T')[0] }
    },
    'Fuente del contacto': {
      select: { name: 'Otro' }
    },
    'Notas principales': {
      rich_text: [{ text: { content: buildNotasPrincipales(data, type) } }]
    },
    'Frase textual clave': {
      rich_text: [{ text: { content: buildFraseTextual(data, type) } }]
    },
    'Precio aceptable mensual': {
      rich_text: [{ text: { content: buildPrecioAceptableMensual(data, type) } }]
    }
  };
  
  if (data.telefono) props['Telefono'] = { phone_number: clamp(data.telefono, 30) };
  if (data.email) {
    const emailValue = clamp(data.email, 100);
    if (emailValue.includes('@') && emailValue.includes('.')) {
      props['Email'] = { email: emailValue };
    }
  }
  
  const city = normalizeCity(data.ciudad);
  if (city) props['Ciudad'] = { select: { name: city } };
  
  const dolor = inferDolor(data, type);
  if (dolor !== null) props['Nivel de dolor'] = { number: dolor };
  
  const receptividad = inferReceptividad(data, type);
  if (receptividad !== null) props['Receptividad al concepto'] = { number: receptividad };
  
  const bundles = inferDisposicionBundles(data, type);
  if (bundles) props['Disposicion bundles'] = { select: { name: bundles } };
  
  if (type === 'provider') {
    const cats = filterCategories(data.q2_categorias);
    if (cats.length > 0) {
      props['Categorias del proveedor'] = {
        multi_select: cats.map(c => ({ name: c }))
      };
      props['Cantidad de categorias'] = { number: cats.length };
    }
    
    const dominante = inferProviderDominant(data);
    if (dominante) props['Categoria dominante'] = { select: { name: dominante } };
    
    if (data.q18_piloto) {
      const pilotMap = { 'Sí': 'Si', 'Si': 'Si', 'Quizás': 'Quizas', 'Quizas': 'Quizas', 'No': 'No' };
      const pilotVal = pilotMap[data.q18_piloto] || 'Pendiente';
      props['Compromiso piloto'] = { select: { name: pilotVal } };
    }
    
    if (data.q19_referidos) {
      props['Referidos obtenidos'] = {
        rich_text: [{ text: { content: clamp(data.q19_referidos, 1990) } }]
      };
    }
    
    const proxPaso = data.q18_piloto === 'Sí' || data.q18_piloto === 'Si'
      ? 'Pasar a piloto'
      : data.q18_piloto === 'Quizás' || data.q18_piloto === 'Quizas'
      ? 'Volver a contactar'
      : 'Sin accion';
    props['Proximo paso'] = { select: { name: proxPaso } };
  } else {
    const servs = filterCategories(data.q1_servicios);
    if (servs.length > 0) {
      props['Categorias de interes'] = {
        multi_select: servs.map(c => ({ name: c }))
      };
    }
    
    const hurricane = inferInteresHurricane(data, type);
    props['Interes hurricane prep'] = { select: { name: hurricane } };
    
    if (data.q18_referidos) {
      props['Referidos obtenidos'] = {
        rich_text: [{ text: { content: clamp(data.q18_referidos, 1990) } }]
      };
    }
    
    props['Proximo paso'] = { select: { name: 'Sin accion' } };
  }

  const otherCats = type === 'provider' ? data.q2_categorias : data.q1_servicios;
  if (asArray(otherCats).includes(OTHER_CATEGORY_VALUE)) {
    const customField = type === 'provider' ? data.q2_categoria_custom : data.q1_servicio_custom;
    if (customField) {
      props['Categoria custom'] = {
        rich_text: [{ text: { content: clamp(customField, 1990) } }]
      };
    }
    if (type === 'provider' && data.q2_llc_name) {
      props['LLC name'] = {
        rich_text: [{ text: { content: clamp(data.q2_llc_name, 1990) } }]
      };
    }
  }

  return props;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  if (!NOTION_TOKEN) {
    console.error('Missing NOTION_TOKEN env variable');
    return res.status(500).json({ error: 'Server not configured' });
  }
  
  try {
    const data = req.body || {};
    const type = data.type;
    
    if (!type || (type !== 'provider' && type !== 'client')) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    
    if (!data.nombre || data.nombre.trim().length < 2) {
      return res.status(400).json({ error: 'Name required' });
    }
    
    const properties = buildProperties(data, type);
    
    const notionResponse = await fetch(NOTION_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_API_VERSION
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties
      })
    });
    
    if (!notionResponse.ok) {
      const errText = await notionResponse.text();
      console.error('Notion API error:', notionResponse.status, errText);
      return res.status(500).json({ 
        error: 'Notion API error',
        details: process.env.NODE_ENV === 'development' ? errText : undefined
      });
    }
    
    const notionData = await notionResponse.json();
    
    return res.status(200).json({ 
      success: true,
      pageId: notionData.id 
    });
  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
