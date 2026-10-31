// Bank soal Qowaid (Nahwu, Shorof, I'rab). Format sama dengan data.mjs.
// [[kata]] di dalam `ar` = kata yang ditanyakan; aplikasi menampilkannya dengan sorotan.
// Jawaban benar SELALU di urutan pertama — server mengacak urutan saat bermain.

const IRAB = "Tentukan kedudukan dan tanda i'rab kata yang ditandai."
const JENIS_FIIL = "Kata ini termasuk fi'il apa?"

const irab = (cat, level, ar, options, explanation) =>
  ({ cat, type: 'irab_challenge', level, prompt: IRAB, ar, options, explanation })

export const QUESTIONS = [
  // =================== NAHWU ===================
  // ---- Mubtada' & Khabar ----
  irab('mubtada-khabar', 'beginner', '[[الْكِتَابُ]] جَدِيدٌ',
    ["Mubtada' marfu' dengan dhammah", "Khabar marfu' dengan dhammah", "Fa'il marfu' dengan dhammah", "Maf'ul bih manshub dengan fathah"],
    "الْكِتَابُ adalah mubtada': isim marfu' di awal jumlah ismiyyah yang menjadi pokok pembicaraan. Tanda rafa'-nya dhammah. جَدِيدٌ adalah khabarnya."),
  irab('mubtada-khabar', 'beginner', 'الْمَسْجِدُ [[كَبِيرٌ]]',
    ["Khabar marfu' dengan dhammah", "Mubtada' marfu' dengan dhammah", "Na'at marfu' dengan dhammah", "Hal manshub dengan fathah"],
    "كَبِيرٌ adalah khabar: bagian yang menyempurnakan makna mubtada' الْمَسْجِدُ. Khabar selalu marfu', tandanya dhammah (tanwin)."),
  irab('mubtada-khabar', 'intermediate', 'فِي الْفَصْلِ [[طُلَّابٌ]]',
    ["Mubtada' muakhkhar marfu' dengan dhammah", "Khabar marfu' dengan dhammah", "Fa'il marfu' dengan dhammah", "Na'at marfu' dengan dhammah"],
    "طُلَّابٌ adalah mubtada' muakhkhar (diakhirkan). Karena mubtada'-nya nakirah dan khabarnya syibhu jumlah (فِي الْفَصْلِ), khabar wajib didahulukan (khabar muqaddam)."),
  { cat: 'mubtada-khabar', type: 'nahwu_battle', level: 'advanced', prompt: 'Khabar pada kalimat berikut berbentuk …', ar: 'الطَّالِبُ يَقْرَأُ الْقُرْآنَ',
    options: ["Jumlah fi'liyyah", 'Mufrad', 'Syibhu jumlah', 'Jumlah ismiyyah'],
    explanation: "Khabar dari الطَّالِبُ adalah يَقْرَأُ الْقُرْآنَ, yaitu jumlah fi'liyyah (fi'il + fa'il dhamir mustatir + maf'ul bih). Jumlah ini berkedudukan rafa' sebagai khabar (fi mahalli raf'in)." },

  // ---- Fa'il ----
  irab('fail', 'beginner', 'جَاءَ [[الْمُدَرِّسُ]]',
    ["Fa'il marfu' dengan dhammah", "Mubtada' marfu' dengan dhammah", "Maf'ul bih manshub dengan fathah", "Khabar marfu' dengan dhammah"],
    "الْمُدَرِّسُ adalah fa'il: isim marfu' setelah fi'il ma'lum yang menunjukkan pelaku. Tanda rafa'-nya dhammah."),
  irab('fail', 'intermediate', 'نَجَحَ [[الْمُهَنْدِسُونَ]]',
    ["Fa'il marfu' dengan wawu karena jamak mudzakkar salim", "Fa'il marfu' dengan dhammah", "Mubtada' marfu' dengan wawu", "Fa'il manshub dengan ya'"],
    "الْمُهَنْدِسُونَ adalah fa'il. Jamak mudzakkar salim di-rafa'-kan dengan wawu sebagai pengganti dhammah (tanda i'rab far'i)."),
  { cat: 'fail', type: 'grammar_detective', level: 'intermediate', prompt: 'Kalimat manakah yang SALAH?',
    options: ['قَامَ فَاطِمَةُ', 'قَامَتْ فَاطِمَةُ', 'جَلَسَ الطُّلَّابُ', 'نَجَحَ مُحَمَّدٌ'],
    explanation: "Jika fa'il-nya muannats haqiqi (perempuan sungguhan) dan langsung setelah fi'il, fi'il wajib diberi ta' ta'nits: قَامَتْ فَاطِمَةُ. Maka قَامَ فَاطِمَةُ salah." },

  // ---- Maf'ul bih ----
  irab('maful-bih', 'beginner', 'كَتَبَ الطَّالِبُ [[الدَّرْسَ]]',
    ["Maf'ul bih manshub dengan fathah", "Fa'il marfu' dengan dhammah", "Mudhaf ilaih majrur dengan kasrah", "Hal manshub dengan fathah"],
    "الدَّرْسَ adalah maf'ul bih: isim manshub yang dikenai pekerjaan. Tanda nashab-nya fathah."),
  irab('maful-bih', 'intermediate', 'رَأَيْتُ [[الْمُعَلِّمِينَ]]',
    ["Maf'ul bih manshub dengan ya' karena jamak mudzakkar salim", "Maf'ul bih manshub dengan fathah", "Fa'il marfu' dengan wawu", "Isim majrur dengan ya'"],
    "الْمُعَلِّمِينَ adalah maf'ul bih. Jamak mudzakkar salim di-nashab-kan dengan ya' sebagai pengganti fathah."),
  irab('maful-bih', 'intermediate', 'شَاهَدْتُ [[الطَّالِبَاتِ]]',
    ["Maf'ul bih manshub dengan kasrah karena jamak muannats salim", "Maf'ul bih manshub dengan fathah", "Isim majrur dengan kasrah", "Mudhaf ilaih majrur dengan kasrah"],
    "الطَّالِبَاتِ adalah maf'ul bih. Jamak muannats salim di-nashab-kan dengan kasrah sebagai pengganti fathah. Jadi kasrah di sini bukan tanda jarr."),
  irab('maful-bih', 'advanced', 'قَرَأَ [[الْقُرْآنَ]] أَحْمَدُ',
    ["Maf'ul bih manshub dengan fathah (didahulukan dari fa'il)", "Fa'il marfu' dengan dhammah", "Mubtada' marfu' dengan dhammah", "Hal manshub dengan fathah"],
    "الْقُرْآنَ tetap maf'ul bih meskipun disebut sebelum fa'il أَحْمَدُ (maf'ul bih muqaddam). Tandanya fathah. أَحْمَدُ adalah fa'il marfu' (mamnu' min ash-sharf, tanpa tanwin)."),

  // ---- Na'at ----
  irab('naat', 'beginner', 'هَذَا بَيْتٌ [[جَمِيلٌ]]',
    ["Na'at marfu' dengan dhammah, mengikuti man'ut-nya", "Khabar marfu' dengan dhammah", "Mubtada' marfu' dengan dhammah", "Hal manshub dengan fathah"],
    "جَمِيلٌ adalah na'at (sifat) bagi بَيْتٌ. Na'at mengikuti man'ut-nya dalam i'rab: بَيْتٌ marfu' (khabar), maka جَمِيلٌ juga marfu'."),
  { cat: 'naat', type: 'nahwu_battle', level: 'intermediate', prompt: "Pilih na'at yang tepat untuk melengkapi kalimat.", ar: 'رَأَيْتُ بِنْتًا ـــــ',
    options: ['صَغِيرَةً', 'صَغِيرٌ', 'صَغِيرَةٌ', 'الصَّغِيرَةَ'],
    explanation: "Na'at mengikuti man'ut dalam i'rab (manshub), jenis (muannats), dan nakirah/ma'rifah. بِنْتًا manshub, muannats, nakirah, maka na'at-nya صَغِيرَةً." },
  irab('naat', 'advanced', 'مَرَرْتُ بِالطُّلَّابِ [[الْمُجْتَهِدِينَ]]',
    ["Na'at majrur dengan ya' karena jamak mudzakkar salim", "Na'at majrur dengan kasrah", "Maf'ul bih manshub dengan ya'", "Hal manshub dengan ya'"],
    "الْمُجْتَهِدِينَ adalah na'at bagi الطُّلَّابِ yang majrur oleh بِـ. Na'at ikut majrur; karena berbentuk jamak mudzakkar salim, tanda jarr-nya ya'. Bukan hal, karena hal harus nakirah."),

  // ---- Idhafah ----
  irab('idhafah', 'beginner', 'هَذَا كِتَابُ [[الطَّالِبِ]]',
    ['Mudhaf ilaih majrur dengan kasrah', "Na'at majrur dengan kasrah", 'Isim majrur oleh huruf jar', "Maf'ul bih manshub dengan fathah"],
    "الطَّالِبِ adalah mudhaf ilaih. Mudhaf ilaih selalu majrur; tandanya kasrah. كِتَابُ adalah mudhaf (tanpa ال dan tanpa tanwin)."),
  { cat: 'idhafah', type: 'grammar_detective', level: 'intermediate', prompt: 'Kalimat manakah yang SALAH?',
    options: ['هَذَا الْكِتَابُ الطَّالِبِ', 'هَذَا كِتَابُ الطَّالِبِ', 'هَذَا كِتَابٌ جَدِيدٌ', 'هَذَا بَابُ الْفَصْلِ'],
    explanation: "Dalam idhafah, mudhaf tidak boleh diberi ال dan tidak bertanwin. Yang benar: هَذَا كِتَابُ الطَّالِبِ." },
  irab('idhafah', 'advanced', 'جَاءَ [[مُعَلِّمُو]] الْمَدْرَسَةِ',
    ["Fa'il marfu' dengan wawu; nun jamak dibuang karena idhafah", "Fa'il marfu' dengan dhammah", "Mubtada' marfu' dengan wawu", "Mudhaf ilaih majrur"],
    "مُعَلِّمُو asalnya مُعَلِّمُونَ (jamak mudzakkar salim), fa'il marfu' dengan wawu. Nun-nya dibuang karena menjadi mudhaf bagi الْمَدْرَسَةِ."),

  // ---- Hal ----
  irab('hal', 'intermediate', 'جَاءَ الطَّالِبُ [[مُبْتَسِمًا]]',
    ['Hal manshub dengan fathah', "Maf'ul bih manshub dengan fathah", "Na'at manshub dengan fathah", 'Tamyiz manshub dengan fathah'],
    "مُبْتَسِمًا adalah hal: isim nakirah manshub yang menjelaskan keadaan shahibul hal (الطَّالِبُ) saat terjadinya pekerjaan."),
  { cat: 'hal', type: 'nahwu_battle', level: 'advanced', prompt: 'Pilih hal yang tepat untuk melengkapi kalimat.', ar: 'رَجَعَ الْجُنُودُ ـــــ',
    options: ['مُنْتَصِرِينَ', 'مُنْتَصِرُونَ', 'الْمُنْتَصِرِينَ', 'مُنْتَصِرًا'],
    explanation: "Hal harus nakirah dan manshub, serta sesuai dengan shahibul hal. الْجُنُودُ jamak, maka hal-nya jamak mudzakkar salim manshub dengan ya': مُنْتَصِرِينَ." },

  // ---- Tamyiz ----
  irab('tamyiz', 'intermediate', 'اِشْتَرَيْتُ عِشْرِينَ [[كِتَابًا]]',
    ['Tamyiz manshub dengan fathah', "Maf'ul bih manshub dengan fathah", 'Hal manshub dengan fathah', 'Mudhaf ilaih majrur'],
    "كِتَابًا adalah tamyiz bilangan (tamyiz 'adad): menjelaskan apa yang dihitung. Tamyiz bilangan 11–99 berupa isim mufrad manshub."),
  { cat: 'tamyiz', type: 'nahwu_battle', level: 'advanced', prompt: 'Pilih tamyiz yang tepat untuk melengkapi kalimat.', ar: 'عِنْدِي ثَلَاثَةُ ـــــ',
    options: ['كُتُبٍ', 'كُتُبًا', 'كِتَابٍ', 'كِتَابًا'],
    explanation: "Tamyiz bilangan 3–10 berupa isim jamak yang majrur sebagai mudhaf ilaih: ثَلَاثَةُ كُتُبٍ." },

  // ---- Nawasikh ----
  irab('nawasikh', 'intermediate', 'كَانَ الْجَوُّ [[بَارِدًا]]',
    ['Khabar kana manshub dengan fathah', 'Isim kana marfu\' dengan dhammah', 'Hal manshub dengan fathah', "Maf'ul bih manshub dengan fathah"],
    "كَانَ me-rafa'-kan isimnya (الْجَوُّ) dan me-nashab-kan khabarnya. بَارِدًا adalah khabar kana, manshub dengan fathah."),
  irab('nawasikh', 'intermediate', 'إِنَّ [[اللّٰهَ]] غَفُورٌ',
    ['Isim inna manshub dengan fathah', "Khabar inna marfu' dengan dhammah", "Mubtada' marfu' dengan dhammah", "Maf'ul bih manshub dengan fathah"],
    "إِنَّ me-nashab-kan isimnya dan me-rafa'-kan khabarnya (kebalikan dari كَانَ). اللّٰهَ adalah isim inna, manshub dengan fathah; غَفُورٌ khabar inna."),
  { cat: 'nawasikh', type: 'nahwu_battle', level: 'advanced', prompt: 'Pilih bentuk yang benar untuk melengkapi kalimat.', ar: 'إِنَّ الطُّلَّابَ ـــــ',
    options: ['مُجْتَهِدُونَ', 'مُجْتَهِدِينَ', 'مُجْتَهِدًا', 'مُجْتَهِدُوا'],
    explanation: "Kata yang kosong adalah khabar inna, maka marfu'. Karena jamak mudzakkar salim, tanda rafa'-nya wawu: مُجْتَهِدُونَ." },

  // ---- Majrurat ----
  irab('majrurat', 'beginner', 'ذَهَبْتُ إِلَى [[الْمَسْجِدِ]]',
    ['Isim majrur oleh huruf jar dengan kasrah', 'Mudhaf ilaih majrur dengan kasrah', "Maf'ul bih manshub dengan fathah", "Na'at majrur dengan kasrah"],
    "الْمَسْجِدِ didahului huruf jar إِلَى, maka majrur dengan kasrah."),
  irab('majrurat', 'advanced', 'صَلَّيْتُ فِي [[مَسَاجِدَ]] كَثِيرَةٍ',
    ['Isim majrur dengan fathah karena mamnu\' min ash-sharf', 'Isim majrur dengan kasrah', "Maf'ul bih manshub dengan fathah", 'Hal manshub dengan fathah'],
    "مَسَاجِدَ majrur oleh فِي, tetapi tandanya fathah karena isim ghairu munsharif (shighat muntahal jumu': wazan مَفَاعِلُ) yang tidak ber-ال dan tidak di-idhafah-kan."),

  // ---- Tawabi' ----
  irab('tawabi', 'intermediate', 'جَاءَ مُحَمَّدٌ وَ[[عَلِيٌّ]]',
    ["Ma'thuf marfu' dengan dhammah, mengikuti مُحَمَّدٌ", "Badal marfu' dengan dhammah", "Mubtada' marfu' dengan dhammah", "Khabar marfu' dengan dhammah"],
    "عَلِيٌّ di-'athaf-kan (disambung) kepada مُحَمَّدٌ dengan huruf وَ. Ma'thuf mengikuti ma'thuf 'alaih dalam i'rab, maka marfu'."),
  irab('tawabi', 'advanced', 'جَاءَ الطُّلَّابُ [[كُلُّهُمْ]]',
    ["Taukid ma'nawi marfu' dengan dhammah", "Na'at marfu' dengan dhammah", "Fa'il marfu' dengan dhammah", "Mubtada' marfu' dengan dhammah"],
    "كُلُّ yang bersambung dengan dhamir kembali ke kata sebelumnya adalah taukid ma'nawi. Ia mengikuti الطُّلَّابُ (fa'il) sehingga marfu'."),

  // ---- Macam-macam jumlah & jenis kata ----
  { cat: 'anwa-jumal', type: 'sentence_analysis', level: 'beginner', prompt: 'Termasuk jenis jumlah apakah kalimat ini?', ar: 'الْعِلْمُ نُورٌ',
    options: ['Jumlah ismiyyah', "Jumlah fi'liyyah", 'Syibhu jumlah'],
    explanation: "Diawali isim (الْعِلْمُ) sebagai mubtada' dan diikuti khabar, maka jumlah ismiyyah." },
  { cat: 'anwa-jumal', type: 'sentence_analysis', level: 'beginner', prompt: 'Termasuk jenis jumlah apakah kalimat ini?', ar: 'يَدْرُسُ الطَّالِبُ',
    options: ["Jumlah fi'liyyah", 'Jumlah ismiyyah', 'Syibhu jumlah'],
    explanation: "Diawali fi'il (يَدْرُسُ) lalu fa'il (الطَّالِبُ), maka jumlah fi'liyyah." },
  { cat: 'anwa-jumal', type: 'identify_word', level: 'beginner', prompt: 'Kata yang ditandai termasuk jenis kalimah apa?', ar: '[[فِي]] الْبَيْتِ',
    options: ['Huruf', 'Isim', "Fi'il"],
    explanation: "فِي adalah huruf (huruf jar): tidak bermakna sempurna kecuali bersama kata lain, dan tidak menerima tanda isim maupun fi'il." },
  { cat: 'anwa-jumal', type: 'identify_word', level: 'beginner', prompt: 'Kata ini termasuk jenis kalimah apa?', ar: 'الْمَدْرَسَةُ',
    options: ['Isim', "Fi'il", 'Huruf'],
    explanation: "الْمَدْرَسَةُ adalah isim. Tandanya: menerima ال dan bisa bertanwin." },
  { cat: 'anwa-jumal', type: 'identify_word', level: 'advanced', prompt: 'Kata ini termasuk jenis kalimah apa?', ar: 'لَيْسَ',
    options: ["Fi'il", 'Huruf', 'Isim'],
    explanation: "لَيْسَ adalah fi'il madhi jamid (tidak bisa di-tashrif penuh). Buktinya ia menerima ta' fa'il: لَسْتُ، لَسْنَا." },
  { cat: 'anwa-jumal', type: 'sentence_builder', level: 'intermediate',
    prompt: "Susun menjadi jumlah ismiyyah yang diawali mubtada': \"Guru itu berada di kelas.\"",
    tiles: ['الْمُدَرِّسُ', 'فِي', 'الْفَصْلِ'],
    accepted: ['الْمُدَرِّسُ فِي الْفَصْلِ'],
    explanation: "Mubtada' (الْمُدَرِّسُ) di awal, lalu khabar berupa syibhu jumlah (jar-majrur) فِي الْفَصْلِ." },

  // =================== SHOROF ===================
  // ---- Fi'il Madhi ----
  { cat: 'madhi', type: 'fiil_challenge', level: 'beginner', prompt: JENIS_FIIL, ar: 'كَتَبَ',
    options: ["Fi'il madhi", "Fi'il mudhari'", "Fi'il amr"],
    explanation: "كَتَبَ adalah fi'il madhi (lampau): tiga huruf dengan harakat fathah di akhir, tanpa huruf mudhara'ah." },
  { cat: 'madhi', type: 'tashrif_battle', level: 'intermediate', prompt: 'Ubah كَتَبَ untuk dhamir هُمْ (mereka laki-laki).',
    options: ['كَتَبُوا', 'كَتَبْنَ', 'كَتَبْتُمْ', 'كَتَبَا'],
    explanation: "Untuk هُمْ ditambahkan wawu jama'ah (dan alif fariqah): كَتَبُوا. كَتَبْنَ untuk هُنَّ, كَتَبْتُمْ untuk أَنْتُمْ, كَتَبَا untuk هُمَا." },
  { cat: 'madhi', type: 'tashrif_battle', level: 'intermediate', prompt: 'Ubah كَتَبَ untuk dhamir أَنْتِ (kamu perempuan).',
    options: ['كَتَبْتِ', 'كَتَبْتَ', 'كَتَبَتْ', 'كَتَبْتُ'],
    explanation: "أَنْتِ → ta' fa'il berharakat kasrah: كَتَبْتِ. كَتَبْتَ untuk أَنْتَ, كَتَبَتْ untuk هِيَ, كَتَبْتُ untuk أَنَا." },
  { cat: 'madhi', type: 'tashrif_battle', level: 'advanced', prompt: 'Ubah قَالَ untuk dhamir أَنَا.',
    options: ['قُلْتُ', 'قَالْتُ', 'قِلْتُ', 'قَوَلْتُ'],
    explanation: "قَالَ asalnya قَوَلَ (ajwaf wawi). Saat bertemu ta' fa'il yang membuat lam fi'il sukun, alif dibuang (iltiqa' sakinain) dan fa' fi'il didhammah sebagai tanda asal wawu: قُلْتُ." },

  // ---- Fi'il Mudhari' ----
  { cat: 'mudhari', type: 'tashrif_battle', level: 'beginner', prompt: "Apa fi'il mudhari' dari كَتَبَ untuk dhamir هُوَ?",
    options: ['يَكْتُبُ', 'يَكْتِبُ', 'يَكْتَبُ', 'تَكْتُبُ'],
    explanation: "كَتَبَ – يَكْتُبُ (bab نَصَرَ – يَنْصُرُ: 'ain mudhari' berharakat dhammah). Untuk هُوَ huruf mudhara'ah-nya يَـ." },
  { cat: 'mudhari', type: 'tashrif_battle', level: 'intermediate', prompt: "Apa fi'il mudhari' dari ذَهَبَ untuk dhamir هُنَّ?",
    options: ['يَذْهَبْنَ', 'يَذْهَبُونَ', 'تَذْهَبْنَ', 'يَذْهَبَانِ'],
    explanation: "هُنَّ → يَذْهَبْنَ (nun niswah). يَذْهَبُونَ untuk هُمْ, تَذْهَبْنَ untuk أَنْتُنَّ, يَذْهَبَانِ untuk هُمَا." },
  { cat: 'mudhari', type: 'tashrif_battle', level: 'advanced', prompt: "Apa fi'il mudhari' dari أَكْرَمَ untuk dhamir هُوَ?",
    options: ['يُكْرِمُ', 'يَكْرُمُ', 'يُكَرِّمُ', 'يَتَكَرَّمُ'],
    explanation: "أَكْرَمَ berwazan أَفْعَلَ, mudhari'-nya يُفْعِلُ: يُكْرِمُ. Huruf mudhara'ah fi'il ruba'i didhammah dan hamzah أَفْعَلَ dibuang." },

  // ---- Fi'il Amr ----
  { cat: 'amr', type: 'tashrif_battle', level: 'beginner', prompt: "Apa fi'il amr dari يَكْتُبُ (untuk أَنْتَ)?",
    options: ['اُكْتُبْ', 'اِكْتِبْ', 'كْتُبْ', 'تَكْتُبْ'],
    explanation: "Buang huruf mudhara'ah dan sukunkan akhirnya: كْتُبْ. Karena huruf pertama sukun, ditambah hamzah washl; hamzahnya didhammah karena 'ain fi'il-nya dhammah: اُكْتُبْ." },
  { cat: 'amr', type: 'tashrif_battle', level: 'intermediate', prompt: "Apa fi'il amr dari يَجْلِسُ untuk dhamir أَنْتُمْ?",
    options: ['اِجْلِسُوا', 'اُجْلُسُوا', 'اِجْلِسُونَ', 'تَجْلِسُوا'],
    explanation: "Amr untuk أَنْتُمْ: اِجْلِسُوا. Hamzah washl dikasrah karena 'ain fi'il-nya kasrah; nun dibuang seperti pada af'al khamsah yang majzum." },
  { cat: 'amr', type: 'tashrif_battle', level: 'advanced', prompt: "Apa fi'il amr dari يَقُومُ (untuk أَنْتَ)?",
    options: ['قُمْ', 'قُومْ', 'اُقُمْ', 'قَامْ'],
    explanation: "Buang huruf mudhara'ah: قُومُ → disukunkan menjadi قُومْ. Terjadi iltiqa' sakinain (wawu dan mim), maka wawu dibuang: قُمْ. Tidak perlu hamzah washl karena huruf pertama berharakat." },

  // ---- Mashdar ----
  { cat: 'mashdar', type: 'tashrif_battle', level: 'intermediate', prompt: 'Apa mashdar dari عَلَّمَ?',
    options: ['تَعْلِيمٌ', 'عِلْمٌ', 'إِعْلَامٌ', 'تَعَلُّمٌ'],
    explanation: "عَلَّمَ berwazan فَعَّلَ, mashdarnya تَفْعِيلٌ: تَعْلِيمٌ. عِلْمٌ mashdar عَلِمَ, إِعْلَامٌ mashdar أَعْلَمَ, تَعَلُّمٌ mashdar تَعَلَّمَ." },
  { cat: 'mashdar', type: 'tashrif_battle', level: 'advanced', prompt: 'Apa mashdar dari اِسْتَغْفَرَ?',
    options: ['اِسْتِغْفَارٌ', 'اِسْتَغْفَارٌ', 'مُسْتَغْفِرٌ', 'غُفْرَانٌ'],
    explanation: "اِسْتَغْفَرَ berwazan اِسْتَفْعَلَ, mashdarnya اِسْتِفْعَالٌ: اِسْتِغْفَارٌ (ta' berharakat kasrah). مُسْتَغْفِرٌ adalah isim fa'il." },

  // ---- Isim Fa'il ----
  { cat: 'isim-fail', type: 'tashrif_battle', level: 'beginner', prompt: "Apa isim fa'il dari كَتَبَ?",
    options: ['كَاتِبٌ', 'مَكْتُوبٌ', 'كِتَابٌ', 'مَكْتَبٌ'],
    explanation: "Isim fa'il fi'il tsulatsi berwazan فَاعِلٌ: كَاتِبٌ (penulis). مَكْتُوبٌ isim maf'ul, مَكْتَبٌ isim makan." },
  { cat: 'isim-fail', type: 'tashrif_battle', level: 'intermediate', prompt: "Apa isim fa'il dari اِجْتَهَدَ?",
    options: ['مُجْتَهِدٌ', 'مُجْتَهَدٌ', 'جَاهِدٌ', 'اِجْتِهَادٌ'],
    explanation: "Isim fa'il dari fi'il lebih dari tiga huruf: ganti huruf mudhara'ah (يَجْتَهِدُ) dengan mim berdhammah dan kasrahkan huruf sebelum akhir: مُجْتَهِدٌ. Jika difathah (مُجْتَهَدٌ) menjadi isim maf'ul." },

  // ---- Isim Maf'ul ----
  { cat: 'isim-maful', type: 'tashrif_battle', level: 'beginner', prompt: "Apa isim maf'ul dari كَتَبَ?",
    options: ['مَكْتُوبٌ', 'كَاتِبٌ', 'مَكْتَبٌ', 'كِتَابَةٌ'],
    explanation: "Isim maf'ul fi'il tsulatsi berwazan مَفْعُولٌ: مَكْتُوبٌ (yang ditulis)." },
  { cat: 'isim-maful', type: 'tashrif_battle', level: 'advanced', prompt: "Apa isim maf'ul dari أَرْسَلَ?",
    options: ['مُرْسَلٌ', 'مُرْسِلٌ', 'إِرْسَالٌ', 'رَسُولٌ'],
    explanation: "Dari mudhari' يُرْسِلُ: ganti huruf mudhara'ah dengan mim berdhammah dan fathahkan huruf sebelum akhir: مُرْسَلٌ (yang diutus). مُرْسِلٌ isim fa'il, إِرْسَالٌ mashdar." },

  // ---- Tashrif (ma'lum & majhul) ----
  { cat: 'tashrif', type: 'tashrif_battle', level: 'advanced', prompt: "Apa bentuk fi'il madhi majhul dari كَتَبَ?",
    options: ['كُتِبَ', 'كَتِبَ', 'كُتُبَ', 'يُكْتَبُ'],
    explanation: "Madhi majhul: huruf pertama didhammah dan huruf sebelum akhir dikasrah: كُتِبَ (telah ditulis). يُكْتَبُ adalah mudhari' majhul." },
  { cat: 'tashrif', type: 'tashrif_battle', level: 'intermediate', prompt: "Apa bentuk fi'il mudhari' majhul dari نَصَرَ untuk dhamir هُوَ?",
    options: ['يُنْصَرُ', 'يَنْصُرُ', 'نُصِرَ', 'يُنْصِرُ'],
    explanation: "Mudhari' majhul: huruf mudhara'ah didhammah dan huruf sebelum akhir difathah: يُنْصَرُ (ditolong). يَنْصُرُ adalah bentuk ma'lum." },

  // ---- Mizan Sharfi ----
  { cat: 'mizan', type: 'complete_rule', level: 'beginner', prompt: 'Apa mizan sharfi (wazan) kata berikut?', ar: 'كَاتِبٌ',
    options: ['فَاعِلٌ', 'فَعِيلٌ', 'مَفْعُولٌ', 'فِعَالٌ'],
    explanation: "Huruf asli ك–ت–ب ditimbang dengan ف–ع–ل; alif tambahan setelah huruf pertama tetap ditulis: فَاعِلٌ." },
  { cat: 'mizan', type: 'complete_rule', level: 'intermediate', prompt: 'Apa mizan sharfi (wazan) kata berikut?', ar: 'اِسْتَخْرَجَ',
    options: ['اِسْتَفْعَلَ', 'اِفْتَعَلَ', 'اِنْفَعَلَ', 'تَفَاعَلَ'],
    explanation: "Huruf aslinya خ–ر–ج; tambahan اِسْتَـ di depan tetap ditulis: اِسْتَفْعَلَ." },
  { cat: 'mizan', type: 'complete_rule', level: 'advanced', prompt: 'Apa mizan sharfi (wazan) kata berikut?', ar: 'قَالَ',
    options: ['فَعَلَ', 'فَاعَلَ', 'فَالَ', 'فَعَّلَ'],
    explanation: "قَالَ asalnya قَوَلَ (alif adalah wawu yang berubah, bukan huruf tambahan). Mizan mengikuti huruf asli: فَعَلَ." },

  // ---- Mujarrad & Mazid ----
  { cat: 'mujarrad-mazid', type: 'fiil_challenge', level: 'beginner', prompt: 'Apa huruf asli (akar kata) dari kata berikut?', ar: 'مَدْرَسَةٌ',
    options: ['د – ر – س', 'م – د – ر', 'ر – س – ة', 'م – د – س'],
    explanation: "مَدْرَسَةٌ berasal dari دَرَسَ (belajar). Mim di awal dan ta' marbuthah di akhir adalah huruf tambahan (isim makan berwazan مَفْعَلَةٌ)." },
  { cat: 'mujarrad-mazid', type: 'fiil_challenge', level: 'intermediate', prompt: "Fi'il berikut termasuk …", ar: 'تَعَلَّمَ',
    options: ['Tsulatsi mazid dua huruf', 'Tsulatsi mujarrad', 'Tsulatsi mazid satu huruf', "Ruba'i mujarrad"],
    explanation: "تَعَلَّمَ berwazan تَفَعَّلَ: akar ع–ل–م ditambah dua huruf (ta' di awal dan pengulangan lam/tasydid)." },

  // ---- Shahih & Mu'tal ----
  { cat: 'shahih-mutal', type: 'fiil_challenge', level: 'intermediate', prompt: "Fi'il berikut termasuk jenis …", ar: 'وَعَدَ',
    options: ["Mu'tal mitsal", "Mu'tal ajwaf", "Mu'tal naqish", 'Shahih salim'],
    explanation: "Mitsal: fi'il yang huruf pertamanya (fa' fi'il) huruf illat. وَعَدَ diawali wawu." },
  { cat: 'shahih-mutal', type: 'fiil_challenge', level: 'intermediate', prompt: "Fi'il berikut termasuk jenis …", ar: 'رَمَى',
    options: ["Mu'tal naqish", "Mu'tal mitsal", "Mu'tal ajwaf", 'Shahih mudha\'af'],
    explanation: "Naqish: fi'il yang huruf terakhirnya (lam fi'il) huruf illat. رَمَى asalnya رَمَيَ (akhiran ya')." },
  { cat: 'shahih-mutal', type: 'fiil_challenge', level: 'advanced', prompt: "Fi'il berikut termasuk jenis …", ar: 'مَدَّ',
    options: ["Shahih mudha'af", "Mu'tal ajwaf", 'Shahih mahmuz', "Mu'tal lafif"],
    explanation: "مَدَّ asalnya مَدَدَ: 'ain dan lam fi'il-nya huruf yang sama, maka disebut mudha'af. Tidak ada huruf illat maupun hamzah, sehingga termasuk shahih." },

  // =================== I'RAB ===================
  { cat: 'rafa', type: 'complete_rule', level: 'beginner', prompt: "Tanda rafa' yang asli (ashliyyah) adalah …",
    options: ['Dhammah', 'Fathah', 'Kasrah', 'Sukun'],
    explanation: "Tanda asli: rafa' = dhammah, nashab = fathah, jarr = kasrah, jazm = sukun. Tanda lain (wawu, alif, ya', dll.) disebut tanda far'iyyah (cabang)." },
  irab('rafa', 'intermediate', 'جَاءَ [[الطَّالِبَانِ]]',
    ["Fa'il marfu' dengan alif karena isim mutsanna", "Fa'il marfu' dengan dhammah", "Maf'ul bih manshub dengan ya'", 'Isim majrur dengan ya\''],
    "Isim mutsanna di-rafa'-kan dengan alif sebagai pengganti dhammah: الطَّالِبَانِ. Saat manshub/majrur menjadi الطَّالِبَيْنِ."),
  irab('nashab', 'intermediate', 'رَأَيْتُ [[أَخَاكَ]]',
    ["Maf'ul bih manshub dengan alif karena asma'ul khamsah", "Maf'ul bih manshub dengan fathah", "Fa'il marfu' dengan wawu", 'Isim majrur dengan ya\''],
    "أَخٌ termasuk asma'ul khamsah (أَبٌ، أَخٌ، حَمٌ، فُو، ذُو). Jika di-idhafah-kan kepada selain ya' mutakallim, ia di-nashab-kan dengan alif: أَخَاكَ."),
  irab('nashab', 'advanced', 'لَنْ [[يَذْهَبُوا]]',
    ["Fi'il mudhari' manshub dengan membuang nun", "Fi'il mudhari' majzum dengan membuang nun", "Fi'il mudhari' manshub dengan fathah", "Fi'il mudhari' marfu' dengan tetapnya nun"],
    "لَنْ me-nashab-kan fi'il mudhari'. يَذْهَبُونَ termasuk af'al khamsah, sehingga tanda nashab-nya membuang nun: لَنْ يَذْهَبُوا."),
  { cat: 'jarr', type: 'complete_rule', level: 'beginner', prompt: 'Tanda jarr yang asli (ashliyyah) adalah …',
    options: ['Kasrah', 'Fathah', 'Dhammah', 'Sukun'],
    explanation: "Tanda jarr yang asli adalah kasrah. Tanda gantinya: ya' (mutsanna, jamak mudzakkar salim, asma'ul khamsah) dan fathah (isim ghairu munsharif)." },
  irab('jarr', 'intermediate', 'سَلَّمْتُ عَلَى [[أَبِيكَ]]',
    ["Isim majrur dengan ya' karena asma'ul khamsah", 'Isim majrur dengan kasrah', "Maf'ul bih manshub dengan alif", "Fa'il marfu' dengan wawu"],
    "أَبٌ termasuk asma'ul khamsah. Setelah huruf jar عَلَى ia majrur, dan tanda jarr-nya ya': أَبِيكَ."),
  irab('jazm', 'intermediate', 'لَمْ [[يَكْتُبْ]]',
    ["Fi'il mudhari' majzum dengan sukun", "Fi'il mudhari' manshub dengan fathah", "Fi'il mudhari' marfu' dengan dhammah", "Fi'il mudhari' majzum dengan membuang nun"],
    "لَمْ men-jazm-kan fi'il mudhari'. يَكْتُبُ berakhiran huruf shahih, sehingga tanda jazm-nya sukun: لَمْ يَكْتُبْ."),
  irab('jazm', 'advanced', 'لَمْ [[يَدْعُ]]',
    ["Fi'il mudhari' majzum dengan membuang huruf illat (wawu)", "Fi'il mudhari' majzum dengan sukun", "Fi'il mudhari' marfu' dengan dhammah muqaddarah", "Fi'il mudhari' manshub dengan fathah"],
    "يَدْعُو berakhiran huruf illat wawu. Fi'il mudhari' mu'tal akhir di-jazm-kan dengan membuang huruf illat-nya: لَمْ يَدْعُ."),
  { cat: 'alamat-irab', type: 'complete_rule', level: 'intermediate', prompt: 'Jamak muannats salim ketika manshub ditandai dengan …',
    options: ['Kasrah', 'Fathah', "Ya'", 'Alif'],
    explanation: "Jamak muannats salim di-nashab-kan dengan kasrah sebagai pengganti fathah, contoh: رَأَيْتُ الطَّالِبَاتِ." },
  { cat: 'alamat-irab', type: 'complete_rule', level: 'advanced', prompt: "Isim ghairu munsharif ketika majrur (tanpa ال dan tidak di-idhafah-kan) ditandai dengan …",
    options: ['Fathah', 'Kasrah', "Ya'", 'Sukun'],
    explanation: "Isim ghairu munsharif (mamnu' min ash-sharf) di-jarr-kan dengan fathah sebagai pengganti kasrah, contoh: مَرَرْتُ بِأَحْمَدَ. Jika ber-ال atau di-idhafah-kan, kembali memakai kasrah." },
  { cat: 'irab-jumlah', type: 'sentence_analysis', level: 'advanced', prompt: 'Apa i\'rab kata yang ditandai?', ar: 'كَانَ الطَّالِبُ [[يَقْرَأُ]] الْكِتَابَ',
    options: ["Fi'il mudhari' marfu'; jumlahnya menjadi khabar kana (mahall nashab)", "Fi'il mudhari' manshub karena كَانَ", 'Isim kana marfu\'', "Fi'il madhi mabni 'ala al-fath"],
    explanation: "يَقْرَأُ tetap marfu' (tidak didahului 'amil nashab/jazm). Jumlah fi'liyyah يَقْرَأُ الْكِتَابَ berkedudukan nashab sebagai khabar كَانَ (fi mahalli nashbin)." },
  { cat: 'irab-jumlah', type: 'sentence_analysis', level: 'advanced', prompt: "Apa i'rab kata yang ditandai?", ar: '[[الطُّلَّابُ]] حَضَرُوا',
    options: ["Mubtada' marfu' dengan dhammah", "Fa'il marfu' dengan dhammah", "Maf'ul bih muqaddam", "Khabar muqaddam"],
    explanation: "Fa'il tidak didahulukan atas fi'il-nya (pendapat jumhur). Fa'il dari حَضَرُوا adalah wawu jama'ah, sehingga الطُّلَّابُ adalah mubtada', dan jumlah حَضَرُوا menjadi khabarnya." },
]
