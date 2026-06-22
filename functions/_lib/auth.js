/**
 * functions/_lib/auth.js — Cloudflare Pages Functions auth helpers
 * Web Crypto only (no node deps). PBKDF2 password hashing + HS256 JWT in an
 * httpOnly cookie. Used by /api/auth/* and /api/atlas.
 */

const ENC = new TextEncoder();
const DEC = new TextDecoder();
const PBKDF2_ITERS = 100000;
export const SESSION_COOKIE = "gb_session";
export const SESSION_TTL = 60 * 60 * 24 * 30; // 30 gün (saniye)

/* ── hex / base64url ─────────────────────────────────────────────────── */
function bufToHex(buf) {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
}
function hexToBuf(hex) {
  const a = new Uint8Array(hex.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16);
  return a;
}
function b64urlFromBytes(bytes) {
  let bin = "";
  const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlFromStr(str) {
  return b64urlFromBytes(ENC.encode(str));
}
function bytesFromB64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ── password (PBKDF2-SHA256) ────────────────────────────────────────── */
export async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBuf(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", ENC.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERS, hash: "SHA-256" },
    key,
    256
  );
  return { hash: bufToHex(bits), salt: bufToHex(salt) };
}
export async function verifyPassword(password, saltHex, hashHex) {
  const { hash } = await hashPassword(password, saltHex);
  // constant-time-ish compare
  if (hash.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}

/* ── JWT (HS256) ─────────────────────────────────────────────────────── */
async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", ENC.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function signJWT(payload, secret, ttl = SESSION_TTL) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + ttl, ...payload };
  const head = b64urlFromStr(JSON.stringify(header)) + "." + b64urlFromStr(JSON.stringify(body));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, ENC.encode(head));
  return head + "." + b64urlFromBytes(sig);
}
export async function verifyJWT(token, secret) {
  if (!token || token.split(".").length !== 3) return null;
  const [h, p, s] = token.split(".");
  try {
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify("HMAC", key, bytesFromB64url(s), ENC.encode(h + "." + p));
    if (!ok) return null;
    const payload = JSON.parse(DEC.decode(bytesFromB64url(p)));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

/* ── cookies ─────────────────────────────────────────────────────────── */
export function makeSessionCookie(token, ttl = SESSION_TTL) {
  return (
    SESSION_COOKIE + "=" + token +
    "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=" + ttl
  );
}
export function clearSessionCookie() {
  return SESSION_COOKIE + "=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}
export function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  const m = raw.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : null;
}

/* ── helpers ─────────────────────────────────────────────────────────── */
export function uuid() {
  return crypto.randomUUID();
}
export function jsonResponse(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders }
  });
}
export function normalizeEmail(e) {
  return String(e || "").trim().toLowerCase();
}
export function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
