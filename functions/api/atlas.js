/**
 * POST /api/atlas  { message, profile?, history? }
 * Keyless Atlas for visitors: the Gemini key lives server-side (env.GEMINI_API_KEY).
 * Requires a logged-in user; enforces a per-plan DAILY quota (server truth, so it
 * can't be spoofed from the browser). Returns { ok, text, used, cap }.
 */
import { jsonResponse } from "../_lib/auth.js";
import { sessionUser, ensureSchema, utcDay, getUsage, incUsage } from "../_lib/db.js";

// Daily message caps by plan (adjust freely)
const CAPS = { free: 5, pro: 60, promax: 400 };

const SYSTEM =
  "Sen 'Atlas'sın: Gelecek Bul platformunun, Türk lise öğrencilerine yönelik " +
  "kariyer ve tercih danışmanı yapay zekâsısın. Sıcak, net, klişesiz ve kısa konuş. " +
  "Türkiye bağlamını bil (YKS, TYT/AYT, bölümler, YÖK Atlas, alanlar SAY/EA/SÖZ/DİL). " +
  "Somut, uygulanabilir öneriler ver; emin olmadığında dürüstçe söyle. Türkçe yanıtla.";

export async function onRequestPost(context) {
  const { request, env } = context;

  const u = await sessionUser(context);
  if (!u) return jsonResponse({ ok: false, error: "auth_required" }, 401);

  if (!env.GEMINI_API_KEY) return jsonResponse({ ok: false, error: "ai_unconfigured" }, 500);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ ok: false, error: "bad_json" }, 400); }
  const message = String(body.message || "").trim().slice(0, 4000);
  const profile = String(body.profile || "").trim().slice(0, 1000);
  if (!message) return jsonResponse({ ok: false, error: "empty" }, 400);

  // ── per-plan daily quota (server-enforced) ──────────────────────────────
  const plan = CAPS[u.plan] !== undefined ? u.plan : "free";
  const cap = CAPS[plan];
  const day = utcDay();
  await ensureSchema(env.DB);
  const used = await getUsage(env.DB, u.id, day);
  if (used >= cap) {
    return jsonResponse(
      { ok: false, error: "quota_exceeded", plan, cap, used, resetsAt: day + "T24:00Z" },
      429
    );
  }
  await incUsage(env.DB, u.id, day); // count the attempt up-front

  // ── build prompt ────────────────────────────────────────────────────────
  const history = Array.isArray(body.history)
    ? body.history.slice(-6).map((m) => ({
        role: m.role === "atlas" || m.role === "model" ? "model" : "user",
        parts: [{ text: String(m.text || "").slice(0, 2000) }]
      }))
    : [];
  const userText = (profile ? "Öğrenci profili: " + profile + "\n\n" : "") + "Soru: " + message;
  const contents = history.concat([{ role: "user", parts: [{ text: userText }] }]);

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        encodeURIComponent(env.GEMINI_API_KEY),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: { temperature: 0.85, maxOutputTokens: 600 }
        })
      }
    );
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return jsonResponse({ ok: false, error: "ai_error", status: r.status, detail: detail.slice(0, 200) }, 502);
    }
    const j = await r.json();
    const c = j && j.candidates && j.candidates[0];
    const text = c && c.content && c.content.parts && c.content.parts[0] && c.content.parts[0].text;
    if (!text) return jsonResponse({ ok: false, error: "ai_empty" }, 502);
    return jsonResponse({ ok: true, text, plan, used: used + 1, cap });
  } catch (e) {
    return jsonResponse({ ok: false, error: "ai_unreachable", detail: String(e).slice(0, 200) }, 502);
  }
}
