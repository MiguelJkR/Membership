# Cuestionario MacLorian Innovation

Web bilingue (ES/EN) para validar la idea de **membresias multi-categoria de servicios para hogares en SW Florida**. Cada respuesta se guarda automaticamente en la database de Notion **"Entrevistas de Validacion"**.

- **Proveedores:** 20 preguntas, ~10 minutos.
- **Homeowners:** 19 preguntas, ~8 minutos.
- 5 bloques: A) sobre ti, B) tu negocio o casa hoy, C) que te frustra, D) la idea, E) cierre.
- Inferencia automatica de: nivel de dolor (1-10), receptividad (1-10), categoria dominante, disposicion bundles, interes hurricane, frase textual clave, proximo paso.

---

## Estructura

```
cuestionario-web/
├── index.html              ← Frontend bilingue, mobile-first, sin dependencias
├── api/
│   └── submit.js           ← Vercel Function. POST /api/submit → Notion API
├── package.json            ← type: module, sin dependencias externas
├── vercel.json             ← maxDuration 10s + headers de seguridad
├── .env.example            ← Documentacion de variables (NUNCA con secretos reales)
├── .gitignore
├── README.md               ← Este archivo
└── 03-mensajes-outreach.md ← Plantillas para outreach a proveedores
```

---

## Deploy en Vercel — paso a paso

### Prerrequisitos

```bash
node --version    # >= 18
npm --version
npm install -g vercel
vercel --version
```

### 1. Login

```bash
vercel login
```

Usa la cuenta `migueljkrs`.

### 2. Linkear con el proyecto existente

Desde la carpeta `cuestionario-web/`:

```bash
cd cuestionario-web
vercel link
```

- Set up and develop? **Y**
- Which scope → seleccionar **migueljkrs**
- Link to existing project? **Y**
- Nombre del proyecto: **project-6lklw**

Esto crea una carpeta `.vercel/` (no la commitees, ya esta en .gitignore).

### 3. Configurar variables de entorno

```bash
vercel env add NOTION_TOKEN
# Valor: el token de la integracion "MacLorian Cuestionario Web"
# Environments: Production, Preview, Development (las 3)

vercel env add NOTION_DATABASE_ID
# Valor: a5de9526-4375-41f4-bc7d-475dc16f0264
# Environments: Production, Preview, Development (las 3)
```

> **OJO:** si el token de Notion estuvo expuesto en alguna captura de pantalla,
> regeneralo PRIMERO en https://www.notion.so/my-integrations antes de
> guardarlo en Vercel.

### 4. Deploy a produccion

```bash
vercel --prod
```

Te dara una URL tipo `https://project-6lklw-xxxxx.vercel.app`.

### 5. Test end-to-end

1. Abrir la URL en el navegador.
2. Probar el toggle ES/EN (debe persistir tras recargar).
3. Click en "Soy proveedor de servicios".
4. Llenar el cuestionario completo con datos de prueba.
5. Submit.
6. Verificar la pantalla de exito.
7. Ir a Notion → database "Entrevistas de Validacion".
8. Debe aparecer una nueva entrada con `Estado = Listo` y todos los campos poblados.
9. Repetir para "Soy homeowner".
10. Borrar las 2 entradas de prueba en Notion.

### 6. Dominio personalizado (opcional)

```bash
vercel domains add investigacion.maclorianxgroup.com
```

Luego, en el panel DNS de `maclorianxgroup.com` agregar:

```
Type:  CNAME
Name:  investigacion
Value: cname.vercel-dns.com
TTL:   3600
```

SSL automatico en 5-30 min.

---

## Desarrollo local

```bash
cd cuestionario-web
cp .env.example .env.local
# Editar .env.local y poner el token de Notion real
vercel dev
```

Abre http://localhost:3000.

---

## Troubleshooting

| Sintoma | Causa probable | Solucion |
|---|---|---|
| "Hubo un problema enviando tus respuestas" | Token de Notion mal copiado | `vercel env rm NOTION_TOKEN` y volver a agregar. Re-deploy. |
| Logs muestran 401 | Token invalido o expirado | Regenerar en https://www.notion.so/my-integrations |
| Logs muestran 404 | Database ID incorrecto | Verificar `a5de9526-4375-41f4-bc7d-475dc16f0264` |
| Logs muestran 403 | Integracion sin acceso a la database | En Notion: abrir database → ⋯ → Connections → Connect to → MacLorian Cuestionario Web |
| Web carga pero submit no responde | Variables agregadas DESPUES del deploy | `vercel --prod` de nuevo |
| Property "X" not found | El nombre exacto del campo en Notion no coincide | Comparar mapping en `api/submit.js` con la database |

Ver logs en tiempo real:

```bash
vercel logs <URL_DEPLOYMENT>
```

---

## Notion - schema esperado

Database **"Entrevistas de Validacion"** (ID: `a5de9526-4375-41f4-bc7d-475dc16f0264`). El backend escribe estas propiedades:

| Propiedad | Tipo Notion | Origen |
|---|---|---|
| Entrevistado | title | `nombre` o `negocio` |
| Tipo | select (Proveedor / Cliente) | `tipo` |
| Estado | status (Listo) | fijo |
| Fecha | date | hoy |
| Ciudad | select | `ciudad` |
| Telefono | phone_number | `telefono` |
| Email | email | `email` |
| Categorias del proveedor | multi_select | `categorias_proveedor` |
| Categoria dominante | select | inferido (primera del array) |
| Cantidad de categorias | number | length del array |
| Categorias de interes | multi_select | `categorias_interes` o `categorias_actuales` |
| Nivel de dolor | number 1-10 | inferido (texto + radios) |
| Receptividad al concepto | number 1-10 | slider directo |
| Disposicion bundles | select (Alta/Media/Baja/No aplica) | inferido |
| Precio aceptable mensual | rich_text | `precio_aceptable` |
| Compromiso piloto | select (Si/Quizas/No/Pendiente) | inferido |
| Interes hurricane prep | select (Alto/Medio/Bajo/No aplica) | inferido |
| Frase textual clave | rich_text | `dolor_principal` truncado a 500 chars |
| Notas principales | rich_text | `notas` |
| Referidos obtenidos | rich_text | `referidos` |
| Proximo paso | select | inferido (Pasar a piloto / Volver a contactar / Descartar) |
| Fuente del contacto | select | `fuente` |
| ID | unique_id | auto (Notion) |
| Fecha de creacion | created_time | auto (Notion) |
| Ultima actualizacion | last_edited_time | auto (Notion) |

---

## Logica de inferencia (api/submit.js)

- **Nivel de dolor (1-10):** arranca en 5, suma por keywords de frustracion en `dolor_principal`, suma por longitud del texto, suma/resta segun "Si/No" en preguntas de C, considera el slider `molestia_coordinacion` para clientes.
- **Receptividad:** valor del slider `receptividad_membresia` (1-10).
- **Categoria dominante:** primera categoria seleccionada (asume orden de prioridad del usuario).
- **Disposicion bundles (proveedor):** parsea `disposicion_bundles` (definitivamente si → Alta, tal vez → Media, no → Baja).
- **Disposicion bundles (cliente):** segun cantidad de `categorias_interes` (4+ → Alta, 2-3 → Media, 1 → Baja).
- **Interes hurricane:** parsea `interes_hurricane` (mucho → Alto, algo → Medio, nada → Bajo).
- **Compromiso piloto:** parsea `compromiso_piloto` (si → Si, quiza → Quizas, no → No).
- **Proximo paso:** si `compromiso_piloto = Si` Y `receptividad >= 6` → "Pasar a piloto". Si `receptividad >= 7` → "Pasar a piloto". Si `>= 4` → "Volver a contactar". Si `< 4` → "Descartar".
- **Frase textual clave:** primer 500 caracteres de `dolor_principal`.

---

## Cambios y mantenimiento

- Para agregar una pregunta: editar `QUESTIONS_PROVEEDOR` o `QUESTIONS_CLIENTE` en `index.html`. Si el dato debe ir a Notion, agregar el mapping en `buildProperties()` de `api/submit.js`.
- Para agregar un idioma: extender el objeto `I18N` en `index.html` y agregar las traducciones en cada `label`/`option` de las preguntas.
- Para cambiar la paleta: modificar las CSS variables en `:root` (`--primary`, `--accent`, etc.).

---

© MacLorian X Group LLC · Cape Coral, FL
