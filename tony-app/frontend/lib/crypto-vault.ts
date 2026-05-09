/**
 * Browser-side AES-GCM encryption for password vault.
 * Master password derives an AES-256 key via PBKDF2-SHA256 (600k iterations).
 * Server NEVER sees the master password — only encrypted blobs.
 */

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export type VaultEntry = {
  id: string;
  label: string;
  username?: string;
  url?: string;
  encrypted_password: string; // base64
  iv_password: string; // base64
  encrypted_notes?: string;
  iv_notes?: string;
  category?: string;
  created_at: string;
  updated_at: string;
};

export type DecryptedEntry = {
  id: string;
  label: string;
  username?: string;
  url?: string;
  password: string;
  notes?: string;
  category?: string;
  created_at: string;
  updated_at: string;
};

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export function generateSalt(): string {
  const arr = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(arr);
  return bufToB64(arr.buffer);
}

async function deriveKey(masterPassword: string, saltB64: string, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64ToBuf(saltB64),
      iterations,
      hash: "SHA-256",
    },
    passKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptString(plaintext: string, masterPassword: string, saltB64: string, iterations = PBKDF2_ITERATIONS): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveKey(masterPassword, saltB64, iterations);
  const iv = new Uint8Array(IV_BYTES);
  crypto.getRandomValues(iv);
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  return { ciphertext: bufToB64(ct), iv: bufToB64(iv.buffer) };
}

export async function decryptString(ciphertextB64: string, ivB64: string, masterPassword: string, saltB64: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const key = await deriveKey(masterPassword, saltB64, iterations);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBuf(ivB64) },
    key,
    b64ToBuf(ciphertextB64)
  );
  return new TextDecoder().decode(pt);
}

export async function encryptEntry(
  entry: { label: string; username?: string; url?: string; password: string; notes?: string; category?: string; id?: string; created_at?: string },
  masterPassword: string,
  saltB64: string,
  iterations = PBKDF2_ITERATIONS
): Promise<VaultEntry> {
  const pwd = await encryptString(entry.password, masterPassword, saltB64, iterations);
  let notes: { ciphertext: string; iv: string } | null = null;
  if (entry.notes) notes = await encryptString(entry.notes, masterPassword, saltB64, iterations);
  const now = new Date().toISOString();
  return {
    id: entry.id || crypto.randomUUID(),
    label: entry.label,
    username: entry.username,
    url: entry.url,
    encrypted_password: pwd.ciphertext,
    iv_password: pwd.iv,
    encrypted_notes: notes?.ciphertext,
    iv_notes: notes?.iv,
    category: entry.category,
    created_at: entry.created_at || now,
    updated_at: now,
  };
}

export async function decryptEntry(entry: VaultEntry, masterPassword: string, saltB64: string, iterations = PBKDF2_ITERATIONS): Promise<DecryptedEntry> {
  const password = await decryptString(entry.encrypted_password, entry.iv_password, masterPassword, saltB64, iterations);
  let notes: string | undefined;
  if (entry.encrypted_notes && entry.iv_notes) {
    notes = await decryptString(entry.encrypted_notes, entry.iv_notes, masterPassword, saltB64, iterations);
  }
  return {
    id: entry.id,
    label: entry.label,
    username: entry.username,
    url: entry.url,
    password,
    notes,
    category: entry.category,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  };
}

/** Generate a strong random password (16 chars by default). */
export function generatePassword(length = 16, includeSymbols = true): string {
  const lower = "abcdefghijkmnopqrstuvwxyz"; // exclude l (looks like 1)
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude I, O
  const digits = "23456789"; // exclude 0, 1
  const symbols = "!@#$%&*+-=?";
  const charset = lower + upper + digits + (includeSymbols ? symbols : "");
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let pwd = "";
  for (let i = 0; i < length; i++) pwd += charset[arr[i] % charset.length];
  return pwd;
}
