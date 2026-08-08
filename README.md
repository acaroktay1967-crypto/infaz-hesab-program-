# İnfaz Hesaplama Programı ⚖️

Türk ceza infaz mevzuatına göre (5275 Sayılı Kanun) hükümlülerin infaz sürelerini,
açığa geçiş tarihlerini, denetimli serbestlik ve koşullu salıverme tarihlerini
hesaplayan **Electron tabanlı** masaüstü uygulaması. Arayüz aynı zamanda tarayıcıda
çalışabildiği için iPhone/Safari üzerinde de kullanılabilir.

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

### iPhone / Mobil Tarayıcı

- `/renderer/index.html` dosyasını bir web sunucusu üzerinden açın
- Uygulama Electron olmadan doğrudan tarayıcı içinde hesaplama yapar
- iPhone Safari'de isterseniz **Ana Ekrana Ekle** ile uygulama gibi kullanabilirsiniz

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
