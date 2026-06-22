/** GET /api/auth/me → { ok, user|null } */
import { jsonResponse } from "../../_lib/auth.js";
import { sessionUser, publicUser } from "../../_lib/db.js";

export async function onRequestGet(context) {
  try {
    const u = await sessionUser(context);
    return jsonResponse({ ok: true, user: publicUser(u) });
  } catch (e) {
    return jsonResponse({ ok: true, user: null });
  }
}
