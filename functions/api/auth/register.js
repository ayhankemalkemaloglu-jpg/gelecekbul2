/** POST /api/auth/register  { email, password, name?, role? } */
import {
  hashPassword, signJWT, makeSessionCookie, jsonResponse, uuid,
  normalizeEmail, validEmail
} from "../../_lib/auth.js";
import { ensureSchema, getUserByEmail, createUser, publicUser } from "../../_lib/db.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return jsonResponse({ ok: false, error: "db_unconfigured" }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ ok: false, error: "bad_json" }, 400); }

  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const name = (body.name ? String(body.name) : "").trim().slice(0, 80) || null;
  const role = ["student", "veli", "kurumsal"].includes(body.role) ? body.role : "student";

  if (!validEmail(email)) return jsonResponse({ ok: false, error: "invalid_email" }, 400);
  if (password.length < 8) return jsonResponse({ ok: false, error: "weak_password" }, 400);

  await ensureSchema(env.DB);
  const existing = await getUserByEmail(env.DB, email);
  if (existing) return jsonResponse({ ok: false, error: "email_taken" }, 409);

  const { hash, salt } = await hashPassword(password);
  const id = uuid();
  await createUser(env.DB, { id, email, name, pass_hash: hash, pass_salt: salt, plan: "free", role });

  const user = { id, email, name, plan: "free", role };
  const token = await signJWT({ sub: id, plan: "free" }, env.AUTH_SECRET || "dev-insecure-secret");
  return jsonResponse({ ok: true, user: publicUser(user) }, 200, { "Set-Cookie": makeSessionCookie(token) });
}
