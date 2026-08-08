# İnfaz Hesaplama PWA

iPhone ve Android cihazlar için Progressive Web App (PWA) olarak geliştirilmiş İnfaz Hesaplama Programı.

## Özellikler

- **Progressive Web App (PWA)**: Ana ekrana eklenebilir, çevrimdışı çalışabilir
- **iPhone Optimizasyonu**: iOS Safari için özel meta etiketler ve splash screens
- **Responsive Tasarım**: Mobil cihazlar için optimize edilmiş arayüz
- **Offline Destek**: Service Worker ile çevrimdışı kullanım
- **Touch Friendly**: Dokunmatik ekranlar için optimize edilmiş kontroller

## Kurulum

### Yerel Geliştirme

1. Bir HTTP server başlatın:

```bash
# Python ile
python3 -m http.server 8080

# Node.js ile (npx serve)
npx serve -p 8080

# PHP ile
php -S localhost:8080
```

2. Tarayıcınızda `http://localhost:8080` adresini açın.

### Production Deployment

PWA'nın tam çalışması için HTTPS gereklidir. Aşağıdaki platformlarda ücretsiz barındırabilirsiniz:

- **GitHub Pages**: Repository'yi GitHub'a push edip Pages'ı etkinleştirin
- **Netlify**: `web-app` klasörünü sürükleyip bırakın
- **Vercel**: Repository'yi bağlayın ve deploy edin
- **Cloudflare Pages**: GitHub/GitLab entegrasyonu ile deploy edin

## iPhone'a Ekleme

1. Safari'de web uygulamasını açın
2. Paylaş düğmesine (⎋) dokunun
3. "Ana Ekrana Ekle" seçeneğini seçin
4. "Ekle" düğmesine dokunun

## Dosya Yapısı

```
web-app/
├── index.html          # Ana HTML dosyası (PWA meta etiketleri dahil)
├── style.css           # Mobil optimize CSS
├── infaz.js            # İnfaz hesaplama motoru (browser API)
├── renderer.js         # UI mantığı
├── manifest.json       # PWA Web App Manifest
├── service-worker.js   # Offline destek için Service Worker
├── icons/              # PWA ve iOS ikonları
│   ├── icon-*.png      # Çeşitli boyutlarda uygulama ikonları
│   ├── apple-touch-icon.png
│   ├── favicon.ico
│   └── splash-*.png    # iOS splash screens
└── README.md           # Bu dosya
```

## Teknik Detaylar

### PWA Gereksinimleri

- ✅ Web App Manifest (`manifest.json`)
- ✅ Service Worker (`service-worker.js`)
- ✅ HTTPS (production için)
- ✅ Responsive tasarım
- ✅ Touch-friendly UI

### iOS Safari Desteği

- `apple-mobile-web-app-capable`: Tam ekran mod
- `apple-mobile-web-app-status-bar-style`: Durum çubuğu stili
- `apple-touch-icon`: Ana ekran ikonu
- `apple-touch-startup-image`: Splash screens

### Desteklenen Tarayıcılar

- Safari (iOS 11.3+)
- Chrome (Android 5+)
- Firefox Mobile
- Samsung Internet
- Microsoft Edge

## Electron vs PWA

| Özellik | Electron | PWA |
|---------|----------|-----|
| Platform | Desktop (Win/Mac/Linux) | Tüm platformlar |
| Kurulum | .exe/.dmg/.AppImage | Yok (web tabanlı) |
| Güncelleme | Manuel | Otomatik |
| Boyut | ~150MB | ~500KB |
| Offline | ✅ | ✅ (Service Worker) |
| iPhone | ❌ | ✅ |

## Lisans

MIT License
