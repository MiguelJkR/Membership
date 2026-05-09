/**
 * TONY AI API client.
 * Uses NEXT_PUBLIC_API_URL env var or fallback to local Flask dashboard.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8765";

export type FetchResult<T> = T & { ok?: boolean; error?: string };

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<FetchResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` } as FetchResult<T>;
    }
    return await res.json();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) } as FetchResult<T>;
  }
}

export const api = {
  portfolio: () => fetchJson<{ combined: any; moomoo: any; oanda: any; real_money_only: any; breakdown: any }>("/api/portfolio"),
  perfHistory: () => fetchJson<{ rows: Array<{ ts: string; combined_value: number; moomoo_pl: number; oanda_pl: number }> }>("/api/perf_history"),
  risk: () => fetchJson<{ total_score: number; label: string; components: Record<string, { score: number }> }>("/api/risk"),
  vix: () => fetchJson<{ vix: number; regime: string }>("/api/vix"),
  agents: () => fetchJson<{ count: number; agents: Array<{ name: string; category: string; active: boolean }> }>("/api/agents"),
  signals: () => fetchJson<{ signals: Array<{ id: string; action: string; symbol: string; price?: number; shares?: number }> }>("/api/signals"),
  trading: () => fetchJson<{ moomoo_positions: any[]; oanda: { open_positions: any[]; open_trades_count: number } }>("/api/trading"),
  health: () => fetchJson<{ composite_score: number; components: Record<string, { score: number }> }>("/api/health"),
  emailDrafts: () => fetchJson<{ count: number; drafts: any[]; stats: any }>("/api/email_drafts"),
  emailInboxSummary: () => fetchJson<{ ok: boolean; count?: number; emails?: any[] }>("/api/email_inbox_summary"),
  emailProcess: (limit = 10) =>
    fetchJson("/api/email_process", { method: "POST", body: JSON.stringify({ limit }) }),
  notifications: () => fetchJson<{ events: Array<{ event_type: string; symbol?: string; timestamp_utc: string }> }>("/api/notifications"),
  voice: (text: string) => fetchJson("/api/voice", { method: "POST", body: JSON.stringify({ text }) }),
  refreshAll: () => fetchJson("/api/action/refresh_all", { method: "POST" }),
  decideSignal: (signal_id: string, decision: "approve" | "reject") =>
    fetchJson("/api/action/signal", { method: "POST", body: JSON.stringify({ signal_id, decision }) }),
  oandaExecute: (instrument: string, side: "buy" | "sell", units: number) =>
    fetchJson("/api/action/oanda_execute", { method: "POST", body: JSON.stringify({ instrument, side, units }) }),
  // === New integration endpoints ===
  youtubeList: () => fetchJson<{ ok: boolean; transcripts_count: number; video_ids: string[] }>("/api/youtube_list"),
  youtubeQuery: (query: string, k = 5) =>
    fetchJson<{ ok: boolean; query: string; matches_count?: number; synthesis?: string; sources?: any[] }>(
      "/api/youtube_query", { method: "POST", body: JSON.stringify({ query, k }) }),
  youtubeIngest: (url: string) =>
    fetchJson("/api/youtube_ingest", { method: "POST", body: JSON.stringify({ url }) }),
  llmAsk: (prompt: string, prefer: "auto" | "groq" | "ollama" = "auto", max_tokens = 800) =>
    fetchJson<{ ok: boolean; model?: string; response?: string; source?: string }>(
      "/api/llm_ask", { method: "POST", body: JSON.stringify({ prompt, prefer, max_tokens }) }),
  llmStatus: () => fetchJson<{ ok: boolean; groq_key: boolean; ollama_running: boolean; ollama_models: string[]; groq_models_fallback: string[] }>("/api/llm_status"),
  news: (symbol?: string) =>
    fetchJson<any>(symbol ? `/api/news?symbol=${encodeURIComponent(symbol)}` : "/api/news"),
  sentiment: () => fetchJson<any>("/api/sentiment"),
  tonyChat: (text: string) =>
    fetchJson<{ ok: boolean; response?: string; source?: string; model?: string }>(
      "/api/tony_chat", { method: "POST", body: JSON.stringify({ text }) }),
  n8nTrigger: (path: string, payload: any = {}) =>
    fetchJson("/api/n8n_trigger", { method: "POST", body: JSON.stringify({ path, payload }) }),
  scheduledTasks: () => fetchJson<{ ok: boolean; count: number; tasks: Array<{ id: string; description: string; fireAt: string; cron: string }> }>("/api/scheduled_tasks"),
  company: () => fetchJson<any>("/api/company"),
  socialPostDraft: (brand: string, topic: string, platform = "twitter") =>
    fetchJson<any>("/api/social_post_draft", { method: "POST", body: JSON.stringify({ brand, topic, platform }) }),
};

export const fmt = (n: number | undefined) =>
  "$" + (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const fmtCompact = (n: number | undefined) => {
  const v = n || 0;
  if (Math.abs(v) >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return "$" + (v / 1_000).toFixed(1) + "K";
  return fmt(v);
};
