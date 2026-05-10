"use client";
import { useEffect, useState } from "react";
import { api, buildIntentUrl } from "@/lib/api";
import { Card, MiniMetric } from "@/components/Card";
import {
  Send, Loader2, Sparkles, Copy, Check, Megaphone, Calendar, Plus, Clock,
  CheckCircle2, ExternalLink, TrendingUp, Trash2, Edit2, Award, RefreshCw, X, Zap, Heart, MessageCircle, Share2, Eye
} from "lucide-react";

const PLATFORMS = [
  { id: "twitter", label: "Twitter / X", limit: 280 },
  { id: "linkedin", label: "LinkedIn", limit: 1300 },
  { id: "instagram", label: "Instagram", limit: 2200 },
  { id: "tiktok", label: "TikTok", limit: 2200 },
];

const BRANDS = [
  { id: "MacLorian X Group", label: "MacLorian X (holding)" },
  { id: "DEDUTH Academy", label: "DEDUTH Adultos" },
  { id: "DEDUTH Kids", label: "DEDUTH Kids" },
  { id: "TRASLAPP", label: "TRASLAPP" },
];

const SAMPLE_TOPICS = [
  "Lanzamiento DEDUTH Academy adultos — value props",
  "AI-powered productivity for solopreneurs",
  "Behind-the-scenes Tony AI build",
  "Trading transparency real numbers",
  "Por qué no apuntamos al vertical latam",
];

type Draft = { text: string; angle: string };
type QueueEntry = {
  id: string; brand: string; platform: string; text: string; angle?: string;
  scheduled_for: string; status: "scheduled" | "posted" | "skipped";
  ab_set_id?: string; ab_winner?: boolean; ab_score?: number;
  performance: { likes: number; replies: number; shares: number; impressions: number };
  notes?: string; created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)]",
  posted: "border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)]",
  skipped: "border-[var(--color-text-dim)]/40 bg-black/40 text-[var(--color-text-dim)]",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "PROGRAMADO",
  posted: "PUBLICADO",
  skipped: "OMITIDO",
};

export default function SocialManagerPage() {
  // Tabs
  const [tab, setTab] = useState<"composer" | "queue" | "analytics">("composer");

  // Composer state
  const [brand, setBrand] = useState(BRANDS[0].id);
  const [platform, setPlatform] = useState("twitter");
  const [topic, setTopic] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>(getDefaultSchedule());
  const [scheduleAB, setScheduleAB] = useState(true);

  // Queue state
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [perfEditing, setPerfEditing] = useState<string | null>(null);

  function getDefaultSchedule() {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  }

  async function loadQueue() {
    const r = await api.socialQueue();
    if (r.ok) setQueue(r.queue || []);
  }

  useEffect(() => { loadQueue(); }, []);

  // Composer: generate
  async function generate() {
    if (!topic.trim() || generating) return;
    setGenerating(true); setDrafts([]);
    const r = await api.socialPostDraft(brand, topic, platform);
    setGenerating(false);
    let parsedDrafts: Draft[] = [];
    try {
      const responseText = r.response || "";
      const innerStart = responseText.indexOf("{");
      if (innerStart >= 0) {
        const inner = JSON.parse(responseText.substring(innerStart));
        parsedDrafts = inner.drafts || [];
      }
    } catch (e) { console.error("Parse error:", e, "raw:", r); }
    setDrafts(parsedDrafts);
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(null), 2000);
  }

  // Schedule single draft to queue
  async function scheduleSingle(d: Draft) {
    await api.socialQueueAdd([{
      brand, platform, text: d.text, angle: d.angle,
      scheduled_for: new Date(scheduleDate).toISOString(),
    }]);
    await loadQueue();
    alert("Programado para " + new Date(scheduleDate).toLocaleString("es"));
  }

  // Schedule all 3 drafts as A/B variants (different times each)
  async function scheduleAll() {
    if (!drafts.length) return;
    const baseDate = new Date(scheduleDate);
    const ab_set_id = crypto.randomUUID().slice(0, 8);
    const posts = drafts.map((d, i) => {
      const sched = new Date(baseDate);
      // Spread by 24h × i so they don't compete same day
      sched.setHours(sched.getHours() + 24 * i);
      return {
        brand, platform, text: d.text, angle: d.angle,
        scheduled_for: sched.toISOString(),
        ab_set_id: scheduleAB ? ab_set_id : undefined,
      };
    });
    await api.socialQueueAdd(posts);
    await loadQueue();
    setTab("queue");
    alert(`${posts.length} posts agregados a la cola${scheduleAB ? " como variantes A/B" : ""}`);
  }

  // Queue actions
  async function markPosted(entry: QueueEntry) {
    await api.socialQueueUpdate(entry.id, { status: "posted" });
    await loadQueue();
  }
  async function markSkipped(entry: QueueEntry) {
    await api.socialQueueUpdate(entry.id, { status: "skipped" });
    await loadQueue();
  }
  async function deleteEntry(id: string) {
    if (!confirm("¿Eliminar esta entrada de la cola?")) return;
    await api.socialQueueDelete(id);
    await loadQueue();
  }
  async function savePerformance(id: string, perf: any) {
    await api.socialQueueUpdate(id, { performance: perf });
    await loadQueue();
    setPerfEditing(null);
  }

  // Open intent URL + auto-copy text
  function openInPlatform(entry: QueueEntry | { platform: string; text: string }) {
    const url = buildIntentUrl(entry.platform, entry.text);
    navigator.clipboard.writeText(entry.text).catch(() => {});
    window.open(url, "_blank");
  }

  const platformConfig = PLATFORMS.find((p) => p.id === platform);
  const filteredQueue = queue.filter((e) => filterStatus === "all" || e.status === filterStatus);
  const dueNow = queue.filter((e) => e.status === "scheduled" && new Date(e.scheduled_for) <= new Date()).length;
  const scheduled = queue.filter((e) => e.status === "scheduled").length;
  const posted = queue.filter((e) => e.status === "posted").length;
  const abSets = new Set(queue.filter((e) => e.ab_set_id).map((e) => e.ab_set_id)).size;

  return (
    <div className="p-4 md:p-5 space-y-4">
      {/* Subheader strip — Claude Design vocabulary */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Megaphone size={14} className="text-[var(--color-green)]" />
            <span className="text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
              GESTOR DE POSTS · MULTI-PLATAFORMA · BRAND VOICE · GROQ COPYWRITER · QUEUE + A/B
            </span>
          </div>
          <button onClick={loadQueue} className="text-[var(--color-text-dim)] hover:text-[var(--color-green)]" title="Recargar">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
        {[
          { id: "composer", label: "COMPOSITOR", icon: Sparkles, count: drafts.length },
          { id: "queue", label: "COLA", icon: Calendar, count: scheduled, alert: dueNow > 0 },
          { id: "analytics", label: "ANALYTICS A/B", icon: TrendingUp, count: abSets },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                isActive ? "text-[var(--color-cyan)] bg-[var(--color-cyan)]/10 glow-cyan" : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
              }`}
            >
              <Icon size={14} />
              <span className="text-[10px] tracking-widest font-mono">{t.label}</span>
              {t.count > 0 && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                  t.alert ? "bg-[var(--color-red)] text-white animate-pulse" : "bg-[var(--color-cyan)]/30 text-[var(--color-cyan)]"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniMetric label="DEBEN PUBLICARSE" value={`${dueNow}`} tone={dueNow > 0 ? "red" : "green"} />
        <MiniMetric label="PROGRAMADOS" value={`${scheduled}`} tone="amber" />
        <MiniMetric label="PUBLICADOS" value={`${posted}`} tone="green" />
        <MiniMetric label="SETS A/B" value={`${abSets}`} tone="cyan" />
        <MiniMetric label="TOTAL COLA" value={`${queue.length}`} />
      </div>

      {/* === TAB: COMPOSER === */}
      {tab === "composer" && (
        <>
          <Card title="COMPOSITOR DE POSTS" glow="cyan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">MARCA</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]">
                  {BRANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">PLATAFORMA (límite: {platformConfig?.limit} chars)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mt-1">
                  {PLATFORMS.map((p) => (
                    <button key={p.id} onClick={() => setPlatform(p.id)}
                      className={`px-2 py-2 rounded text-[10px] tracking-widest font-mono border transition-colors ${
                        platform === p.id ? "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10" : "border-[var(--color-border)] text-[var(--color-text-dim)]"
                      }`}>{p.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">TÓPICO</label>
              <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="¿De qué querés postear?" rows={3}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)] resize-none" />
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {SAMPLE_TOPICS.map((t) => (
                <button key={t} onClick={() => setTopic(t)} className="text-[9px] font-mono tracking-widest px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/40">{t}</button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={generate} disabled={generating || !topic.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 disabled:opacity-40 transition-colors">
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span className="text-[10px] tracking-widest font-mono">{generating ? "GENERANDO 3 BORRADORES..." : "GENERAR 3 BORRADORES"}</span>
              </button>
              <div className="flex items-center gap-2 text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono">
                <Calendar size={12} />
                <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                  className="px-2 py-1 bg-black/40 border border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]" />
              </div>
              <label className="flex items-center gap-2 text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono cursor-pointer">
                <input type="checkbox" checked={scheduleAB} onChange={(e) => setScheduleAB(e.target.checked)} className="accent-[var(--color-cyan)]" />
                A/B testing (3 variantes, 24h aparte)
              </label>
            </div>

            <div className="text-[9px] text-[var(--color-text-dim)] font-mono mt-2">
              Reglas de marca: WORLDWIDE · prohibido "hispano"/"latam"/"gringo" · directo sin floreo
            </div>
          </Card>

          {drafts.length > 0 && (
            <Card title={`${drafts.length} BORRADORES GENERADOS`} glow="green">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {drafts.map((d, i) => {
                  const tooLong = platformConfig && d.text.length > platformConfig.limit;
                  return (
                    <div key={i} className="p-3 bg-black/40 rounded border border-[var(--color-border)] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] tracking-widest text-[var(--color-cyan)] font-mono">BORRADOR {i + 1} · {d.angle}</span>
                        <button onClick={() => copyText(d.text, `d-${i}`)} className="text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]">
                          {copied === `d-${i}` ? <Check size={12} className="text-[var(--color-green)]" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div className="text-[12px] text-[var(--color-text)] whitespace-pre-wrap leading-relaxed flex-1 min-h-[80px]">{d.text}</div>
                      <div className="flex items-center justify-between text-[8px] tracking-widest font-mono">
                        <span className={tooLong ? "text-[var(--color-red)]" : "text-[var(--color-text-dim)]"}>{d.text.length}/{platformConfig?.limit} chars</span>
                        <div className="flex gap-1">
                          <button onClick={() => openInPlatform({ platform, text: d.text })} title="Abrir en plataforma + copy" className="px-2 py-0.5 rounded border border-[var(--color-cyan)]/40 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10">
                            <ExternalLink size={10} />
                          </button>
                          <button onClick={() => scheduleSingle(d)} title="Agregar a cola" className="px-2 py-0.5 rounded border border-[var(--color-amber)]/40 text-[var(--color-amber)] hover:bg-[var(--color-amber)]/10">
                            <Calendar size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={scheduleAll} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded bg-[var(--color-green)]/20 border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/40 transition-colors">
                <Calendar size={14} />
                <span className="text-[10px] tracking-widest font-mono">PROGRAMAR TODOS A LA COLA{scheduleAB ? " (A/B 24h aparte)" : ""}</span>
              </button>
            </Card>
          )}
        </>
      )}

      {/* === TAB: QUEUE === */}
      {tab === "queue" && (
        <>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "TODOS" },
              { id: "scheduled", label: "PROGRAMADOS" },
              { id: "posted", label: "PUBLICADOS" },
              { id: "skipped", label: "OMITIDOS" },
            ].map((s) => (
              <button key={s.id} onClick={() => setFilterStatus(s.id)}
                className={`px-3 py-1.5 rounded text-[10px] tracking-widest font-mono border transition-colors ${
                  filterStatus === s.id ? "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10" : "border-[var(--color-border)] text-[var(--color-text-dim)]"
                }`}>
                {s.label} {s.id === "all" ? `(${queue.length})` : `(${queue.filter((q) => q.status === s.id).length})`}
              </button>
            ))}
          </div>

          {dueNow > 0 && (
            <Card glow="cyan" className="border-[var(--color-amber)]">
              <div className="flex items-center gap-2 text-[var(--color-amber)] text-sm font-bold">
                <Zap size={16} className="animate-pulse" />
                {dueNow} {dueNow === 1 ? "post está listo" : "posts están listos"} para publicarse ahora
              </div>
              <div className="text-[10px] text-[var(--color-text-dim)] mt-1">
                Click "PUBLICAR EN" → abre la plataforma con el texto pre-llenado en el clipboard, después marcá como publicado.
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredQueue.map((e) => {
              const due = e.status === "scheduled" && new Date(e.scheduled_for) <= new Date();
              const platformInfo = PLATFORMS.find((p) => p.id === e.platform);
              return (
                <Card key={e.id} className={`${due ? "border-[var(--color-amber)] glow-cyan" : ""}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[8px] tracking-widest px-2 py-0.5 rounded border font-mono ${STATUS_COLOR[e.status]}`}>
                          {STATUS_LABEL[e.status]}
                        </span>
                        <span className="text-[9px] font-mono text-[var(--color-cyan)]">{platformInfo?.label || e.platform}</span>
                        <span className="text-[9px] font-mono text-[var(--color-text-dim)]">{e.brand}</span>
                        {e.ab_set_id && (
                          <span className={`text-[8px] tracking-widest px-2 py-0.5 rounded border font-mono ${e.ab_winner ? "border-[var(--color-green)] text-[var(--color-green)] bg-[var(--color-green)]/10" : "border-purple-400/40 text-purple-400"}`}>
                            {e.ab_winner ? <><Award size={9} className="inline mr-0.5" />WINNER</> : `A/B ${e.ab_set_id.substring(0,4)}`}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-[var(--color-text-dim)] font-mono mt-1 flex items-center gap-2">
                        <Clock size={10} />{new Date(e.scheduled_for).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                        {e.angle && <span>· {e.angle}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteEntry(e.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-red)]">
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div className="px-3 py-2 bg-black/60 rounded text-[12px] text-[var(--color-text)] leading-relaxed mb-2 whitespace-pre-wrap">{e.text}</div>

                  {/* Performance display/edit */}
                  {e.status === "posted" && (
                    perfEditing === e.id ? (
                      <PerfEditor entry={e} onSave={(p: any) => savePerformance(e.id, p)} onCancel={() => setPerfEditing(null)} />
                    ) : (
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        <PerfCell icon={Heart} value={e.performance?.likes || 0} label="likes" />
                        <PerfCell icon={MessageCircle} value={e.performance?.replies || 0} label="resp" />
                        <PerfCell icon={Share2} value={e.performance?.shares || 0} label="shares" />
                        <PerfCell icon={Eye} value={e.performance?.impressions || 0} label="vistas" />
                      </div>
                    )
                  )}

                  <div className="flex flex-wrap gap-2">
                    {e.status === "scheduled" && (
                      <>
                        <button onClick={() => { openInPlatform(e); }} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 text-[10px] tracking-widest font-mono">
                          <ExternalLink size={11} />PUBLICAR EN {platformInfo?.label?.split(" ")[0].toUpperCase()}
                        </button>
                        <button onClick={() => markPosted(e)} className="flex items-center justify-center gap-1 px-3 py-1.5 rounded border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/10 text-[10px] tracking-widest font-mono" title="Marcar como publicado">
                          <CheckCircle2 size={11} />HECHO
                        </button>
                        <button onClick={() => markSkipped(e)} className="px-3 py-1.5 rounded border border-[var(--color-text-dim)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] text-[10px] tracking-widest font-mono">
                          OMITIR
                        </button>
                      </>
                    )}
                    {e.status === "posted" && (
                      <button onClick={() => setPerfEditing(e.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded border border-[var(--color-amber)] text-[var(--color-amber)] hover:bg-[var(--color-amber)]/10 text-[10px] tracking-widest font-mono">
                        <Edit2 size={11} />ACTUALIZAR PERFORMANCE
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
            {!filteredQueue.length && (
              <div className="col-span-full text-center py-12 text-[10px] text-[var(--color-text-dim)] font-mono">
                Sin entradas en esta vista. Generá borradores en COMPOSITOR y agregalos a la cola.
              </div>
            )}
          </div>
        </>
      )}

      {/* === TAB: ANALYTICS A/B === */}
      {tab === "analytics" && (
        <ABAnalytics queue={queue} />
      )}
    </div>
  );
}

function PerfCell({ icon: Icon, value, label }: any) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-black/40 rounded border border-[var(--color-border)]">
      <Icon size={11} className="text-[var(--color-text-dim)]" />
      <span className="text-[11px] font-mono font-bold text-[var(--color-text)]">{value}</span>
      <span className="text-[8px] tracking-widest text-[var(--color-text-dim)] font-mono">{label}</span>
    </div>
  );
}

function PerfEditor({ entry, onSave, onCancel }: any) {
  const [p, setP] = useState({
    likes: entry.performance?.likes || 0,
    replies: entry.performance?.replies || 0,
    shares: entry.performance?.shares || 0,
    impressions: entry.performance?.impressions || 0,
  });
  return (
    <div className="grid grid-cols-4 gap-2 mb-2 p-2 bg-black/40 rounded border border-[var(--color-amber)]/40">
      {(["likes", "replies", "shares", "impressions"] as const).map((k) => (
        <div key={k}>
          <label className="text-[8px] tracking-widest text-[var(--color-text-dim)] font-mono">{k}</label>
          <input type="number" value={p[k]} onChange={(e) => setP({ ...p, [k]: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-black border border-[var(--color-border)] rounded text-[11px] font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-amber)]" />
        </div>
      ))}
      <div className="col-span-4 flex gap-2 pt-1">
        <button onClick={() => onSave(p)} className="flex-1 px-3 py-1 rounded bg-[var(--color-green)]/20 border border-[var(--color-green)] text-[var(--color-green)] text-[10px] tracking-widest font-mono">GUARDAR</button>
        <button onClick={onCancel} className="px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] text-[10px] tracking-widest font-mono">CANCELAR</button>
      </div>
    </div>
  );
}

function ABAnalytics({ queue }: { queue: QueueEntry[] }) {
  const sets: Record<string, QueueEntry[]> = {};
  queue.forEach((e) => { if (e.ab_set_id) { if (!sets[e.ab_set_id]) sets[e.ab_set_id] = []; sets[e.ab_set_id].push(e); } });
  const arr = Object.entries(sets).sort((a, b) => b[1].length - a[1].length);

  if (!arr.length) {
    return (
      <Card title="ANALYTICS A/B" glow="cyan">
        <div className="text-[11px] text-[var(--color-text-dim)] py-8 text-center">
          Sin sets A/B todavía. En el Compositor, generá 3 borradores y marcá la opción "A/B testing" antes de programar.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {arr.map(([setId, variants]) => {
        const allPosted = variants.every((v) => v.status === "posted");
        const winner = variants.find((v) => v.ab_winner);
        return (
          <Card key={setId} title={`SET ${setId} · ${variants.length} VARIANTES`} glow={winner ? "green" : "cyan"} action={
            allPosted && winner ? (
              <span className="text-[9px] tracking-widest text-[var(--color-green)] font-mono flex items-center gap-1">
                <Award size={10} />WINNER: variante {variants.findIndex((v) => v.id === winner.id) + 1}
              </span>
            ) : (
              <span className="text-[9px] tracking-widest text-[var(--color-amber)] font-mono">
                {variants.filter((v) => v.status === "posted").length}/{variants.length} publicadas
              </span>
            )
          }>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {variants.map((v, i) => {
                const isWinner = v.ab_winner;
                const score = v.ab_score || 0;
                return (
                  <div key={v.id} className={`p-3 rounded border ${isWinner ? "border-[var(--color-green)] bg-[var(--color-green)]/5" : "border-[var(--color-border)] bg-black/40"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] tracking-widest text-[var(--color-cyan)] font-mono">VARIANTE {i + 1}</span>
                      {isWinner && <Award size={12} className="text-[var(--color-green)]" />}
                    </div>
                    <div className="text-[10px] text-[var(--color-text)] line-clamp-3 mb-2">{v.text}</div>
                    <div className="text-[8px] text-[var(--color-text-dim)] font-mono mb-2">{v.angle}</div>
                    {v.status === "posted" ? (
                      <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                        <div>❤ {v.performance?.likes || 0} likes</div>
                        <div>💬 {v.performance?.replies || 0} resp</div>
                        <div>🔁 {v.performance?.shares || 0} shares</div>
                        <div>👁 {v.performance?.impressions || 0} vistas</div>
                        {score > 0 && <div className="col-span-2 text-[var(--color-cyan)] mt-1">score: {score.toFixed(1)}</div>}
                      </div>
                    ) : (
                      <div className="text-[9px] text-[var(--color-text-dim)] font-mono">
                        {STATUS_LABEL[v.status]} · {new Date(v.scheduled_for).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {allPosted && winner && (
              <div className="mt-3 px-3 py-2 bg-[var(--color-green)]/5 border-l-2 border-[var(--color-green)] rounded text-[10px] text-[var(--color-text-dim)]">
                <strong className="text-[var(--color-green)]">Lección:</strong> el ángulo "{winner.angle}" superó a las otras {variants.length - 1} variantes con score {(winner.ab_score || 0).toFixed(1)}. Reusalo para tópicos similares.
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
