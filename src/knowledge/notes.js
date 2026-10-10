// Okunabilir bilgi notları. Kaynaklar knowledge_base.md'de özetlenen kitaplardır;
// metinler özgün cümlelerle yazılmıştır, kitaplardan uzun alıntı içermez.

export const NOTES = {
  impulse: {
    title: 'İtki (impulse)',
    summary:
      'Trend yönünde ilerleyen beş dalgalı yapı. 1, 3 ve 5 trendi taşır, 2 ve 4 onu kısmen geri alır. Elliott Dalga Prensibi\'nin en katı kurallarla tanımlanan kalıbıdır; üç kuraldan biri bile bozulursa yapı itki değildir.',
    points: [
      "Üç kırılmaz kural: dalga 2 başlangıcı aşamaz, dalga 3 en kısa olamaz, dalga 4 dalga 1 bölgesine giremez.",
      'Dalga 3 genellikle en uzun ve en hızlı dalgadır. Kripto ve emtia piyasalarında uzamanın 5. dalgada görülme olasılığı daha yüksektir.',
      'Dalga 2 çoğunlukla keskin (zigzag), dalga 4 çoğunlukla yatay (flat, üçgen, kombinasyon) olur. Buna alternasyon denir.',
      '2-4 noktalarını birleştiren çizgiye dalga 3\'ten çizilen paralel, dalga 5\'in muhtemel bitiş bölgesini verir.',
      'Neely ekolü bir dalganın gerçekten uzamış olmasını (≥%161,8) itkinin şartı sayar. Klasik ekol bunu yalnızca bir eğilim olarak görür.',
    ],
    sources: 'Elliott — Nature\'s Law Ch.4-6; Frost & Prechter — EWP Ders 4, 10, 12; Neely 5-4; Elliott Wave Handbook',
  },
  diagonal: {
    title: 'Diagonal (leading / ending)',
    summary:
      'Kama şeklinde ilerleyen beş dalgalı bir yapı. İtkiden farkı dalga 4\'ün dalga 1 bölgesine girmesine izin verilmesi ve trend çizgilerinin yakınsaması (veya ıraksaması). Ending diagonal bir hareketin sonunda, leading diagonal ise başında görülür.',
    points: [
      "Ending diagonal yalnızca 5. dalga veya C dalgası konumunda oluşur. Piyasanın 'çok hızlı, çok ileri' gittiği yerlerde görülür ve alt dalgaların hepsi üçlüdür.",
      'Leading diagonal 1. veya A dalgası konumunda oluşur. Elliott\'ın kendi keşfi değildir; sonradan kabul görmüştür.',
      'Daralan tipte dalgalar giderek kısalır (1>3>5, 2>4). Genişleyen tipte giderek uzar.',
      'Ending diagonal bittiğinde fiyat genellikle hızla diagonal\'in başladığı seviyeye döner.',
      'Leading diagonal\'den sonra derin bir dalga 2 ve uzayan bir dalga 3 beklenir.',
    ],
    sources: 'Frost & Prechter — EWP Ders 5; tradedevils EW Patterns; Rules.docx',
  },
  zigzag: {
    title: 'Zigzag (5-3-5)',
    summary:
      'Keskin bir düzeltme. A beş dalgalı bir hamle, B onun bir kısmını geri alan üçlü bir tepki, C ise yine beş dalgalı ve A\'yı aşan bir hamledir. Fiyatı belirgin şekilde geri götüren, "dik" düzeltmeler genellikle zigzag\'dır.',
    points: [
      "B dalgası A'nın başlangıcını asla geçemez; genellikle A'nın %38,2–78,6'sını geri alır.",
      "C dalgası en sık A'ya eşittir; sonraki olası oranlar 1,272, 1,618 ve 0,618'dir.",
      "C, A'nın bitişini aşamazsa 'kesik zigzag' olur. C, A'nın 1,618 katını çok aşarsa yapı bir zigzag değil, yeni bir trendin başlangıcı olabilir.",
      'Zigzag\'lar genellikle 0-B çizgisine A\'dan çizilen paralel kanal içinde kalır.',
      "Bir itkinin 2. dalgası en sık zigzag olur.",
    ],
    sources: 'Frost & Prechter — EWP Ders 6; tradedevils EW Patterns; Guidelines.docx; Neely 5-20',
  },
  flat: {
    title: 'Flat (3-3-5)',
    summary:
      "Yatay bir düzeltme. A ve B üçlüdür ve B, A'yı neredeyse tamamen (en az ~%90) geri alır. C beşlidir ve genellikle A'nın bitişi civarında sonlanır. Trend güçlüyken görülür: karşı taraf fiyatı fazla geri götüremez.",
    points: [
      "Regular flat: B ≈ A'nın başlangıcı, C ≈ A'nın bitişi.",
      "Expanded flat: B, A'nın başlangıcını aşar (>%105), C de A'nın bitişini belirgin şekilde geçer. Tipik olarak C ≈ 1,618A. Elliott buna 'irregular' demişti.",
      'Running flat: B başlangıcı aşar ama C, A\'nın bitişine ulaşamaz. Çok nadirdir; erken etiketlemek çoğu zaman yanıltır.',
      'Kural setleri B için farklı alt sınır koyar: F&P %90, Neely %61,8, kurs föyü %70.',
      'Flat\'ler genellikle uzamış bir dalganın öncesinde veya sonrasında görülür; bir itkinin 4. dalgasında sıktır.',
    ],
    sources: 'Frost & Prechter — EWP Ders 7; Elliott Ch.7 (irregular top); tradedevils EW Patterns; Neely 5-18',
  },
  triangle: {
    title: 'Üçgen (3-3-3-3-3)',
    summary:
      'Beş üçlü bacaktan (A-B-C-D-E) oluşan yatay bir düzeltme. Piyasanın kararsızlığını ve giderek azalan oynaklığı yansıtır. Bittiğinde ana trend yönünde hızlı bir "thrust" gelir.',
    points: [
      "Yalnızca bir itkinin 4. dalgası, B dalgası, X dalgası ya da kombinasyonun son dalgası konumunda görülür.",
      "Daralan üçgende her bacak kendinden önceki aynı yönlü bacağın içinde kalır; A-C ve B-D çizgileri ileride kesişir.",
      'Genişleyen üçgen nadirdir; her bacak bir öncekini aşar.',
      "B ile D aynı seviyede biterse barrier üçgen olur. B, A'nın başlangıcını aşarsa running üçgen olur.",
      'Thrust genellikle üçgenin en geniş yeri kadar ilerler. Neely bunu en geniş bacağın %75–125\'i olarak sayısallaştırır.',
      'En sık yapılan hata: beşinci bacak bitmeden yapıya üçgen demek.',
    ],
    sources: 'Elliott Ch.5; Frost & Prechter — EWP Ders 8; tradedevils EW Patterns; Neely 5-27',
  },
  wxy: {
    title: 'WXY (çift düzeltme)',
    summary:
      'İki basit düzeltmenin (W ve Y) bir bağlantı dalgasıyla (X) birleşmesi. Keskin versiyonu çift zigzag, yatay versiyonu kombinasyondur (double three). Frost & Prechter, Elliott\'ın ABC-X-ABC gösterimini yanıltıcı bulup W-X-Y notasyonunu getirmiştir.',
    points: [
      "Çift zigzag: ilk zigzag hedefe yetmediğinde ikinci bir zigzag eklenir. X genellikle W'nin %38,2–50'sini geri alır ve W'nin başlangıcını geçemez.",
      "Kombinasyon: yatay bir yapıdır. X, W'nin en az %90'ını geri alır (en fazla 2 katı). W ve Y farklı tiplerde olur; üçgen sadece son konumda görülür.",
      'Ana dalgalar (W, Y) genellikle 1:1 veya 1:0,618 oranındadır.',
      'F&P\'ye göre kombinasyonlar ana trende karşı eğim göstermez.',
      'Deneyimsiz trader\'lar için en zor yapılardır; net bir sinyal oluşana kadar beklemek çoğu zaman daha iyidir.',
    ],
    sources: 'Frost & Prechter — EWP Ders 6, 9; tradedevils EW Patterns; Rules.docx; Elliott Wave Handbook',
  },
};

export const GENERAL_NOTES = [
  {
    title: 'Kural ve kılavuz farkı',
    body: 'Kırılmaz kural bozulduğunda sayım geçersizdir; başka bir yorum aranmalıdır. Kılavuz ise yalnızca bir olasılıktır: sapma sayımı bozmaz ama güveni azaltır. Bu araçta kurallar ❌, kılavuz sapmaları ⚠️ olarak gösterilir. Skor yalnızca kılavuzlardan hesaplanır.',
  },
  {
    title: 'Önce sayım, sonra oran',
    body: 'Fibonacci oranları analizin ikinci adımıdır. Sayım kurallara uymuyorsa hedef ölçmek anlamsızdır. Güvenilir bir hedef tek bir orandan değil, birden fazla bağımsız oranın aynı bölgede kesişmesinden (confluence) gelir.',
  },
  {
    title: 'Alternatif sayım disiplini',
    body: 'Her zaman ikinci bir sayım elde tutulur. Fiyat ana sayımın geçersizlik seviyesini kırarsa ikinci sayım hemen ana senaryo olur. Eski sayımda ısrar etmek en pahalı hatalardan biridir.',
  },
  {
    title: 'Hasanwavebot dersleri',
    body: 'Botun zarar eden işlemlerinin kök nedeni bir kod hatası değil, mantık boşluğuydu. Bot iki noktaya bakıp aradaki hareketin gerçekten beş dalgalı olup olmadığını kontrol etmiyordu, üst zaman dilimine bakmıyordu ve çok dar sabit stop kullanıyordu. Bu yüzden araç her analizde iç yapı, üst zaman dilimi ve geçersizlik seviyesi hatırlatması yapar.',
  },
  {
    title: 'Yazarlar arası farklar',
    body: 'Frost & Prechter temkinlidir ve kuralların sayısını az tutar. Neely klasik kılavuzların bir kısmını sayısal kurallara çevirir (Litmus testi, Time Rule). Kurs föyü (Rules.docx) bunu en uca taşır ve neredeyse her fiyat ve süre ilişkisine sınır koyar; ancak bu sınırları destekleyen bir vaka çalışması sunmaz. Ayarlardan kural setini değiştirerek aynı noktaların farklı ekollerde nasıl değerlendirildiğini görebilirsin.',
  },
  {
    title: 'Lineer ve log ölçek',
    body: 'Fiyat geniş bir aralıkta hareket ettiyse (uzun vade, yüksek oynaklık) log ölçek daha anlamlıdır. Bu araçta log ölçek seçilirse dalga uzunlukları yüzde bazında (ln fiyat farkıyla) ölçülür. Bir kanal iki ölçekte de kırıldıysa sinyal daha güçlüdür.',
  },
];
