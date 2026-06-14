# 10 — Brand Guide: Faraón Pay

> Identidad visual y verbal completa para Faraón Pay, la app de membresía multi-categoría para servicios de hogar y profesionales en SW Florida.
>
> **Parent:** MacLorian X Group LLC
> **Producto:** Faraón Pay (consumer brand)
> **Tagline ES:** Vivir como un faraón.
> **Tagline EN:** Live like a pharaoh.

**Última actualización:** 2026-06-14
**Status:** READY-TO-LAUNCH (pendiente registros legales)

---

## 🎨 1. Identidad visual

### Logo concept

**Versión principal:**
Silueta minimalista de pirámide escalonada con ojo de Horus integrado en la cara superior, todo en líneas geométricas limpias. Pirámide en dorado profundo sobre fondo crema o lapislázuli, dependiendo del contexto.

**Variantes:**
- **Wordmark:** `FARAÓN PAY` en Cinzel SemiBold con un sutil tilde ornamental
- **Símbolo solo:** la pirámide + ojo, sin texto (para favicon, app icon)
- **Vertical:** símbolo arriba, wordmark abajo (para social profiles)
- **Horizontal:** símbolo a la izquierda, wordmark a la derecha (para headers web/email)

**Mockup ASCII del símbolo (conceptual):**

```
        /\
       /◉ \
      /____\
     /      \
    /________\
   /          \
  /____________\
```

(El triángulo es la pirámide, `◉` representa el ojo de Horus en la parte superior.)

### Paleta de colores oficial

| Color | Hex | Uso |
|---|---|---|
| **Dorado Imperial** | `#D4A017` | Color primario — logo, CTAs principales, acentos |
| **Lapislázuli** | `#1F4E79` | Color secundario — backgrounds oscuros, headers |
| **Papiro** | `#F5E6C8` | Fondo crema cálido, secciones light |
| **Carbón** | `#1A1A1A` | Texto principal |
| **Arena Pálida** | `#E8DCC4` | Líneas, dividers, hover states |
| **Verde Mali** | `#2D6A4F` | Estados de éxito, "Confirmado" |
| **Rojo Aragüe** | `#B23A48` | Estados de error |
| **Beige Suave** | `#FAF3E0` | Background principal |

**Reglas de combinación:**
- Hero sections: Lapislázuli #1F4E79 con texto Papiro #F5E6C8 y CTAs Dorado #D4A017
- Cards: Beige Suave #FAF3E0 con texto Carbón #1A1A1A
- Footers: Carbón #1A1A1A con texto Papiro #F5E6C8

### Tipografía

| Categoría | Familia | Pesos | Uso |
|---|---|---|---|
| **Display** | Cinzel | 400, 600, 700 | Headlines, "FARAÓN PAY" wordmark, hero text |
| **Body** | Inter | 400, 500, 600, 700 | Texto general, párrafos, navegación |
| **Mono** | JetBrains Mono | 400, 500 | Código, datos técnicos, números destacados |

**Importación Google Fonts:**

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Reglas:**
- Headlines (H1, H2): Cinzel SemiBold/Bold, espaciado generoso
- Body: Inter 400, line-height 1.55, máx 70 char/línea
- CTAs: Inter SemiBold, uppercase, letter-spacing 0.05em
- Números destacados ($6,450/mes): Cinzel Bold tamaño grande
- Tagline: Cinzel Regular, italic, espaciado abierto

### Elementos gráficos auxiliares

- **Patrón hierático:** repetición sutil de jeroglíficos estilizados (pyramid, ankh, eye of horus) como fondo decorativo en pages premium
- **Líneas doradas:** dividers horizontales de 1px en color Dorado #D4A017
- **Iconografía:** outline icons estilo "egipcio moderno" — geometría simple, líneas finas
- **Fotografía:** preferir tomas de arquitectura egipcia, atardeceres dorados, oasis, escenas de descanso/abundancia

---

## ✍️ 2. Identidad verbal

### Voz de marca

**Personalidad de Faraón Pay:**
- **Imperial pero accesible** — habla como un consejero real, no como un commercial
- **Confiada sin arrogancia** — "esto funciona", no "esto es lo mejor del mundo"
- **Cálida pero profesional** — humor sutil, nunca payaso
- **Educativa cuando necesario** — explica "vivir como un faraón" si alguien no lo conoce

### Tono según contexto

| Contexto | Tono |
|---|---|
| Outreach inicial | Curioso + valioso ("te traigo una idea, escuchá") |
| Cuestionario | Honesto + breve ("8 min de tu tiempo") |
| Onboarding | Cálido + claro ("bienvenido a Faraón Pay") |
| Soporte | Empático + resolutivo ("entiendo, lo arreglamos") |
| Marketing | Aspiracional + concreto ("vivís como un faraón con $99/mes") |

### Vocabulario aprobado

| Usar ✅ | Evitar ❌ |
|---|---|
| Membresía | Suscripción (suena spam) |
| Vivir como un faraón | Vivir como un rey (genérico) |
| Tu casa funciona sola | Automatización (frío) |
| Equipo de proveedores verificados | Workers (clase distinta) |
| Abundancia | Lujo (excluyente) |
| Faraón Home / Faraón Pro | Cuentas / Usuarios |
| Inversión mensual | Pago / Mensualidad (suena obligación) |

### Taglines según campaña

| Mensaje | Tagline |
|---|---|
| Hero principal | **Vivir como un faraón** / Live like a pharaoh |
| Provider pitch | Convertí tu negocio en un imperio recurrente |
| Homeowner pitch | Tu casa funciona sola. Como un palacio real. |
| Bundle | Un solo pago. Todo tu reino cubierto. |
| Pilot | Sé uno de los 5 primeros faraones del reino |

### Email signature universal

```
Miguel Balart
Founder · Faraón Pay
MacLorian X Group LLC · Cape Coral, FL
contact@maclorianxgroup.com

Vivir como un faraón. Hoy.
👉 faraonpay.com
```

---

## 🏛 3. Arquitectura de marca y tiers

```
MacLorian X Group LLC (parent holding)
└── Faraón Pay (consumer brand)
    │
    ├── 👑 Faraón Home — Para homeowners (consumidores)
    │   ├── Faraón Essential — $99/mes (servicios core)
    │   ├── Faraón Plus — $199/mes (premium tier)
    │   └── Faraón Royal — $399/mes (concierge completo)
    │
    └── 🛠 Faraón Pro — Para proveedores
        ├── Faraón Pro Starter — onboarding gratis primer mes
        ├── Faraón Pro Growth — 10% comisión estándar
        └── Faraón Pro Elite — 7% comisión + marketing dedicado
```

### Naming conventions para futuros features

- **Features de provider:** prefijo `Pro` (`Pro Calendar`, `Pro Earnings`, `Pro Reviews`)
- **Features de homeowner:** prefijo `Home` (`Home Schedule`, `Home Wallet`, `Home Concierge`)
- **Tiers:** nombres egipcios elegantes (`Essential`, `Plus`, `Royal`)
- **Internal projects:** nombres de Reyes/Pharaohs (`Project Khufu` = pyramid-scale feature, `Project Cleopatra` = beauty/wellness expansion, `Project Ramses` = Pro core)

---

## 🎯 4. Aplicación práctica

### Pitch elevator (30 segundos)

> "Faraón Pay es la app donde dueños de casa pagan UNA cuota mensual y reciben todo el mantenimiento de su hogar — lawn, pool, A/C, handyman, todo. Como un faraón antiguo no pensaba en mantener su palacio porque tenía un equipo invisible que lo resolvía. Faraón Pay hace lo mismo para vos, hoy, por $99/mes."

### Posicionamiento vs competencia

| Competidor | Su pitch | Nuestro diferenciador |
|---|---|---|
| Angi (Angie's List) | "Encontrá el mejor pro para tu trabajo" | Nosotros: no buscás cada vez. Pagás una vez al mes y el equipo aparece solo. |
| Thumbtack | "Compará y contratá pros locales" | Nosotros: zero coordination. Vivís como un faraón, no como un gerente de proyecto. |
| HomeAdvisor | "Conectamos homeowners con pros" | Nosotros: marketplace de membresías recurrentes, no de jobs sueltos. |
| Lawnstarter | "Lawn mowing on demand" | Nosotros: 18+ categorías bundled, no monoservicio. |

### Marketing copy templates

**Headline ads (Facebook/Instagram):**
- "Vivir como un faraón cuesta $99/mes. ¿Te animás?"
- "Los faraones tenían un equipo invisible. Vos también podés."
- "Pagás 1 cuota. Tu casa funciona sola. Es así de simple."

**Subject lines (email):**
- "[Nombre], $6,450/mes recurrente + vivir como un faraón"
- "Cómo Faraón Pay cambió la economía doméstica de Cape Coral"
- "Reservamos 5 spots en el piloto — ¿uno es para vos?"

**SMS/WhatsApp hooks (80 caracteres):**
- "Faraón Pay: tu casa funciona sola por $99/mes. 10 min para validarlo? 👇"
- "Convertí tu negocio en imperio recurrente. Faraón Pro arranca aquí 👉"

---

## 📐 5. Specs técnicos para diseño

### Sizes y exportes de logo

| Uso | Tamaño | Formato |
|---|---|---|
| Favicon | 32×32, 16×16 | ICO + PNG |
| App icon | 1024×1024, 512×512, 192×192 | PNG (alpha) |
| Social profile | 400×400 | PNG / JPG |
| Email signature | 600×100 | PNG (alpha) |
| Web header | 240×60 | SVG (preferred) |
| Watermark documents | 800×200 | PNG (alpha, 30% opacity) |

### Snippet CSS variables (drop-in para cualquier pagina)

```css
:root {
  /* Faraón Pay brand palette */
  --fp-gold: #D4A017;
  --fp-lapis: #1F4E79;
  --fp-papyrus: #F5E6C8;
  --fp-carbon: #1A1A1A;
  --fp-sand: #E8DCC4;
  --fp-mali-green: #2D6A4F;
  --fp-aragua-red: #B23A48;
  --fp-bg: #FAF3E0;

  /* Tipografía */
  --fp-display: 'Cinzel', Georgia, serif;
  --fp-body: 'Inter', -apple-system, system-ui, sans-serif;
  --fp-mono: 'JetBrains Mono', 'Courier New', monospace;

  /* Espaciado */
  --fp-radius: 16px;
  --fp-radius-sm: 10px;
  --fp-radius-pill: 999px;
  --fp-shadow: 0 1px 2px rgba(31, 78, 121, 0.06), 0 8px 24px rgba(31, 78, 121, 0.08);
  --fp-shadow-gold: 0 4px 12px rgba(212, 160, 23, 0.20);
}
```

### Botones tipo

```css
.fp-btn-primary {
  background: var(--fp-gold);
  color: var(--fp-carbon);
  font-family: var(--fp-body);
  font-weight: 600;
  padding: 14px 28px;
  border-radius: var(--fp-radius-pill);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  box-shadow: var(--fp-shadow-gold);
  transition: all 0.2s;
}

.fp-btn-primary:hover {
  background: #E5B530;
  transform: translateY(-1px);
}
```

---

## 🚫 6. Qué NO hacer (anti-patrones de marca)

- **❌ Logo en fucsia o colores fluorescentes** — Faraón es noble, no nightclub
- **❌ Imágenes de faraones bailando/cómicos** — respeto a la historia
- **❌ Jeroglíficos random sin sentido** — usar solo símbolos auténticos (ankh, eye of Horus, pyramid)
- **❌ Tipografía Papyrus** ⚠️ — paradójicamente cliché y mal vista en diseño
- **❌ Photoshop de Cleopatra/Tutankamón modernizados** — kitsch
- **❌ Promesas exageradas** — "te convertimos en millonario" no, "te organizamos tu casa" sí
- **❌ Música de fondo "egipcia" estereotipada** en videos — usar música ambient moderna con sutiles toques orientales
- **❌ Hablar de "esclavos" o referencias problemáticas históricas** — siempre "equipo de proveedores verificados"

---

## 🔮 7. Roadmap visual de la marca (12 meses)

| Mes | Hito de marca |
|---|---|
| Mes 1 (now) | Registro legal, dominios, social handles |
| Mes 2 | Identidad visual finalizada (logo final por designer profesional) |
| Mes 3 | Landing page beta + Faraón Home (web) |
| Mes 4 | Faraón Pro dashboard MVP |
| Mes 5 | Lanzamiento del piloto con 5 primeros faraones |
| Mes 6 | Feedback loop + ajustes de UX |
| Mes 9 | App móvil iOS + Android |
| Mes 12 | Expansion fuera de SW Florida (Tampa? Miami?) |

---

## 📚 Referencias visuales para el designer

Cuando contratemos al diseñador profesional, mostrarle estos brands como inspiración:

- **Visual elegance:** Apollo (Apollo Global), Brilliant Earth, Le Labo
- **Premium minimalism:** Public Goods, Allbirds, Recess
- **Bold cultural:** Cleo (the fintech), Kantar (research), Ocean Spray (heritage)
- **Egyptian-inspired modern:** evitar referencias obvias (Tutankamón pop). Mejor: arquitectura de Karnak fotografiada con luz cálida + abstracción geométrica.

NO mostrarle:
- Logos de pirámides de gobiernos (Defensa, agencias)
- Logos de hoteles "egipcios" (Luxor Las Vegas)
- Logos de cigarrillos (Camel — usa pirámides también)

---

¿Avanzamos al archivo 11 (Launch checklist)?
