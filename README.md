# Gelecek Bul — statik arayüz

> Bir test değil, canlı bir **Kariyer GPS**'i.

Gelecek Bul'un tüm arayüzünün (ana sayfa + tüm alt sayfalar, özellikler,
butonlar, metinler) **aurora "midnight glass"** tasarım sistemiyle yeniden
inşa edilmiş, derleme adımı gerektirmeyen statik kopyası.

## Tasarım sistemi (template — değişmez)

Tüm sayfalar tek bir tasarım dilini paylaşır; tokenlar `styles.css :root`
içinde yaşar (renkler, imza aurora gradyanı, Inter tip ölçeği, boşluk, radius,
gölge, yüzeyler). Yeniden temalandırmak için sadece oradaki değişkenleri düzenle.

- `index.html` — ana sayfa (hero, nasıl çalışır, araçlar, planlar, SSS, CTA)
- `styles.css` — tüm tasarım tokenları + bileşen sınıfları (nav, kart, plan,
  form, sekme, FAQ, modal, prose…)
- `script.js` — paylaşılan etkileşimler: mobil menü, hero morph, login modal,
  sekmeler, sayaçlar, scroll-reveal (her sayfada aynı dosya, element yoksa no-op)

Derleme yok — `index.html`'i aç, yeter.

## Sayfalar

| Grup | Sayfalar |
|---|---|
| Keşfet | `index.html`, `test.html`, `meslekler.html`, `nomad-harita.html`, `tercih.html`, `maas-rotalari.html` |
| Dönüşüm | `mock-mulakat.html`, `snapshot.html`, `tercih-donemi.html`, `kariyer-gps-landing.html`, `karsilastir.html` |
| Hesap | `dashboard.html`, `davet.html`, `referans.html`, `mezunlar.html`, `onboarding.html`, `test-karsilastir.html` |
| Aile & Okul | `aile.html`, `veli-dashboard.html`, `veli-panel.html`, `okullar.html`, `okul-demo.html`, `sinif-pilot.html` |
| Destek | `iletisim.html`, `sinav-takvimi.html`, `yenilikler.html`, `404.html` |
| Yasal | `yasal.html`, `kvkk.html`, `cerez.html`, `cocuk-veri.html`, `mesafeli-satis.html`, `sorumluluk.html`, `uyelik-sozlesmesi.html` |

## Yerelde çalıştır

```bash
python3 -m http.server 8000
# sonra http://localhost:8000 adresini aç
```

## Notlar

- **Backend yok.** Test akışı, formlar, ödeme ve giriş arayüzleri birebir
  taşındı; canlı API çağrıları yerine demo/yerel davranış gösterir
  (form gönderiminde inline başarı, ödeme/giriş butonları login modalını açar).
- Marka varlıkları `static/icons/` altında (gerçek `logo.webp` + favicon seti).
- İçerik kaynağı: Gelecek Bul production arayüzü (kariyer + meslek seçimi
  platformu, lise 11–12 öğrencileri için).
