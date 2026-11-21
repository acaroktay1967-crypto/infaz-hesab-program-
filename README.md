# İnfaz Hesaplama Programı ⚖️

Türk ceza infaz mevzuatına göre (5275 Sayılı Kanun) hükümlülerin infaz sürelerini,
açığa geçiş tarihlerini, denetimli serbestlik ve koşullu salıverme tarihlerini
hesaplayan **Electron tabanlı** masaüstü uygulaması.

---

## Özellikler

| Özellik | Açıklama |
|---|---|
| **Otomatik infaz oranları** | Suç kategorisine göre kapalı/açık/KS oranları otomatik uygulanır |
| **Resmi takvim hesabı** | 1 yıl = takvim yılı, 1 ay = gerçek ay uzunluğu; artık yıllar dahil |
| **Mahsup (tutukluluk)** | Tutukluluk veya başka mahsup süresi efektif başlangıca yansıtılır |
| **Giriş/Çıkış Dönemleri** | Birden fazla dönem eklenebilir; biri "hesaba katılmayacak" olarak işaretlenebilir |
| **Denetimli Serbestlik** | Koşullu salıverme tarihinden 1 yıl önce DS tarihi otomatik hesaplanır |
| **Lehe Yasa Karşılaştırması** | 765 TCK ↔ 5237 TCK KS tarihleri karşılaştırılarak lehe yasa tespiti yapılır |
| **Müebbet Ceza** | Müebbet (30 yıl) ve Ağırlaştırılmış Müebbet (36 yıl) ayrı hesap |

---

## İnfaz Kategorileri

| Kategori | Kapalı Oran | KS Oranı | DS |
|---|---|---|---|
| Genel Suç (5237 TCK) | ½ | ⅔ | ✅ KS'den 1 yıl önce |
| Örgütsüz Cinsel Saldırı (TCK 102/1) | ⅔ | ⅔ | ✅ |
| Ağır Suç (TCK 81, 94, 102/2, 103, 109/3, 188) | ¾ | ¾ | ✅ |
| Terör Suçu (TMK 1-17) | ¾ | ¾ | ❌ |
| Çocuğa Karşı Cinsel Suç (TCK 103) | ¾ | ¾ | ❌ |
| Müebbet Hapis | 24 yıl | 30 yıl | ✅ |
| Ağırlaştırılmış Müebbet | 30 yıl | 36 yıl | ❌ |

---

## Kurulum & Çalıştırma

```bash
npm install
npm start
```

---

## Proje Yapısı

```
├── main.js              # Electron ana süreç & IPC yöneticileri
├── preload.js           # Güvenli context-bridge katmanı
├── src/
│   └── infaz.js         # Tüm hesaplama motoru (testlenebilir, framework bağımsız)
└── renderer/
    ├── index.html       # Uygulama arayüzü (3 sekme)
    ├── style.css        # Stiller
    └── renderer.js      # Arayüz mantığı & IPC çağrıları
```

---

## Yasal Dayanak

- **5275 Sayılı Kanun** – Ceza ve Güvenlik Tedbirlerinin İnfazı
- **5237 TCK Madde 107** – Koşullu Salıverme
- **5275 Sayılı Kanun Madde 105/A** – Denetimli Serbestlik
- **765 Sayılı TCK** – Lehe yasa karşılaştırması için

> ⚠️ **Uyarı:** Bu program bilgi amaçlıdır. Kesin hukuki işlemler için mutlaka bir avukat veya infaz hâkimliğine başvurunuz.

## Sürüm 2.0 – Suç tarihine göre lehe infaz hesabı (Kasım 2026)

Hesaplama artık **suç tarihine** göre, o tarihte yürürlükte olan (lehe) infaz hükümlerini uygular; suç türü (istisna suçlar), **çocuk/yetişkin** ayrımı ve tekerrür dikkate alınır.

| Suç tarihi | Uygulanan kural |
|---|---|
| 01.06.2005 öncesi | Ana hesapta 765/647 ve 5237/5275 hüküm süreleri ile 765/647 KS oranını girin; mahsup dahil KS tarihleri otomatik karşılaştırılır ve daha lehe rejim uygulanır |
| 28.06.2014 öncesi | 102/2, 103, 104/2-3 ve TCK 188'de KS 2/3 (sonrası yetişkinde 3/4 – 6545 s.K.) |
| 01.07.2016 öncesi | TCK 83, 87/2-d, 94-96 ve MİT suçlarında KS 1/2, DS 2 yıl (6713 s.K. öncesi) |
| 30.03.2020 ve öncesi | Geçici 6: DS genel suçlarda 3 yıl, istisna suçlarda 1 yıl, 70 yaş / 0-6 yaş çocuklu kadında 4 yıl |
| 31.07.2023 ve öncesi | Geçici 10/6 (7571 s.K.): suç türü istisnaları dışında; kararın kesinleşme ve infaza başlama tarihleri de 31.07.2023 veya öncesi olmalıdır |
| 04.06.2025 ve sonrası | 7550 s.K.: DS için KS süresinin 1/10'u (en az 5 gün) kurumda (105/A, Geçici 11); ikinci tekerrürde KS 3/4 (108/3) |
| 18.08.2026 ve sonrası | 7593 s.K.: TCK 81-83, 102-103, 188, 220'de 15 yaş altı günler iki gün sayılmaz (107/5) |

**Koşullu salıverilme oranları (5275 m.107):** genel suçlar 1/2; 107/2 istisna suçları 2/3; nitelikli cinsel suçlar, TCK 188 ve terör suçlarında yetişkinde 3/4, **çocukta 2/3**. Müebbet: 24 yıl, ağırlaştırılmış 30 yıl; örgüt/terör (yetişkin) 30/36 yıl; tekerrürde 33/39 yıl. Çocukların suçları tekerrüre esas olmaz (TCK 58/5).

**Kaynak:** Osman Atalay (Yargıtay 1. Ceza Dairesi Üyesi) infaz şemaları; 5275 s.K. güncel metni; Açık Ceza İnfaz Kurumlarına Ayrılma Yönetmeliği m.6.

**Diğer değişiklikler:** tek hesaplama motoru (`pwa-infaz.js`; Electron sürümü de aynı motoru kullanır), eski `renderer/` ve `preload.js` kaldırıldı, service worker GitHub Pages alt dizininde çalışacak şekilde düzeltildi, `npm test` ile birim testleri eklendi.

> Program bilgi amaçlıdır; kesin hesap için infaz savcılığı / infaz hâkimliği kararı esastır.
