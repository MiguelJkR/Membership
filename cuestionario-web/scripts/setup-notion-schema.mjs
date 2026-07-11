#!/usr/bin/env node
/**
 * setup-notion-schema.mjs — crea en la base Notion "Entrevistas de Validación"
 * TODAS las propiedades v2 que api/submit.js escribe, para que ninguna respuesta
 * caiga a legacy/Overflow. Fuente única: PROP_MAP + META_PROPS de api/submit.js
 * (sin lista duplicada → sin drift).
 *
 * Uso:
 *   NOTION_TOKEN=secret_xxx NOTION_DATABASE_ID=6d47... node scripts/setup-notion-schema.mjs        # dry-run (solo muestra el diff)
 *   NOTION_TOKEN=secret_xxx NOTION_DATABASE_ID=6d47... node scripts/setup-notion-schema.mjs --apply # aplica los cambios
 *
 * Idempotente: solo agrega las propiedades que faltan; nunca borra ni cambia tipos existentes.
 * Las opciones de los select/multi_select se autocrean cuando llega la primera respuesta.
 */
import { PROP_MAP, META_PROPS } from '../api/submit.js';

const TOKEN = process.env.NOTION_TOKEN;
const DB = process.env.NOTION_DATABASE_ID || '6d4735de-69f4-4d8b-b5ce-89bfcdb9f475';
const APPLY = process.argv.includes('--apply');
const NOTION_VERSION = '2022-06-28';

if (!TOKEN) {
  console.error('✗ Falta NOTION_TOKEN en el entorno.');
  process.exit(1);
}

// tipo Notion → cuerpo de creación de propiedad
const BODY = {
  rich_text: { rich_text: {} },
  select: { select: {} },
  multi_select: { multi_select: {} },
  number: { number: { format: 'number' } },
  checkbox: { checkbox: {} }
};

// Propiedades deseadas (name → tipo), derivadas de submit.js
const desired = new Map();
for (const [, [name, build]] of Object.entries(PROP_MAP)) {
  if (build && build.nt) desired.set(name, build.nt);
}
for (const [name, type] of META_PROPS) desired.set(name, type);

async function notion(method, path, body) {
  const r = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${json.message || JSON.stringify(json)}`);
  return json;
}

async function main() {
  console.log(`DB: ${DB}`);
  console.log(`Modo: ${APPLY ? 'APLICAR' : 'DRY-RUN (usa --apply para ejecutar)'}`);
  console.log(`Propiedades v2 requeridas: ${desired.size}\n`);

  const db = await notion('GET', `/databases/${DB}`);
  const existing = new Set(Object.keys(db.properties || {}));

  const missing = [];
  for (const [name, type] of desired) {
    if (!existing.has(name)) missing.push([name, type]);
  }

  // Aviso de conflictos de tipo (existe pero con otro tipo → NO se toca, solo se reporta)
  const conflicts = [];
  for (const [name, type] of desired) {
    const cur = db.properties?.[name]?.type;
    if (cur && cur !== type) conflicts.push([name, cur, type]);
  }

  console.log(`Ya existen: ${desired.size - missing.length}/${desired.size}`);
  console.log(`Faltan: ${missing.length}`);
  if (conflicts.length) {
    console.log(`\n⚠ Conflictos de tipo (se dejan como están, revisar a mano):`);
    for (const [n, cur, want] of conflicts) console.log(`   "${n}": DB=${cur} vs esperado=${want}`);
  }

  if (!missing.length) { console.log('\n✓ La base ya tiene todas las propiedades v2.'); return; }

  console.log(`\n${APPLY ? 'Creando' : 'Se crearían'} ${missing.length} propiedades:`);
  for (const [name, type] of missing) console.log(`   + "${name}" (${type})`);

  if (!APPLY) { console.log('\nDry-run: nada se modificó. Re-ejecuta con --apply.'); return; }

  // Notion admite varias propiedades por PATCH; se hace en lotes chicos por seguridad.
  const batchSize = 15;
  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    const properties = {};
    for (const [name, type] of batch) properties[name] = BODY[type];
    await notion('PATCH', `/databases/${DB}`, { properties });
    console.log(`   ✓ lote ${Math.floor(i / batchSize) + 1}: ${batch.length} propiedades`);
  }
  console.log('\n✓ Esquema actualizado. Verificá corriendo el script de nuevo (debería decir "0 faltan").');
}

main().catch(e => { console.error('\n✗ Error:', e.message); process.exit(1); });
