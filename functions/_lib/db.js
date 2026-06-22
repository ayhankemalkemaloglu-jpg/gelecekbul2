/**
 * functions/_lib/db.js — D1 helpers (users + atlas usage)
 * ensureSchema runs idempotent CREATE TABLE IF NOT EXISTS so a fresh D1 works
 * even before `wrangler d1 execute schema.sql`.
 */
import { verifyJWT, readCookie, SESSION_COOKIE } from "./auth.js";

export async function ensureSchema(DB) {
  await DB.batch([
    DB.prepare(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        pass_hash TEXT NOT NULL,
        pass_salt TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free',
        role TEXT NOT NULL DEFAULT 'student',
        created_at INTEGER NOT NULL,
        last_login INTEGER
      )`
    ),
    DB.prepare(
      `CREATE TABLE IF NOT EXISTS atlas_usage (
        user_id TEXT NOT NULL,
        day TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, day)
      )`
    )
  ]);
}

export async function getUserByEmail(DB, email) {
  return DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
}
export async function getUserById(DB, id) {
  return DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
}
export async function createUser(DB, u) {
  await DB.prepare(
    `INSERT INTO users (id,email,name,pass_hash,pass_salt,plan,role,created_at)
     VALUES (?,?,?,?,?,?,?,?)`
  ).bind(u.id, u.email, u.name || null, u.pass_hash, u.pass_salt, u.plan || "free", u.role || "student", Date.now()).run();
}
export async function touchLogin(DB, id) {
  await DB.prepare("UPDATE users SET last_login = ? WHERE id = ?").bind(Date.now(), id).run();
}
export async function setPlan(DB, id, plan) {
  await DB.prepare("UPDATE users SET plan = ? WHERE id = ?").bind(plan, id).run();
}

/* Atlas daily usage (per user, UTC day) */
export function utcDay(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
export async function getUsage(DB, userId, day) {
  const row = await DB.prepare("SELECT count FROM atlas_usage WHERE user_id=? AND day=?").bind(userId, day).first();
  return row ? row.count : 0;
}
export async function incUsage(DB, userId, day) {
  await DB.prepare(
    `INSERT INTO atlas_usage (user_id, day, count) VALUES (?,?,1)
     ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1`
  ).bind(userId, day).run();
}

/* Resolve the logged-in user from the session cookie (or null) */
export async function sessionUser(context) {
  const { request, env } = context;
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const payload = await verifyJWT(token, env.AUTH_SECRET || "dev-insecure-secret");
  if (!payload || !payload.sub) return null;
  try {
    await ensureSchema(env.DB);
    return await getUserById(env.DB, payload.sub);
  } catch (e) {
    return null;
  }
}

export function publicUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name, plan: u.plan, role: u.role };
}
