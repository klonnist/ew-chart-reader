# EW Grafik Okuyucu

Grafik ekran görüntüsü üzerinde Elliott Wave sayımını **kural tabanlı** kontrol eden web aracı.
Hiçbir yapay zekâ API'si, sunucu veya ücretli servis kullanmaz. Tüm mantık tarayıcıda çalışan
saf JavaScript'tir ve sayfa hiçbir harici ağ isteği yapmaz.

**Canlı:** https://klonnist.github.io/ew-chart-reader/

> ⚠️ **Yatırım tavsiyesi değildir.** Araç, tıkladığın dönüş noktalarına Elliott Dalga Prensibi'nin
> kurallarını uygular. Piyasanın nereye gideceğini bilemez.

## Nasıl kullanılır

1. **Grafik yükle.** Ekran görüntüsünü sürükle-bırak, dosya seç ya da `Ctrl+V` ile yapıştır. Görsel tarayıcıdan dışarı çıkmaz.
2. **Fiyat ekseni kalibrasyonu.** *Kalibrasyon* modunda grafikte fiyatı bilinen iki yüksekliğe tıkla (ör. eksendeki 60.000 ve 65.000 çizgileri) ve fiyatlarını yaz. Grafik logaritmikse **Log ölçek** kutusunu işaretle. `60.000`, `60000`, `1,2955` ve `1.2955` yazımlarının hepsi kabul edilir.
3. **Kalıp seç ve noktaları koy.** İtki, diagonal, zigzag, flat, üçgen, WXY ya da *Bilmiyorum: hepsini dene*. Dönüş noktalarına soldan sağa sırayla tıkla. Noktalar sürüklenerek düzeltilebilir; *Geri al* (`Ctrl+Z`) ve *Temizle* düğmeleri var. Mobilde dokunarak nokta koyabilirsin; sayfayı kaydırmak için *Kaydır* moduna geç.
4. **Analiz et.** Sonuç ekranında şunlar gösterilir:
   - Skor sıralı aday sayımlar
   - Kural tablosu: ✅ geçti, ❌ bozuldu, ⚠️ kılavuzdan sapma, ⏳ henüz kontrol edilemez
   - Ölçülen oranlar (ör. *Dalga 2 = dalga 1'in %58'i, tipik aralıkta*)
   - Geçersizlik seviyesi
   - Sonraki dalganın Fibonacci hedefleri (grafikte yatay çizgi olarak)
   - Hasanwavebot derslerinden gelen kontrol hatırlatmaları
   - İlgili bilgi notu

   Analizden sonra noktaları sürüklersen sonuç canlı olarak güncellenir.

**Yarım sayım:** En az 3 nokta yeterlidir. Örneğin yalnızca 0-1-2 girersen dalga 3 hedefleri ve geçersizlik seviyesi hesaplanır. Henüz kontrol edilemeyen kurallar ⏳ ile gösterilir.

**Geçmiş:** Her analiz küçük resim, noktalar ve sonuçla birlikte tarayıcının `localStorage`'ına kaydedilir (en fazla 20 kayıt). JSON olarak dışa ve içe aktarılabilir.

## Kural setleri

Ayarlardan seçilir; varsayılan Frost & Prechter'dır.

| Konu | Frost & Prechter | Neely | Kurs (Rules + Guidelines.docx) |
|---|---|---|---|
| Flat'te B en az | %90 | %61,8 | %70 |
| Zigzag'da B | < %100 | ≤ %61,8 | %20 – <%100 |
| Uzama (bir dalga ≥ 1,618× sonraki) | kılavuz | **kural** (Litmus testi) | kılavuz |
| Dalga 4 örtüşmesi | yasak | yasak | kaldıraçlı piyasada en fazla %15 (seçenek) |
| Zaman kuralları | — | Time Rule (⚠️) | süre oranı sınırları |
| Genişleyen diagonal | geçerli | geçerli | geçersiz (dalga 5 her zaman dalga 3'ten kısa) |

Tam liste uygulamadaki **Kurallar** sayfasındadır (91 kontrol; set, kalıp ve tür filtreleriyle).

### Kural türleri

- **Kırılmaz kural:** Bozulursa sayım geçersiz olur ve Fibonacci hedefi çizilmez. Kural önce geçerli sayım, sonra oran.
- **Kılavuz:** Sapma uyarı verir ve skoru düşürür. Skor yalnızca kılavuzlardan hesaplanır.
- **Hatırlatma:** Noktalardan ölçülemeyen konular için kontrol listesidir: alt dalga yapısı (5-3-5 vb.), üst zaman dilimi teyidi, stop yerleşimi.

### Sınırlar

Motor yalnızca dönüş noktalarının fiyat ve zaman (x ekseni) koordinatlarını görür. Alt dalgaların
iç yapısını göremez. "Dalga 3 impulse olmalı" veya "1 ve 3 aynı anda kesik 5 olamaz" gibi kurallar
bu yüzden hatırlatma olarak gösterilir. Triple (W-X-Y-X-Z) yapılar doğrudan sayılmaz. Log ölçek
seçildiğinde dalga uzunlukları ln(fiyat) farkıyla, yani yüzde bazında ölçülür.

## Kaynaklar

Kurallar ve notlar aşağıdaki kaynakların kişisel özetlerinden (`knowledge_base.md`) türetilmiş, özgün
cümlelerle yazılmıştır:

- R. N. Elliott: *Nature's Law* (1946)
- A. J. Frost & R. R. Prechter: *Elliott Wave Principle* (1978/2005)
- Glenn Neely: *Mastering Elliott Wave* (1990)
- Financial Freedom Trading: *Elliott Wave Handbook* (2020)
- tradedevils.com: *Rules & Guidelines of Elliott Wave* (EW Patterns)
- Elliott Ders 1-8 kursu: *Rules.docx*, *Guidelines.docx*
- WyzFi Strategies (S11): dalga 4 giriş bölgesi
- Hasanwavebot kök neden analizi: iç yapı ve üst zaman dilimi teyidi, dar stop dersi

## Geliştirme

Bağımlılık yoktur. Node 22+ yeterlidir.

```bash
node --test tests/*.test.js
```

```bash
node tools/serve.js
```

Kod yapısı:

- `src/engine/`: arayüzden bağımsız, saf fonksiyonlar (`analyze`, kalibrasyon, kalıp tanımları, hedef ve geçersizlik seviyeleri)
- `src/rules/`: makine tarafından kontrol edilebilir kurallar. Her kuralda `id`, `name`, `type`, `patterns`, `sets`, `need`, `check()`, `description` ve `source` alanları bulunur.
- `src/knowledge/`: okunabilir kalıp notları
- `src/ui/`: tuval, sonuç, geçmiş ve kurallar sayfası
- `tests/`: sentetik geçerli/bozuk örnekler, kural seti farkları ve `practice_case_log.md` vakaları

Her push'ta GitHub Actions önce testleri çalıştırır, testler geçerse siteyi GitHub Pages'e yayınlar.

## Lisans

MIT
