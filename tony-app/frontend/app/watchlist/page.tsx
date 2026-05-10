"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import {
  Eye, AlertTriangle, TrendingUp, TrendingDown, Clock, Loader2,
  CheckCircle2, AlertCircle, Activity, Edit2, Save, X as XIcon,
  Plus as PlusIcon, Trash2,
} from "lucide-react";

const PRIORITY_STYLES = {
  critical: "border-[var(--color-red)] bg-[var(--color-red)]/5 text-[var(--color-red)]",
  high: "border-[var(--color-amber)] bg-[var(--color-amber)]/5 text-[var(--color-amber)]",
  info: "border-[var(--color-cyan)] bg-[var(--color-cyan)]/5 text-[var(--color-cyan)]",
};

const EMPTY_TRIGGER = {
  id: "",
  symbol: "",
  trigger_above: null as number | null,
  trigger_below: null as number | null,
  action: "",
  rationale: "",
  priority: "info",
  cooldown_h: 24,
};

export default function WatchlistPage() {
  const [data, setData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => api.watchlistTriggers().then(setData);
    refresh();
    const i = setInterval(refresh, 30000);
    return () => clearInterval(i);
  }, []);

  const startEdit = () => {
    if (!data?.triggers) return;
    setDraft(JSON.parse(JSON.stringify(data.triggers)));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft([]);
  };

  const saveTriggers = async () => {
    setSaving(true);
    try {
      // Validate required fields
      const errors: string[] = [];
      draft.forEach((t, i) => {
        if (!t.id) errors.push(`Trigger #${i + 1}: id requerido`);
        if (!t.symbol) errors.push(`Trigger #${i + 1}: symbol requerido`);
        if (!t.action) errors.push(`Trigger #${i + 1}: action requerido`);
        if (t.trigger_above == null && t.trigger_below == null) {
          errors.push(`Trigger #${i + 1}: trigger_above OR trigger_below requerido`);
        }
      });
      if (errors.length) {
        setSavedFlash("ERR: " + errors[0]);
        setTimeout(() => setSavedFlash(null), 4000);
        setSaving(false);
        return;
      }
      // Strip nulls and computed fields before save
      const clean = draft.map((t) => {
        const o: any = {
          id: t.id,
          symbol: t.symbol,
          action: t.action,
          priority: t.priority || "info",
          cooldown_h: Number(t.cooldown_h) || 24,
        };
        if (t.trigger_above != null && t.trigger_above !== "") o.trigger_above = Number(t.trigger_above);
        if (t.trigger_below != null && t.trigger_below !== "") o.trigger_below = Number(t.trigger_below);
        if (t.rationale) o.rationale = t.rationale;
        if (t.valid_from) o.valid_from = t.valid_from;
        return o;
      });
      const r = await api.watchlistTriggersSave(clean);
      if (r.ok && r.saved) {
        setSavedFlash(`OK guardados ${r.count}`);
        setEditing(false);
        setDraft([]);
        // Refresh
        api.watchlistTriggers().then(setData);
      } else {
        setSavedFlash("ERR al guardar");
      }
    } catch (e: any) {
      setSavedFlash("ERR " + (e?.message || "unknown"));
    } finally {
      setSaving(false);
      setTimeout(() => setSavedFlash(null), 3500);
    }
  };

  const addTrigger = () => {
    setDraft([...draft, { ...EMPTY_TRIGGER, id: `trigger_${Date.now()}` }]);
  };

  const removeTrigger = (idx: number) => {
    setDraft(draft.filter((_, i) => i !== idx));
  };

  const updateTrigger = (idx: number, patch: any) => {
    setDraft(draft.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  if (!data) {
    return (
      <div className="p-5">
        <PageHeader title="Watchlist" subtitle="ALERTS POR PRECIO · COOLDOWNS · MARKET HOURS" />
        <Card>
          <div className="flex items-center gap-2 py-4 text-[var(--color-text-dim)] text-[11px] font-mono">
            <Loader2 size={14} className="animate-spin" /> cargando triggers...
          </div>
        </Card>
      </div>
    );
  }

  const triggers = data.triggers || [];
  const bySymbol: Record<string, any[]> = {};
  for (const t of triggers) {
    bySymbol[t.symbol] = bySymbol[t.symbol] || [];
    bySymbol[t.symbol].push(t);
  }

  const criticals = triggers.filter((t: any) => t.priority === "critical");
  const highs = triggers.filter((t: any) => t.priority === "high");
  const infos = triggers.filter((t: any) => t.priority === "info");
  const cooldowns = triggers.filter((t: any) => t.in_cooldown);

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Watchlist"
        subtitle="ALERTS POR PRECIO · COOLDOWNS · MARKET HOURS · AUTO-REFRESH 30s"
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniMetric label="TRIGGERS" value={`${data.total}`} tone="cyan" />
        <MiniMetric label="CRÍTICOS" value={`${criticals.length}`} tone="red" />
        <MiniMetric label="ALTA PRIO" value={`${highs.length}`} tone="amber" />
        <MiniMetric label="INFO" value={`${infos.length}`} tone="cyan" />
        <MiniMetric label="EN COOLDOWN" value={`${data.active_cooldowns}`} tone="amber" />
      </div>

      {/* Edit mode toolbar */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Eye size={13} className="text-[var(--color-cyan)]" />
            <span className="text-[10px] tracking-widest font-mono text-[var(--color-text-dim)]">
              {editing ? "MODO EDICIÓN ACTIVO" : "MODO LECTURA"}
            </span>
            {savedFlash && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                savedFlash.startsWith("OK")
                  ? "text-[var(--color-green)] border-[var(--color-green)]/40 bg-[var(--color-green)]/10"
                  : "text-[var(--color-red)] border-[var(--color-red)]/40 bg-[var(--color-red)]/10"
              }`}>{savedFlash}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest font-mono rounded border border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/20 transition"
              >
                <Edit2 size={11} /> EDITAR TRIGGERS
              </button>
            ) : (
              <>
                <button
                  onClick={addTrigger}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest font-mono rounded border border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)] hover:bg-[var(--color-green)]/20 transition"
                >
                  <PlusIcon size={11} /> AÑADIR
                </button>
                <button
                  onClick={saveTriggers}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest font-mono rounded border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)] hover:bg-[var(--color-amber)]/20 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} GUARDAR
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest font-mono rounded border border-[var(--color-red)]/40 bg-[var(--color-red)]/10 text-[var(--color-red)] hover:bg-[var(--color-red)]/20 transition"
                >
                  <XIcon size={11} /> CANCELAR
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Edit mode: list of editable triggers */}
      {editing ? (
        <Card title="EDITOR DE TRIGGERS" glow="cyan">
          <div className="space-y-3">
            {draft.map((t, i) => (
              <TriggerEditor
                key={i}
                trigger={t}
                idx={i}
                onChange={(patch) => updateTrigger(i, patch)}
                onRemove={() => removeTrigger(i)}
              />
            ))}
            {draft.length === 0 && (
              <div className="text-center py-8 text-[10px] font-mono text-[var(--color-text-dim)]">
                Sin triggers. Click <strong className="text-[var(--color-green)]">AÑADIR</strong> para crear uno nuevo.
              </div>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Triggers grouped by symbol */}
          <Card title="TRIGGERS POR SYMBOL" glow="cyan">
            <div className="space-y-4">
              {Object.entries(bySymbol).map(([symbol, syms]) => (
                <div key={symbol}>
                  <div className="flex items-center gap-2 mb-2">
                    <Eye size={13} className="text-[var(--color-cyan)]" />
                    <span className="text-base font-bold text-[var(--color-text)]">{symbol}</span>
                    <span className="text-[9px] tracking-widest font-mono text-[var(--color-text-dim)]">
                      {(syms as any[]).length} trigger{(syms as any[]).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(syms as any[]).map((t) => (
                      <TriggerCard key={t.id} trigger={t} />
                    ))}
                  </div>
                </div>
              ))}
              {triggers.length === 0 && (
                <div className="text-center py-8 text-[10px] font-mono text-[var(--color-text-dim)]">
                  Sin triggers configurados.<br />
                  Click <strong className="text-[var(--color-cyan)]">EDITAR TRIGGERS</strong> para crear uno.
                </div>
              )}
            </div>
          </Card>

          {/* Cooldowns active */}
          {cooldowns.length > 0 && (
            <Card title="COOLDOWNS ACTIVOS" glow="cyan">
              <div className="space-y-1">
                {cooldowns.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-black/40 rounded border border-[var(--color-amber)]/40">
                    <div className="flex items-center gap-2">
                      <Clock size={11} className="text-[var(--color-amber)]" />
                      <span className="text-[11px] text-[var(--color-text)] font-bold">{t.symbol}</span>
                      <span className="text-[10px] font-mono text-[var(--color-text-dim)]">{t.id}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[var(--color-amber)]">
                      {t.cooldown_remaining_min} min restantes
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      <Card title="📖 INFO">
        <div className="text-[11px] text-[var(--color-text-dim)] space-y-2 leading-relaxed">
          <div>
            <strong className="text-[var(--color-text)]">Watchlist Alerter Cron</strong> corre cada 5 min durante
            market hours (9:30–16:00 ET, Mon-Fri). Verifica precios via <code>price_fetcher.py</code> y
            dispara alertas a Telegram cuando un trigger se cumple.
          </div>
          <div>
            <strong className="text-[var(--color-text)]">Cooldowns</strong> evitan spam: tras disparar un trigger,
            no se vuelve a alertar por <code>cooldown_h</code> horas (default 24h, crítico 6h).
          </div>
          <div>
            <strong className="text-[var(--color-text)]">Editor inline:</strong> los cambios se guardan en
            <code> watchlist_triggers.json</code> con backup automático <code>.bak</code>. El cron lee el archivo
            cada ciclo, no hace falta reiniciar.
          </div>
        </div>
      </Card>
    </div>
  );
}

function TriggerCard({ trigger }: { trigger: any }) {
  const isAbove = "trigger_above" in trigger;
  const target = isAbove ? trigger.trigger_above : trigger.trigger_below;
  const TrendIcon = isAbove ? TrendingUp : TrendingDown;
  const priority = trigger.priority || "info";
  const styleClass = PRIORITY_STYLES[priority as keyof typeof PRIORITY_STYLES] || PRIORITY_STYLES.info;

  // Calc % distance if we have last_price
  let distance: string | null = null;
  if (trigger.last_price && target) {
    const pct = ((trigger.last_price - target) / target) * 100;
    distance = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
  }

  return (
    <div className={`px-3 py-2 rounded border-l-2 ${styleClass}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <TrendIcon size={12} />
          <span className="text-[11px] font-mono font-bold text-[var(--color-text)] truncate">{trigger.id}</span>
        </div>
        <span className="text-[8px] tracking-widest font-mono px-1.5 py-0.5 rounded bg-black/40 shrink-0">
          {priority.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--color-text-dim)]">
        <span>
          {isAbove ? "→ above" : "→ below"} <span className="text-[var(--color-text)]">${target?.toFixed(2)}</span>
        </span>
        {trigger.last_price !== undefined && trigger.last_price !== null && (
          <>
            <span>·</span>
            <span>last: ${trigger.last_price?.toFixed(2)}</span>
          </>
        )}
        {distance && (
          <>
            <span>·</span>
            <span className={distance.startsWith("-") ? "text-[var(--color-red)]" : "text-[var(--color-green)]"}>
              {distance}
            </span>
          </>
        )}
      </div>

      <div className="mt-1.5 flex items-start gap-2">
        <CheckCircle2 size={10} className="text-[var(--color-green)] mt-0.5 shrink-0" />
        <div className="text-[10px] text-[var(--color-text)]">
          <span className="font-semibold">Acción:</span> {trigger.action}
        </div>
      </div>

      {trigger.rationale && (
        <div className="mt-1 flex items-start gap-2">
          <AlertCircle size={10} className="text-[var(--color-text-dim)] mt-0.5 shrink-0" />
          <div className="text-[9px] text-[var(--color-text-dim)] italic">{trigger.rationale}</div>
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between text-[8px] font-mono">
        {trigger.in_cooldown ? (
          <span className="flex items-center gap-1 text-[var(--color-amber)]">
            <Clock size={9} /> COOLDOWN {trigger.cooldown_remaining_min}m
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[var(--color-green)]">
            <Activity size={9} /> ARMADO
          </span>
        )}
        <span className="text-[var(--color-text-dim)]">cooldown {trigger.cooldown_h}h</span>
      </div>
    </div>
  );
}

function TriggerEditor({
  trigger, idx, onChange, onRemove,
}: { trigger: any; idx: number; onChange: (p: any) => void; onRemove: () => void }) {
  const inputCls = "px-2 py-1 text-[10px] font-mono bg-black/40 border border-[var(--color-border)] rounded text-[var(--color-text)] focus:border-[var(--color-cyan)] focus:outline-none w-full";
  const labelCls = "text-[8px] tracking-widest font-mono text-[var(--color-text-dim)] block mb-1";

  return (
    <div className="px-3 py-3 rounded border border-[var(--color-amber)]/30 bg-black/30 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-widest font-mono text-[var(--color-text-dim)]">
          TRIGGER #{idx + 1}
        </span>
        <button
          onClick={onRemove}
          className="flex items-center gap-1 px-2 py-0.5 text-[9px] tracking-widest font-mono rounded border border-[var(--color-red)]/40 text-[var(--color-red)] hover:bg-[var(--color-red)]/10 transition"
        >
          <Trash2 size={9} /> ELIMINAR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>ID (único)</label>
          <input
            className={inputCls}
            value={trigger.id || ""}
            onChange={(e) => onChange({ id: e.target.value })}
            placeholder="aal_breakout_12_50"
          />
        </div>
        <div>
          <label className={labelCls}>SYMBOL</label>
          <input
            className={inputCls}
            value={trigger.symbol || ""}
            onChange={(e) => onChange({ symbol: e.target.value.toUpperCase() })}
            placeholder="AAL"
          />
        </div>
        <div>
          <label className={labelCls}>TRIGGER_ABOVE ($)</label>
          <input
            type="number"
            step="0.01"
            className={inputCls}
            value={trigger.trigger_above ?? ""}
            onChange={(e) => onChange({
              trigger_above: e.target.value === "" ? null : parseFloat(e.target.value),
              trigger_below: e.target.value !== "" ? null : trigger.trigger_below,
            })}
            placeholder="12.50"
          />
        </div>
        <div>
          <label className={labelCls}>TRIGGER_BELOW ($)</label>
          <input
            type="number"
            step="0.01"
            className={inputCls}
            value={trigger.trigger_below ?? ""}
            onChange={(e) => onChange({
              trigger_below: e.target.value === "" ? null : parseFloat(e.target.value),
              trigger_above: e.target.value !== "" ? null : trigger.trigger_above,
            })}
            placeholder="11.80"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>ACTION (qué hacer cuando dispare)</label>
        <input
          className={inputCls}
          value={trigger.action || ""}
          onChange={(e) => onChange({ action: e.target.value })}
          placeholder="Trim 50% AAL — toma ganancias"
        />
      </div>

      <div>
        <label className={labelCls}>RATIONALE (opcional)</label>
        <input
          className={inputCls}
          value={trigger.rationale || ""}
          onChange={(e) => onChange({ rationale: e.target.value })}
          placeholder="Breakout sobre EMA50, volumen confirmado"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelCls}>PRIORITY</label>
          <select
            className={inputCls}
            value={trigger.priority || "info"}
            onChange={(e) => onChange({ priority: e.target.value })}
          >
            <option value="info">info</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>COOLDOWN (h)</label>
          <input
            type="number"
            min="1"
            max="168"
            className={inputCls}
            value={trigger.cooldown_h ?? 24}
            onChange={(e) => onChange({ cooldown_h: parseInt(e.target.value) || 24 })}
          />
        </div>
        <div>
          <label className={labelCls}>VALID_FROM (opcional, YYYY-MM-DD)</label>
          <input
            className={inputCls}
            value={trigger.valid_from || ""}
            onChange={(e) => onChange({ valid_from: e.target.value })}
            placeholder="2026-05-09"
          />
        </div>
      </div>
    </div>
  );
}
