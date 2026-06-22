# Gelecek Bul 2 — Cloudflare Pages + gerçek üyelik + keyless Atlas

Bu repo artık **statik site + sunucusuz backend** (Cloudflare Pages Functions).
Üyelik (kayıt/giriş) **gerçek** (D1 veritabanı), Atlas AI **anahtarsız** sunulur
(Gemini anahtarı sunucuda gizli) ve **plana göre günlük kota** uygulanır.

```
functions/
  _lib/auth.js        PBKDF2 şifre + HS256 JWT (cookie) + yardımcılar
  _lib/db.js          D1 (users + atlas_usage) + oturum çözümü
  api/auth/register.js  POST  kayıt
  api/auth/login.js     POST  giriş
  api/auth/logout.js    POST  çıkış
  api/auth/me.js        GET   oturum bilgisi { user|null }
  api/atlas.js          POST  Atlas (giriş + plan kotası zorunlu → Gemini)
schema.sql            D1 tabloları
wrangler.toml         Pages + D1 binding
```

Plan kotaları `functions/api/atlas.js` içinde: **Free 5 · Pro 60 · Pro Max 400 mesaj/gün** (UTC). İstediğin gibi değiştir.

---

## Kurulum (tek seferlik)

Gereken: Cloudflare hesabı + bir **Gemini API anahtarı** (https://aistudio.google.com/apikey).
Komutlar için `npx wrangler` yeter (global kurulum şart değil).

### 1) D1 veritabanını oluştur ve şemayı uygula
```bash
npx wrangler d1 create gelecekbul2-db
# Çıktıdaki database_id'yi wrangler.toml içine yapıştır (REPLACE_WITH_YOUR_D1_DATABASE_ID)
npx wrangler d1 execute gelecekbul2-db --remote --file=./schema.sql
```

### 2) Pages projesini repoya bağla
Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** →
`ayhankemalkemaloglu-jpg/gelecekbul2` reposunu seç.
- Production branch: `claude/nifty-hopper-c014ul` (ya da `main`'e merge ettikten sonra `main`)
- Framework preset: **None** · Build command: **(boş)** · Build output directory: **`/`**
- Functions otomatik `functions/` klasöründen algılanır.

### 3) Bağlantı + gizli anahtarlar (Pages projesi ayarları)
Dashboard → Pages projesi → **Settings → Functions → D1 database bindings**:
- Variable name: `DB` → Database: `gelecekbul2-db`

Dashboard → **Settings → Environment variables & Secrets** (Production):
- `GEMINI_API_KEY` = Gemini anahtarın  (Secret/encrypted)
- `AUTH_SECRET`    = uzun rastgele string (Secret) — örn:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
(CLI ile alternatif: `npx wrangler pages secret put GEMINI_API_KEY --project-name gelecekbul2`)

### 4) Yayınla
Git'e push yeterli (otomatik deploy). Manuel istersen: `npx wrangler pages deploy .`

### 5) Domain bağlama
Pages projesi → **Custom domains → Set up a custom domain**.
> ⚠️ **DİKKAT:** `gelecekbul.com` şu an Render'daki eski siteye gidiyor. Onu buraya
> bağlarsan canlı site bu yeni sürümle **değişir**. Önce bir alt alan adıyla
> test etmeni öneririm (örn. `yeni.gelecekbul.com` veya `app.gelecekbul.com`),
> emin olunca ana alan adını taşı.

---

## Plan yükseltme (ödeme entegrasyonu gelene kadar)
Gerçek ödeme henüz yok. Bir kullanıcının planını elle ayarlamak için:
```bash
npx wrangler d1 execute gelecekbul2-db --remote \
  --command "UPDATE users SET plan='promax' WHERE email='ornek@eposta.com'"
```
(plan: `free` | `pro` | `promax`)

## Yerel geliştirme
```bash
npx wrangler pages dev . --d1 DB=gelecekbul2-db
# .dev.vars dosyasına GEMINI_API_KEY ve AUTH_SECRET koy (git'e girmez)
```

## Statik önizleme (backend olmadan)
`python3 -m http.server` ya da `index.html`'i çift tıkla: `/api/*` olmadığı için
giriş/Atlas zarifçe devre dışı kalır (çıkış yapılmış sayılır, Atlas şablon yanıt
verir). Site geri kalanı normal çalışır.

## Güvenlik notları
- Şifreler PBKDF2-SHA256 (100k iter) ile saklanır; düz şifre tutulmaz.
- Oturum: HS256 JWT, **HttpOnly + Secure + SameSite=Lax** cookie (JS okuyamaz).
- Atlas kotası **sunucuda** (D1) tutulur → tarayıcıdan plan taklit edilse bile
  kota aşılamaz. Plan da sunucudaki kullanıcı kaydından okunur.
- `GEMINI_API_KEY` yalnızca sunucuda; tarayıcıya/respoya hiç gitmez.
