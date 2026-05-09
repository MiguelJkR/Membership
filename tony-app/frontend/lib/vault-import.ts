/**
 * Vault Import — parser para archivos de credenciales.
 * Soporta:
 *  - CSV (LastPass / Bitwarden / 1Password / genérico con headers)
 *  - JSON (Bitwarden export, 1Password 1pif, array genérico, KeePass kdbx-export)
 *  - TXT plain text con patrones (key: value, key=value, blocks separados)
 *
 * Todo se ejecuta en el browser — el server NUNCA ve la data sin encriptar.
 */

export type ImportedEntry = {
  label: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  source_format?: string;
  raw?: string; // for review/debug
};

export type ParseResult = {
  format: "csv" | "json" | "txt" | "unknown";
  entries: ImportedEntry[];
  errors: string[];
  total_lines?: number;
};

// ============== AUTO-DETECT ==============

export function parseAuto(content: string, filename = ""): ParseResult {
  const trimmed = content.trim();
  const ext = filename.toLowerCase().split(".").pop() || "";

  // JSON detection
  if (ext === "json" || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return parseJson(parsed);
    } catch {
      // fall through
    }
  }

  // CSV detection: has comma-separated headers in first line
  if (ext === "csv" || (trimmed.includes(",") && trimmed.split("\n")[0].split(",").length >= 2)) {
    const csvResult = parseCsv(content);
    if (csvResult.entries.length > 0) return csvResult;
  }

  // TXT fallback
  return parseTxt(content);
}

// ============== JSON ==============

export function parseJson(data: any): ParseResult {
  const entries: ImportedEntry[] = [];
  const errors: string[] = [];

  // Bitwarden JSON export: { items: [...] }
  if (data && Array.isArray(data.items)) {
    for (const item of data.items) {
      try {
        const login = item.login || {};
        const url = (login.uris || [])[0]?.uri || login.uri || "";
        entries.push({
          label: item.name || login.username || "Unknown",
          username: login.username,
          password: login.password || "",
          url,
          notes: item.notes,
          category: item.folderId ? "Importado" : undefined,
          source_format: "bitwarden-json",
        });
      } catch (e) {
        errors.push(`Bitwarden item parse: ${e}`);
      }
    }
    return { format: "json", entries: entries.filter((e) => e.password), errors };
  }

  // 1Password 1pif: array of items with overview/details
  if (Array.isArray(data) && data[0]?.overview) {
    for (const item of data) {
      try {
        const ov = item.overview || {};
        const det = item.details || {};
        const fields = det.fields || [];
        const passwordField = fields.find((f: any) => f.designation === "password");
        const userField = fields.find((f: any) => f.designation === "username");
        entries.push({
          label: ov.title || "Unknown",
          username: userField?.value,
          password: passwordField?.value || "",
          url: ov.url || (ov.URLs || [])[0]?.u,
          notes: det.notesPlain,
          source_format: "1password-1pif",
        });
      } catch (e) {
        errors.push(`1Password item: ${e}`);
      }
    }
    return { format: "json", entries: entries.filter((e) => e.password), errors };
  }

  // Generic array of {label, username, password, url, notes}
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === "object") {
        const password = item.password || item.pwd || item.pass || item.secret || "";
        if (!password) continue;
        entries.push({
          label: item.label || item.name || item.title || item.site || "Unknown",
          username: item.username || item.user || item.email || item.login,
          password,
          url: item.url || item.uri || item.site,
          notes: item.notes || item.comment,
          source_format: "generic-json",
        });
      }
    }
    return { format: "json", entries, errors };
  }

  return { format: "json", entries: [], errors: ["JSON format no reconocido"] };
}

// ============== CSV ==============

const CSV_FIELD_MAP: Record<string, string[]> = {
  label: ["name", "title", "label", "account", "site_name", "service"],
  username: ["username", "user", "login", "email", "login_username"],
  password: ["password", "pwd", "pass", "secret", "login_password"],
  url: ["url", "uri", "site", "website", "login_uri"],
  notes: ["notes", "extra", "comments", "comment", "description"],
  category: ["folder", "category", "group", "grouping"],
};

export function parseCsv(content: string): ParseResult {
  const errors: string[] = [];
  const entries: ImportedEntry[] = [];
  const lines = content.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) {
    return { format: "csv", entries: [], errors: ["CSV vacío o sin headers"], total_lines: lines.length };
  }

  // Robust CSV split with quote handling
  function splitCsv(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else inQuote = !inQuote;
      } else if (c === "," && !inQuote) {
        fields.push(current);
        current = "";
      } else {
        current += c;
      }
    }
    fields.push(current);
    return fields;
  }

  const headers = splitCsv(lines[0]).map((h) => h.toLowerCase().trim());
  const fieldIdx: Record<string, number> = {};
  for (const [target, aliases] of Object.entries(CSV_FIELD_MAP)) {
    const idx = headers.findIndex((h) => aliases.includes(h));
    if (idx >= 0) fieldIdx[target] = idx;
  }

  if (fieldIdx.password === undefined) {
    errors.push(`No se encontró columna de password. Headers: ${headers.join(", ")}`);
    return { format: "csv", entries: [], errors, total_lines: lines.length };
  }

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsv(lines[i]);
    const password = values[fieldIdx.password]?.trim();
    if (!password) continue;
    entries.push({
      label: values[fieldIdx.label]?.trim() || values[fieldIdx.url]?.trim() || `Importado ${i}`,
      username: fieldIdx.username !== undefined ? values[fieldIdx.username]?.trim() : undefined,
      password,
      url: fieldIdx.url !== undefined ? values[fieldIdx.url]?.trim() : undefined,
      notes: fieldIdx.notes !== undefined ? values[fieldIdx.notes]?.trim() : undefined,
      category: fieldIdx.category !== undefined ? values[fieldIdx.category]?.trim() || "Importado" : "Importado",
      source_format: "csv",
    });
  }
  return { format: "csv", entries, errors, total_lines: lines.length };
}

// ============== TXT (pattern recognition) ==============

const URL_RE = /https?:\/\/[^\s,;]+|(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?/i;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const KV_RE = /^([a-záéíóúñ][a-záéíóúñ\s_]*?)\s*[:=]\s*(.+)$/i;

const KEY_LABELS: Record<string, string[]> = {
  label: ["site", "service", "name", "title", "label", "sitio", "servicio", "nombre", "titulo", "cuenta", "account"],
  username: ["user", "username", "login", "email", "usuario", "nombre de usuario", "correo"],
  password: ["password", "pass", "pwd", "secret", "contraseña", "contrasena", "clave"],
  url: ["url", "uri", "site", "web", "link", "enlace", "direccion"],
  notes: ["notes", "comment", "info", "notas", "comentario", "informacion", "extra"],
  category: ["category", "group", "folder", "categoria", "grupo", "carpeta"],
};

function detectKey(rawKey: string): string | null {
  const k = rawKey.toLowerCase().trim();
  for (const [target, aliases] of Object.entries(KEY_LABELS)) {
    if (aliases.includes(k) || aliases.some((a) => k.includes(a))) {
      return target;
    }
  }
  return null;
}

export function parseTxt(content: string): ParseResult {
  const errors: string[] = [];
  const entries: ImportedEntry[] = [];

  // Split by blank lines = blocks
  const blocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const entry: Partial<ImportedEntry> & { _matched_lines: string[] } = { _matched_lines: [] };
    const lines = block.split("\n");
    const unmatched: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Try key:value pattern
      const kvMatch = trimmed.match(KV_RE);
      if (kvMatch) {
        const target = detectKey(kvMatch[1]);
        if (target && !(entry as any)[target]) {
          (entry as any)[target] = kvMatch[2].trim().replace(/^["']|["']$/g, "");
          entry._matched_lines.push(line);
          continue;
        }
      }

      // URL standalone
      if (!entry.url) {
        const urlMatch = trimmed.match(URL_RE);
        if (urlMatch) entry.url = urlMatch[0];
      }
      // Email standalone (presumed username)
      if (!entry.username) {
        const emailMatch = trimmed.match(EMAIL_RE);
        if (emailMatch) entry.username = emailMatch[0];
      }
      unmatched.push(line);
    }

    if (entry.password) {
      entries.push({
        label: entry.label || entry.url || entry.username || "Importado",
        username: entry.username,
        password: entry.password,
        url: entry.url,
        notes: entry.notes || (unmatched.length > 1 ? unmatched.join("\n") : undefined),
        category: entry.category || "Importado",
        source_format: "txt-pattern",
        raw: block.length > 500 ? block.substring(0, 500) + "..." : block,
      });
    } else if (block.length > 20) {
      errors.push(`Block sin password detectado: ${block.substring(0, 60)}...`);
    }
  }

  // Fallback: if no blocks detected, try line-by-line with looser patterns
  if (entries.length === 0 && blocks.length === 1) {
    const allLines = content.split("\n");
    let currentEntry: Partial<ImportedEntry> = {};
    for (const line of allLines) {
      const kv = line.match(KV_RE);
      if (kv) {
        const target = detectKey(kv[1]);
        if (target) (currentEntry as any)[target] = kv[2].trim();
      }
      // Heuristic: if password just got set, push entry
      if (currentEntry.password) {
        entries.push({
          label: currentEntry.label || "Importado",
          username: currentEntry.username,
          password: currentEntry.password,
          url: currentEntry.url,
          notes: currentEntry.notes,
          category: "Importado",
          source_format: "txt-loose",
        });
        currentEntry = {};
      }
    }
  }

  return { format: "txt", entries, errors, total_lines: content.split("\n").length };
}
