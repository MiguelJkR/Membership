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
  watchlist: () => fetchJson<any>("/api/watchlist"),
  workflowDetail: (id: string) => fetchJson<any>(`/api/workflow_detail?id=${encodeURIComponent(id)}`),
  vaultList: () => fetchJson<{ ok: boolean; exists: boolean; entries?: any[]; salt_b64?: string; iterations?: number }>("/api/vault/list"),
  vaultSave: (entries: any[], salt_b64: string, iterations: number) =>
    fetchJson<any>("/api/vault/save", { method: "POST", body: JSON.stringify({ entries, salt_b64, iterations }) }),
  socialQueue: () => fetchJson<{ ok: boolean; queue: any[] }>("/api/social_queue"),
  socialQueueAdd: (posts: any[]) =>
    fetchJson<any>("/api/social_queue/add", { method: "POST", body: JSON.stringify({ posts }) }),
  socialQueueUpdate: (id: string, updates: any) =>
    fetchJson<any>("/api/social_queue/update", { method: "POST", body: JSON.stringify({ id, updates }) }),
  socialQueueDelete: (id: string) =>
    fetchJson<any>("/api/social_queue/delete", { method: "POST", body: JSON.stringify({ id }) }),
  // === Tony Agent (autonomous tool-using agent) ===
  agentTools: () =>
    fetchJson<{ ok: boolean; tools: Array<{ name: string; description: string; parameters: Record<string, string>; requires_approval: boolean }> }>(
      "/api/tony_agent/tools"
    ),
  agentRun: (goal: string) =>
    fetchJson<AgentSessionResponse>("/api/tony_agent/run", {
      method: "POST",
      body: JSON.stringify({ goal }),
    }),
  agentApprove: (id: string, action: "approve_once" | "approve_always" | "deny") =>
    fetchJson<AgentSessionResponse>("/api/tony_agent/approve", {
      method: "POST",
      body: JSON.stringify({ id, action }),
    }),
  agentSessions: () =>
    fetchJson<{ ok: boolean; sessions: Array<{ id: string; goal: string; status: string; iterations: number; created_at: number }> }>(
      "/api/tony_agent/sessions"
    ),
  agentSessionDetail: (id: string) =>
    fetchJson<{ ok: boolean; session: any }>(`/api/tony_agent/session/${encodeURIComponent(id)}`),
};

export type AgentTraceEntry =
  | { type: "assistant"; content: string | null; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>; model: string; iteration: number }
  | { type: "tool_result"; tool: string; ok: boolean; preview: string; full_count?: number | null }
  | { type: "approval_pause"; pending: { tool: string; args: Record<string, any>; description: string; tool_call_id: string } }
  | { type: "approval"; decision: string; tool: string; ok?: boolean; preview?: string }
  | { type: "llm_error"; error: string };

export type AgentSessionResponse = {
  ok: boolean;
  id: string;
  status: "running" | "complete" | "needs_approval" | "error" | "max_iterations";
  iterations: number;
  trace: AgentTraceEntry[];
  final_answer?: string | null;
  pending_approval?: { tool: string; args: Record<string, any>; description: string; tool_call_id: string } | null;
  error?: string | null;
};

// Helper: build platform-native composer intent URL
export function buildIntentUrl(platform: string, text: string, url?: string): string {
  const enc = encodeURIComponent(text + (url ? "\n" + url : ""));
  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${enc}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url || "")}&summary=${enc}`;
    case "instagram":
      // IG no acepta intent URL — abrir compose web
      return "https://www.instagram.com/";
    case "tiktok":
      return "https://www.tiktok.com/upload";
    default:
      return "#";
  }
}

export const fmt = (n: number | undefined) =>
  "$" + (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const fmtCompact = (n: number | undefined) => {
  const v = n || 0;
  if (Math.abs(v) >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return "$" + (v / 1_000).toFixed(1) + "K";
  return fmt(v);
};
