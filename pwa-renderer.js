'use strict';

/* ============================================================
   İnfaz Hesaplama Programı – Arayüz Mantığı (iOS Uyumlu)
   ============================================================ */

// ---------------------------------------------------------------------------
// Sayfa yüklendiğinde çalıştır
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
  
  // ---------------------------------------------------------------------------
  // Sekme Yönetimi
  // ---------------------------------------------------------------------------
  
  var sekmeBtnler = document.querySelectorAll('.sekme-btn');
  for (var i = 0; i < sekmeBtnler.length; i++) {
    sekmeBtnler[i].addEventListener('click', function(e) {
      var hedef = this.getAttribute('data-sekme');
      var tumBtnler = document.querySelectorAll('.sekme-btn');
      var tumPaneller = document.querySelectorAll('.sekme-panel');
      
      for (var j = 0; j < tumBtnler.length; j++) {
        tumBtnler[j].classList.remove('aktif');
      }
      for (var k = 0; k < tumPaneller.length; k++) {
        tumPaneller[k].classList.remove('aktif');
      }
      
      this.classList.add('aktif');
      document.getElementById('panel-' + hedef).classList.add('aktif');
    });
  }

  // ---------------------------------------------------------------------------
  // Yardımcı Fonksiyonlar
  // ---------------------------------------------------------------------------
  
  function sayiAl(id, varsayilan) {
    if (varsayilan === undefined) varsayilan = 0;
    var el = document.getElementById(id);
    if (!el) return varsayilan;
    var v = parseInt(el.value, 10);
    return isNaN(v) || v < 0 ? varsayilan : v;
  }

  function gunFarkiLocal(tarih1Str, tarih2Str) {
    if (!tarih1Str || !tarih2Str) return 0;
    var t1 = new Date(tarih1Str);
    var t2 = new Date(tarih2Str);
    var ms = Date.UTC(t2.getFullYear(), t2.getMonth(), t2.getDate()) -
             Date.UTC(t1.getFullYear(), t1.getMonth(), t1.getDate());
    return Math.round(ms / 86400000);
  }

  // ---------------------------------------------------------------------------
  // Dönem Belirleme
  // ---------------------------------------------------------------------------
  
  var DONEM_ETIKETLER = {
    1: '30.03.2020 Öncesi',
    2: '30.03.2020 – 31.07.2023 Arası',
    3: '31.07.2023 – 01.06.2024 Arası',
    4: '01.06.2024 – 04.06.2025 Arası',
    5: '04.06.2025 Sonrası'
  };

  function sucTarihiDonemBelirleLocal(tarihStr) {
    if (!tarihStr) return null;
    var d = new Date(tarihStr);
    if (d < new Date('2020-03-30')) return 1;
    if (d < new Date('2023-07-31')) return 2;
    if (d < new Date('2024-06-01')) return 3;
    if (d < new Date('2025-06-04')) return 4;
    return 5;
  }

  // Suç tarihi değiştiğinde
  var sucTarihiInput = document.getElementById('suc-tarihi');
  if (sucTarihiInput) {
    sucTarihiInput.addEventListener('change', function() {
      var tarih = this.value;
      var donem = sucTarihiDonemBelirleLocal(tarih);
      var badge = document.getElementById('donem-badge');
      var mukerrerAlani = document.getElementById('mukerrer-alani');

      if (donem && badge) {
        badge.style.display = 'block';
        document.getElementById('donem-badge-metin').textContent =
          'Dönem ' + donem + ': ' + DONEM_ETIKETLER[donem];
        if (mukerrerAlani) {
          mukerrerAlani.style.display = donem === 4 ? 'flex' : 'none';
        }
        if (donem !== 4) {
          var mukerrerCb = document.getElementById('mukerrer');
          if (mukerrerCb) mukerrerCb.checked = false;
        }
      } else if (badge) {
        badge.style.display = 'none';
        if (mukerrerAlani) mukerrerAlani.style.display = 'none';
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Tutuklu Toggle
  // ---------------------------------------------------------------------------
  
  var tutukluToggle = document.getElementById('tutuklu-toggle');
  if (tutukluToggle) {
    tutukluToggle.addEventListener('change', function() {
      var evet = this.value === 'evet';
      var alan = document.getElementById('tutuklu-alan');
      if (alan) {
        alan.style.display = evet ? 'block' : 'none';
      }
      if (!evet) {
        var bilgi = document.getElementById('mahsup-bilgisi');
        if (bilgi) bilgi.style.display = 'none';
      }
    });
  }

  // Mahsup güncelleme
  function mahsupGuncelle() {
    var baslangicEl = document.getElementById('tutuklu-baslangic');
    var bitisEl = document.getElementById('tutuklu-bitis');
    var bilgiDiv = document.getElementById('mahsup-bilgisi');
    var gunSayisiInput = document.getElementById('tutuklu-gun-sayisi');

    if (!baslangicEl || !bitisEl) return;
    
    var baslangic = baslangicEl.value;
    var bitis = bitisEl.value;

    if (baslangic && bitis) {
      var gun = gunFarkiLocal(baslangic, bitis);
      if (gunSayisiInput) {
        gunSayisiInput.value = gun >= 0 ? gun : 0;
      }
      if (gun >= 0) {
        var yil = Math.floor(gun / 365);
        var kalan = gun % 365;
        var ay = Math.floor(kalan / 30);
        var g = kalan % 30;
        var parcalar = [];
        if (yil > 0) parcalar.push(yil + ' yıl');
        if (ay > 0) parcalar.push(ay + ' ay');
        if (g > 0) parcalar.push(g + ' gün');
        var sure = parcalar.length ? parcalar.join(' ') : '0 gün';
        var metin = document.getElementById('mahsup-bilgisi-metin');
        if (metin) {
          metin.textContent = 'Mahsup süresi: ' + gun + ' gün (' + sure + ') – bu süre hüküm süresinden düşülür.';
        }
        if (bilgiDiv) bilgiDiv.style.display = 'flex';
      } else {
        var metin2 = document.getElementById('mahsup-bilgisi-metin');
        if (metin2) {
          metin2.textContent = '⚠ Salıverme tarihi tutuklama tarihinden önce olamaz.';
        }
        if (bilgiDiv) bilgiDiv.style.display = 'flex';
      }
    } else {
      if (gunSayisiInput) gunSayisiInput.value = '0';
      if (bilgiDiv) bilgiDiv.style.display = 'none';
    }
  }

  var tutukluBaslangic = document.getElementById('tutuklu-baslangic');
  var tutukluBitis = document.getElementById('tutuklu-bitis');
  if (tutukluBaslangic) tutukluBaslangic.addEventListener('change', mahsupGuncelle);
  if (tutukluBitis) tutukluBitis.addEventListener('change', mahsupGuncelle);

  // ---------------------------------------------------------------------------
  // Hata Mesajı Yardımcıları
  // ---------------------------------------------------------------------------
  
  function hataMesajiGoster(msg) {
    var div = document.getElementById('hata-mesaji');
    var metin = document.getElementById('hata-metin');
    if (metin) metin.textContent = msg;
    if (div) div.style.display = 'flex';
  }

  function hataMesajiGizle() {
    var div = document.getElementById('hata-mesaji');
    if (div) div.style.display = 'none';
  }

  // ---------------------------------------------------------------------------
  // HESAPLA BUTONU
  // ---------------------------------------------------------------------------
  
  var hesaplaBtn = document.getElementById('hesapla-btn');
  if (hesaplaBtn) {
    hesaplaBtn.onclick = function() {
      hataMesajiGizle();

      // Form değerlerini al
      var sucTarihiEl = document.getElementById('suc-tarihi');
      var ilkGirisEl = document.getElementById('ilk-giris');
      var cikisTarihiEl = document.getElementById('cikis-tarihi');
      var tutukluToggleEl = document.getElementById('tutuklu-toggle');
      var istisnaSucEl = document.getElementById('istisna-suc');
      var mukerrerEl = document.getElementById('mukerrer');
      
      var sucTarihi = sucTarihiEl ? sucTarihiEl.value : '';
      var cezaYil = sayiAl('ceza-yil');
      var cezaAy = sayiAl('ceza-ay');
      var cezaGun = sayiAl('ceza-gun');
      var ilkGiris = ilkGirisEl ? ilkGirisEl.value : '';
      var cikisTarihi = cikisTarihiEl ? cikisTarihiEl.value : null;
      var tutukluEvet = tutukluToggleEl ? tutukluToggleEl.value === 'evet' : false;
      var tutuklulukBaslangic = null;
      var tutuklulukBitis = null;
      
      if (tutukluEvet) {
        var tbEl = document.getElementById('tutuklu-baslangic');
        var teEl = document.getElementById('tutuklu-bitis');
        tutuklulukBaslangic = tbEl ? tbEl.value : null;
        tutuklulukBitis = teEl ? teEl.value : null;
      }
      
      var istisnaSuc = istisnaSucEl ? istisnaSucEl.value : 'NORMAL';
      var isMukerrer = mukerrerEl ? mukerrerEl.checked : false;

      // Doğrulama
      if (!sucTarihi) {
        hataMesajiGoster('Lütfen suç tarihini giriniz.');
        return;
      }
      if (!ilkGiris) {
        hataMesajiGoster('Lütfen cezaevine giriş tarihini giriniz.');
        return;
      }
      if (cezaYil === 0 && cezaAy === 0 && cezaGun === 0) {
        hataMesajiGoster('Lütfen hüküm süresini giriniz (en az 1 gün).');
        return;
      }

      // Hesaplama parametreleri
      var params = {
        sucTarihi: sucTarihi,
        cezaYil: cezaYil,
        cezaAy: cezaAy,
        cezaGun: cezaGun,
        cezaeviGirisTarihi: ilkGiris,
        cezaeviCikisTarihi: cikisTarihi,
        tutuklulukBaslangic: tutuklulukBaslangic,
        tutuklulukBitis: tutuklulukBitis,
        istisnaSuc: istisnaSuc,
        isMukerrer: isMukerrer
      };

      // API kontrolü
      if (typeof window.infazAPI === 'undefined' || !window.infazAPI) {
        hataMesajiGoster('Hesaplama modülü yüklenemedi. Sayfayı yenileyin.');
        return;
      }

      // Hesaplama yap
      try {
        var yanit = window.infazAPI.yeniHesapla(params);
        
        if (!yanit) {
          hataMesajiGoster('Hesaplama sonucu alınamadı.');
          return;
        }
        
        if (!yanit.success) {
          hataMesajiGoster('Hesaplama hatası: ' + (yanit.error || 'Bilinmeyen hata'));
          return;
        }
        
        yeniSonuclariGoster(yanit.data);
        
      } catch (err) {
        hataMesajiGoster('Hesaplama hatası: ' + err.message);
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Temizle Butonu
  // ---------------------------------------------------------------------------
  
  var temizleBtn = document.getElementById('temizle-btn');
  if (temizleBtn) {
    temizleBtn.onclick = function() {
      var alanlar = [
        { id: 'suc-tarihi', val: '' },
        { id: 'ceza-yil', val: '0' },
        { id: 'ceza-ay', val: '0' },
        { id: 'ceza-gun', val: '0' },
        { id: 'ilk-giris', val: '' },
        { id: 'cikis-tarihi', val: '' },
        { id: 'tutuklu-toggle', val: 'hayir' },
        { id: 'tutuklu-baslangic', val: '' },
        { id: 'tutuklu-bitis', val: '' },
        { id: 'istisna-suc', val: 'NORMAL' },
        { id: 'tutuklu-gun-sayisi', val: '0' }
      ];
      
      for (var i = 0; i < alanlar.length; i++) {
        var el = document.getElementById(alanlar[i].id);
        if (el) el.value = alanlar[i].val;
      }
      
      var mukerrer = document.getElementById('mukerrer');
      if (mukerrer) mukerrer.checked = false;
      
      var gizlenecekler = ['tutuklu-alan', 'mahsup-bilgisi', 'donem-badge', 'mukerrer-alani', 'sonuclar-kart'];
      for (var j = 0; j < gizlenecekler.length; j++) {
        var el2 = document.getElementById(gizlenecekler[j]);
        if (el2) el2.style.display = 'none';
      }
      
      hataMesajiGizle();
    };
  }

  // ---------------------------------------------------------------------------
  // Sonuçları Göster
  // ---------------------------------------------------------------------------
  
  var sonucVerisi = null; // PDF/Word için sakla
  
  function yeniSonuclariGoster(d) {
    sonucVerisi = d; // Sakla
    
    var kart = document.getElementById('sonuclar-kart');
    if (!kart) return;
    
    kart.style.display = 'block';

    // Özet kutu
    var ozetDonem = document.getElementById('ozet-donem');
    var ozetBaslangic = document.getElementById('ozet-baslangic');
    var ozetKsOran = document.getElementById('ozet-ks-oran');
    var ozetKs = document.getElementById('ozet-ks');
    
    if (ozetDonem) ozetDonem.textContent = 'Dönem ' + d.donemNo + ': ' + d.donemLabel;
    if (ozetBaslangic) ozetBaslangic.textContent = d.efektifBaslangic;
    if (ozetKsOran) ozetKsOran.textContent = d.ksOranKesir + ' (' + d.ksOran + ')';
    if (ozetKs) ozetKs.textContent = d.ksTarihi;

    // Detay tablosu
    var tbody = document.getElementById('sonuc-tablo-govde');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    var satirlar = [];

    // Dönem bilgisi
    satirlar.push({ etiket: 'Suç Tarihi Dönemi', deger: 'Dönem ' + d.donemNo + ' – ' + d.donemLabel, sinif: 'onemli' });
    satirlar.push({ etiket: 'Suç Tarihi', deger: d.sucTarihi });
    satirlar.push({ etiket: 'Cezaevine Giriş', deger: d.cezaeviGirisTarihi });

    // Mahsup
    if (d.mahsupGunSayisi > 0) {
      satirlar.push({ tip: 'ayrac' });
      satirlar.push({ etiket: 'Mahsup Süresi (tutukluluk)', deger: d.mahsupYMG + ' (' + d.mahsupGunSayisi + ' gün)', sinif: 'vurgu' });
      satirlar.push({ etiket: 'Efektif İnfaz Başlangıcı', deger: d.efektifBaslangic, sinif: 'onemli' });
    } else {
      satirlar.push({ etiket: 'Efektif İnfaz Başlangıcı', deger: d.efektifBaslangic });
    }

    // Ceza süresi
    satirlar.push({ tip: 'ayrac' });
    satirlar.push({ etiket: 'Toplam Ceza Süresi', deger: d.toplamCezaYMG + ' (' + d.toplamCezaGun + ' gün)' });
    satirlar.push({ etiket: 'Tam Tahliye Tarihi', deger: d.tahlieTarihi });

    // KS
    satirlar.push({ tip: 'ayrac' });
    satirlar.push({ etiket: 'Koşullu Salıverme Oranı (' + d.ksOranKesir + ')', deger: d.ksOran, sinif: 'oran-satir' });
    satirlar.push({ etiket: 'KS Süresi', deger: d.ksYMG + ' (' + d.ksGun + ' gün)' });
    satirlar.push({ etiket: '→ Koşullu Salıverme Tarihi (KS)', deger: d.ksTarihi, sinif: 'basari' });

    // DS
    satirlar.push({ tip: 'ayrac' });
    if (d.dsEligible) {
      if (d.dsBaslangic) {
        satirlar.push({ etiket: '→ DS Başlangıç Tarihi', deger: d.dsBaslangic, sinif: 'basari' });
        satirlar.push({ etiket: '→ DS Bitiş Tarihi', deger: d.dsBitis });
      }
      satirlar.push({ etiket: 'DS Süresi / Kural', deger: d.dsSuresiAciklama });
      if (d.erkenDsTarihi) {
        satirlar.push({ etiket: '→ Geçici 10/6 Erken DS Tarihi', deger: d.erkenDsTarihi, sinif: 'vurgu' });
      }
    } else {
      satirlar.push({ etiket: 'Denetimli Serbestlik (DS)', deger: '❌ ' + d.dsSuresiAciklama });
    }

    // Erken Açık
    if (d.erkenAcikTarihi) {
      satirlar.push({ tip: 'ayrac' });
      var yil = d.donemNo <= 3 ? '3' : '5';
      satirlar.push({
        etiket: '→ Geçici 10/6 Erken Açık Cezaevi (+' + yil + ' yıl)',
        deger: d.erkenAcikTarihi,
        sinif: 'vurgu'
      });
    }

    // Cezaevinde gerçek kalış
    if (d.cezaeviGercekSure) {
      satirlar.push({ tip: 'ayrac' });
      satirlar.push({ etiket: 'Cezaevinde Kalış (giriş→çıkış)', deger: d.cezaeviGercekSure.toplamYMG + ' (' + d.cezaeviGercekSure.toplamGun + ' gün)' });
      satirlar.push({ etiket: 'Efektif Kalış (mahsup sonrası)', deger: d.cezaeviGercekSure.efektifYMG + ' (' + d.cezaeviGercekSure.efektifGun + ' gün)' });
    }

    // Tabloyu oluştur
    for (var i = 0; i < satirlar.length; i++) {
      var s = satirlar[i];
      if (s.tip === 'ayrac') {
        var ayracTr = document.createElement('tr');
        ayracTr.innerHTML = '<td colspan="2" style="padding:4px 0; background:transparent;"></td>';
        tbody.appendChild(ayracTr);
      } else {
        var tr = document.createElement('tr');
        if (s.sinif) tr.className = s.sinif;
        tr.innerHTML = '<td>' + s.etiket + '</td><td>' + (s.deger || '—') + '</td>';
        tbody.appendChild(tr);
      }
    }

    // Dönem notu
    var notAlani = document.getElementById('donem-not-alani');
    var notMetin = document.getElementById('donem-not-metin');
    if (d.donemNot && notAlani && notMetin) {
      notMetin.textContent = d.donemNot;
      notAlani.style.display = 'flex';
    } else if (notAlani) {
      notAlani.style.display = 'none';
    }

    // Sayfayı sonuçlara kaydır
    kart.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------------------
  // PDF İndir
  // ---------------------------------------------------------------------------
  
  var pdfBtn = document.getElementById('pdf-indir-btn');
  if (pdfBtn) {
    pdfBtn.onclick = function() {
      if (!sonucVerisi) {
        alert('Önce hesaplama yapın.');
        return;
      }
      pdfOlustur(sonucVerisi);
    };
  }
  
  function pdfOlustur(d) {
    var icerik = infazOzetiOlustur(d);
    
    // Yeni pencerede HTML olarak aç (yazdırılabilir)
    var yeniPencere = window.open('', '_blank');
    yeniPencere.document.write(icerik);
    yeniPencere.document.close();
    yeniPencere.print();
  }

  // ---------------------------------------------------------------------------
  // Word İndir
  // ---------------------------------------------------------------------------
  
  var wordBtn = document.getElementById('word-indir-btn');
  if (wordBtn) {
    wordBtn.onclick = function() {
      if (!sonucVerisi) {
        alert('Önce hesaplama yapın.');
        return;
      }
      wordOlustur(sonucVerisi);
    };
  }
  
  function wordOlustur(d) {
    var icerik = infazOzetiOlustur(d);
    
    var blob = new Blob(['\ufeff' + icerik], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'infaz-hesabi-' + new Date().toISOString().slice(0, 10) + '.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------------------
  // İnfaz Özeti HTML Oluştur
  // ---------------------------------------------------------------------------
  
  function infazOzetiOlustur(d) {
    var tarih = new Date().toLocaleDateString('tr-TR');
    
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>İnfaz Hesaplama Özeti</title>';
    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }';
    html += 'h1 { color: #1a3a6c; border-bottom: 2px solid #e8a020; padding-bottom: 10px; }';
    html += 'h2 { color: #2c5fa8; margin-top: 20px; }';
    html += 'table { width: 100%; border-collapse: collapse; margin: 10px 0; }';
    html += 'th, td { padding: 8px 12px; text-align: left; border: 1px solid #ddd; }';
    html += 'th { background: #f0f4fa; color: #1a3a6c; }';
    html += '.onemli { background: #eff6ff; font-weight: bold; }';
    html += '.basari { background: #f0fdf4; color: #1e7e34; font-weight: bold; }';
    html += '.vurgu { background: #fef3c7; }';
    html += '.footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }';
    html += '@media print { body { padding: 0; } }';
    html += '</style></head><body>';
    
    html += '<h1>⚖️ İnfaz Hesaplama Özeti</h1>';
    html += '<p><strong>Hesaplama Tarihi:</strong> ' + tarih + '</p>';
    
    html += '<h2>📋 Temel Bilgiler</h2>';
    html += '<table>';
    html += '<tr><th>Bilgi</th><th>Değer</th></tr>';
    html += '<tr><td>Suç Tarihi Dönemi</td><td class="onemli">Dönem ' + d.donemNo + ' – ' + d.donemLabel + '</td></tr>';
    html += '<tr><td>Suç Tarihi</td><td>' + d.sucTarihi + '</td></tr>';
    html += '<tr><td>Cezaevine Giriş</td><td>' + d.cezaeviGirisTarihi + '</td></tr>';
    html += '<tr><td>Efektif İnfaz Başlangıcı</td><td class="onemli">' + d.efektifBaslangic + '</td></tr>';
    html += '</table>';
    
    if (d.mahsupGunSayisi > 0) {
      html += '<h2>⏱️ Mahsup Bilgisi</h2>';
      html += '<table>';
      html += '<tr><th>Bilgi</th><th>Değer</th></tr>';
      html += '<tr><td>Mahsup Süresi (tutukluluk)</td><td class="vurgu">' + d.mahsupYMG + ' (' + d.mahsupGunSayisi + ' gün)</td></tr>';
      html += '</table>';
    }
    
    html += '<h2>📊 Ceza Süresi</h2>';
    html += '<table>';
    html += '<tr><th>Bilgi</th><th>Değer</th></tr>';
    html += '<tr><td>Toplam Ceza Süresi</td><td>' + d.toplamCezaYMG + ' (' + d.toplamCezaGun + ' gün)</td></tr>';
    html += '<tr><td>Tam Tahliye Tarihi</td><td>' + d.tahlieTarihi + '</td></tr>';
    html += '</table>';
    
    html += '<h2>🔓 Koşullu Salıverme</h2>';
    html += '<table>';
    html += '<tr><th>Bilgi</th><th>Değer</th></tr>';
    html += '<tr><td>KS Oranı</td><td>' + d.ksOranKesir + ' (' + d.ksOran + ')</td></tr>';
    html += '<tr><td>KS Süresi</td><td>' + d.ksYMG + ' (' + d.ksGun + ' gün)</td></tr>';
    html += '<tr><td>Koşullu Salıverme Tarihi</td><td class="basari">' + d.ksTarihi + '</td></tr>';
    html += '</table>';
    
    html += '<h2>🏠 Denetimli Serbestlik</h2>';
    html += '<table>';
    html += '<tr><th>Bilgi</th><th>Değer</th></tr>';
    if (d.dsEligible) {
      if (d.dsBaslangic) {
        html += '<tr><td>DS Başlangıç Tarihi</td><td class="basari">' + d.dsBaslangic + '</td></tr>';
        html += '<tr><td>DS Bitiş Tarihi</td><td>' + d.dsBitis + '</td></tr>';
      }
      html += '<tr><td>DS Kuralı</td><td>' + d.dsSuresiAciklama + '</td></tr>';
      if (d.erkenDsTarihi) {
        html += '<tr><td>Erken DS Tarihi (Geçici 10/6)</td><td class="vurgu">' + d.erkenDsTarihi + '</td></tr>';
      }
    } else {
      html += '<tr><td>Denetimli Serbestlik</td><td>❌ ' + d.dsSuresiAciklama + '</td></tr>';
    }
    html += '</table>';
    
    if (d.erkenAcikTarihi) {
      var yil = d.donemNo <= 3 ? '3' : '5';
      html += '<h2>🏢 Açık Cezaevi</h2>';
      html += '<table>';
      html += '<tr><th>Bilgi</th><th>Değer</th></tr>';
      html += '<tr><td>Erken Açık Cezaevi (+' + yil + ' yıl)</td><td class="vurgu">' + d.erkenAcikTarihi + '</td></tr>';
      html += '</table>';
    }
    
    html += '<div class="footer">';
    html += '<p>⚠️ Bu belge bilgi amaçlıdır. Kesin hukuki işlemler için mutlaka bir avukat veya infaz hâkimliğine başvurunuz.</p>';
    html += '<p>5275 Sayılı Ceza ve Güvenlik Tedbirlerinin İnfazı Hakkında Kanun kapsamında hesaplanmıştır.</p>';
    html += '</div>';
    
    html += '</body></html>';
    
    return html;
  }

  // ---------------------------------------------------------------------------
  // Dönem Yönetimi (Sekme 2)
  // ---------------------------------------------------------------------------
  
  var donemSayaci = 0;
  var excludedDonemIdx = -1;

  var donemEkleBtn = document.getElementById('donem-ekle-btn');
  if (donemEkleBtn) {
    donemEkleBtn.onclick = function() {
      donemEkle();
    };
  }

  function donemEkle() {
    var idx = donemSayaci++;
    var liste = document.getElementById('donemler-listesi');
    if (!liste) return;

    var div = document.createElement('div');
    div.className = 'donem-satir';
    div.id = 'donem-' + idx;
    div.setAttribute('data-idx', idx);

    div.innerHTML = 
      '<div class="donem-no">' + (idx + 1) + '</div>' +
      '<div class="form-grup" style="min-width:140px;">' +
        '<label>Giriş Tarihi</label>' +
        '<input type="date" class="donem-giris" id="donem-giris-' + idx + '" />' +
      '</div>' +
      '<div class="form-grup" style="min-width:140px;">' +
        '<label>Çıkış Tarihi</label>' +
        '<input type="date" class="donem-cikis" id="donem-cikis-' + idx + '" />' +
      '</div>' +
      '<div class="donem-sure" id="donem-sure-' + idx + '">—</div>' +
      '<label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:12px;">' +
        '<input type="radio" name="haric-donem" value="' + idx + '" />' +
        '<span class="haric-etiket">Hesaba Katılmayacak</span>' +
      '</label>' +
      '<button type="button" class="btn btn-tehlike btn-kucuk" onclick="window.donemSil(' + idx + ')">✖</button>';

    liste.appendChild(div);

    var girisInput = document.getElementById('donem-giris-' + idx);
    var cikisInput = document.getElementById('donem-cikis-' + idx);
    
    if (girisInput) {
      girisInput.addEventListener('change', function() { donemSuresiGuncelle(idx); });
    }
    if (cikisInput) {
      cikisInput.addEventListener('change', function() { donemSuresiGuncelle(idx); });
    }

    var radio = div.querySelector('input[type="radio"]');
    if (radio) {
      radio.addEventListener('change', function() {
        excludedDonemIdx = idx;
        tumDonemlerHesapla();
      });
    }

    tumDonemlerHesapla();
  }

  window.donemSil = function(idx) {
    var el = document.getElementById('donem-' + idx);
    if (el) el.remove();
    if (excludedDonemIdx === idx) {
      excludedDonemIdx = -1;
    }
    tumDonemlerHesapla();
  };

  function donemSuresiGuncelle(idx) {
    var girisEl = document.getElementById('donem-giris-' + idx);
    var cikisEl = document.getElementById('donem-cikis-' + idx);
    var sureEl = document.getElementById('donem-sure-' + idx);

    if (girisEl && girisEl.value && cikisEl && cikisEl.value && sureEl) {
      var ms = new Date(cikisEl.value) - new Date(girisEl.value);
      if (ms >= 0) {
        sureEl.textContent = Math.round(ms / 86400000) + ' gün';
      } else {
        sureEl.textContent = '⚠ Hata';
      }
    } else if (sureEl) {
      sureEl.textContent = '—';
    }
    tumDonemlerHesapla();
  }

  function tumDonemlerHesapla() {
    var donemler = [];
    var satirlar = document.querySelectorAll('.donem-satir');
    
    for (var i = 0; i < satirlar.length; i++) {
      var satir = satirlar[i];
      var idx = parseInt(satir.getAttribute('data-idx'), 10);
      var girisEl = document.getElementById('donem-giris-' + idx);
      var cikisEl = document.getElementById('donem-cikis-' + idx);
      if (girisEl && cikisEl) {
        donemler.push({ giris: girisEl.value, cikis: cikisEl.value });
      }
    }

    if (donemler.length === 0) {
      var sonucAlani = document.getElementById('donem-sonuc-alani');
      if (sonucAlani) sonucAlani.style.display = 'none';
      return;
    }

    if (typeof window.infazAPI !== 'undefined' && window.infazAPI) {
      var yanit = window.infazAPI.donemHesapla({ donemler: donemler, excludeIndex: excludedDonemIdx });
      if (yanit && yanit.success) {
        var d = yanit.data;
        var sonucAlani2 = document.getElementById('donem-sonuc-alani');
        if (sonucAlani2) sonucAlani2.style.display = 'block';

        var tumToplamGun = 0;
        for (var j = 0; j < d.donemDetay.length; j++) {
          tumToplamGun += (d.donemDetay[j].gun || 0);
        }
        
        var toplamTumu = document.getElementById('donem-toplam-tumü');
        var toplamDahil = document.getElementById('donem-toplam-dahil');
        if (toplamTumu) toplamTumu.textContent = tumToplamGun + ' gün';
        if (toplamDahil) toplamDahil.textContent = d.toplamGun + ' gün (' + d.toplamYMG + ')';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Lehe Yasa Karşılaştırması (Sekme 3)
  // ---------------------------------------------------------------------------
  
  var leheHesaplaBtn = document.getElementById('lehe-hesapla-btn');
  if (leheHesaplaBtn) {
    leheHesaplaBtn.onclick = function() {
      var leheHata = document.getElementById('lehe-hata');
      var leheHataMetin = document.getElementById('lehe-hata-metin');
      var leheSonucAlani = document.getElementById('lehe-sonuc-alani');
      
      if (leheHata) leheHata.style.display = 'none';
      if (leheSonucAlani) leheSonucAlani.style.display = 'none';

      var leheGirisEl = document.getElementById('lehe-giris');
      var ilkGirisTarihi = leheGirisEl ? leheGirisEl.value : '';

      if (!ilkGirisTarihi) {
        if (leheHataMetin) leheHataMetin.textContent = 'Lütfen giriş tarihini giriniz.';
        if (leheHata) leheHata.style.display = 'flex';
        return;
      }

      var params = {
        ilkGirisTarihi: ilkGirisTarihi,
        mahsupYil: sayiAl('lehe-mahsup-yil'),
        mahsupAy: sayiAl('lehe-mahsup-ay'),
        mahsupGun: sayiAl('lehe-mahsup-gun'),
        yasa5237Yil: sayiAl('l5237-yil'),
        yasa5237Ay: sayiAl('l5237-ay'),
        yasa5237Gun: sayiAl('l5237-gun'),
        yasa5237Kategori: document.getElementById('l5237-kategori') ? document.getElementById('l5237-kategori').value : 'GENEL',
        yasa765Yil: sayiAl('l765-yil'),
        yasa765Ay: sayiAl('l765-ay'),
        yasa765Gun: sayiAl('l765-gun'),
        yasa765KsOran: parseFloat(document.getElementById('l765-ks-oran') ? document.getElementById('l765-ks-oran').value : '0.6667'),
        yasa765KapaliOran: parseFloat(document.getElementById('l765-kapali-oran') ? document.getElementById('l765-kapali-oran').value : '0.5')
      };

      if (typeof window.infazAPI === 'undefined' || !window.infazAPI) {
        if (leheHataMetin) leheHataMetin.textContent = 'Hesaplama modülü yüklenemedi.';
        if (leheHata) leheHata.style.display = 'flex';
        return;
      }

      try {
        var yanit = window.infazAPI.leheKarsilastir(params);
        
        if (!yanit || !yanit.success) {
          if (leheHataMetin) leheHataMetin.textContent = 'Hata: ' + (yanit ? yanit.error : 'Bilinmeyen');
          if (leheHata) leheHata.style.display = 'flex';
          return;
        }

        var d = yanit.data;
        if (leheSonucAlani) leheSonucAlani.style.display = 'block';
        
        var leheSonucMetin = document.getElementById('lehe-sonuc-metin');
        if (leheSonucMetin) leheSonucMetin.textContent = '⚖️ ' + d.leheYasa;

        leheTabloOlustur('lehe-5237-tablo', d.tck5237);
        leheTabloOlustur('lehe-765-tablo', d.tck765);
        
      } catch (err) {
        if (leheHataMetin) leheHataMetin.textContent = 'Hata: ' + err.message;
        if (leheHata) leheHata.style.display = 'flex';
      }
    };
  }

  function leheTabloOlustur(tbodyId, veri) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    tbody.innerHTML = '';

    var satirlar = [
      { etiket: 'Ceza', deger: veri.ceza },
      { etiket: 'Toplam Ceza (gün)', deger: veri.toplamYMG + ' (' + veri.toplamGun + ' gün)' },
      { etiket: 'Kapalı Süre', deger: veri.kapaliYMG + ' (' + veri.kapaliGun + ' gün)' },
      { etiket: '→ Açığa Geçiş', deger: veri.kapaliSon, sinif: 'vurgu' },
      { etiket: 'KS Süresi', deger: veri.ksYMG + ' (' + veri.ksGun + ' gün)' },
      { etiket: '→ Koşullu Salıverme', deger: veri.ksTarihi, sinif: 'basari' },
      { etiket: '→ Denetimli Serbestlik', deger: veri.dsTarihi || '—' }
    ];

    for (var i = 0; i < satirlar.length; i++) {
      var s = satirlar[i];
      var tr = document.createElement('tr');
      if (s.sinif) tr.className = s.sinif;
      tr.innerHTML = '<td>' + s.etiket + '</td><td>' + s.deger + '</td>';
      tbody.appendChild(tr);
    }
  }

}); // DOMContentLoaded sonu
