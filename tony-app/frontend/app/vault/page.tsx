"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import {
  Lock, Unlock, KeyRound, Plus, Loader2, Eye, EyeOff, Copy, Check,
  Trash2, Edit2, Save, X, Shuffle, ExternalLink, AlertTriangle, Search,
  Upload, FileText, FileJson, Sheet, FileUp, AlertCircle
} from "lucide-react";
import {
  generateSalt, encryptEntry, decryptEntry, generatePassword,
  type VaultEntry, type DecryptedEntry,
} from "@/lib/crypto-vault";
import { parseAuto, type ImportedEntry, type ParseResult } from "@/lib/vault-import";
import { TonyKeystoreSection } from "@/components/TonyKeystoreSection";

const CATEGORIES = ["Trading/Brokers", "Banking", "Email/Cloud", "APIs/Dev", "Personal", "Otro"];
const CATEGORY_COLORS: Record<string, string> = {
  "Trading/Brokers": "text-[var(--color-cyan)] border-[var(--color-cyan)]/40",
  "Banking": "text-[var(--color-green)] border-[var(--color-green)]/40",
  "Email/Cloud": "text-purple-400 border-purple-400/40",
  "APIs/Dev": "text-[var(--color-amber)] border-[var(--color-amber)]/40",
  "Personal": "text-pink-400 border-pink-400/40",
  "Otro": "text-[var(--color-text-dim)] border-[var(--color-text-dim)]/40",
};

export default function VaultPage() {
  const [locked, setLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState("");
  const [vaultData, setVaultData] = useState<{ entries: VaultEntry[]; salt_b64: string; iterations: number; exists: boolean }>({ entries: [], salt_b64: "", iterations: 600000, exists: false });
  const [decrypted, setDecrypted] = useState<DecryptedEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  // Edit modal
  const [editing, setEditing] = useState<DecryptedEntry | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  // Reveal/copy
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  // Load encrypted vault on mount
  useEffect(() => {
    api.vaultList().then((d) => {
      if (d.ok) setVaultData({ entries: d.entries || [], salt_b64: d.salt_b64 || "", iterations: d.iterations || 600000, exists: !!d.exists });
    });
  }, []);

  // Auto-lock after 5min idle
  useEffect(() => {
    if (locked) return;
    let timer = setTimeout(() => lock(), 5 * 60 * 1000);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => lock(), 5 * 60 * 1000);
    };
    document.addEventListener("mousemove", reset);
    document.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousemove", reset);
      document.removeEventListener("keydown", reset);
    };
  }, [locked]);

  function lock() {
    setLocked(true);
    setMasterPassword("");
    setDecrypted([]);
    setRevealed({});
    setEditing(null);
    setShowAdd(false);
    setShowImport(false);
  }

  async function handleImport(entries: ImportedEntry[]) {
    if (!entries.length) return;
    // Convert ImportedEntry → DecryptedEntry, dedupe against existing labels
    const existingLabels = new Set(decrypted.map((d) => `${(d.label || "").toLowerCase()}|${(d.username || "").toLowerCase()}`));
    const newDecrypted: DecryptedEntry[] = [];
    for (const e of entries) {
      const key = `${e.label.toLowerCase()}|${(e.username || "").toLowerCase()}`;
      if (existingLabels.has(key)) continue; // skip dupes
      existingLabels.add(key);
      newDecrypted.push({
        id: crypto.randomUUID(),
        label: e.label,
        username: e.username || "",
        password: e.password,
        url: e.url || "",
        notes: e.notes || (e.source_format ? `Importado desde ${e.source_format}` : ""),
        category: e.category || "Otro",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    if (!newDecrypted.length) {
      alert("No se importaron entradas — todas son duplicados de las existentes.");
      return;
    }
    await persistEntries([...decrypted, ...newDecrypted]);
    setShowImport(false);
    alert(`✓ ${newDecrypted.length} entradas importadas y encriptadas correctamente.`);
  }

  async function unlock() {
    if (!masterPassword || unlocking) return;
    setUnlocking(true); setError("");
    try {
      let salt = vaultData.salt_b64;
      let iterations = vaultData.iterations;
      // First-time setup: create new salt
      if (!vaultData.exists || !salt) {
        salt = generateSalt();
        // Save empty vault to seed the file
        await api.vaultSave([], salt, iterations);
        setVaultData({ entries: [], salt_b64: salt, iterations, exists: true });
        setDecrypted([]);
        setLocked(false);
        return;
      }
      // Try decrypt one entry to validate password (or all if any exist)
      const decryptedAll: DecryptedEntry[] = [];
      for (const e of vaultData.entries) {
        const d = await decryptEntry(e, masterPassword, salt, iterations);
        decryptedAll.push(d);
      }
      setDecrypted(decryptedAll);
      setLocked(false);
    } catch (e) {
      setError("Contraseña maestra incorrecta o vault corrupto");
    }
    setUnlocking(false);
  }

  async function backupKeystoreToVault(): Promise<{ ok: boolean; count?: number; error?: string }> {
    try {
      // 1. Get decrypted keystore from backend (localhost-only, DPAPI)
      const dump = await api.keystoreExportDecrypted();
      if (!dump.ok || !dump.secrets || dump.secrets.length === 0) {
        return { ok: false, error: dump.error || "no secrets to backup" };
      }
      // 2. Build DecryptedEntries (label/category match what user expects in vault)
      const newEntries: DecryptedEntry[] = dump.secrets.map((s) => {
        const existing = decrypted.find(
          (d) => d.label === `Tony Keystore: ${s.name}` && d.category === "APIs/Dev"
        );
        const now = new Date().toISOString();
        return {
          id: existing?.id || crypto.randomUUID(),
          label: `Tony Keystore: ${s.name}`,
          username: s.scope || "api",
          password: s.value,
          url: "",
          notes: s.description || `Backup desde Tony keystore (DPAPI). Re-encriptado ZK.`,
          category: "APIs/Dev",
          created_at: existing?.created_at || now,
          updated_at: now,
        };
      });
      // 3. Merge: replace existing Tony Keystore entries, keep the rest
      const others = decrypted.filter(
        (d) => !(d.category === "APIs/Dev" && d.label.startsWith("Tony Keystore:"))
      );
      const merged = [...others, ...newEntries];
      // 4. Encrypt + persist
      await persistEntries(merged);
      return { ok: true, count: newEntries.length };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  }

  async function persistEntries(updatedDecrypted: DecryptedEntry[]) {
    setSaving(true);
    try {
      // Re-encrypt all
      const encrypted: VaultEntry[] = [];
      for (const d of updatedDecrypted) {
        const enc = await encryptEntry(d, masterPassword, vaultData.salt_b64, vaultData.iterations);
        encrypted.push(enc);
      }
      await api.vaultSave(encrypted, vaultData.salt_b64, vaultData.iterations);
      setDecrypted(updatedDecrypted);
      setVaultData({ ...vaultData, entries: encrypted });
    } catch (e) {
      setError("Error guardando: " + String(e));
    }
    setSaving(false);
  }

  async function handleSaveEntry(entry: DecryptedEntry, isNew: boolean) {
    const updated = isNew ? [...decrypted, entry] : decrypted.map((d) => (d.id === entry.id ? entry : d));
    await persistEntries(updated);
    setEditing(null); setShowAdd(false);
  }

  async function deleteEntry(id: string) {
    if (!confirm("¿Eliminar esta entrada permanentemente?")) return;
    const updated = decrypted.filter((d) => d.id !== id);
    await persistEntries(updated);
  }

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    // Auto-clear clipboard after 30s for security
    setTimeout(() => navigator.clipboard.writeText("").catch(() => {}), 30000);
  }

  const filtered = decrypted.filter((d) => {
    if (search && !`${d.label} ${d.username || ""} ${d.url || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && d.category !== filterCategory) return false;
    return true;
  });
  const byCategory: Record<string, number> = {};
  decrypted.forEach((d) => { byCategory[d.category || "Otro"] = (byCategory[d.category || "Otro"] || 0) + 1; });

  // ============ LOCK SCREEN ============
  if (locked) {
    return (
      <div className="p-4 md:p-5 space-y-4">
        <div className="flex flex-col items-center justify-center pt-8 pb-4">
        <Card className="w-full max-w-md" glow="cyan" scanline>
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full border-2 border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 flex items-center justify-center mb-4 glow-cyan">
              <Lock size={28} className="text-[var(--color-cyan)]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] mb-1">Bóveda Bloqueada</h1>
            <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono mb-1">
              ENCRIPTACIÓN AES-GCM 256 · PBKDF2-SHA256 600K · ZERO-KNOWLEDGE
            </div>
            <div className="text-[10px] text-[var(--color-text-dim)] mb-6">
              {vaultData.exists ? `${vaultData.entries.length} entradas encriptadas` : "Primera vez — al ingresar password se creará la bóveda"}
            </div>

            <div className="w-full space-y-3">
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") unlock(); }}
                placeholder="Contraseña maestra"
                autoFocus
                className="w-full px-4 py-3 bg-black/60 border border-[var(--color-border)] rounded text-base font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)] text-center"
              />
              {error && (
                <div className="flex items-center gap-2 text-[var(--color-red)] text-[11px] font-mono justify-center">
                  <AlertTriangle size={12} />{error}
                </div>
              )}
              <button
                onClick={unlock}
                disabled={!masterPassword || unlocking}
                className="w-full px-4 py-3 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                {unlocking ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                <span className="text-[10px] tracking-widest font-mono">
                  {unlocking ? "DESCIFRANDO..." : vaultData.exists ? "DESBLOQUEAR" : "CREAR BÓVEDA"}
                </span>
              </button>
            </div>

            <div className="mt-6 px-4 py-3 bg-[var(--color-amber)]/5 border-l-2 border-[var(--color-amber)] rounded text-[9px] text-[var(--color-text-dim)] text-left w-full">
              <div className="flex items-center gap-2 text-[var(--color-amber)] font-mono tracking-widest mb-1">
                <AlertTriangle size={10} />ZERO-KNOWLEDGE
              </div>
              La contraseña maestra NUNCA se envía al servidor. Solo encripta/descifra en tu navegador. Si la perdés, no hay recuperación posible — los datos quedan inaccesibles.
            </div>
          </div>
        </Card>
        </div>

        {/* Tony API keys (server-side, DPAPI) — accesibles SIN master password */}
        <TonyKeystoreSection />
      </div>
    );
  }

  // ============ UNLOCKED VIEW ============
  return (
    <div className="p-4 md:p-5 space-y-4">
      {/* Subheader strip — Claude Design vocabulary */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Unlock size={14} className="text-[var(--color-green)]" />
            <span className="text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
              BÓVEDA · {decrypted.length} ENTRADAS · DESCIFRADAS EN MEMORIA · AUTO-LOCK 5min
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-[var(--color-amber)] text-[var(--color-amber)] hover:bg-[var(--color-amber)]/10 transition-colors"
              title="Importar archivo .txt / .csv / .json"
            >
              <Upload size={14} />
              <span className="text-[10px] tracking-widest font-mono">IMPORTAR</span>
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/10 transition-colors"
            >
              <Plus size={14} />
              <span className="text-[10px] tracking-widest font-mono">NUEVA ENTRADA</span>
            </button>
            <button
              onClick={lock}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-[var(--color-red)] text-[var(--color-red)] hover:bg-[var(--color-red)]/10 transition-colors"
            >
              <Lock size={14} />
              <span className="text-[10px] tracking-widest font-mono">BLOQUEAR</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <MiniMetric label="TOTAL" value={`${decrypted.length}`} tone="cyan" />
        {CATEGORIES.slice(0, 5).map((c) => (
          <MiniMetric key={c} label={c.split("/")[0].toUpperCase()} value={`${byCategory[c] || 0}`} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar entrada..."
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Entries grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((d) => (
          <Card key={d.id} className="">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <KeyRound size={14} className="text-[var(--color-cyan)] shrink-0" />
                  <span className="text-sm font-bold text-[var(--color-text)] truncate">{d.label}</span>
                </div>
                {d.username && <div className="text-[10px] text-[var(--color-text-dim)] font-mono truncate mt-0.5">{d.username}</div>}
              </div>
              {d.category && (
                <span className={`shrink-0 text-[8px] tracking-widest px-2 py-0.5 rounded border font-mono ${CATEGORY_COLORS[d.category] || CATEGORY_COLORS.Otro}`}>
                  {d.category.split("/")[0]}
                </span>
              )}
            </div>

            {/* Password reveal */}
            <div className="flex items-center gap-2 px-3 py-2 bg-black/60 rounded border border-[var(--color-border)] mb-2">
              <span className="flex-1 text-[11px] font-mono text-[var(--color-text)] truncate">
                {revealed[d.id] ? d.password : "•".repeat(Math.min(d.password.length, 20))}
              </span>
              <button onClick={() => setRevealed((r) => ({ ...r, [d.id]: !r[d.id] }))} className="text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]">
                {revealed[d.id] ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button onClick={() => copyToClipboard(d.password, `pwd-${d.id}`)} className="text-[var(--color-text-dim)] hover:text-[var(--color-green)]">
                {copied === `pwd-${d.id}` ? <Check size={12} className="text-[var(--color-green)]" /> : <Copy size={12} />}
              </button>
            </div>

            {/* URL + actions */}
            <div className="flex items-center justify-between text-[9px] font-mono">
              {d.url ? (
                <a href={d.url.startsWith("http") ? d.url : `https://${d.url}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-cyan)] hover:underline truncate flex items-center gap-1 max-w-[60%]">
                  <ExternalLink size={10} />{d.url}
                </a>
              ) : <span />}
              <div className="flex gap-2">
                <button onClick={() => setEditing(d)} className="text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]" title="Editar">
                  <Edit2 size={12} />
                </button>
                <button onClick={() => deleteEntry(d.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-red)]" title="Eliminar">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            {d.notes && <div className="mt-2 px-2 py-1 bg-[var(--color-amber)]/5 border-l-2 border-[var(--color-amber)] rounded text-[10px] text-[var(--color-text-dim)] line-clamp-2">{d.notes}</div>}
          </Card>
        ))}
        {!filtered.length && (
          <div className="col-span-full text-center py-12 text-[10px] text-[var(--color-text-dim)] font-mono">
            {decrypted.length === 0 ? "Bóveda vacía. Click NUEVA ENTRADA para empezar." : "Sin coincidencias con el filtro."}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {(editing || showAdd) && (
        <EntryModal
          initial={editing}
          onCancel={() => { setEditing(null); setShowAdd(false); }}
          onSave={(e) => handleSaveEntry(e, !editing)}
          saving={saving}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onCancel={() => setShowImport(false)}
          onConfirm={handleImport}
          saving={saving}
        />
      )}

      {/* Tony Keystore — DPAPI server-side API keys, with optional backup to ZK vault */}
      <TonyKeystoreSection onBackupToVault={backupKeystoreToVault} />
    </div>
  );
}

function EntryModal({ initial, onCancel, onSave, saving }: { initial: DecryptedEntry | null; onCancel: () => void; onSave: (e: DecryptedEntry) => void; saving: boolean }) {
  const [label, setLabel] = useState(initial?.label || "");
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState(initial?.password || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [category, setCategory] = useState(initial?.category || "Otro");
  const [showPwd, setShowPwd] = useState(false);

  function generate() { setPassword(generatePassword(20, true)); }

  function submit() {
    if (!label || !password) { alert("Etiqueta y contraseña requeridas"); return; }
    onSave({
      id: initial?.id || crypto.randomUUID(),
      label, username, password, url, notes, category,
      created_at: initial?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-5" onClick={onCancel}>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-cyan)] rounded-lg p-5 w-full max-w-md glow-cyan" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--color-text)]">{initial ? "Editar Entrada" : "Nueva Entrada"}</h2>
          <button onClick={onCancel} className="text-[var(--color-text-dim)] hover:text-[var(--color-red)]"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">ETIQUETA *</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ej. Moomoo cuenta principal" className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]" />
          </div>
          <div>
            <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">CATEGORÍA</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">USUARIO / EMAIL</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]" />
          </div>
          <div>
            <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">CONTRASEÑA *</label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 pr-10 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]" />
                <button onClick={() => setShowPwd(!showPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button onClick={generate} className="px-3 py-2 rounded border border-[var(--color-amber)] text-[var(--color-amber)] hover:bg-[var(--color-amber)]/10" title="Generar contraseña fuerte">
                <Shuffle size={14} />
              </button>
            </div>
          </div>
          <div>
            <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]" />
          </div>
          <div>
            <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">NOTAS</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)] resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onCancel} className="flex-1 px-4 py-2 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
              <span className="text-[10px] tracking-widest font-mono">CANCELAR</span>
            </button>
            <button onClick={submit} disabled={saving || !label || !password} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded bg-[var(--color-green)]/20 border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/40 disabled:opacity-40">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="text-[10px] tracking-widest font-mono">GUARDAR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ IMPORT MODAL ============

function ImportModal({
  onCancel,
  onConfirm,
  saving,
}: {
  onCancel: () => void;
  onConfirm: (entries: ImportedEntry[]) => Promise<void> | void;
  saving: boolean;
}) {
  const [pasted, setPasted] = useState("");
  const [filename, setFilename] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [defaultCategory, setDefaultCategory] = useState<string>("Otro");
  const [overrideCategory, setOverrideCategory] = useState(false);
  const [revealAll, setRevealAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function applyParse(result: ParseResult) {
    setParseResult(result);
    const sel: Record<number, boolean> = {};
    result.entries.forEach((_, i) => { sel[i] = true; });
    setSelected(sel);
  }

  async function handleFile(file: File) {
    const text = await file.text();
    setFilename(file.name);
    setPasted(text);
    const result = parseAuto(text, file.name);
    applyParse(result);
  }

  function handlePastedParse() {
    if (!pasted.trim()) return;
    const result = parseAuto(pasted, filename);
    applyParse(result);
  }

  function toggleAll(value: boolean) {
    if (!parseResult) return;
    const sel: Record<number, boolean> = {};
    parseResult.entries.forEach((_, i) => { sel[i] = value; });
    setSelected(sel);
  }

  function commit() {
    if (!parseResult) return;
    const chosen = parseResult.entries
      .map((e, i) => ({ ...e, _idx: i }))
      .filter((e) => selected[e._idx])
      .map(({ _idx, ...rest }) => ({
        ...rest,
        category: overrideCategory ? defaultCategory : (rest.category || defaultCategory),
      }));
    if (!chosen.length) {
      alert("Selecciona al menos una entrada para importar.");
      return;
    }
    onConfirm(chosen);
  }

  const formatIcon =
    parseResult?.format === "json" ? <FileJson size={12} /> :
    parseResult?.format === "csv" ? <Sheet size={12} /> :
    parseResult?.format === "txt" ? <FileText size={12} /> :
    <FileUp size={12} />;

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-5" onClick={onCancel}>
      <div
        className="bg-[var(--color-bg-card)] border border-[var(--color-amber)] rounded-lg p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto glow-cyan"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-[var(--color-amber)]" />
            <h2 className="text-lg font-bold text-[var(--color-text)]">Importar Credenciales</h2>
          </div>
          <button onClick={onCancel} className="text-[var(--color-text-dim)] hover:text-[var(--color-red)]"><X size={16} /></button>
        </div>

        <div className="px-3 py-2 mb-4 bg-[var(--color-amber)]/5 border-l-2 border-[var(--color-amber)] rounded text-[10px] text-[var(--color-text-dim)]">
          <div className="flex items-center gap-2 text-[var(--color-amber)] font-mono tracking-widest mb-1">
            <AlertCircle size={11} />ZERO-KNOWLEDGE
          </div>
          El archivo se procesa <span className="text-[var(--color-cyan)]">100% en tu navegador</span>. Cada entrada se encripta antes de guardarse.
          Soporta: <span className="font-mono text-[var(--color-text)]">.txt</span> · <span className="font-mono text-[var(--color-text)]">.csv</span> · <span className="font-mono text-[var(--color-text)]">.json</span> · LastPass · Bitwarden · 1Password · genérico con patrones <span className="font-mono">key: value</span>.
        </div>

        {/* Step 1: file input or paste */}
        {!parseResult && (
          <div className="space-y-3">
            <div>
              <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">SELECCIONAR ARCHIVO</label>
              <div className="mt-1 flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.json,.tsv,.1pif,text/plain,text/csv,application/json"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded border-2 border-dashed border-[var(--color-amber)]/50 text-[var(--color-amber)] hover:bg-[var(--color-amber)]/5 transition-colors"
                >
                  <Upload size={16} />
                  <span className="text-[11px] tracking-widest font-mono">
                    {filename ? `ARCHIVO: ${filename}` : "ELEGIR ARCHIVO (.txt / .csv / .json)"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <span className="text-[9px] font-mono text-[var(--color-text-dim)]">O PEGA TEXTO</span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>

            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={8}
              placeholder={`Ejemplos válidos:\n\nGmail\nuser: miguel@correo.com\npassword: MiPass123!\nurl: https://gmail.com\n\nTwitter\nusuario: miguel\ncontraseña: otraPass2!\n\nO formato CSV con headers: name,username,password,url`}
              className="w-full px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-[11px] font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)] resize-none"
            />

            <div className="flex gap-2 pt-1">
              <button onClick={onCancel} className="flex-1 px-4 py-2 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
                <span className="text-[10px] tracking-widest font-mono">CANCELAR</span>
              </button>
              <button
                onClick={handlePastedParse}
                disabled={!pasted.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded bg-[var(--color-amber)]/20 border border-[var(--color-amber)] text-[var(--color-amber)] hover:bg-[var(--color-amber)]/40 disabled:opacity-40"
              >
                <FileUp size={14} />
                <span className="text-[10px] tracking-widest font-mono">ANALIZAR PATRONES</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: review parsed entries */}
        {parseResult && (
          <div className="space-y-3">
            {/* Summary bar */}
            <div className="flex items-center justify-between gap-3 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded">
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-[var(--color-cyan)] uppercase tracking-widest">
                  {formatIcon}{parseResult.format}
                </span>
                <span className="text-[var(--color-text-dim)]">·</span>
                <span className="text-[var(--color-green)]">{parseResult.entries.length} detectadas</span>
                <span className="text-[var(--color-text-dim)]">·</span>
                <span className="text-[var(--color-amber)]">{selectedCount} seleccionadas</span>
                {parseResult.errors.length > 0 && (
                  <>
                    <span className="text-[var(--color-text-dim)]">·</span>
                    <span className="text-[var(--color-red)]">{parseResult.errors.length} avisos</span>
                  </>
                )}
              </div>
              <button
                onClick={() => { setParseResult(null); setSelected({}); }}
                className="text-[9px] font-mono tracking-widest text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]"
              >
                ← VOLVER
              </button>
            </div>

            {/* Errors / warnings */}
            {parseResult.errors.length > 0 && (
              <div className="px-3 py-2 bg-[var(--color-red)]/5 border-l-2 border-[var(--color-red)] rounded text-[10px] text-[var(--color-text-dim)] max-h-24 overflow-y-auto">
                {parseResult.errors.map((err, i) => (
                  <div key={i} className="font-mono text-[10px] truncate">⚠ {err}</div>
                ))}
              </div>
            )}

            {/* Category control */}
            <div className="flex items-center gap-3 px-3 py-2 bg-black/30 border border-[var(--color-border)] rounded">
              <span className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">CATEGORÍA</span>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="px-2 py-1 bg-black/40 border border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-text-dim)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideCategory}
                  onChange={(e) => setOverrideCategory(e.target.checked)}
                  className="accent-[var(--color-cyan)]"
                />
                Aplicar a todas (sobrescribir las del archivo)
              </label>
            </div>

            {/* Bulk select */}
            {parseResult.entries.length > 0 && (
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAll(true)}
                    className="px-2 py-1 rounded border border-[var(--color-green)]/40 text-[var(--color-green)] hover:bg-[var(--color-green)]/10 tracking-widest"
                  >
                    SELECCIONAR TODAS
                  </button>
                  <button
                    onClick={() => toggleAll(false)}
                    className="px-2 py-1 rounded border border-[var(--color-text-dim)]/40 text-[var(--color-text-dim)] hover:bg-white/5 tracking-widest"
                  >
                    NINGUNA
                  </button>
                </div>
                <button
                  onClick={() => setRevealAll(!revealAll)}
                  className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-cyan)]/40 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 tracking-widest"
                >
                  {revealAll ? <EyeOff size={11} /> : <Eye size={11} />}
                  {revealAll ? "OCULTAR" : "REVELAR"} CONTRASEÑAS
                </button>
              </div>
            )}

            {/* Preview list */}
            <div className="border border-[var(--color-border)] rounded max-h-72 overflow-y-auto divide-y divide-[var(--color-border)]">
              {parseResult.entries.length === 0 && (
                <div className="text-center py-8 text-[10px] text-[var(--color-text-dim)] font-mono">
                  No se detectaron credenciales válidas en el contenido.
                </div>
              )}
              {parseResult.entries.map((e, i) => (
                <label
                  key={i}
                  className={`flex items-start gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer ${
                    selected[i] ? "bg-[var(--color-green)]/5" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!selected[i]}
                    onChange={(ev) => setSelected((s) => ({ ...s, [i]: ev.target.checked }))}
                    className="mt-1 accent-[var(--color-green)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <KeyRound size={11} className="text-[var(--color-cyan)] shrink-0" />
                      <span className="text-[12px] font-bold text-[var(--color-text)] truncate">{e.label}</span>
                      {e.source_format && (
                        <span className="text-[8px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-black/60 border border-[var(--color-border)] text-[var(--color-text-dim)] shrink-0">
                          {e.source_format}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 mt-1 text-[10px] font-mono">
                      {e.username && <div className="text-[var(--color-text-dim)] truncate">user: <span className="text-[var(--color-text)]">{e.username}</span></div>}
                      <div className="text-[var(--color-text-dim)] truncate">
                        pass: <span className="text-[var(--color-amber)]">
                          {revealAll ? e.password : "•".repeat(Math.min(e.password.length, 16))}
                        </span>
                      </div>
                      {e.url && <div className="col-span-full text-[var(--color-cyan)] truncate">{e.url}</div>}
                      {e.notes && <div className="col-span-full text-[var(--color-text-dim)] line-clamp-1 italic">{e.notes}</div>}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={onCancel} className="flex-1 px-4 py-2 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
                <span className="text-[10px] tracking-widest font-mono">CANCELAR</span>
              </button>
              <button
                onClick={commit}
                disabled={saving || selectedCount === 0}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-2 rounded bg-[var(--color-green)]/20 border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/40 disabled:opacity-40"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span className="text-[10px] tracking-widest font-mono">
                  ENCRIPTAR E IMPORTAR {selectedCount} ENTRADAS
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
