// Bank soal Qowaid — tambahan ke-3. Format sama dengan data-qowaid.mjs.
// [[kata]] di dalam `ar` = kata yang ditanyakan. Jawaban benar SELALU di urutan pertama.

const IRAB = "Tentukan kedudukan dan tanda i'rab kata yang ditandai."
const JENIS_FIIL = "Kata ini termasuk fi'il apa?"
const MIZAN = 'Apa mizan sharfi (wazan) kata berikut?'
const KALIMAH = 'Kata yang ditandai termasuk jenis kalimah apa?'
const JENIS = "Fi'il berikut termasuk jenis apa?"

const irab = (cat, level, ar, options, explanation) =>
  ({ cat, type: 'irab_challenge', level, prompt: IRAB, ar, options, explanation })
const battle = (cat, level, prompt, ar, options, explanation) =>
  ({ cat, type: 'nahwu_battle', level, prompt, ar, options, explanation })
const detektif = (cat, level, topik, options, explanation) =>
  ({ cat, type: 'grammar_detective', level, prompt: `Kalimat manakah yang SALAH? (Perhatikan ${topik}.)`, options, explanation })
const tashrif = (cat, level, prompt, options, explanation) =>
  ({ cat, type: 'tashrif_battle', level, prompt, options, explanation })
const rule = (cat, level, prompt, ar, options, explanation) =>
  ({ cat, type: 'complete_rule', level, prompt, ar, options, explanation })

export const QUESTIONS = [
  // =================== NAHWU ===================
  irab('mubtada-khabar', 'beginner', '[[الصَّبْرُ]] جَمِيلٌ',
    ["Mubtada' marfu' dengan dhammah", "Khabar marfu' dengan dhammah", "Fa'il marfu' dengan dhammah", "Maf'ul bih manshub dengan fathah"],
    "الصَّبْرُ di awal jumlah ismiyyah adalah mubtada', marfu' dengan dhammah. جَمِيلٌ adalah khabarnya."),
  irab('mubtada-khabar', 'intermediate', 'الطَّالِبَاتُ [[مُجْتَهِدَاتٌ]]',
    ["Khabar marfu' dengan dhammah (jamak muannats salim)", "Mubtada' marfu' dengan dhammah", "Na'at marfu' dengan dhammah", "Khabar manshub dengan kasrah"],
    "مُجْتَهِدَاتٌ adalah khabar bagi الطَّالِبَاتُ. Jamak muannats salim di-rafa'-kan dengan dhammah (tanda asli)."),
  battle('mubtada-khabar', 'intermediate', 'Pilih khabar yang tepat untuk melengkapi kalimat.', 'الْمُسْلِمُونَ ـــــ',
    ['صَادِقُونَ', 'صَادِقِينَ', 'صَادِقٌ', 'الصَّادِقِينَ'],
    "Khabar marfu' dan sesuai mubtada' (jamak mudzakkar): صَادِقُونَ, dengan wawu sebagai tanda rafa'."),

  irab('fail', 'beginner', 'نَامَ [[الطِّفْلُ]]',
    ["Fa'il marfu' dengan dhammah", "Mubtada' marfu' dengan dhammah", "Maf'ul bih manshub dengan fathah", "Khabar marfu' dengan dhammah"],
    "الطِّفْلُ adalah pelaku perbuatan نَامَ, maka fa'il, marfu' dengan dhammah."),
  irab('fail', 'intermediate', 'سَافَرَتْ [[الْمُعَلِّمَاتُ]]',
    ["Fa'il marfu' dengan dhammah (jamak muannats salim)", "Mubtada' marfu' dengan dhammah", "Maf'ul bih manshub dengan kasrah", "Fa'il marfu' dengan wawu"],
    "الْمُعَلِّمَاتُ adalah fa'il dari سَافَرَتْ. Jamak muannats salim di-rafa'-kan dengan dhammah."),
  irab('fail', 'advanced', 'كُتِبَ [[الدَّرْسُ]]',
    ["Naibul fa'il marfu' dengan dhammah", "Fa'il marfu' dengan dhammah", "Maf'ul bih manshub", "Mubtada' marfu'"],
    "كُتِبَ adalah fi'il majhul (pasif). Isim marfu' setelahnya disebut naibul fa'il (pengganti fa'il), asalnya maf'ul bih."),

  irab('maful-bih', 'beginner', 'فَتَحَ الْوَلَدُ [[النَّافِذَةَ]]',
    ["Maf'ul bih manshub dengan fathah", "Fa'il marfu' dengan dhammah", "Hal manshub dengan fathah", "Mudhaf ilaih majrur"],
    "النَّافِذَةَ adalah yang dikenai perbuatan فَتَحَ, maka maf'ul bih, manshub dengan fathah."),
  irab('maful-bih', 'advanced', 'أَعْطَيْتُ الْفَقِيرَ [[دِرْهَمًا]]',
    ["Maf'ul bih kedua manshub dengan fathah", "Tamyiz manshub", "Hal manshub", "Maf'ul bih pertama manshub"],
    "أَعْطَى me-nashab-kan dua maf'ul bih: الْفَقِيرَ (pertama) dan دِرْهَمًا (kedua)."),

  battle('naat', 'beginner', "Pilih na'at yang tepat untuk melengkapi kalimat.", 'هَذَا كِتَابٌ ـــــ',
    ['مُفِيدٌ', 'مُفِيدًا', 'الْمُفِيدُ', 'مُفِيدَةٌ'],
    "Man'ut كِتَابٌ: marfu', nakirah, mudzakkar. Na'at-nya mengikuti: مُفِيدٌ."),
  detektif('naat', 'intermediate', "kesesuaian na'at dan man'ut",
    ['قَرَأْتُ قِصَّةً طَوِيلًا', 'قَرَأْتُ قِصَّةً طَوِيلَةً', 'قَرَأْتُ كِتَابًا طَوِيلًا', 'قَرَأْتُ الْقِصَّةَ الطَّوِيلَةَ'],
    "قِصَّةً muannats, maka na'at-nya juga muannats: قِصَّةً طَوِيلَةً. Jadi قِصَّةً طَوِيلًا salah."),

  irab('idhafah', 'beginner', 'قَرَأْتُ كِتَابَ [[اللّٰهِ]]',
    ["Mudhaf ilaih majrur dengan kasrah", "Isim majrur dengan huruf jar", "Maf'ul bih manshub", "Na'at majrur"],
    "Lafzhul jalalah di sini adalah mudhaf ilaih bagi كِتَابَ, maka majrur dengan kasrah."),
  battle('idhafah', 'advanced', 'Pilih bentuk yang benar untuk melengkapi kalimat.', 'رَأَيْتُ ـــــ الْمَدْرَسَةِ',
    ['مُعَلِّمِي', 'مُعَلِّمِينَ', 'الْمُعَلِّمِينَ', 'مُعَلِّمُو'],
    "Maf'ul bih jamak mudzakkar salim yang menjadi mudhaf: manshub dengan ya' dan nunnya dibuang karena idhafah: مُعَلِّمِي الْمَدْرَسَةِ."),

  irab('hal', 'beginner', 'شَرِبْتُ الْمَاءَ [[بَارِدًا]]',
    ["Hal manshub dengan fathah", "Na'at manshub dengan fathah", "Maf'ul bih kedua", "Tamyiz manshub"],
    "بَارِدًا menjelaskan keadaan الْمَاءَ saat diminum (dalam keadaan dingin). Hal nakirah dan manshub; shahibul hal-nya ma'rifah."),
  battle('hal', 'intermediate', 'Pilih hal yang tepat untuk melengkapi kalimat.', 'رَجَعَتِ الطَّالِبَتَانِ ـــــ',
    ['مَسْرُورَتَيْنِ', 'مَسْرُورَتَانِ', 'مَسْرُورَةً', 'الْمَسْرُورَتَيْنِ'],
    "Hal manshub, nakirah, dan sesuai shahibul hal (dua perempuan): مَسْرُورَتَيْنِ (mutsanna manshub dengan ya')."),

  irab('tamyiz', 'intermediate', 'اِشْتَرَيْتُ عِشْرِينَ [[قَلَمًا]]',
    ["Tamyiz manshub dengan fathah", "Maf'ul bih manshub", "Mudhaf ilaih majrur", "Hal manshub"],
    "Tamyiz bilangan 11–99 adalah isim mufrad manshub: عِشْرِينَ قَلَمًا."),
  battle('tamyiz', 'advanced', 'Pilih tamyiz yang tepat untuk melengkapi kalimat.', 'فِي الْمَكْتَبَةِ مِائَةُ ـــــ',
    ['كِتَابٍ', 'كِتَابًا', 'كُتُبٍ', 'كُتُبًا'],
    "Tamyiz bilangan مِائَةٌ dan أَلْفٌ adalah isim mufrad majrur sebagai mudhaf ilaih: مِائَةُ كِتَابٍ."),

  irab('nawasikh', 'intermediate', 'ظَنَنْتُ الْجَوَّ [[حَارًّا]]',
    ["Maf'ul bih kedua (asalnya khabar) manshub", "Hal manshub", "Na'at manshub", "Khabar kana manshub"],
    "ظَنَّ termasuk zhanna wa akhawatuha yang me-nashab-kan mubtada' dan khabar sebagai dua maf'ul bih. حَارًّا adalah maf'ul bih kedua."),
  battle('nawasikh', 'intermediate', 'Pilih bentuk yang benar untuk melengkapi kalimat.', 'لَيْسَ الْمُؤْمِنُونَ ـــــ',
    ['كَاذِبِينَ', 'كَاذِبُونَ', 'كَاذِبًا', 'الْكَاذِبِينَ'],
    "Khabar laisa manshub. Jamak mudzakkar salim di-nashab-kan dengan ya': كَاذِبِينَ."),

  irab('majrurat', 'beginner', 'خَرَجْتُ مِنَ [[الْبَيْتِ]]',
    ["Isim majrur dengan kasrah karena huruf jar", "Mudhaf ilaih majrur", "Maf'ul bih manshub", "Na'at majrur"],
    "مِنْ adalah huruf jar (nunnya berharakat fathah karena bertemu ال), maka الْبَيْتِ majrur dengan kasrah."),
  irab('majrurat', 'advanced', 'مَرَرْتُ بِـ[[أَخِيكَ]]',
    ["Isim majrur dengan ya' karena asmaul khamsah", "Isim majrur dengan kasrah", "Isim majrur dengan ya' karena mutsanna", "Mudhaf ilaih majrur"],
    "أَخِيكَ majrur oleh بِـ. أَخٌ termasuk al-asma' al-khamsah yang di-jarr-kan dengan ya'."),

  irab('tawabi', 'intermediate', 'جَاءَ الْخَلِيفَةُ [[عُمَرُ]]',
    ["Badal kull min kull marfu' dengan dhammah", "Na'at marfu'", "Taukid marfu'", "Khabar marfu'"],
    "عُمَرُ adalah orang yang sama dengan الْخَلِيفَةُ, maka badal kull min kull (badal muthabiq), mengikuti marfu'. Tanpa tanwin karena mamnu' min ash-sharf."),
  battle('tawabi', 'advanced', "Pilih taukid yang tepat untuk melengkapi kalimat.", 'رَأَيْتُ الطُّلَّابَ ـــــ',
    ['كُلَّهُمْ', 'كُلُّهُمْ', 'كُلِّهِمْ', 'كُلًّا'],
    "Taukid mengikuti yang dikuatkan (الطُّلَّابَ manshub), maka كُلَّهُمْ (manshub dengan fathah)."),

  { cat: 'anwa-jumal', type: 'sentence_analysis', level: 'beginner', prompt: 'Termasuk jenis jumlah apakah kalimat ini?', ar: 'الْجَوُّ جَمِيلٌ',
    options: ['Jumlah ismiyyah', "Jumlah fi'liyyah", 'Syibhu jumlah'],
    explanation: "Diawali isim (الْجَوُّ, mubtada') diikuti khabar (جَمِيلٌ), maka jumlah ismiyyah." },
  { cat: 'anwa-jumal', type: 'sentence_analysis', level: 'intermediate', prompt: 'Termasuk jenis jumlah apakah kalimat ini?', ar: 'يَحْفَظُ الطُّلَّابُ الْقُرْآنَ',
    options: ["Jumlah fi'liyyah", 'Jumlah ismiyyah', 'Syibhu jumlah'],
    explanation: "Diawali fi'il mudhari' (يَحْفَظُ), lalu fa'il dan maf'ul bih, maka jumlah fi'liyyah." },
  { cat: 'anwa-jumal', type: 'identify_word', level: 'beginner', prompt: KALIMAH, ar: 'ذَهَبْتُ [[إِلَى]] الْمَسْجِدِ',
    options: ['Huruf', 'Isim', "Fi'il"],
    explanation: "إِلَى adalah huruf jar. Ia tidak bermakna sempurna kecuali bersama kata lain." },
  { cat: 'anwa-jumal', type: 'identify_word', level: 'intermediate', prompt: KALIMAH, ar: 'جَاءَ [[الَّذِي]] نَجَحَ',
    options: ['Isim', 'Huruf', "Fi'il"],
    explanation: "الَّذِي adalah isim maushul (kata sambung), termasuk isim mabni. Di sini berkedudukan sebagai fa'il." },

  // =================== SHOROF ===================
  { cat: 'madhi', type: 'fiil_challenge', level: 'beginner', prompt: JENIS_FIIL, ar: 'شَرِبَ',
    options: ["Fi'il madhi", "Fi'il mudhari'", "Fi'il amr"],
    explanation: "شَرِبَ adalah fi'il madhi: perbuatan lampau, diakhiri fathah, tanpa huruf mudhara'ah." },
  tashrif('madhi', 'intermediate', 'Ubah كَتَبَ untuk dhamir هُنَّ.', ['كَتَبْنَ', 'كَتَبُوا', 'كَتَبْتُنَّ', 'كَتَبَتْ'],
    "هُنَّ → nun niswah, huruf sebelumnya disukunkan: كَتَبْنَ. كَتَبْتُنَّ untuk أَنْتُنَّ."),
  tashrif('madhi', 'advanced', 'Ubah مَشَى untuk dhamir أَنَا.', ['مَشَيْتُ', 'مَشَوْتُ', 'مَشْتُ', 'مَشَاتُ'],
    "مَشَى naqish ya'i (asal مَشَيَ). Saat bersambung dengan ta' fa'il, alif kembali ke asal ya': مَشَيْتُ."),

  { cat: 'mudhari', type: 'fiil_challenge', level: 'beginner', prompt: JENIS_FIIL, ar: 'نَكْتُبُ',
    options: ["Fi'il mudhari'", "Fi'il madhi", "Fi'il amr"],
    explanation: "نَكْتُبُ diawali huruf mudhara'ah نَـ (kami), maka fi'il mudhari'." },
  tashrif('mudhari', 'intermediate', "Apa fi'il mudhari' dari ذَهَبَ untuk dhamir هُمَا?", ['يَذْهَبَانِ', 'تَذْهَبَانِ', 'يَذْهَبُونَ', 'يَذْهَبْنَ'],
    "هُمَا (mudzakkar) → يَـ + alif itsnain + nun: يَذْهَبَانِ. تَذْهَبَانِ untuk أَنْتُمَا atau هُمَا muannats."),
  tashrif('mudhari', 'advanced', "Apa fi'il mudhari' dari اِسْتَغْفَرَ untuk dhamir أَنَا?", ['أَسْتَغْفِرُ', 'أَسْتَغْفَرُ', 'أُسْتَغْفِرُ', 'اِسْتَغْفِرُ'],
    "اِسْتَغْفَرَ (wazan اِسْتَفْعَلَ) → mudhari' يَسْتَفْعِلُ. Untuk أَنَا: أَسْتَغْفِرُ (huruf mudhara'ah fathah karena fi'il-nya enam huruf)."),

  tashrif('amr', 'beginner', "Apa fi'il amr dari يَجْلِسُ (untuk أَنْتَ)?", ['اِجْلِسْ', 'اُجْلُسْ', 'جْلِسْ', 'تَجْلِسْ'],
    "Buang huruf mudhara'ah, sukunkan akhir, tambah hamzah washl berkasrah (karena 'ain fi'il kasrah): اِجْلِسْ."),
  tashrif('amr', 'intermediate', "Apa fi'il amr dari يَقْرَأُ untuk dhamir أَنْتُمْ?", ['اِقْرَءُوا', 'اُقْرُءُوا', 'اِقْرَأْ', 'تَقْرَءُونَ'],
    "Amr untuk أَنْتُمْ: buang huruf mudhara'ah dan nun, tambah hamzah washl berkasrah: اِقْرَءُوا (juga ditulis اِقْرَؤُوا)."),
  tashrif('amr', 'advanced', "Apa fi'il amr dari يَقِفُ (untuk أَنْتَ)?", ['قِفْ', 'اِقِفْ', 'وَقِفْ', 'اِوْقِفْ'],
    "يَقِفُ dari وَقَفَ (mitsal wawi, wawunya hilang pada mudhari'). Buang huruf mudhara'ah: قِفُ → قِفْ. Tidak perlu hamzah washl karena huruf pertama berharakat."),

  tashrif('mashdar', 'beginner', 'Apa mashdar dari فَتَحَ?', ['فَتْحٌ', 'مِفْتَاحٌ', 'فَاتِحٌ', 'مَفْتُوحٌ'],
    "Mashdar فَتَحَ adalah فَتْحٌ (pembukaan). مِفْتَاحٌ isim alat, فَاتِحٌ isim fa'il, مَفْتُوحٌ isim maf'ul."),
  tashrif('mashdar', 'intermediate', 'Apa mashdar dari اِنْطَلَقَ?', ['اِنْطِلَاقٌ', 'تَطْلِيقٌ', 'إِطْلَاقٌ', 'مُنْطَلَقٌ'],
    "اِنْطَلَقَ berwazan اِنْفَعَلَ, mashdarnya اِنْفِعَالٌ: اِنْطِلَاقٌ. إِطْلَاقٌ mashdar أَطْلَقَ, تَطْلِيقٌ mashdar طَلَّقَ."),
  tashrif('mashdar', 'advanced', 'Apa mashdar dari تَعَلَّمَ?', ['تَعَلُّمٌ', 'تَعْلِيمٌ', 'تَعَالُمٌ', 'عِلْمٌ'],
    "تَعَلَّمَ berwazan تَفَعَّلَ, mashdarnya تَفَعُّلٌ: تَعَلُّمٌ (belajar). تَعْلِيمٌ mashdar عَلَّمَ (mengajar)."),

  tashrif('isim-fail', 'beginner', "Apa isim fa'il dari نَصَرَ?", ['نَاصِرٌ', 'مَنْصُورٌ', 'نَصْرٌ', 'نَصِيرٌ'],
    "Isim fa'il tsulatsi berwazan فَاعِلٌ: نَاصِرٌ (penolong). مَنْصُورٌ isim maf'ul, نَصْرٌ mashdar."),
  tashrif('isim-fail', 'intermediate', "Apa isim fa'il dari أَسْلَمَ?", ['مُسْلِمٌ', 'مُسْلَمٌ', 'سَالِمٌ', 'إِسْلَامٌ'],
    "Dari يُسْلِمُ: ganti huruf mudhara'ah dengan مُـ, kasrahkan huruf sebelum akhir: مُسْلِمٌ. إِسْلَامٌ adalah mashdarnya."),

  tashrif('isim-maful', 'beginner', "Apa isim maf'ul dari عَلِمَ?", ['مَعْلُومٌ', 'عَالِمٌ', 'مُعَلَّمٌ', 'عِلْمٌ'],
    "Isim maf'ul tsulatsi berwazan مَفْعُولٌ: مَعْلُومٌ (yang diketahui)."),
  tashrif('isim-maful', 'advanced', "Apa isim maf'ul dari قَالَ?", ['مَقُولٌ', 'مَقْوُولٌ', 'قَائِلٌ', 'مُقَالٌ'],
    "Wazan مَفْعُولٌ dari قَوَلَ asalnya مَقْوُولٌ, lalu diringkas (i'lal) menjadi مَقُولٌ (yang dikatakan)."),

  tashrif('tashrif', 'intermediate', "Fi'il فَتَحَ – يَفْتَحُ termasuk bab apa?", ['فَعَلَ – يَفْعَلُ', 'فَعَلَ – يَفْعُلُ', 'فَعَلَ – يَفْعِلُ', 'فَعِلَ – يَفْعَلُ'],
    "فَتَحَ – يَفْتَحُ: 'ain madhi fathah, 'ain mudhari' fathah, yaitu bab ke-3 (فَعَلَ – يَفْعَلُ). Bab ini umumnya 'ain atau lam fi'il-nya huruf halq (ح)."),
  tashrif('tashrif', 'advanced', "Fi'il عَلِمَ – يَعْلَمُ termasuk bab apa?", ['فَعِلَ – يَفْعَلُ', 'فَعِلَ – يَفْعِلُ', 'فَعَلَ – يَفْعَلُ', 'فَعُلَ – يَفْعُلُ'],
    "عَلِمَ – يَعْلَمُ: 'ain madhi kasrah, 'ain mudhari' fathah, yaitu bab ke-4 (فَعِلَ – يَفْعَلُ)."),

  rule('mizan', 'beginner', MIZAN, 'جَلَسَ', ['فَعَلَ', 'فَاعَلَ', 'فَعِلَ', 'فَعَّلَ'],
    "Huruf asli ج–ل–س semuanya berharakat fathah: فَعَلَ."),
  rule('mizan', 'intermediate', MIZAN, 'مُجْتَهِدٌ', ['مُفْتَعِلٌ', 'مُفَاعِلٌ', 'مُفْعِلٌ', 'مُسْتَفْعِلٌ'],
    "Huruf asli ج–ه–د; tambahan mim di depan dan ta' setelah fa' fi'il: مُفْتَعِلٌ (isim fa'il dari اِجْتَهَدَ)."),
  rule('mizan', 'advanced', MIZAN, 'كُتُبٌ', ['فُعُلٌ', 'فُعُولٌ', 'فِعَالٌ', 'أَفْعَالٌ'],
    "Huruf asli ك–ت–ب dengan dhammah pada fa' dan 'ain: فُعُلٌ (salah satu wazan jamak taksir)."),

  rule('mujarrad-mazid', 'intermediate', "Fi'il berikut termasuk mujarrad atau mazid?", 'أَكْرَمَ',
    ['Tsulatsi mazid satu huruf', 'Tsulatsi mujarrad', 'Tsulatsi mazid dua huruf', "Ruba'i mujarrad"],
    "Huruf asli ك–ر–م; tambahannya hamzah di depan (wazan أَفْعَلَ): mazid satu huruf."),
  rule('mujarrad-mazid', 'advanced', "Faedah (makna) wazan أَفْعَلَ pada kata berikut adalah …", 'أَجْلَسَ',
    ["Ta'diyah (menjadikan transitif)", 'Musyarakah (saling)', 'Thalab (meminta)', "Muthawa'ah"],
    "جَلَسَ (duduk) intransitif; أَجْلَسَ = mendudukkan (seseorang). Hamzah أَفْعَلَ di sini untuk ta'diyah."),

  rule('shahih-mutal', 'beginner', JENIS, 'صَامَ',
    ['Ajwaf', 'Mitsal', 'Naqish', 'Shahih salim'],
    "'Ain fi'il-nya huruf illat (asal wawu: صَوَمَ, mudhari'-nya يَصُومُ), maka disebut ajwaf (ajwaf wawi)."),
  rule('shahih-mutal', 'intermediate', JENIS, 'أَخَذَ',
    ['Shahih mahmuz', 'Shahih salim', 'Mitsal', 'Shahih mudha\'af'],
    "Fa' fi'il-nya hamzah, maka disebut mahmuz (mahmuz al-fa'). Hamzah bukan huruf illat, jadi tetap fi'il shahih."),

  // =================== I'RAB ===================
  irab('rafa', 'beginner', 'أَحْمَدُ [[يَذْهَبُ]] إِلَى الْمَدْرَسَةِ',
    ["Fi'il mudhari' marfu' dengan dhammah", "Fi'il mudhari' manshub dengan fathah", "Fi'il mudhari' majzum dengan sukun", "Isim marfu' sebagai khabar"],
    "يَذْهَبُ adalah fi'il mudhari' yang tidak didahului 'amil nashab atau jazm, maka marfu' dengan dhammah. Jumlah يَذْهَبُ ... menjadi khabar bagi أَحْمَدُ."),
  irab('nashab', 'intermediate', 'جِئْتُ كَيْ [[أَتَعَلَّمَ]]',
    ["Fi'il mudhari' manshub dengan fathah karena كَيْ", "Fi'il mudhari' marfu'", "Fi'il mudhari' majzum", "Fi'il madhi mabni"],
    "كَيْ termasuk huruf nashab (أَنْ، لَنْ، كَيْ، إِذَنْ), maka أَتَعَلَّمَ manshub dengan fathah."),
  irab('jazm', 'intermediate', 'لَمْ [[يَحْضُرُوا]] الدَّرْسَ',
    ["Fi'il mudhari' majzum dengan hadzf an-nun", "Fi'il mudhari' manshub dengan hadzf an-nun", "Fi'il mudhari' majzum dengan sukun", "Fi'il madhi mabni"],
    "لَمْ men-jazm-kan. يَحْضُرُوا (al-af'al al-khamsah) majzum dengan dibuangnya nun."),
  battle('jazm', 'intermediate', 'Pilih bentuk yang benar untuk melengkapi kalimat.', 'لَا ـــــ فِي الْفَصْلِ',
    ['تَلْعَبْ', 'تَلْعَبُ', 'تَلْعَبَ', 'لَعِبْتَ'],
    "لَا nahiyah (larangan) men-jazm-kan fi'il mudhari': لَا تَلْعَبْ (jangan bermain)."),
  rule('alamat-irab', 'intermediate', "Jamak mudzakkar salim ketika manshub dan majrur ditandai dengan …", null,
    ["Ya'", 'Kasrah', 'Fathah', 'Alif'],
    "Jamak mudzakkar salim: rafa' dengan wawu (الْمُسْلِمُونَ), nashab dan jarr dengan ya' (الْمُسْلِمِينَ)."),
  irab('irab-jumlah', 'advanced', 'صُمْتُ [[يَوْمَ]] الْخَمِيسِ',
    ["Maf'ul fih (zharaf zaman) manshub dengan fathah", "Maf'ul bih manshub", "Hal manshub", "Mubtada' marfu'"],
    "يَوْمَ menjelaskan waktu perbuatan (puasa pada hari Kamis), maka maf'ul fih/zharaf zaman, manshub dengan fathah, sekaligus mudhaf."),
]
