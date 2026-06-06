# İnfaz Hesaplama Programı ⚖️

Türk ceza infaz mevzuatına göre (5275 Sayılı Kanun) hükümlülerin infaz sürelerini,
açığa geçiş tarihlerini, denetimli serbestlik ve koşullu salıverme tarihlerini
hesaplayan **Electron tabanlı** masaüstü uygulaması.

---

## Özellikler

| Özellik | Açıklama |
|---|---|
| **Otomatik infaz oranları** | Suç kategorisine göre kapalı/açık/KS oranları otomatik uygulanır |
| **Tarih bazlı oran çözümü** | Suç tarihine göre 2014, 2016, 2020 (7242) ve 2025 (7550) eşikleri uygulanır |
| **Çocuk/Yetişkin ayrımı** | Terör, cinsel, uyuşturucu ve örgüt suçlarında çocuk/yetişkin oran farkı desteklenir |
| **Mükerrir analizi** | Mükerrir ve ikinci kez mükerrir için dönemsel oranlar hesaplanır |
| **Resmi takvim hesabı** | 1 yıl = takvim yılı, 1 ay = gerçek ay uzunluğu; artık yıllar dahil |
| **Mahsup (tutukluluk)** | Tutukluluk veya başka mahsup süresi efektif başlangıca yansıtılır |
| **Giriş/Çıkış Dönemleri** | Birden fazla dönem eklenebilir; biri "hesaba katılmayacak" olarak işaretlenebilir |
| **Denetimli Serbestlik** | 1 yıl, 2 yıl (özel grup) ve 3 yıl (Geçici 6 seçeneği) DS hesaplanır |
| **Lehe Yasa Karşılaştırması** | 765 TCK ↔ 5237 TCK KS tarihleri karşılaştırılarak lehe yasa tespiti yapılır |
| **Adli Para / Tekerrür** | Karar tarihine göre kesinlik, kanun yolu, tekerrüre esas olma ve uyarlama analizi |
| **Müebbet Ceza** | Müebbet (30 yıl) ve Ağırlaştırılmış Müebbet (36 yıl) ayrı hesap |

---

## İnfaz Kategorileri

| Kategori | Kapalı Oran | KS Oranı | DS |
|---|---|---|---|
| Genel suç | ½ | 7242 öncesi ⅔, sonrası ½ | ✅ (1 yıl / Geçici 6 seçeneği 3 yıl) |
| Terör | Yetişkin ¾, çocuk ⅔ | Yetişkin ¾, çocuk ⅔ | ✅ |
| Cinsel suçlar | Basit ⅔, nitelikli (2014 öncesi ⅔, sonrası ¾), çocuk ⅔ | Aynı oran | ✅ |
| Uyuşturucu ticareti | Yetişkin (2014 öncesi ⅔, sonrası ¾), çocuk ⅔ | Aynı oran | ✅ |
| Kasten öldürme / İşkence / Eziyet | ⅔ | ⅔ | ✅ |
| Özel grup (83/94/95/96/87-2-d/MİT) | 2016 öncesi ½, sonrası ⅔ | 2016 öncesi ½, sonrası ⅔ | ✅ (2016 öncesi 2 yıl) |
| Örgüt / Mükerrir | Eski ¾, 7242 sonrası ⅔ (çocukta ⅔) | Aynı oran | ✅ |
| İkinci kez mükerrir | 7550 sonrası ¾ | 7550 sonrası ¾ | ✅ |
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
    ├── index.html       # Uygulama arayüzü (5 sekme)
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
