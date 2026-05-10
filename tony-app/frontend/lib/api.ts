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
  agentPerformance: () =>
    fetchJson<{
      ok: boolean;
      total_sessions: number;
      status_breakdown: Record<string, number>;
      completion_rate_pct: number;
      memory_usage_pct: number;
      avg_iterations: number;
      top_tools: Array<[string, number]>;
      timeline_7d: Array<{ day: string; total: number; complete: number; error: number; completion_rate: number }>;
    }>("/api/tony_agent/performance"),
  agentOrchestrate: (goal: string, max_steps = 4) =>
    fetchJson<{
      ok: boolean;
      goal: string;
      steps_total: number;
      steps: Array<{ step: number; sub_goal: string; final: string; status: string }>;
      final_synthesis: string;
      duration_s: number;
    }>("/api/tony_agent/orchestrate", {
      method: "POST",
      body: JSON.stringify({ goal, max_steps }),
    }),
  watchlistTriggersSave: (triggers: any[]) =>
    fetchJson<{ ok: boolean; saved: boolean; count: number }>("/api/watchlist_triggers/save", {
      method: "POST",
      body: JSON.stringify({ triggers }),
    }),
  watchlistTriggers: () =>
    fetchJson<{
      ok: boolean;
      total: number;
      active_cooldowns: number;
      triggers: Array<{
        id: string;
        symbol: string;
        trigger_above?: number;
        trigger_below?: number;
        action: string;
        rationale: string;
        priority: "critical" | "high" | "info";
        cooldown_h: number;
        valid_from?: string;
        last_fired_ts?: string;
        last_price?: number;
        in_cooldown: boolean;
        cooldown_remaining_min: number;
      }>;
    }>("/api/watchlist_triggers"),
  alertBridgeStatus: () =>
    fetchJson<{
      ok: boolean;
      discord: string;
      slack: string;
      filters: { level_min?: string; skip_categories?: string[] };
    }>("/api/alert_bridge/status"),
  alertBridgeConfigure: (config: { discord?: string | null; slack?: string | null; level_min?: string }) =>
    fetchJson<{ ok: boolean }>("/api/alert_bridge/configure", {
      method: "POST",
      body: JSON.stringify(config),
    }),
  alertBridgeBroadcast: (text: string, level: "info" | "warn" | "error" | "critical" = "info") =>
    fetchJson<{ ok: boolean; sent_to?: string[] }>("/api/alert_bridge/broadcast", {
      method: "POST",
      body: JSON.stringify({ text, level }),
    }),
  uptime: () =>
    fetchJson<{
      ok: boolean;
      start_ts: number;
      uptime_seconds: number;
      days: number;
      hours: number;
      minutes: number;
      label: string;
    }>("/api/uptime"),
  feedbackInsights: () =>
    fetchJson<{
      ok: boolean;
      total: number;
      by_category: Record<string, number>;
      by_intent: Record<string, number>;
      by_sentiment: Record<string, number>;
      positive_rate_pct: number;
      rejection_rate_pct: number;
    }>("/api/telegram_feedback/insights"),
  feedbackRecent: (limit = 20) =>
    fetchJson<{
      ok: boolean;
      entries: Array<{
        ts: string;
        reply_text: string;
        original_preview: string;
        category: string;
        intent: string;
        sentiment: string;
      }>;
    }>(`/api/telegram_feedback/recent?limit=${limit}`),
  agentsConfig: () =>
    fetchJson<{ ok: boolean; config: { _metadata?: any; agents: AgentConfig[] } }>("/api/agents/config"),
  agentsConfigSave: (config: { _metadata?: any; agents: AgentConfig[] }) =>
    fetchJson<{ ok: boolean; saved: boolean; agents_count: number }>(
      "/api/agents/config", { method: "POST", body: JSON.stringify({ config }) }
    ),
  tonyExplica: () =>
    fetchJson<{
      ok: boolean;
      explanation: string;
      score: number;
      mood: string;
      raw: any;
      ts: string;
    }>("/api/tony_explica"),
  n8nErrorTimeline: () =>
    fetchJson<{
      ok: boolean;
      total_24h: number;
      timeline: Array<{ hour: string; label: string; count: number }>;
    }>("/api/n8n_error_timeline"),
  n8nErrors: () =>
    fetchJson<{
      ok: boolean;
      total_errors_last_30: number;
      errors: Array<{ id: string; workflow_id: string; workflow_name: string; started_at: string; mode: string }>;
      by_workflow: Array<{ workflow_name: string; error_count: number; most_recent: string }>;
    }>("/api/n8n_errors"),
  systemStatus: () =>
    fetchJson<{
      ok?: boolean;
      ts: string;
      subsystems: Record<string, any>;
      tools: { total: number; read_only: number; gated: number; names: string[] };
      alerts: { watchlist_triggers?: number; fired_recently?: number; last_fired?: string | null };
      health: { composite_score?: number; label?: string };
    }>("/api/system_status"),
};

export type AgentConfig = {
  id: string;
  name: string;
  enabled: boolean;
  icon?: string;
  accent?: string;
  role: string;
  responsibilities?: string[];
  tools_needed?: string[];
  linked_workflows?: string[];
  trigger_keywords?: string[];
  default_prompt_extension?: string;
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
