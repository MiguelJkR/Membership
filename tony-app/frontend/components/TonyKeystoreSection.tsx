"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  KeyRound, Plus, Loader2, Trash2, Save, X as XIcon,
  CheckCircle2, ShieldCheck, Cpu, Eye, EyeOff, Download,
} from "lucide-react";

type KeystoreSecret = {
  name: string;
  description: string;
  scope: string;
  created_ts: number;
  updated_ts: number;
  value_length: number;
};

const KNOWN_KEYS: Record<string, { label: string; description: string }> = {
  groq_api_key: {
    label: "Groq API",
    description: "LLM primary provider (free tier)",
  },
  anthropic_api_key: {
    label: "Anthropic Claude",
    description: "LLM fallback when Groq rate-limited",
  },
  n8n_api_key: {
    label: "n8n REST API",
    description: "Workflow management",
  },
  openai_api_key: {
    label: "OpenAI",
    description: "Optional alternative LLM",
  },
  telegram_bot_token: {
    label: "Telegram Bot",
    description: "Notification bot",
  },
};

/**
 * TONY KEYSTORE — DPAPI-encrypted server-side secrets that Tony uses programmatically.
 *
 * SEPARADO del zero-knowledge vault:
 *  - Zero-knowledge vault (arriba) → tus passwords personales (banco, email, etc.)
 *    Encriptados con master password en el browser. Tony NO los lee.
 *  - Tony Keystore (este) → API keys que Tony usa al ejecutar tareas.
 *    Encriptados server-side con Windows DPAPI (atado a tu cuenta + PC).
 *    Tony las lee automáticamente sin password.
 */
interface TonyKeystoreSectionProps {
  /** Si se pasa, muestra botón "BACKUP AL VAULT" que llama esta función.
   *  Solo se debe pasar cuando el zero-knowledge vault está unlocked. */
  onBackupToVault?: () => Promise<{ ok: boolean; count?: number; error?: string }>;
}

export function TonyKeystoreSection({ onBackupToVault }: TonyKeystoreSectionProps = {}) {
  const [secrets, setSecrets] = useState<KeystoreSecret[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [showRevealedPlaceholder, setShowRevealedPlaceholder] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.keystoreList();
      if (r.ok) setSecrets(r.secrets);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const flashFor = (msg: string, ms = 3000) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), ms);
  };

  const saveSecret = async () => {
    if (!draftName.trim() || !draftValue.trim()) {
      flashFor("ERR: name + value required");
      return;
    }
    setSaving(true);
    try {
      const r = await api.keystoreSet(
        draftName.trim(),
        draftValue,
        draftDescription || KNOWN_KEYS[draftName.trim()]?.description || ""
      );
      if (r.ok) {
        flashFor(`OK guardado: ${r.name}`);
        setDraftName("");
        setDraftValue("");
        setDraftDescription("");
        setShowAdd(false);
        await load();
      } else {
        flashFor("ERR al guardar");
      }
    } catch (e: any) {
      flashFor("ERR " + (e?.message || "unknown"));
    } finally {
      setSaving(false);
    }
  };

  const deleteSecret = async (name: string) => {
    if (!confirm(`¿Eliminar la key "${name}" del keystore? Esto rompera Tony si ${name} es crítica.`)) return;
    try {
      await api.keystoreDelete(name);
      flashFor(`OK eliminado: ${name}`);
      await load();
    } catch (e: any) {
      flashFor("ERR " + (e?.message || "unknown"));
    }
  };

  const testSecret = async (name: string) => {
    try {
      const r = await api.keystoreTest(name);
      if (r.ok) {
        flashFor(`OK ${name}: prefix=${r.prefix || "?"} length=${r.value_length}`, 5000);
      } else {
        flashFor(`ERR test: ${(r as any).error || "unknown"}`);
      }
    } catch (e: any) {
      flashFor("ERR " + (e?.message || "unknown"));
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 flex items-center justify-center">
            <Cpu size={18} className="text-[var(--color-amber)]" />
          </div>
          <div>
            <h3 className="text-[12px] tracking-[0.25em] font-mono text-[var(--color-text)] font-semibold">
              TONY KEYSTORE · API KEYS
            </h3>
            <div className="text-[9px] tracking-widest font-mono text-[var(--color-text-dim)]">
              DPAPI · WINDOWS-USER-BOUND · SERVER-SIDE
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {flash && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                flash.startsWith("OK")
                  ? "text-[var(--color-green)] border-[var(--color-green)]/40 bg-[var(--color-green)]/10"
                  : "text-[var(--color-red)] border-[var(--color-red)]/40 bg-[var(--color-red)]/10"
              }`}
            >
              {flash}
            </span>
          )}
          {onBackupToVault && secrets.length > 0 && (
            <button
              onClick={async () => {
                setBackingUp(true);
                try {
                  const r = await onBackupToVault();
                  if (r.ok) {
                    flashFor(`OK backup: ${r.count} keys -> vault`, 5000);
                  } else {
                    flashFor(`ERR backup: ${r.error || "unknown"}`, 5000);
                  }
                } catch (e: any) {
                  flashFor("ERR " + (e?.message || "unknown"));
                } finally {
                  setBackingUp(false);
                }
              }}
              disabled={backingUp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest font-mono rounded border border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/20 transition disabled:opacity-50"
              title="Re-encripta cada key con tu master password del vault y las guarda como entradas"
            >
              {backingUp ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
              BACKUP AL VAULT
            </button>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest font-mono rounded border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)] hover:bg-[var(--color-amber)]/20 transition"
          >
            {showAdd ? <XIcon size={11} /> : <Plus size={11} />}
            {showAdd ? "CANCELAR" : "AÑADIR KEY"}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 px-3 py-2 rounded border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 text-[10px] text-[var(--color-text-dim)] leading-relaxed">
        <ShieldCheck size={12} className="text-[var(--color-cyan)] mt-0.5 shrink-0" />
        <div>
          Estas keys las usa Tony AI para llamar APIs (Groq, Anthropic, n8n, etc.). Encriptadas con
          <strong className="text-[var(--color-cyan)]"> Windows DPAPI</strong> — solo tu cuenta de Windows
          en esta PC puede leerlas. Si copiás el archivo a otra máquina, no se descifra.
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded border border-[var(--color-amber)]/30 bg-black/30 p-3 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] tracking-widest font-mono text-[var(--color-text-dim)] block mb-1">
                NOMBRE (ej: openai_api_key)
              </label>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="openai_api_key"
                className="w-full px-2 py-1 text-[10px] font-mono bg-black/40 border border-[var(--color-border)] rounded text-[var(--color-text)] focus:border-[var(--color-amber)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[8px] tracking-widest font-mono text-[var(--color-text-dim)] block mb-1">
                DESCRIPCIÓN (opcional)
              </label>
              <input
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder={KNOWN_KEYS[draftName]?.description || "Para qué se usa"}
                className="w-full px-2 py-1 text-[10px] font-mono bg-black/40 border border-[var(--color-border)] rounded text-[var(--color-text)] focus:border-[var(--color-amber)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[8px] tracking-widest font-mono text-[var(--color-text-dim)] block mb-1 flex items-center gap-2">
              VALOR (la key — se encripta antes de guardarse)
              <button
                type="button"
                onClick={() => setShowRevealedPlaceholder(!showRevealedPlaceholder)}
                className="text-[var(--color-text-dim)] hover:text-[var(--color-amber)]"
              >
                {showRevealedPlaceholder ? <EyeOff size={10} /> : <Eye size={10} />}
              </button>
            </label>
            <input
              type={showRevealedPlaceholder ? "text" : "password"}
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              placeholder="sk-... / xoxb-... / bearer ..."
              className="w-full px-2 py-1 text-[10px] font-mono bg-black/40 border border-[var(--color-border)] rounded text-[var(--color-text)] focus:border-[var(--color-amber)] focus:outline-none"
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={saveSecret}
              disabled={saving || !draftName || !draftValue}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest font-mono rounded border border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)] hover:bg-[var(--color-green)]/20 transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              GUARDAR
            </button>
          </div>
        </div>
      )}

      {/* Secrets list */}
      <div className="space-y-2">
        {loading && (
          <div className="flex items-center gap-2 py-3 text-[var(--color-text-dim)] text-[10px] font-mono">
            <Loader2 size={12} className="animate-spin" /> cargando keystore...
          </div>
        )}
        {!loading && secrets.length === 0 && (
          <div className="text-center py-6 text-[10px] font-mono text-[var(--color-text-dim)]">
            Sin keys guardadas. Click <strong className="text-[var(--color-amber)]">AÑADIR KEY</strong>
          </div>
        )}
        {secrets.map((s) => {
          const known = KNOWN_KEYS[s.name];
          const updated = new Date(s.updated_ts * 1000).toLocaleString("es-AR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div
              key={s.name}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded border border-[var(--color-border)] bg-black/30 hover:border-[var(--color-amber)]/30 transition"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <KeyRound size={13} className="text-[var(--color-amber)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold text-[var(--color-text)]">
                      {s.name}
                    </span>
                    {known?.label && (
                      <span className="text-[8px] tracking-widest font-mono px-1.5 py-0.5 rounded bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/30 text-[var(--color-cyan)]">
                        {known.label}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-[var(--color-text-dim)] truncate">
                    {s.description || known?.description || "(sin descripción)"}
                    {" · "}
                    actualizada {updated}
                    {" · "}
                    {s.value_length}b cifrados
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => testSecret(s.name)}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] tracking-widest font-mono rounded border border-[var(--color-cyan)]/40 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 transition"
                  title="Verifica que se puede desencriptar"
                >
                  <CheckCircle2 size={10} />
                  TEST
                </button>
                <button
                  onClick={() => deleteSecret(s.name)}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] tracking-widest font-mono rounded border border-[var(--color-red)]/40 text-[var(--color-red)] hover:bg-[var(--color-red)]/10 transition"
                  title="Eliminar permanentemente"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
