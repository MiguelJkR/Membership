"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import {
  Webhook, Send, CheckCircle2, XCircle, Loader2, Save, AlertCircle,
  MessageCircle, Hash, Eye, EyeOff, Shield,
} from "lucide-react";

const LEVELS = ["info", "warn", "error", "critical"] as const;
type Level = (typeof LEVELS)[number];

export default function WebhooksPage() {
  const [config, setConfig] = useState<any>(null);
  const [discord, setDiscord] = useState("");
  const [slack, setSlack] = useState("");
  const [levelMin, setLevelMin] = useState<Level>("info");
  const [showDiscord, setShowDiscord] = useState(false);
  const [showSlack, setShowSlack] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [testText, setTestText] = useState("Test desde Tony AI · Webhooks page");
  const [testLevel, setTestLevel] = useState<Level>("info");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    api.alertBridgeStatus().then((d) => {
      if (d.ok) {
        setConfig(d);
        setLevelMin((d.filters?.level_min as Level) || "info");
      }
    });
  }, []);

  async function save() {
    if (saving) return;
    setSaving(true);
    const payload: any = { level_min: levelMin };
    if (discord) payload.discord = discord;
    if (slack) payload.slack = slack;
    const r = await api.alertBridgeConfigure(payload);
    if (r.ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      setDiscord("");
      setSlack("");
      api.alertBridgeStatus().then((d) => d.ok && setConfig(d));
    }
    setSaving(false);
  }

  async function clearChannel(ch: "discord" | "slack") {
    if (!confirm(`¿Borrar webhook de ${ch}?`)) return;
    const payload: any = { [ch]: null };
    await api.alertBridgeConfigure(payload);
    api.alertBridgeStatus().then((d) => d.ok && setConfig(d));
  }

  async function broadcast() {
    if (testing || !testText.trim()) return;
    setTesting(true);
    setTestResult(null);
    const r = await api.alertBridgeBroadcast(testText, testLevel);
    setTestResult(r);
    setTesting(false);
  }

  const discordConfigured = config?.discord === "configured";
  const slackConfigured = config?.slack === "configured";

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Webhooks"
        subtitle="DISCORD · SLACK · BRIDGE DE ALERTAS · HMAC SIGNATURES"
        action={
          <div className="flex items-center gap-2">
            {savedFlash && (
              <span className="text-[10px] font-mono tracking-widest text-[var(--color-green)]">
                ✓ GUARDADO
              </span>
            )}
          </div>
        }
      />

      {/* Status overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className={`border-2 ${discordConfigured ? "border-[var(--color-green)]/40" : "border-[var(--color-border)]"}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${discordConfigured ? "border-[var(--color-green)] bg-[var(--color-green)]/10" : "border-[var(--color-border)] bg-black/40"}`}>
              <MessageCircle size={18} className={discordConfigured ? "text-[var(--color-green)]" : "text-[var(--color-text-dim)]"} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[var(--color-text)]">DISCORD</div>
              <div className={`text-[10px] font-mono tracking-widest ${discordConfigured ? "text-[var(--color-green)]" : "text-[var(--color-text-dim)]"}`}>
                {discordConfigured ? "CONFIGURADO ✓" : "NO CONFIGURADO"}
              </div>
            </div>
          </div>
          {discordConfigured && (
            <button
              onClick={() => clearChannel("discord")}
              className="text-[9px] font-mono tracking-widest text-[var(--color-red)] hover:underline"
            >
              eliminar webhook
            </button>
          )}
        </Card>

        <Card className={`border-2 ${slackConfigured ? "border-[var(--color-green)]/40" : "border-[var(--color-border)]"}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${slackConfigured ? "border-[var(--color-green)] bg-[var(--color-green)]/10" : "border-[var(--color-border)] bg-black/40"}`}>
              <Hash size={18} className={slackConfigured ? "text-[var(--color-green)]" : "text-[var(--color-text-dim)]"} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[var(--color-text)]">SLACK</div>
              <div className={`text-[10px] font-mono tracking-widest ${slackConfigured ? "text-[var(--color-green)]" : "text-[var(--color-text-dim)]"}`}>
                {slackConfigured ? "CONFIGURADO ✓" : "NO CONFIGURADO"}
              </div>
            </div>
          </div>
          {slackConfigured && (
            <button
              onClick={() => clearChannel("slack")}
              className="text-[9px] font-mono tracking-widest text-[var(--color-red)] hover:underline"
            >
              eliminar webhook
            </button>
          )}
        </Card>

        <Card className="border-2 border-[var(--color-cyan)]/40">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 flex items-center justify-center">
              <Shield size={18} className="text-[var(--color-cyan)]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[var(--color-text)]">HMAC SIGNATURES</div>
              <div className="text-[10px] font-mono tracking-widest text-[var(--color-cyan)]">
                ANTI-REPLAY 300s
              </div>
            </div>
          </div>
          <div className="text-[10px] text-[var(--color-text-dim)] font-mono">
            v1,t=&lt;ts&gt;,sig=&lt;hex&gt; · per-channel secrets
          </div>
        </Card>
      </div>

      {/* Configuration form */}
      <Card title="CONFIGURAR WEBHOOKS" glow="cyan">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono">
              DISCORD WEBHOOK URL
            </label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <input
                  type={showDiscord ? "text" : "password"}
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3 py-2 pr-10 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)]"
                />
                <button
                  onClick={() => setShowDiscord(!showDiscord)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]"
                  type="button"
                >
                  {showDiscord ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="text-[9px] text-[var(--color-text-dim)] font-mono mt-1">
              Discord → Settings de canal → Integrations → Webhooks → New Webhook
            </div>
          </div>

          <div>
            <label className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono">
              SLACK WEBHOOK URL
            </label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <input
                  type={showSlack ? "text" : "password"}
                  value={slack}
                  onChange={(e) => setSlack(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3 py-2 pr-10 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)]"
                />
                <button
                  onClick={() => setShowSlack(!showSlack)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]"
                  type="button"
                >
                  {showSlack ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="text-[9px] text-[var(--color-text-dim)] font-mono mt-1">
              api.slack.com → Apps → Incoming Webhooks → Add to Workspace
            </div>
          </div>

          <div>
            <label className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono">
              NIVEL MÍNIMO
            </label>
            <select
              value={levelMin}
              onChange={(e) => setLevelMin(e.target.value as Level)}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l} {l === "info" ? "(todos los alerts)" : l === "critical" ? "(solo críticos)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || (!discord && !slack)}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--color-green)]/20 border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/40 disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="text-[10px] tracking-widest font-mono">GUARDAR CAMBIOS</span>
            </button>
          </div>

          <div className="px-3 py-2 bg-[var(--color-amber)]/5 border-l-2 border-[var(--color-amber)] rounded text-[10px] text-[var(--color-text-dim)] font-mono">
            <div className="flex items-center gap-2 text-[var(--color-amber)] mb-1">
              <AlertCircle size={11} /> SEGURIDAD
            </div>
            URLs nunca se devuelven al frontend después de guardar (solo "configurado/no").
            Cambios solo aplican desde localhost (verifica IP).
          </div>
        </div>
      </Card>

      {/* Test broadcast */}
      <Card title="PROBAR BROADCAST">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono">
              MENSAJE DE PRUEBA
            </label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)] resize-none"
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono">
                NIVEL
              </label>
              <select
                value={testLevel}
                onChange={(e) => setTestLevel(e.target.value as Level)}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]"
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button
              onClick={broadcast}
              disabled={testing || !testText.trim() || (!discordConfigured && !slackConfigured)}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 disabled:opacity-40"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span className="text-[10px] tracking-widest font-mono">ENVIAR</span>
            </button>
          </div>

          {testResult && (
            <div className={`px-3 py-2 rounded border-l-2 ${testResult.ok ? "border-[var(--color-green)] bg-[var(--color-green)]/5" : "border-[var(--color-red)] bg-[var(--color-red)]/5"}`}>
              <div className="flex items-center gap-2 mb-1">
                {testResult.ok ? (
                  <CheckCircle2 size={12} className="text-[var(--color-green)]" />
                ) : (
                  <XCircle size={12} className="text-[var(--color-red)]" />
                )}
                <span className="text-[10px] tracking-widest font-mono text-[var(--color-text)]">
                  {testResult.ok ? "ENVIADO" : "ERROR"}
                </span>
              </div>
              <div className="text-[10px] font-mono text-[var(--color-text-dim)]">
                {testResult.sent_to?.length > 0
                  ? `Llegó a: ${testResult.sent_to.join(", ")}`
                  : testResult.skipped
                  ? `Skipped: ${testResult.skipped}`
                  : "—"}
              </div>
            </div>
          )}

          {!discordConfigured && !slackConfigured && (
            <div className="text-[10px] text-[var(--color-text-dim)] font-mono italic">
              Configurá al menos un webhook arriba para poder probar broadcast.
            </div>
          )}
        </div>
      </Card>

      <Card title="📖 GUÍA DE USO">
        <div className="text-[11px] text-[var(--color-text-dim)] space-y-2 leading-relaxed">
          <div>
            <strong className="text-[var(--color-text)]">¿Para qué?</strong> Replicar alerts de Telegram a Discord o Slack
            para que tu equipo las vea sin estar en tu Telegram personal.
          </div>
          <div>
            <strong className="text-[var(--color-text)]">Discord:</strong> servidor → channel settings → Integrations →
            Webhooks → "New Webhook" → Copy URL.
          </div>
          <div>
            <strong className="text-[var(--color-text)]">Slack:</strong> api.slack.com/apps → tu app → "Incoming Webhooks"
            → "Add to Workspace" → elige channel → Copy URL.
          </div>
          <div>
            <strong className="text-[var(--color-text)]">Filtros:</strong> "Nivel mínimo" filtra qué alerts se envían.
            Por ejemplo, "warn" salta los "info" rutinarios y solo manda warnings + errors + critical.
          </div>
          <div>
            <strong className="text-[var(--color-text)]">Anti-replay:</strong> Cada mensaje saliente lleva HMAC-SHA256
            con timestamp. Verificable en el destino con el secret del canal.
          </div>
        </div>
      </Card>
    </div>
  );
}
