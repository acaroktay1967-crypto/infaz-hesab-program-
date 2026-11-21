'use strict';
// Basit birim testleri: node test/infaz.test.js
var assert = require('assert');
var m = require('../src/infaz.js');
var gecti = 0;
function t(ad, fn) { try { fn(); gecti++; console.log('✓ ' + ad); } catch (e) { console.error('✗ ' + ad + '\n  ' + e.message); process.exitCode = 1; } }
function h(p) { return m.yeniInfazHesapla(p); }

t('Genel suç, 2019: KS 1/2, Geçici 6 DS 3 yıl, Geçici 10/6 uygulanır', function () {
  var d = h({ sucTarihi: '2019-05-01', cezaYil: 10, cezaeviGirisTarihi: '2022-01-01', kesinlesmeTarihi: '2021-12-01', infazaBaslamaTarihi: '2022-01-01' });
  assert.strictEqual(d.ksOranKesir, '1/2');
  assert.strictEqual(d.ksTarihi, '01.01.2027');
  assert.strictEqual(d.dsYil, 3);
  assert.strictEqual(d.dsBaslangic, '01.01.2024');
  assert.ok(d.gecici10.uygulanir);
});
t('Geçici 10/6: kesinleşme veya infaza başlama tarihi girilmezse erken hesap yapılmaz', function () {
  var ortak = { sucTarihi: '2019-05-01', cezaYil: 10, cezaeviGirisTarihi: '2022-01-01' };
  var tarihDurumlari = [
    {},
    { kesinlesmeTarihi: '2021-12-01' },
    { infazaBaslamaTarihi: '2022-01-01' }
  ];
  for (var i = 0; i < tarihDurumlari.length; i++) {
    var d = h(Object.assign({}, ortak, tarihDurumlari[i]));
    assert.ok(!d.gecici10.uygulanir);
    assert.strictEqual(d.gecici10.erkenAcik, null);
  }
});
t('Geçici 10/6: kesinleşme veya infaza başlama tarihi 31.07.2023 sonrasındaysa uygulanmaz', function () {
  var ortak = {
    sucTarihi: '2019-05-01',
    cezaYil: 10,
    cezaeviGirisTarihi: '2022-01-01'
  };
  var kesinlesmeSonrasi = h({
    sucTarihi: ortak.sucTarihi,
    cezaYil: ortak.cezaYil,
    cezaeviGirisTarihi: ortak.cezaeviGirisTarihi,
    kesinlesmeTarihi: '2023-08-01',
    infazaBaslamaTarihi: '2023-07-01'
  });
  var infazSonrasi = h({
    sucTarihi: ortak.sucTarihi,
    cezaYil: ortak.cezaYil,
    cezaeviGirisTarihi: ortak.cezaeviGirisTarihi,
    kesinlesmeTarihi: '2023-07-01',
    infazaBaslamaTarihi: '2023-08-15'
  });
  assert.ok(!kesinlesmeSonrasi.gecici10.uygulanir);
  assert.ok(!infazSonrasi.gecici10.uygulanir);
  assert.strictEqual(kesinlesmeSonrasi.gecici10.erkenDs, null);
  assert.strictEqual(infazSonrasi.gecici10.erkenDs, null);
});
t('Genel suç, 2024: DS 1 yıl, Geçici 10/6 yok', function () {
  var d = h({ sucTarihi: '2024-05-01', cezaYil: 10, cezaeviGirisTarihi: '2025-01-01' });
  assert.strictEqual(d.dsYil, 1);
  assert.ok(!d.gecici10.uygulanir);
});
t('TCK 188 yetişkin 2024: 3/4; çocuk: 2/3; 2013 yetişkin: 2/3 (6545 öncesi)', function () {
  assert.strictEqual(h({ sucTarihi: '2024-05-01', sucTuru: 'UYUSTURUCU_188', cezaYil: 10, cezaeviGirisTarihi: '2025-01-01' }).ksOranKesir, '3/4');
  assert.strictEqual(h({ sucTarihi: '2024-05-01', sucTuru: 'UYUSTURUCU_188', yasGrubu: 'COCUK', cezaYil: 10, cezaeviGirisTarihi: '2025-01-01' }).ksOranKesir, '2/3');
  assert.strictEqual(h({ sucTarihi: '2013-05-01', sucTuru: 'UYUSTURUCU_188', cezaYil: 10, cezaeviGirisTarihi: '2014-01-01' }).ksOranKesir, '2/3');
});
t('Terör çocuk: 2/3; yetişkin: 3/4', function () {
  assert.strictEqual(h({ sucTarihi: '2022-01-01', sucTuru: 'TEROR', yasGrubu: 'COCUK', cezaYil: 6, cezaeviGirisTarihi: '2022-02-01' }).ksOranKesir, '2/3');
  assert.strictEqual(h({ sucTarihi: '2022-01-01', sucTuru: 'TEROR', cezaYil: 6, cezaeviGirisTarihi: '2022-02-01' }).ksOranKesir, '3/4');
});
t('TCK 83, 2015: KS 1/2 (6713 öncesi); 2017: 2/3', function () {
  assert.strictEqual(h({ sucTarihi: '2015-01-01', sucTuru: 'KASTEN_OLDURME_83', cezaYil: 10, cezaeviGirisTarihi: '2016-01-01' }).ksOranKesir, '1/2');
  assert.strictEqual(h({ sucTarihi: '2017-01-01', sucTuru: 'KASTEN_OLDURME_83', cezaYil: 10, cezaeviGirisTarihi: '2018-01-01' }).ksOranKesir, '2/3');
});
t('İkinci tekerrür: suç 2025-06-10 → 3/4; suç 2024 → 2/3', function () {
  assert.strictEqual(h({ sucTarihi: '2025-06-10', mukerrirlik: 'IKINCI', cezaYil: 2, cezaeviGirisTarihi: '2026-01-01' }).ksOranKesir, '3/4');
  assert.strictEqual(h({ sucTarihi: '2024-06-10', mukerrirlik: 'IKINCI', cezaYil: 2, cezaeviGirisTarihi: '2025-01-01' }).ksOranKesir, '2/3');
});
t('107/5: 15 yaş altı günler iki sayılır; 7593 sonrası kasten öldürmede sayılmaz', function () {
  var g = h({ sucTarihi: '2026-09-01', cezaYil: 4, cezaeviGirisTarihi: '2026-09-02', dogumTarihi: '2012-01-01' });
  assert.strictEqual(g.ksTarihi, '03.05.2028');
  var o = h({ sucTarihi: '2026-09-01', sucTuru: 'KASTEN_OLDURME', cezaYil: 12, cezaeviGirisTarihi: '2026-09-02', dogumTarihi: '2012-01-01' });
  assert.strictEqual(o.ksTarihi, '02.09.2034');
  var e = h({ sucTarihi: '2026-08-01', sucTuru: 'KASTEN_OLDURME', cezaYil: 12, cezaeviGirisTarihi: '2026-09-02', dogumTarihi: '2012-01-01' });
  assert.ok(e.ksTarihi !== '02.09.2034');
});
t('Müebbet: adi 24 yıl, örgüt/terör 30 yıl', function () {
  assert.strictEqual(h({ sucTarihi: '2015-01-01', cezaTipi: 'MUEBBET', cezaeviGirisTarihi: '2016-01-01' }).ksTarihi, '01.01.2040');
  assert.strictEqual(h({ sucTarihi: '2015-01-01', sucTuru: 'TEROR', cezaTipi: 'MUEBBET', cezaeviGirisTarihi: '2016-01-01' }).ksTarihi, '01.01.2046');
});
t('Lehe karşılaştırma çalışır', function () {
  var l = m.leheKarsilastirma({ ilkGirisTarihi: '2010-01-01', yasa5237Yil: 5, yasa765Yil: 6, yasa765KsOran: 0.4166667 });
  assert.ok(l.leheYasa && l.tck5237.ksTarihi && l.tck765.ksTarihi);
});
console.log(gecti + ' test geçti');
