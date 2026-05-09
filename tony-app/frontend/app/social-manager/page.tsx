"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Send, Loader2, Sparkles, Copy, Check, Megaphone } from "lucide-react";

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
  "Por qué we don't target latam vertical",
];

type Draft = { text: string; angle: string };

export default function SocialManagerPage() {
  const [brand, setBrand] = useState(BRANDS[0].id);
  const [platform, setPlatform] = useState("twitter");
  const [topic, setTopic] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  async function generate() {
    if (!topic.trim() || generating) return;
    setGenerating(true); setDrafts([]);
    const r = await api.socialPostDraft(brand, topic, platform);
    setGenerating(false);
    // Parse wrapper output
    let parsedDrafts: Draft[] = [];
    try {
      const stdout = (r as any).stdout || "";
      const mainJson = stdout.indexOf("{");
      if (mainJson >= 0) {
        const wrapper = JSON.parse(stdout.substring(mainJson));
        const responseText = wrapper.response || "";
        // The response should be JSON with drafts array
        const innerStart = responseText.indexOf("{");
        if (innerStart >= 0) {
          const inner = JSON.parse(responseText.substring(innerStart));
          parsedDrafts = inner.drafts || [];
        }
      }
    } catch (e) {
      console.error("Parse error:", e);
    }
    setDrafts(parsedDrafts);
  }

  async function copyToClipboard(text: string, idx: number) {
    await navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  const platformConfig = PLATFORMS.find((p) => p.id === platform);

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Social Post Manager"
        subtitle="MULTI-PLATFORM · BRAND VOICE · GROQ COPYWRITER"
      />

      <Card title="POST COMPOSER" glow="cyan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Brand */}
          <div>
            <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">BRAND</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-cyan)]"
            >
              {BRANDS.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>
          {/* Platform */}
          <div>
            <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">
              PLATFORM (límite: {platformConfig?.limit} chars)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mt-1">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-2 py-2 rounded text-[10px] tracking-widest font-mono border transition-colors ${
                    platform === p.id
                      ? "border-[var(--color-cyan)] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10"
                      : "border-[var(--color-border)] text-[var(--color-text-dim)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topic */}
        <div className="mb-3">
          <label className="text-[9px] tracking-widest text-[var(--color-text-dim)] font-mono">TÓPICO</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="¿De qué querés postear?"
            rows={3}
            className="w-full mt-1 px-3 py-2 bg-black/40 border border-[var(--color-border)] rounded text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-cyan)] resize-none"
          />
        </div>

        {/* Sample topics */}
        <div className="flex flex-wrap gap-2 mb-3">
          {SAMPLE_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className="text-[9px] font-mono tracking-widest px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/40"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={generating || !topic.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded bg-[var(--color-cyan)]/20 border border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/40 disabled:opacity-40 transition-colors"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          <span className="text-[10px] tracking-widest font-mono">
            {generating ? "GENERANDO 3 DRAFTS..." : "GENERAR 3 DRAFTS"}
          </span>
        </button>

        <div className="text-[9px] text-[var(--color-text-dim)] font-mono mt-2">
          Brand voice rules: WORLDWIDE · prohibido "hispano"/"latam"/"gringo" · directo sin floreo
        </div>
      </Card>

      {/* Drafts output */}
      {drafts.length > 0 && (
        <Card title={`${drafts.length} DRAFTS GENERATED`} glow="green">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {drafts.map((d, i) => {
              const tooLong = platformConfig && d.text.length > platformConfig.limit;
              return (
                <div key={i} className="p-3 bg-black/40 rounded border border-[var(--color-border)] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] tracking-widest text-[var(--color-cyan)] font-mono">
                      DRAFT {i + 1} · {d.angle}
                    </span>
                    <button
                      onClick={() => copyToClipboard(d.text, i)}
                      className="text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]"
                      title="Copy to clipboard"
                    >
                      {copied === i ? <Check size={12} className="text-[var(--color-green)]" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="text-[12px] text-[var(--color-text)] whitespace-pre-wrap leading-relaxed flex-1">
                    {d.text}
                  </div>
                  <div className="flex items-center justify-between text-[8px] tracking-widest font-mono">
                    <span className={tooLong ? "text-[var(--color-red)]" : "text-[var(--color-text-dim)]"}>
                      {d.text.length}/{platformConfig?.limit} chars
                    </span>
                    <button
                      onClick={() => alert("Posting flow pendiente — usar Telegram /post o n8n Agent Posting Specialist")}
                      className="px-2 py-0.5 rounded border border-[var(--color-green)]/40 text-[var(--color-green)] hover:bg-[var(--color-green)]/10"
                    >
                      <Megaphone size={10} className="inline mr-1" />POST
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card title="EXISTING WORKFLOW INTEGRATION">
        <div className="space-y-2">
          <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
            <div className="text-[10px] tracking-widest text-[var(--color-cyan)] font-mono">AGENT POSTING SPECIALIST</div>
            <div className="text-[10px] text-[var(--color-text-dim)] mt-1">
              n8n workflow `CFmwSWkCX1J8CWWI` — Bot Tony /post command via Telegram triggers it
            </div>
          </div>
          <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
            <div className="text-[10px] tracking-widest text-[var(--color-amber)] font-mono">CONTENT PIPELINE POV</div>
            <div className="text-[10px] text-[var(--color-text-dim)] mt-1">
              Phase 1+2: 5 imágenes DALL-E + caption viral + slideshow FFmpeg cron weekly. ~$0.20/pieza.
            </div>
          </div>
          <div className="px-3 py-2 bg-black/40 rounded border border-[var(--color-border)]">
            <div className="text-[10px] tracking-widest text-[var(--color-text-dim)] font-mono">TODO</div>
            <ul className="text-[10px] text-[var(--color-text-dim)] mt-1 space-y-0.5">
              <li>• OAuth real con X/Meta/TikTok APIs (gating budget approval)</li>
              <li>• Scheduled posting buffer (drafts → queue → cron publish)</li>
              <li>• A/B testing: 3 drafts → publish best performer</li>
              <li>• Reply/comment monitoring + auto-engagement</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
