"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Send, Loader2, Bot, User, Zap, Trash2, Brain, Cpu,
  Sparkles, MessageCircle, Mic, MicOff, Bell, BellOff, AlertTriangle,
  Image as ImageIcon, Volume2, VolumeX, Download, X as XIcon,
  Paperclip, FileText, RefreshCw, Sunrise, Headphones, Share2,
  Copy, CheckCircle2, Link as LinkIcon,
} from "lucide-react";

type ChatImage = { data_b64: string; media_type: string; preview_url: string };

type Msg = {
  role: "user" | "tony" | "system_alert";
  text: string;
  source?: string;
  model?: string;
  ts: string;
  specialist?: { name: string; matched_keyword: string };
  alert_kind?: string;
  alert_priority?: string;
  images?: ChatImage[];
  images_analyzed?: number;
};

const STORAGE_KEY = "tony_chat_history_v4";
const LAST_ALERT_TS_KEY = "tony_chat_last_alert_ts_v1";
const TTS_AUTOPLAY_KEY = "tony_chat_tts_autoplay_v1";
const PUSH_NOTIF_KEY = "tony_chat_push_notif_v1";
const LAST_WEEKLY_ID_KEY = "tony_chat_last_weekly_id_v1";
const LAST_DAILY_ID_KEY = "tony_chat_last_daily_id_v1";
const WAKE_WORD_KEY = "tony_chat_wake_word_v1";
// Wake-word triggers (lowercase, normalized — accents stripped). Includes common
// transcription variants because browsers often hear "tomy"/"tonny".
const WAKE_TRIGGERS = ["hey tony", "hola tony", "che tony", "ok tony", "tony", "tomy", "tonny"];

const QUICK_PROMPTS = [
  "Estado del portfolio + acciones recomendadas hoy",
  "Análisis técnico AAL con niveles clave",
  "Riesgo del portfolio actual y rebalance",
  "Setup forex próxima semana (CPI martes)",
];

const PROVIDER_META: Record<string, { label: string; icon: any; color: string }> = {
  anthropic: { label: "Claude Sonnet 4.5", icon: Sparkles, color: "text-[var(--color-amber)]" },
  groq: { label: "Groq", icon: Zap, color: "text-[var(--color-green)]" },
  ollama: { label: "Ollama", icon: Cpu, color: "text-[var(--color-cyan)]" },
  ollama_local: { label: "Ollama", icon: Cpu, color: "text-[var(--color-cyan)]" },
  llm: { label: "LLM", icon: Brain, color: "text-[var(--color-text-dim)]" },
  init: { label: "Sistema", icon: Bot, color: "text-[var(--color-text-dim)]" },
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [llmStatus, setLlmStatus] = useState<any>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [pendingImages, setPendingImages] = useState<ChatImage[]>([]);
  const [ttsAutoplay, setTtsAutoplay] = useState(false);
  const [pushNotifEnabled, setPushNotifEnabled] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [generatingWeekly, setGeneratingWeekly] = useState(false);
  const [generatingDaily, setGeneratingDaily] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [wakeListening, setWakeListening] = useState(false);
  const [wakeDetected, setWakeDetected] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const wakeRecognitionRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}
    setMessages([{
      role: "tony",
      text: "Hola Miguel. Tony acá — Claude Sonnet 4.5 con acceso a portfolio + watchlist + eventos + 5 specialists. Puedo: analizar texto, escuchar voz (mic), ver imágenes (paste o paperclip), hablarte (altavoz). Preguntame lo que necesites.",
      ts: new Date().toISOString(),
      source: "init",
    }]);
    // Load TTS + Push preferences
    setTtsAutoplay(localStorage.getItem(TTS_AUTOPLAY_KEY) === "1");
    const pushPref = localStorage.getItem(PUSH_NOTIF_KEY) === "1";
    if (pushPref && typeof window !== "undefined" && "Notification" in window) {
      setPushNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  // Persist
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      // Strip data_b64 from images when persisting (too large)
      const slim = messages.slice(-50).map((m) => ({
        ...m,
        images: m.images?.map((img) => ({ ...img, data_b64: "" })),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {}
  }, [messages]);

  useEffect(() => {
    api.llmStatus().then(setLlmStatus);
  }, []);

  // Auto-load latest weekly summary on mount if it's new
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.tonyWeeklySummaryLatest();
        if (cancelled || !r.ok || !r.summary) return;
        const lastSeenId = localStorage.getItem(LAST_WEEKLY_ID_KEY);
        if (lastSeenId === r.summary.id) return; // already shown
        // Inject into messages as a special weekly card
        const stats = r.summary.stats;
        const pnlSign = stats.portfolio_pnl_unr >= 0 ? "+" : "";
        const headerLine =
          `📊 **Resumen ejecutivo semanal** · ${r.summary.week_start} → ${r.summary.week_end} · ` +
          `MV $${stats.portfolio_mv.toFixed(2)} · P/L unr ${pnlSign}$${stats.portfolio_pnl_unr.toFixed(2)} · ` +
          `${stats.trades_week} trades · ${stats.triggers_fired} triggers\n\n---\n\n`;
        setMessages((m) => {
          // Only inject if not already there (idempotent)
          if (m.some((x) => x.text.includes(r.summary!.id))) return m;
          return [
            ...m,
            {
              role: "tony",
              text: headerLine + r.summary!.markdown + `\n\n<!--summary_id:${r.summary!.id}-->`,
              source: r.summary!.source,
              model: r.summary!.model,
              ts: r.summary!.generated_at,
            },
          ];
        });
        localStorage.setItem(LAST_WEEKLY_ID_KEY, r.summary.id);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-load latest daily brief on mount if it's new
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.tonyDailyBriefLatest();
        if (cancelled || !r.ok || !r.brief) return;
        const lastSeenId = localStorage.getItem(LAST_DAILY_ID_KEY);
        if (lastSeenId === r.brief.id) return;
        const stats = r.brief.stats;
        const pnlSign = stats.portfolio_pnl_unr >= 0 ? "+" : "";
        const headerLine =
          `☀️ **Brief diario** · ${r.brief.date} · ` +
          `MV $${stats.portfolio_mv.toFixed(2)} · P/L unr ${pnlSign}$${stats.portfolio_pnl_unr.toFixed(2)} · ` +
          `${stats.trades_24h} trades · ${stats.triggers_24h} triggers · ${stats.events_24h} eventos\n\n---\n\n`;
        setMessages((m) => {
          if (m.some((x) => x.text.includes(r.brief!.id))) return m;
          return [
            ...m,
            {
              role: "tony",
              text: headerLine + r.brief!.markdown + `\n\n<!--brief_id:${r.brief!.id}-->`,
              source: r.brief!.source,
              model: r.brief!.model,
              ts: r.brief!.generated_at,
            },
          ];
        });
        localStorage.setItem(LAST_DAILY_ID_KEY, r.brief.id);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Pro-active alerts + browser push notifications
  useEffect(() => {
    let cancelled = false;
    const fetchAlerts = async () => {
      try {
        const lastTs = parseFloat(localStorage.getItem(LAST_ALERT_TS_KEY) || "0");
        const since = lastTs || Math.floor(Date.now() / 1000);
        if (!lastTs) {
          localStorage.setItem(LAST_ALERT_TS_KEY, String(since));
          return;
        }
        const r = await api.chatPendingAlerts(since);
        if (cancelled || !r.ok || r.count === 0) return;
        const alertMsgs: Msg[] = r.alerts.reverse().map((a) => ({
          role: "system_alert" as const,
          text: a.message,
          ts: a.ts || new Date().toISOString(),
          alert_kind: a.kind,
          alert_priority: a.priority || "info",
        }));
        if (alertMsgs.length > 0) {
          setMessages((m) => [...m, ...alertMsgs]);
          localStorage.setItem(LAST_ALERT_TS_KEY, String(r.now));

          // Browser push notification if enabled + tab not visible
          const pushEnabled = localStorage.getItem(PUSH_NOTIF_KEY) === "1";
          if (
            pushEnabled &&
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted" &&
            document.hidden
          ) {
            // Group multiple into single notification if 3+
            if (alertMsgs.length >= 3) {
              const critical = alertMsgs.filter((a) => a.alert_priority === "critical").length;
              const high = alertMsgs.filter((a) => a.alert_priority === "high").length;
              const summary = critical > 0
                ? `${critical} CRÍTICOS + ${alertMsgs.length - critical} alertas más`
                : high > 0
                ? `${high} alta prioridad + ${alertMsgs.length - high} alertas más`
                : `${alertMsgs.length} eventos del sistema`;
              try {
                new Notification("Tony · Múltiples alertas", {
                  body: summary,
                  icon: "/tony-character-1.png",
                  badge: "/tony-character-1.png",
                  tag: "tony-alerts-batch",
                });
              } catch {}
            } else {
              alertMsgs.forEach((a, idx) => {
                const isUrgent = a.alert_priority === "critical" || a.alert_priority === "high";
                try {
                  const n = new Notification(
                    isUrgent ? "🚨 Tony · " + (a.alert_priority || "alert").toUpperCase() : "Tony · alerta",
                    {
                      body: a.text,
                      icon: "/tony-character-1.png",
                      badge: "/tony-character-1.png",
                      tag: `tony-alert-${a.ts}`,
                      requireInteraction: isUrgent,
                    }
                  );
                  // Click → focus the chat tab
                  n.onclick = () => {
                    window.focus();
                    n.close();
                  };
                } catch {}
              });
            }
          }
        }
      } catch {}
    };
    fetchAlerts();
    const i = setInterval(fetchAlerts, 15000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  async function send(promptOverride?: string) {
    const text = (promptOverride ?? input).trim();
    if ((!text && pendingImages.length === 0) || loading) return;
    const userMsg: Msg = {
      role: "user",
      text: text || "(imagen)",
      ts: new Date().toISOString(),
      images: pendingImages,
    };
    const imagesToSend = pendingImages.map((img) => ({
      data_b64: img.data_b64,
      media_type: img.media_type,
    }));
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPendingImages([]);
    setLoading(true);
    try {
      const history = next
        .filter((m) => m.role === "user" || m.role === "tony")
        .slice(-9, -1)
        .map((m) => ({ role: m.role, text: m.text }));
      const r = await api.tonyChat(text || "Analizá esta imagen", history, imagesToSend);
      const responseText =
        r.response || (r as any).reason || (r as any).error || "(sin respuesta)";
      const newIdx = next.length;
      setMessages((m) => [
        ...m,
        {
          role: "tony",
          text: String(responseText).trim(),
          source: r.source || "llm",
          model: r.model || "?",
          specialist: r.specialist,
          images_analyzed: r.images_analyzed,
          ts: new Date().toISOString(),
        },
      ]);
      // Auto-speak if enabled
      if (ttsAutoplay && r.response) {
        setTimeout(() => speakMessage(newIdx, r.response!), 200);
      }
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          role: "tony",
          text: "Error de conexión: " + (e?.message || String(e)),
          ts: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    if (!confirm("¿Borrar todo el historial del chat?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setMessages([{
      role: "tony",
      text: "Historial limpio. ¿Qué arrancamos?",
      ts: new Date().toISOString(),
      source: "init",
    }]);
  }

  // ===== Voice recording (Whisper) =====
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size < 500) {
          setRecording(false);
          return;
        }
        setTranscribing(true);
        try {
          const r = await api.voiceTranscribe(blob);
          if (r.ok && r.text) {
            setInput((prev) => (prev ? prev + " " : "") + r.text);
          } else {
            alert("Transcripción falló: " + (r.error || "unknown"));
          }
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (e: any) {
      alert("Mic permission denied: " + (e?.message || String(e)));
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  // ===== Wake-word "Hey Tony" — hands-free activation =====
  // Uses Web Speech API (Chrome/Edge). Continuous, low-power, runs in browser.
  // When trigger phrase is detected → kicks off MediaRecorder → Whisper → send.
  function normalizeForWake(t: string): string {
    return t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function isWakeTrigger(text: string): boolean {
    const norm = normalizeForWake(text);
    return WAKE_TRIGGERS.some((trig) => norm.includes(trig));
  }
  function startWakeRecognition() {
    if (typeof window === "undefined") return;
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Tu navegador no soporta wake-word. Usá Chrome o Edge.");
      return;
    }
    // Defensive: stop any existing
    if (wakeRecognitionRef.current) {
      try { wakeRecognitionRef.current.stop(); } catch {}
      wakeRecognitionRef.current = null;
    }
    const rec = new SR();
    rec.lang = "es-AR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 2;

    rec.onresult = (ev: any) => {
      // Look at last result for low-latency detection
      const last = ev.results[ev.results.length - 1];
      if (!last) return;
      const transcript = last[0]?.transcript || "";
      if (!isWakeTrigger(transcript)) return;
      // Already recording or transcribing? skip
      if (recording || transcribing || loading) return;
      setWakeDetected(true);
      // Visual flash + start recording
      setTimeout(() => setWakeDetected(false), 1200);
      // Stop wake to free the mic, start MediaRecorder
      try { rec.stop(); } catch {}
      startRecording().then(() => {
        // Auto-stop after 6 seconds (or user can hit mic button again)
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setRecording(false);
          }
          // Restart wake-listener after recording done (after transcribe completes)
          if (localStorage.getItem(WAKE_WORD_KEY) === "1") {
            setTimeout(() => startWakeRecognition(), 1500);
          }
        }, 6000);
      });
    };
    rec.onerror = (ev: any) => {
      // no-speech, audio-capture, network — restart silently
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        setWakeEnabled(false);
        localStorage.setItem(WAKE_WORD_KEY, "0");
        alert("Permiso de micrófono denegado. Wake-word desactivado.");
        return;
      }
      // Otherwise retry after a beat
      setTimeout(() => {
        if (localStorage.getItem(WAKE_WORD_KEY) === "1") startWakeRecognition();
      }, 1500);
    };
    rec.onend = () => {
      setWakeListening(false);
      // Auto-restart if still enabled
      if (localStorage.getItem(WAKE_WORD_KEY) === "1") {
        setTimeout(() => {
          if (localStorage.getItem(WAKE_WORD_KEY) === "1") startWakeRecognition();
        }, 600);
      }
    };
    rec.onstart = () => {
      setWakeListening(true);
    };
    try {
      rec.start();
      wakeRecognitionRef.current = rec;
    } catch (e) {
      // Already started or aborted — ignore
    }
  }

  function stopWakeRecognition() {
    if (wakeRecognitionRef.current) {
      try { wakeRecognitionRef.current.stop(); } catch {}
      wakeRecognitionRef.current = null;
    }
    setWakeListening(false);
  }

  function toggleWakeWord() {
    if (typeof window === "undefined") return;
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Tu navegador no soporta wake-word. Usá Chrome o Edge en desktop/Android.");
      return;
    }
    if (wakeEnabled) {
      setWakeEnabled(false);
      localStorage.setItem(WAKE_WORD_KEY, "0");
      stopWakeRecognition();
      return;
    }
    setWakeEnabled(true);
    localStorage.setItem(WAKE_WORD_KEY, "1");
    startWakeRecognition();
  }

  // Auto-restore wake-word state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pref = localStorage.getItem(WAKE_WORD_KEY) === "1";
    if (pref) {
      setWakeEnabled(true);
      // Slight delay so other init finishes first
      setTimeout(() => startWakeRecognition(), 800);
    }
    return () => {
      stopWakeRecognition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Share chat — public URL =====
  async function createShare(expiresDays: number = 7) {
    if (creatingShare) return;
    setCreatingShare(true);
    setShareCopied(false);
    try {
      // Filter to user/tony only (system_alerts can be misleading without context)
      const cleanMsgs = messages.map((m) => ({
        role: m.role,
        text: m.text,
        ts: m.ts,
        source: m.source,
        model: m.model,
        specialist: m.specialist,
        alert_priority: m.alert_priority,
      }));
      const title =
        messages.find((m) => m.role === "user")?.text.slice(0, 80) || "Conversación con Tony";
      const r = await api.chatShareCreate({
        messages: cleanMsgs,
        title,
        expires_days: expiresDays,
        author: "Miguel",
      });
      if (!r.ok || !r.url_path) {
        alert("Error creando share: " + (r.error || "unknown"));
        return;
      }
      const fullUrl = `${window.location.origin}${r.url_path}`;
      setShareUrl(fullUrl);
      setShareExpiresAt(r.expires_at || null);
    } catch (e: any) {
      alert("Error: " + (e?.message || String(e)));
    } finally {
      setCreatingShare(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }

  // ===== Image handling (paste + file picker) =====
  async function handleFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagen muy grande (max 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      const previewUrl = result;
      setPendingImages((imgs) => [
        ...imgs,
        { data_b64: base64, media_type: file.type, preview_url: previewUrl },
      ]);
    };
    reader.readAsDataURL(file);
  }

  function onPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFile(file);
        e.preventDefault();
        return;
      }
    }
  }

  // ===== TTS (Tony speaks) =====
  async function speakMessage(idx: number, text: string) {
    if (speakingIdx === idx) {
      // Stop current
      audioRef.current?.pause();
      setSpeakingIdx(null);
      return;
    }
    audioRef.current?.pause();
    setSpeakingIdx(idx);
    try {
      const blob = await api.voiceSpeak(text);
      if (!blob) {
        setSpeakingIdx(null);
        return;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeakingIdx(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setSpeakingIdx(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (e) {
      setSpeakingIdx(null);
    }
  }

  function toggleAutoplay() {
    const next = !ttsAutoplay;
    setTtsAutoplay(next);
    localStorage.setItem(TTS_AUTOPLAY_KEY, next ? "1" : "0");
  }

  async function togglePushNotif() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones nativas");
      return;
    }
    if (pushNotifEnabled) {
      // Disable
      setPushNotifEnabled(false);
      localStorage.setItem(PUSH_NOTIF_KEY, "0");
      return;
    }
    // Request permission if needed
    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      if (result !== "granted") {
        alert("Permiso de notificaciones denegado. Activá en config del browser si querés usarlas.");
        return;
      }
    } else if (Notification.permission === "denied") {
      alert("Las notificaciones están bloqueadas. Andá al candado en la URL → Permisos → permitir Notificaciones.");
      return;
    }
    setPushNotifEnabled(true);
    localStorage.setItem(PUSH_NOTIF_KEY, "1");
    // Test notification
    try {
      const n = new Notification("Tony · Notificaciones activadas ✓", {
        body: "Ahora vas a recibir alertas en el escritorio cuando algo importante pase.",
        icon: "/tony-character-1.png",
        tag: "tony-welcome",
      });
      n.onclick = () => { window.focus(); n.close(); };
    } catch {}
  }

  // ===== Daily Pre-Market Brief =====
  async function generateDailyBrief(force = false) {
    if (generatingDaily) return;
    setGeneratingDaily(true);
    setMessages((m) => [
      ...m,
      {
        role: "tony",
        text: force
          ? "Regenerando brief diario pre-market..."
          : "Generando brief diario pre-market... (Claude analiza últimas 24h)",
        source: "init",
        ts: new Date().toISOString(),
      },
    ]);
    try {
      const r = await api.tonyDailyBriefGenerate(force);
      if (!r.ok || !r.brief) {
        setMessages((m) => [
          ...m,
          {
            role: "tony",
            text: `Error generando brief: ${r.error || r.message || "desconocido"}`,
            ts: new Date().toISOString(),
          },
        ]);
        return;
      }
      const stats = r.brief.stats;
      const pnlSign = stats.portfolio_pnl_unr >= 0 ? "+" : "";
      const cachedBadge = r.cached ? "_(ya existía para hoy — usá Regenerar para forzar)_\n\n" : "";
      const headerLine =
        `☀️ **Brief diario** · ${r.brief.date} · ` +
        `MV $${stats.portfolio_mv.toFixed(2)} · P/L unr ${pnlSign}$${stats.portfolio_pnl_unr.toFixed(2)} · ` +
        `${stats.trades_24h} trades · ${stats.triggers_24h} triggers · ${stats.events_24h} eventos\n\n${cachedBadge}---\n\n`;
      setMessages((m) => [
        ...m,
        {
          role: "tony",
          text: headerLine + r.brief!.markdown + `\n\n<!--brief_id:${r.brief!.id}-->`,
          source: r.brief!.source,
          model: r.brief!.model,
          ts: r.brief!.generated_at,
        },
      ]);
      localStorage.setItem(LAST_DAILY_ID_KEY, r.brief.id);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          role: "tony",
          text: "Error de conexión al generar brief: " + (e?.message || String(e)),
          ts: new Date().toISOString(),
        },
      ]);
    } finally {
      setGeneratingDaily(false);
    }
  }

  // ===== Weekly Executive Summary =====
  async function generateWeeklySummary(force = false) {
    if (generatingWeekly) return;
    setGeneratingWeekly(true);
    // Optimistic message
    setMessages((m) => [
      ...m,
      {
        role: "tony",
        text: force
          ? "Regenerando resumen ejecutivo semanal... (analizando portfolio, trades, triggers, eventos)"
          : "Generando resumen ejecutivo semanal... (Claude analiza últimos 7 días)",
        source: "init",
        ts: new Date().toISOString(),
      },
    ]);
    try {
      const r = await api.tonyWeeklySummaryGenerate(force);
      if (!r.ok || !r.summary) {
        setMessages((m) => [
          ...m,
          {
            role: "tony",
            text: `Error generando resumen: ${r.error || r.message || "desconocido"}`,
            ts: new Date().toISOString(),
          },
        ]);
        return;
      }
      const stats = r.summary.stats;
      const pnlSign = stats.portfolio_pnl_unr >= 0 ? "+" : "";
      const cachedBadge = r.cached ? "_(ya existía para esta semana — usá Regenerar para forzar)_\n\n" : "";
      const headerLine =
        `📊 **Resumen ejecutivo semanal** · ${r.summary.week_start} → ${r.summary.week_end} · ` +
        `MV $${stats.portfolio_mv.toFixed(2)} · P/L unr ${pnlSign}$${stats.portfolio_pnl_unr.toFixed(2)} · ` +
        `${stats.trades_week} trades · ${stats.triggers_fired} triggers\n\n${cachedBadge}---\n\n`;
      setMessages((m) => [
        ...m,
        {
          role: "tony",
          text: headerLine + r.summary!.markdown + `\n\n<!--summary_id:${r.summary!.id}-->`,
          source: r.summary!.source,
          model: r.summary!.model,
          ts: r.summary!.generated_at,
        },
      ]);
      localStorage.setItem(LAST_WEEKLY_ID_KEY, r.summary.id);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          role: "tony",
          text: "Error de conexión al generar resumen: " + (e?.message || String(e)),
          ts: new Date().toISOString(),
        },
      ]);
    } finally {
      setGeneratingWeekly(false);
    }
  }

  // ===== Export =====
  function exportChat(format: "md" | "json") {
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    let content = "";
    let mime = "";
    let filename = "";
    if (format === "md") {
      content = `# Tony Chat Export · ${new Date().toLocaleString("es-AR")}\n\n`;
      content += `Total mensajes: ${messages.length}\n\n---\n\n`;
      for (const m of messages) {
        if (m.role === "system_alert") {
          content += `> 🔔 **${m.alert_priority?.toUpperCase() || "INFO"}** · ${m.text} · ${m.ts.slice(11, 19)}\n\n`;
        } else if (m.role === "user") {
          content += `## 👤 Miguel · ${m.ts.slice(0, 19).replace("T", " ")}\n\n${m.text}\n\n`;
          if (m.images && m.images.length > 0) {
            content += `_[${m.images.length} imagen(es) adjunta(s)]_\n\n`;
          }
        } else {
          const meta = m.specialist
            ? `${m.source || "?"} · ${m.model || "?"} · 🧠 ${m.specialist.name}`
            : `${m.source || "?"} · ${m.model || "?"}`;
          content += `## 🤖 Tony · ${m.ts.slice(0, 19).replace("T", " ")} · ${meta}\n\n${m.text}\n\n`;
        }
        content += `---\n\n`;
      }
      mime = "text/markdown";
      filename = `tony-chat-${ts}.md`;
    } else {
      // Strip image data for JSON export (preview only)
      const slim = messages.map((m) => ({
        ...m,
        images: m.images?.map((img) => ({
          media_type: img.media_type,
          has_data: !!img.data_b64,
        })),
      }));
      content = JSON.stringify(slim, null, 2);
      mime = "application/json";
      filename = `tony-chat-${ts}.json`;
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const hasAnthropic = (llmStatus as any)?.anthropic_key === true;

  return (
    <div className="p-4 md:p-5 flex flex-col h-[calc(100vh-80px)] gap-3">
      {/* Subheader */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-[var(--color-green)]" />
            <span className="text-[10px] tracking-[0.3em] font-mono text-[var(--color-text-dim)]">
              CHAT TONY · CLAUDE + SPECIALISTS · VOICE + VISION + TTS · REEMPLAZA TELEGRAM
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {hasAnthropic && (
              <span className="text-[9px] font-mono tracking-widest px-2 py-1 rounded border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)] flex items-center gap-1">
                <Sparkles size={10} /> CLAUDE
              </span>
            )}
            {llmStatus?.groq_key && (
              <span className="text-[9px] font-mono tracking-widest px-2 py-1 rounded border border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)] flex items-center gap-1">
                <Zap size={10} /> GROQ
              </span>
            )}
            {llmStatus?.ollama_running && (
              <span className="text-[9px] font-mono tracking-widest px-2 py-1 rounded border border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] flex items-center gap-1">
                <Cpu size={10} /> OLLAMA
              </span>
            )}
            <button
              onClick={toggleAutoplay}
              className={`ml-2 px-2 py-1 text-[9px] tracking-widest font-mono rounded border transition flex items-center gap-1 ${
                ttsAutoplay
                  ? "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-amber)]"
              }`}
              title={ttsAutoplay ? "Auto-TTS activado" : "Auto-TTS desactivado"}
            >
              {ttsAutoplay ? <Volume2 size={10} /> : <VolumeX size={10} />}
              TTS {ttsAutoplay ? "ON" : "OFF"}
            </button>
            <button
              onClick={togglePushNotif}
              className={`px-2 py-1 text-[9px] tracking-widest font-mono rounded border transition flex items-center gap-1 ${
                pushNotifEnabled
                  ? "border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)]"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-green)]"
              }`}
              title={pushNotifEnabled ? "Notificaciones browser activadas" : "Activar push notifications"}
            >
              {pushNotifEnabled ? <Bell size={10} /> : <BellOff size={10} />}
              NOTIF {pushNotifEnabled ? "ON" : "OFF"}
            </button>
            <button
              onClick={toggleWakeWord}
              className={`px-2 py-1 text-[9px] tracking-widest font-mono rounded border transition flex items-center gap-1 ${
                wakeDetected
                  ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]/30 text-[var(--color-cyan)] animate-pulse"
                  : wakeEnabled && wakeListening
                  ? "border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]"
                  : wakeEnabled
                  ? "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)]"
              }`}
              title={
                wakeEnabled
                  ? wakeListening
                    ? "Escuchando 'Hey Tony' — decilo y empieza a grabar"
                    : "Wake-word ON pero pausado (esperando)"
                  : "Activar wake-word 'Hey Tony' (manos libres)"
              }
            >
              <Headphones size={10} />
              {wakeDetected ? "DETECTADO!" : `HEY TONY ${wakeEnabled ? (wakeListening ? "•••" : "ON") : "OFF"}`}
            </button>
            <button
              onClick={() => {
                setShowShareModal(true);
                setShareUrl(null);
                setShareCopied(false);
              }}
              className="px-2 py-1 text-[9px] tracking-widest font-mono rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-purple)] hover:border-[var(--color-purple)]/40 transition flex items-center gap-1"
              title="Compartir esta conversación con una URL pública read-only"
            >
              <Share2 size={10} />
              SHARE
            </button>
            <div className="relative group">
              <button
                disabled={generatingDaily}
                onClick={() => generateDailyBrief(false)}
                className="px-2 py-1 text-[9px] tracking-widest font-mono rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-amber)] hover:border-[var(--color-amber)]/40 transition flex items-center gap-1 disabled:opacity-50"
                title="Generar brief diario pre-market (Claude analiza últimas 24h)"
              >
                {generatingDaily ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Sunrise size={10} />
                )}
                BRIEF
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded shadow-lg z-10 whitespace-nowrap">
                <button
                  onClick={() => generateDailyBrief(false)}
                  disabled={generatingDaily}
                  className="block w-full text-left px-3 py-1.5 text-[9px] font-mono tracking-widest text-[var(--color-text-dim)] hover:bg-[var(--color-bg)]/60 hover:text-[var(--color-amber)] disabled:opacity-50"
                >
                  <Sunrise size={10} className="inline mr-1.5" />
                  GENERAR HOY
                </button>
                <button
                  onClick={() => generateDailyBrief(true)}
                  disabled={generatingDaily}
                  className="block w-full text-left px-3 py-1.5 text-[9px] font-mono tracking-widest text-[var(--color-text-dim)] hover:bg-[var(--color-bg)]/60 hover:text-[var(--color-amber)] disabled:opacity-50 border-t border-[var(--color-border)]"
                >
                  <RefreshCw size={10} className="inline mr-1.5" />
                  REGENERAR
                </button>
              </div>
            </div>
            <div className="relative group">
              <button
                disabled={generatingWeekly}
                onClick={() => generateWeeklySummary(false)}
                className="px-2 py-1 text-[9px] tracking-widest font-mono rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-purple)] hover:border-[var(--color-purple)]/40 transition flex items-center gap-1 disabled:opacity-50"
                title="Generar resumen ejecutivo semanal (Claude analiza portfolio + trades + eventos)"
              >
                {generatingWeekly ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <FileText size={10} />
                )}
                RESUMEN
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded shadow-lg z-10 whitespace-nowrap">
                <button
                  onClick={() => generateWeeklySummary(false)}
                  disabled={generatingWeekly}
                  className="block w-full text-left px-3 py-1.5 text-[9px] font-mono tracking-widest text-[var(--color-text-dim)] hover:bg-[var(--color-bg)]/60 hover:text-[var(--color-purple)] disabled:opacity-50"
                >
                  <FileText size={10} className="inline mr-1.5" />
                  GENERAR
                </button>
                <button
                  onClick={() => generateWeeklySummary(true)}
                  disabled={generatingWeekly}
                  className="block w-full text-left px-3 py-1.5 text-[9px] font-mono tracking-widest text-[var(--color-text-dim)] hover:bg-[var(--color-bg)]/60 hover:text-[var(--color-amber)] disabled:opacity-50 border-t border-[var(--color-border)]"
                >
                  <RefreshCw size={10} className="inline mr-1.5" />
                  REGENERAR
                </button>
              </div>
            </div>
            <div className="relative group">
              <button className="px-2 py-1 text-[9px] tracking-widest font-mono rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/40 transition flex items-center gap-1">
                <Download size={10} />
                EXPORT
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded shadow-lg z-10">
                <button
                  onClick={() => exportChat("md")}
                  className="block w-full text-left px-3 py-1.5 text-[9px] tracking-widest font-mono text-[var(--color-text)] hover:bg-[var(--color-cyan)]/10 whitespace-nowrap"
                >
                  MARKDOWN (.md)
                </button>
                <button
                  onClick={() => exportChat("json")}
                  className="block w-full text-left px-3 py-1.5 text-[9px] tracking-widest font-mono text-[var(--color-text)] hover:bg-[var(--color-cyan)]/10 whitespace-nowrap"
                >
                  JSON (.json)
                </button>
              </div>
            </div>
            <button
              onClick={clearHistory}
              className="px-2 py-1 text-[9px] tracking-widest font-mono rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-red)]/40 hover:text-[var(--color-red)] transition"
            >
              <Trash2 size={10} className="inline mr-1" />
              LIMPIAR
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              msg={m}
              idx={i}
              speaking={speakingIdx === i}
              onSpeak={() => speakMessage(i, m.text)}
            />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-9 h-9 rounded-full border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 flex items-center justify-center glow-amber">
                <Sparkles size={14} className="text-[var(--color-amber)] animate-pulse" />
              </div>
              <div className="px-4 py-3 rounded-lg bg-[var(--color-amber)]/5 border border-[var(--color-amber)]/30 text-[10px] font-mono text-[var(--color-text-dim)] flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" />
                Tony pensando con Claude... (~3-8s)
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Pending images preview */}
        {pendingImages.length > 0 && (
          <div className="border-t border-[var(--color-border)] px-3 py-2 flex flex-wrap gap-2">
            {pendingImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.preview_url}
                  alt={`pending ${idx}`}
                  className="h-16 w-16 object-cover rounded border border-[var(--color-amber)]/40"
                />
                <button
                  onClick={() => setPendingImages((imgs) => imgs.filter((_, i) => i !== idx))}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-red)] text-white flex items-center justify-center hover:scale-110 transition"
                >
                  <XIcon size={9} />
                </button>
              </div>
            ))}
            <span className="text-[9px] font-mono text-[var(--color-text-dim)] self-center">
              {pendingImages.length} imagen(es) · Claude las analiza al enviar
            </span>
          </div>
        )}

        {/* Quick prompts */}
        <div className="border-t border-[var(--color-border)] p-3 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={loading}
              className="text-[9px] font-mono tracking-wider px-2.5 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-amber)] hover:border-[var(--color-amber)]/40 transition-colors disabled:opacity-50"
            >
              <Zap size={9} className="inline mr-1" />
              {p}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="border-t border-[var(--color-border)] p-3 flex gap-2 items-center">
          {/* Mic */}
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={loading || transcribing}
            className={`shrink-0 p-2.5 rounded border transition-colors ${
              recording
                ? "border-[var(--color-red)] bg-[var(--color-red)]/20 text-[var(--color-red)] animate-pulse"
                : transcribing
                ? "border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]"
                : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]/40"
            }`}
            title={recording ? "Parar" : "Grabar (Whisper)"}
          >
            {transcribing ? <Loader2 size={14} className="animate-spin" /> : recording ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

          {/* Paperclip (image upload) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="shrink-0 p-2.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-amber)] hover:border-[var(--color-amber)]/40 transition-colors"
            title="Adjuntar imagen (o pegá con Ctrl+V)"
          >
            <Paperclip size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              for (const f of e.target.files || []) handleFile(f);
              e.target.value = "";
            }}
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={loading || recording}
            placeholder={
              recording
                ? "🔴 Grabando..."
                : transcribing
                ? "Transcribiendo..."
                : pendingImages.length > 0
                ? `${pendingImages.length} imagen(es) listas · agregá texto o enviá directo`
                : "Preguntale a Tony — texto, voz, imágenes (paste con Ctrl+V o paperclip)..."
            }
            className="flex-1 px-4 py-2.5 bg-black/40 border border-[var(--color-border)] rounded text-[12px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-amber)]/60 font-mono disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={loading || (!input.trim() && pendingImages.length === 0) || recording}
            className="px-4 py-2 rounded border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 text-[var(--color-amber)] hover:bg-[var(--color-amber)]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Send size={14} />
            <span className="text-[10px] tracking-widest font-mono hidden md:inline">ENVIAR</span>
          </button>
        </div>
      </div>

      <div className="text-[8px] font-mono tracking-widest text-[var(--color-text-dim)] text-center">
        Voice (Whisper) · Vision (Claude analiza imágenes) · TTS (Tony habla) · Pro-active alerts · Specialist routing · Hey Tony · Share link · Export MD/JSON
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowShareModal(false);
          }}
        >
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-[var(--color-purple)]" />
                <h2 className="text-[12px] tracking-widest font-mono text-[var(--color-text)] font-bold">
                  COMPARTIR CONVERSACIÓN
                </h2>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-[var(--color-text-dim)] hover:text-[var(--color-red)]"
              >
                <XIcon size={16} />
              </button>
            </div>

            {!shareUrl ? (
              <>
                <p className="text-[11px] text-[var(--color-text-dim)] mb-4 leading-relaxed">
                  Generá una URL pública read-only de esta conversación. Cualquiera con el link
                  puede leerla pero no responder. Las imágenes no se incluyen.
                </p>
                <div className="text-[10px] font-mono text-[var(--color-text-dim)] mb-4 space-y-1">
                  <div>· {messages.length} mensajes en el chat actual</div>
                  <div>· Las últimas 200 conversaciones se incluyen</div>
                  <div>· Podés revocar el link en cualquier momento</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => createShare(1)}
                    disabled={creatingShare}
                    className="px-3 py-2 text-[10px] tracking-widest font-mono rounded border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-purple)]/40 hover:text-[var(--color-purple)] transition disabled:opacity-50"
                  >
                    {creatingShare ? <Loader2 size={11} className="animate-spin inline" /> : "24H"}
                  </button>
                  <button
                    onClick={() => createShare(7)}
                    disabled={creatingShare}
                    className="px-3 py-2 text-[10px] tracking-widest font-mono rounded border border-[var(--color-purple)]/40 bg-[var(--color-purple)]/10 text-[var(--color-purple)] hover:bg-[var(--color-purple)]/20 transition disabled:opacity-50"
                  >
                    {creatingShare ? <Loader2 size={11} className="animate-spin inline" /> : "7 DÍAS"}
                  </button>
                  <button
                    onClick={() => createShare(30)}
                    disabled={creatingShare}
                    className="px-3 py-2 text-[10px] tracking-widest font-mono rounded border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-purple)]/40 hover:text-[var(--color-purple)] transition disabled:opacity-50"
                  >
                    {creatingShare ? <Loader2 size={11} className="animate-spin inline" /> : "30 DÍAS"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono tracking-widest text-[var(--color-green)]">
                  <CheckCircle2 size={12} />
                  LINK CREADO
                </div>
                <div className="flex items-stretch gap-2 mb-3">
                  <div className="flex-1 px-3 py-2 bg-black/50 border border-[var(--color-border)] rounded font-mono text-[11px] text-[var(--color-cyan)] overflow-hidden">
                    <div className="truncate">{shareUrl}</div>
                  </div>
                  <button
                    onClick={copyShareUrl}
                    className={`px-3 py-2 rounded border transition flex items-center gap-1 text-[10px] tracking-widest font-mono ${
                      shareCopied
                        ? "border-[var(--color-green)]/40 bg-[var(--color-green)]/10 text-[var(--color-green)]"
                        : "border-[var(--color-purple)]/40 bg-[var(--color-purple)]/10 text-[var(--color-purple)] hover:bg-[var(--color-purple)]/20"
                    }`}
                  >
                    {shareCopied ? (
                      <>
                        <CheckCircle2 size={11} /> COPIADO
                      </>
                    ) : (
                      <>
                        <Copy size={11} /> COPIAR
                      </>
                    )}
                  </button>
                </div>
                {shareExpiresAt && (
                  <div className="text-[10px] font-mono text-[var(--color-text-dim)] mb-3">
                    Expira: {new Date(shareExpiresAt).toLocaleString("es-AR")}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 text-center text-[10px] tracking-widest font-mono rounded border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-cyan)]/40 hover:text-[var(--color-cyan)] transition flex items-center justify-center gap-1.5"
                  >
                    <LinkIcon size={11} />
                    ABRIR
                  </a>
                  <button
                    onClick={() => {
                      setShareUrl(null);
                      setShareExpiresAt(null);
                    }}
                    className="flex-1 px-3 py-2 text-[10px] tracking-widest font-mono rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-purple)] transition"
                  >
                    GENERAR OTRO
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  msg: m, idx, speaking, onSpeak,
}: { msg: Msg; idx: number; speaking: boolean; onSpeak: () => void }) {
  if (m.role === "system_alert") {
    const priority = (m.alert_priority || "info").toLowerCase();
    const toneClass = priority === "critical" ? "border-[var(--color-red)]/50 bg-[var(--color-red)]/10 text-[var(--color-red)]" :
      priority === "high" ? "border-[var(--color-amber)]/50 bg-[var(--color-amber)]/10 text-[var(--color-amber)]" :
      "border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/5 text-[var(--color-cyan)]";
    let timeLabel = "";
    try {
      const d = new Date(m.ts);
      timeLabel = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {}
    return (
      <div className="flex justify-center my-2">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full border text-[11px] font-mono ${toneClass}`}>
          {priority === "critical" ? <AlertTriangle size={12} className="animate-pulse" /> : <Bell size={12} />}
          <span>{m.text}</span>
          <span className="text-[var(--color-text-dim)] text-[9px]">· {timeLabel}</span>
        </div>
      </div>
    );
  }

  const isUser = m.role === "user";
  const sourceKey = (m.source || "").toLowerCase().replace(/[^a-z_]/g, "");
  const provider = PROVIDER_META[sourceKey] || PROVIDER_META.llm;
  const ProviderIcon = provider.icon;

  let timeLabel = "";
  try {
    const d = new Date(m.ts);
    timeLabel = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {}

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center ${
          isUser
            ? "border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10"
            : sourceKey === "anthropic"
            ? "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 glow-amber"
            : "border-[var(--color-green)]/40 bg-[var(--color-green)]/10 glow-green"
        }`}
      >
        {isUser ? <User size={14} className="text-[var(--color-cyan)]" /> : <ProviderIcon size={14} className={provider.color} />}
      </div>
      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && m.specialist && (
          <div className="flex items-center gap-1.5 text-[8px] font-mono tracking-widest text-[var(--color-amber)] px-2 py-0.5 rounded-full bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/30">
            <Brain size={9} />
            SPECIALIST · {m.specialist.name}
            <span className="text-[var(--color-text-dim)] ml-1">(matched '{m.specialist.matched_keyword}')</span>
          </div>
        )}
        {!isUser && m.images_analyzed && m.images_analyzed > 0 && (
          <div className="flex items-center gap-1.5 text-[8px] font-mono tracking-widest text-[var(--color-cyan)] px-2 py-0.5 rounded-full bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/30">
            <ImageIcon size={9} />
            ANALIZÓ {m.images_analyzed} IMAGEN(ES)
          </div>
        )}
        {/* User images preview */}
        {isUser && m.images && m.images.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {m.images.map((img, i) =>
              img.preview_url ? (
                <img
                  key={i}
                  src={img.preview_url}
                  alt={`upload ${i}`}
                  className="h-20 w-auto max-w-32 rounded border border-[var(--color-cyan)]/40 object-cover"
                />
              ) : (
                <div key={i} className="h-20 w-20 rounded border border-[var(--color-cyan)]/40 bg-black/40 flex items-center justify-center text-[var(--color-cyan)]/60">
                  <ImageIcon size={20} />
                </div>
              )
            )}
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-lg whitespace-pre-wrap text-[13px] leading-relaxed relative group ${
            isUser
              ? "bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/40 text-[var(--color-text)]"
              : "bg-black/30 border border-[var(--color-border)] text-[var(--color-text)]"
          }`}
        >
          {renderMarkdown(m.text)}
          {/* Speak button for Tony messages */}
          {!isUser && m.role === "tony" && (
            <button
              onClick={onSpeak}
              className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border bg-[var(--color-bg-card)] flex items-center justify-center transition-all ${
                speaking
                  ? "border-[var(--color-amber)] text-[var(--color-amber)] animate-pulse"
                  : "border-[var(--color-border)] text-[var(--color-text-dim)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-amber)] hover:border-[var(--color-amber)]/40"
              }`}
              title={speaking ? "Parar audio" : "Hablar (TTS)"}
            >
              {speaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-[8px] font-mono tracking-widest text-[var(--color-text-dim)]">
          <span>{timeLabel}</span>
          {!isUser && m.source && (
            <>
              <span>·</span>
              <span className={`flex items-center gap-1 ${provider.color}`}>
                <ProviderIcon size={8} />
                {provider.label}
              </span>
            </>
          )}
          {m.model && m.model !== "?" && !isUser && (
            <>
              <span>·</span>
              <span className="text-[var(--color-text-dim)]/70">{m.model}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, idx) => {
        if (line.startsWith("### ")) return <div key={idx} className="text-[var(--color-amber)] font-bold text-[14px] mt-2 mb-1">{renderInline(line.slice(4))}</div>;
        if (line.startsWith("## ")) return <div key={idx} className="text-[var(--color-amber)] font-bold text-[15px] mt-3 mb-1.5">{renderInline(line.slice(3))}</div>;
        if (line.startsWith("# ")) return <div key={idx} className="text-[var(--color-amber)] font-bold text-[16px] mt-3 mb-2">{renderInline(line.slice(2))}</div>;
        if (/^[-*•]\s/.test(line)) return <div key={idx} className="flex gap-2 pl-2"><span className="text-[var(--color-amber)] shrink-0">•</span><span>{renderInline(line.replace(/^[-*•]\s/, ""))}</span></div>;
        if (/^---+$/.test(line.trim())) return <hr key={idx} className="border-[var(--color-border)] my-2" />;
        if (!line.trim()) return <div key={idx} className="h-1.5" />;
        return <div key={idx}>{renderInline(line)}</div>;
      })}
    </>
  );
}

function renderInline(text: string) {
  const parts: any[] = [];
  let lastIdx = 0;
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let match;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={i++} className="text-[var(--color-text)] font-bold">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(<code key={i++} className="text-[var(--color-amber)] font-mono text-[12px] bg-black/40 px-1 rounded">{token.slice(1, -1)}</code>);
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length > 0 ? <>{parts}</> : text;
}
