# COPPA Compliance Checklist — DEDUTH ACADEMY KIDS

**Producto:** kids.deduthacademy.com (live)
**Audiencia:** menores de 13 años (US) + 6-14 años total
**Operador:** MacLorian X Group LLC (Cape Coral, FL)
**Última revisión:** 2026-05-09 (Claude/Tony agent)
**Status global:** ⚠ PARCIAL — privacy OK, falta consent flow + retention pruebas

---

## A · Direct notice (15 USC §6502(b)(1)(A))

- [x] Privacy notice prominente en homepage del KIDS site
- [x] Política accesible antes del signup
- [ ] **Notice directo al padre por email ANTES del signup del niño** ⚠
- [ ] Confirmación de recepción del notice por el padre

**Acción:** implementar email transaccional `coppa-notice@maclorianxgroup.com` que se envía al email parental ANTES de habilitar la cuenta del niño. Plantilla en `marketing-kids/legal/email-coppa-notice.md`.

---

## B · Verifiable Parental Consent (VPC) — FTC-approved methods

Cualquiera de los siguientes (1 basta para sub-13):

- [ ] **Credit card / debit card con micro-cargo de $0.10 reembolsable** ⚠ recomendado
- [ ] Government ID + verificación cara-a-cara (video o foto)
- [ ] Llamada telefónica a staff con verificación de identidad
- [ ] Knowledge-based authentication (questions difíciles)
- [ ] Email + delayed confirmation (ONLY si la app no comparte info con terceros)

**Acción:** implementar `marketing-kids/coppa-consent/` — flujo:
1. Padre ingresa email + nombre
2. Email de doble opt-in con link único TTL 24h
3. Click confirmación → micro-cargo Stripe $0.10 (reembolso instantáneo)
4. Cuenta del niño se activa en Firebase
5. Token JWT con `coppa_verified=true` + `verified_at` ts

Stack: Stripe Checkout + Firebase Auth + email transaccional via SendGrid.

---

## C · Data minimization (15 USC §6502(b)(1)(C))

Solo recolectar lo necesario:

- [x] Edad del niño — sí (necesario para gating)
- [x] Avatar / nombre de pila — opcional
- [x] Progreso lecciones — sí (core feature)
- [ ] **NO** geolocalización
- [ ] **NO** dirección física
- [ ] **NO** número de teléfono del niño
- [ ] **NO** foto del niño (sólo avatar dibujado)
- [ ] **NO** voice clips del niño

**Verificar en código:** `grep -r "child.*phone\|child.*address\|child.*photo" deduth_academy/`

---

## D · Notice of practices (15 USC §6502(b)(1)(B))

- [x] Lista completa de datos recolectados — en privacy/index.html sección 3
- [x] Cómo se usan los datos — sección 5
- [x] Tiempo de retención — sección 7
- [x] Compartir con terceros — sección 9 (Firebase/Google Cloud)
- [ ] **DPAs firmados con terceros** ⚠ confirmar Firebase Data Processing Addendum

**Acción:** descargar y firmar Firebase DPA: https://firebase.google.com/terms/data-processing-terms

---

## E · No condition (15 USC §6502(b)(1)(D))

> No se debe condicionar la participación del niño a la entrega de más info de la necesaria

- [x] Lecciones gratis no requieren info adicional
- [x] Premium tier solo requiere email parental + payment
- [ ] **Auditar: features que ofrecen "más" si das más info** — ninguna debería existir

---

## F · Right to review/delete (15 USC §6502(b)(1)(B)(iii))

- [x] Política dice cómo solicitar — sección 8
- [x] Email de contacto — contact@maclorianxgroup.com
- [ ] **Endpoint API para auto-export JSON** del niño ⚠
- [ ] **Endpoint API para delete completo** (cascade Firestore) ⚠
- [ ] SLA: respuesta en 30 días — proceso documentado para Miguel

**Acción:** implementar `/api/coppa/export?email=parent@...&token=...` y `/api/coppa/delete`.

---

## G · Reasonable security (15 USC §6502(b)(1)(D))

- [x] HTTPS obligatorio en todo el flujo (Vercel default)
- [x] Firebase Auth maneja credenciales
- [ ] **Encryption at rest** — Firestore tiene por default; documentar
- [ ] **Logs no contienen PII de niños** ⚠ auditar logging
- [ ] **Backup encryption** — verificar offsite backup

---

## H · Safe Harbor program (opcional, recomendado)

Programas certificados por FTC que dan presunción de cumplimiento:

- [ ] kidSAFE+ Seal Program — $250-$1500/año
- [ ] PRIVO — costos similares
- [ ] iKeepSafe — gratis para apps small

**Recomendación:** kidSAFE+ Seal Program tier "Educational" — ~$500/año.
Beneficio: si FTC investiga, presunción de buena fe + auditorías anuales reducidas.

---

## I · Breach notification

- [ ] Plan documentado de respuesta a brecha
- [ ] Notificación a padres en <72h si data del niño expuesta
- [ ] Reporte FTC si afecta >500 niños

**Acción:** copiar plantilla GDPR breach response y adaptar para COPPA en `legal-internal/breach_response_plan.md`.

---

## J · International equivalents

| Región | Ley | Edad | Status |
|--------|-----|------|--------|
| US | COPPA | <13 | ⚠ implementar |
| EU/UK | GDPR-K | <16 (ES <14) | ⚠ verificar |
| Brasil | LGPD-K | <12 | ⚠ verificar |
| Argentina | PDP-K | <13 | ⚠ verificar |
| México | LFPDPPP-K | <14 | ⚠ verificar |

---

## Próximas acciones (orden de prioridad)

1. **Implementar parental consent flow** (`/coppa-consent/`) — bloquea signups sub-13 hasta que esté
2. **Email coppa-notice transaccional** — antes de cualquier signup
3. **Endpoints export/delete COPPA** — derecho del padre
4. **Firmar Firebase DPA** — 5 min
5. **Auditar logs por PII de niños** — grep en código
6. **Comprar kidSAFE+ Seal** — $500/año (opcional pero ROI alto si FTC investiga)
7. **Plan de breach response** — copiar template

---

## Riesgo regulatorio (FTC)

- **Multa por violación:** hasta **$51,744 USD por niño afectado** (ajustada inflación 2026)
- **Casos recientes:**
  - YouTube/Google: $170M en 2019
  - TikTok: $5.7M en 2019
  - Epic Games (Fortnite): $275M en 2022 (la mayor)
- **Para una app pequeña con 1000 niños afectados:** exposición teórica $51M. Realista: $50k-$500k para primera ofensa con buena fe demostrada.

**Mitigación clave:** documentar todo + responder dentro de 30 días + Safe Harbor seal.
