/** POST /api/auth/login  { email, password } */
import {
  verifyPassword, signJWT, makeSessionCookie, jsonResponse, normalizeEmail
} from "../../_lib/auth.js";
import { ensureSchema, getUserByEmail, touchLogin, publicUser } from "../../_lib/db.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return jsonResponse({ ok: false, error: "db_unconfigured" }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ ok: false, error: "bad_json" }, 400); }

  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!email || !password) return jsonResponse({ ok: false, error: "missing_fields" }, 400);

  await ensureSchema(env.DB);
  const u = await getUserByEmail(env.DB, email);
  // same generic error whether email or password is wrong
  if (!u || !(await verifyPassword(password, u.pass_salt, u.pass_hash))) {
    return jsonResponse({ ok: false, error: "invalid_credentials" }, 401);
  }
  await touchLogin(env.DB, u.id);
  const token = await signJWT({ sub: u.id, plan: u.plan }, env.AUTH_SECRET || "dev-insecure-secret");
  return jsonResponse({ ok: true, user: publicUser(u) }, 200, { "Set-Cookie": makeSessionCookie(token) });
}
