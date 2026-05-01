# Investigación MacLorian — Cuestionario Web

Web bilingüe (ES/EN) que registra respuestas directamente en la database de Notion **"Entrevistas de Validación"** del workspace MacLorian.

---

## Estructura del proyecto

```
cuestionario-web/
├── index.html              ← Frontend (1 archivo, todo dentro)
├── api/
│   └── submit.js           ← Vercel Function que envía a Notion
├── package.json            ← type: module
├── vercel.json             ← Config Vercel
├── .env.example            ← Documentación de variables
└── .gitignore
```

---

## Deploy en 5 pasos (~20 min total)

### Paso 1 — Generar el token de Notion (3 min)

> ⚠️ Este es el único paso que requiere que TÚ estés loggeado en Notion. No se puede hacer programáticamente.

1. Abrir [https://www.notion.com/my-integrations](https://www.notion.com/my-integrations)
2. Click **"+ New integration"**
3. Configurar:
   - **Name:** `MacLorian Cuestionario Web`
   - **Associated workspace:** El workspace donde está la database "Entrevistas de Validación"
   - **Type:** Internal
   - **Capabilities:** Marcar `Read content`, `Update content`, `Insert content`
4. Click **Submit**
5. Copiar el **Internal Integration Token** (empieza con `secret_` o `ntn_`)
6. Guardarlo temporalmente — lo vas a pegar en Vercel en el paso 4

### Paso 2 — Conectar la database de Notion a la integración (1 min)

> Necesario para que la integración tenga permiso de escribir en la database.

1. Abrir la database **"Entrevistas de Validación"** en Notion
   - Database ID: `a5de9526-4375-41f4-bc7d-475dc16f0264`
2. Click los **tres puntos `...`** en la esquina superior derecha
3. Scroll hasta **"Connections"** → **"Connect to"**
4. Buscar **"MacLorian Cuestionario Web"** y seleccionarla
5. Confirmar acceso

### Paso 3 — Deploy del proyecto en Vercel (5 min)

#### Opción 3A: Drag & drop (más fácil, sin Git)

1. Ir a [vercel.com](https://vercel.com), crear cuenta gratis (login con email o GitHub)
2. Dashboard → **"Add new..."** → **"Project"**
3. Click **"Browse"** o arrastra la carpeta `cuestionario-web` completa
4. **Project Name:** `investigacion-maclorian` (o el que prefieras)
5. **Framework Preset:** `Other` (es HTML estático con función)
6. **NO hacer click en "Deploy" todavía** — primero agregar las variables (paso 4)

#### Opción 3B: Vercel CLI (más rápido si ya tienes Node)

```bash
npm i -g vercel
cd cuestionario-web/
vercel
# Seguir prompts. Aceptar defaults para todo.
```

### Paso 4 — Configurar variables de entorno en Vercel (2 min)

1. Ir a **Project → Settings → Environment Variables**
2. Agregar variable 1:
   - **Key:** `NOTION_TOKEN`
   - **Value:** el token del paso 1 (empieza con `secret_` o `ntn_`)
   - **Environments:** marcar las tres (Production, Preview, Development)
   - **Save**
3. Agregar variable 2:
   - **Key:** `NOTION_DATABASE_ID`
   - **Value:** `a5de9526-4375-41f4-bc7d-475dc16f0264`
   - **Environments:** las tres
   - **Save**
4. Volver a Deployments → click "..." en el último → **Redeploy**

### Paso 5 — Configurar dominio personalizado (5 min)

#### En Vercel:
1. **Project → Settings → Domains**
2. Agregar: `investigacion.maclorianxgroup.com`
3. Vercel te muestra un registro CNAME

#### En tu DNS de maclorianxgroup.com:
```
Type:  CNAME
Name:  investigacion
Value: cname.vercel-dns.com
TTL:   3600 (o automático)
```

Espera 5–30 minutos para propagación. SSL automático.

---

## Test del flujo completo

### Test 1: deploy básico funciona

1. Abrir tu URL de Vercel
2. Verificar que carga la pantalla home
3. Probar el toggle ES/EN
4. Click en una card — debe abrir el cuestionario

### Test 2: el endpoint conecta con Notion

1. Llenar el cuestionario completo (datos de prueba está bien)
2. Click "Enviar respuestas"
3. Esperar mensaje de éxito
4. Abrir la database en Notion → debe aparecer una nueva fila con "Listo"

### Test 3: si no funciona...

**Síntoma: "Hubo un problema enviando tus respuestas"**

Causas posibles:
- ❌ `NOTION_TOKEN` mal copiado o no guardado en Vercel
- ❌ La integración no está conectada a la database (paso 2)
- ❌ No hiciste re-deploy después de agregar las variables

**Cómo debuggear:**
1. Vercel → Deployments → click el último → **"Functions"** tab
2. Click `submit` → **"View Logs"**
3. Ver el error real (401 si es token, 404 si es database, 403 si no hay permisos)

---

## Cómo funciona el mapping automático

El backend infiere propiedades de Notion analizando el texto de las respuestas:

| Propiedad de Notion | Cómo se infiere |
|---|---|
| Nivel de dolor (1-10) | Análisis del texto del problema (keywords: "frustrante", "horrible", "imposible") |
| Receptividad al concepto (1-10) | Combina respuesta de piloto + tono de la reacción |
| Disposición bundles | Alta si dio precio + "sí mejor valor". Baja si dijo "no" |
| Compromiso piloto | "Sí" → "Si", "Quizás" → "Quizas", "No" → "No" |
| Próximo paso | "Pasar a piloto" si Sí, "Volver a contactar" si Quizás, "Sin acción" si No |
| Categoría dominante | Detecta keywords en respuesta de "qué te genera más ingresos" |
| Frase textual clave | Mejor cita de las respuestas abiertas (30-400 chars) |
| Notas principales | Concatena TODAS las respuestas en formato legible |
| Interés hurricane | Alto si $300+, Medio si $100-299, Bajo si <$100 o "no" |
| Precio aceptable mensual | Combina precios mencionados (q14 + q13_ac + q13_pool + etc.) |

---

## Costo total

- **Vercel:** Gratis (Hobby plan, sin límite para este uso)
- **Notion:** Gratis (API 100% gratuita en plan Free, 3 req/seg = 10,800/hora)
- **Dominio:** Ya tienes maclorianxgroup.com
- **SSL:** Gratis automático en Vercel

**Total: $0/mes**

---

## Archivos de referencia

- `index.html` — el frontend (1825 líneas, 80 KB)
- `api/submit.js` — la Vercel Function (recibe POST, envía a Notion)
- `vercel.json` — config con headers de seguridad
- `package.json` — type: module para ES modules

---

## Próximos pasos después de deploy

1. ✅ Llenar un cuestionario de prueba (proveedor) y verificar que llega a Notion
2. ✅ Llenar otro (cliente) para verificar el otro flujo
3. ✅ Borrar las 2 entradas de prueba de la database
4. 📤 Mandar el link a los 25 proveedores de la lista (ver `03-mensajes-outreach.md`)
5. 📤 Postear en NextDoor + grupos de Facebook locales
6. 📊 Día 15: revisar respuestas en Notion, decidir go/no-go
