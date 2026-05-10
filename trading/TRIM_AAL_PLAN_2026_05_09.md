# Plan: Trim AAL — Lunes 12-may-2026

**Generado:** 2026-05-09 (sábado, mercados cerrados)
**Posición actual:** 196 sh @ $10.72 avg, MV $2,582.30, P/L +$481.17 (+18.6%)
**Stop loss activo:** $11.00 ("vender todo sin dudar")
**Status:** PDT ban activo en Moomoo (90d, FINRA Rule 4210)

---

## TL;DR

**Recomendación:** Trim 50% (98 sh) en la apertura del lunes si AAL > $13.20.
Reducir exposición antes del **CPI martes 12-may** y del impacto sostenido de jet fuel +82% YTD.

---

## Contexto que rompe la tesis original

### 1. Iran crisis → jet fuel +82% YTD
- Combustible es ~25% del costo operativo de aerolíneas
- AAL tiene menor hedging que DAL/UAL → más exposición spot
- Cada $10/barrel sostenido = ~$4B costo anual de la industria
- AAL ya bajó guidance EPS Q2-Q3 (revisar earnings call)

### 2. Spirit Airlines bankruptcy 2-may-2026
- Spirit es competidor directo en rutas domésticas low-cost
- Su quiebra parece bullish (menos competencia) PERO:
  - Capacidad se redistribuye → presión de precios temporal
  - Riesgo de contagio en sector si más LCC fallan
  - Inversores cortos rotan a otros nombres del sector

### 3. CPI martes 12-may
- Estimaciones consenso: +0.3% MoM, +3.4% YoY (sticky)
- Si CPI sorprende > +0.4%, expectativa de recortes Fed se aleja
- Aerolíneas son rate-sensitive (deuda alta) → -3 a -5% probable en sector

### 4. Posición técnica AAL actual
- Precio cierre 8-may: ~$13.17
- 50-DMA: ~$12.60 (soporte cercano)
- 200-DMA: ~$13.80 (resistencia overhead)
- RSI(14): ~58 (no sobrecomprado pero estirado)
- Volumen últimos 5d: por debajo del promedio 20d

---

## Plan de ejecución (orden de prioridad)

### Acción 1 · Trim 98 sh @ market open lunes
- **Tipo:** market sell (post-PDT ban → Moomoo bloqueado)
- **Workaround PDT:** ejecutar en cuenta cash (no margin) o esperar 90d
- **Si Moomoo bloquea:** considerar transferir a Robinhood/Fidelity para flexibilidad
- **Target precio:** $13.00 a $13.40 zona razonable
- **P/L realizada esperada:** ~$220 a $260 (98 sh × ($13.20 - $10.72))

### Acción 2 · Stop loss restante 98 sh
- Subir stop a **$12.50** (de $11.00) — protege +$170 de ganancia
- Trailing stop tipo "ratchet": cada $0.50 que sube, sube stop $0.30
- **Stop loss thesis-break:** $11.80 si soporte 50-DMA quiebra

### Acción 3 · Vigilar martes 12-may CPI
- Si CPI < +0.3% → mantener 98 sh restantes (tesis intacta)
- Si CPI +0.3% a +0.4% → trim adicional 49 sh (75% trim total)
- Si CPI > +0.4% → vender 100% restante en open miércoles

### Acción 4 · Re-entry conditions
- AAL < $11.50 + jet fuel < $90/bbl + CPI cooling = re-entry posible
- Evaluar JBLU como alternativa (en watchlist, buy_below=$5)

---

## Cálculos finales

| Escenario | Acción | P/L realizada | Posición restante |
|-----------|--------|---------------|-------------------|
| Best case | Trim 98 sh @ $13.40 | +$262 | 98 sh @ $10.72 |
| Base case | Trim 98 sh @ $13.20 | +$243 | 98 sh @ $10.72 |
| Worst case | Stop $12.50 todo | +$348 | 0 sh |

Capital realizable lunes: **~$1,294 cash** (si trim 98 sh @ $13.20).
P/L total YTD AAL si trim base: $85.60 (realized previo) + $243 = **$328.60**.

---

## Razones para NO hacer nada

(devil's advocate)

1. **Iran crisis puede de-escalar** — Trump/Israel acuerdo posible, fuel cae rápido
2. **Earnings AAL Q1 fueron mejores que esperado** — momentum operativo positivo
3. **Sector beaten down** — múltiplos comprimidos, mean-reversion potencial
4. **Stop $11.00 ya protege** — no urge accionar manualmente
5. **PDT ban penaliza day-trade** — vender ahora + recomprar requiere 90d wait

**Counter:** La tesis es de protección, no de outlook bear total. Mantener 50% mantiene upside.

---

## Calendario de seguimiento

| Fecha | Evento | Acción |
|-------|--------|--------|
| Lun 12 | Market open | Trim 98 sh si AAL > $13.20 |
| Mar 13 | CPI 8:30 ET | Decisión: trim adicional o hold |
| Mié 14 | Continuación | Si CPI hot: vender resto en open |
| Jue 15 | Initial claims | Confirmar narrativa macro |
| Lun 19 | Re-evalúo | Stop trailing + nueva tesis |

---

## Output del agent (cuando se valide con Tony)

```bash
# Tony agent goal:
"Para el lunes en open, trim 98 sh AAL si precio > 13.20.
Subir stop a 12.50 en las 98 sh restantes.
Notificar via Telegram cuando se ejecute."
```

(El agent NO ejecutará la orden — solo prepara la alerta.
Order placement requiere acción manual de Miguel por bloqueo PDT.)
