// Bank soal Qowaid — tambahan (Desember 2026). Format sama dengan data-qowaid.mjs.
// [[kata]] di dalam `ar` = kata yang ditanyakan. Jawaban benar SELALU di urutan pertama.

const IRAB = "Tentukan kedudukan dan tanda i'rab kata yang ditandai."
const JENIS_FIIL = "Kata ini termasuk fi'il apa?"
const SALAH = 'Kalimat manakah yang SALAH?'
const JUMLAH = 'Termasuk jenis jumlah apakah kalimat ini?'
const MIZAN = 'Apa mizan sharfi (wazan) kata berikut?'
const KALIMAH = 'Kata yang ditandai termasuk jenis kalimah apa?'

const irab = (cat, level, ar, options, explanation) =>
  ({ cat, type: 'irab_challenge', level, prompt: IRAB, ar, options, explanation })
const battle = (cat, level, prompt, ar, options, explanation) =>
  ({ cat, type: 'nahwu_battle', level, prompt, ar, options, explanation })
// petunjuk topik membuat setiap soal detektif unik (seed_key = kategori|jenis|prompt|ar)
const detektif = (cat, level, topik, options, explanation) =>
  ({ cat, type: 'grammar_detective', level, prompt: `${SALAH} (Perhatikan ${topik}.)`, options, explanation })
const tashrif = (cat, level, prompt, options, explanation) =>
  ({ cat, type: 'tashrif_battle', level, prompt, options, explanation })
const mizan = (level, ar, options, explanation) =>
  ({ cat: 'mizan', type: 'complete_rule', level, prompt: MIZAN, ar, options, explanation })
const jenisFiil = (cat, level, ar, options, explanation) =>
  ({ cat, type: 'fiil_challenge', level, prompt: JENIS_FIIL, ar, options, explanation })

export const QUESTIONS = [
  // =================== NAHWU ===================
  // ---- Mubtada' & Khabar ----
  irab('mubtada-khabar', 'beginner', '[[اللّٰهُ]] رَحِيمٌ',
    ["Mubtada' marfu' dengan dhammah", "Khabar marfu' dengan dhammah", "Fa'il marfu' dengan dhammah", "Badal marfu' dengan dhammah"],
    "Lafzhul jalalah اللّٰهُ di awal jumlah ismiyyah adalah mubtada', marfu' dengan dhammah. رَحِيمٌ adalah khabarnya."),
  irab('mubtada-khabar', 'beginner', 'الطَّالِبَانِ [[حَاضِرَانِ]]',
    ["Khabar marfu' dengan alif karena mutsanna", "Mubtada' marfu' dengan alif", "Na'at marfu' dengan alif", "Khabar marfu' dengan dhammah"],
    "حَاضِرَانِ adalah khabar bagi الطَّالِبَانِ. Isim mutsanna di-rafa'-kan dengan alif sebagai pengganti dhammah."),
  irab('mubtada-khabar', 'intermediate', '[[الْمُسْلِمُونَ]] إِخْوَةٌ',
    ["Mubtada' marfu' dengan wawu karena jamak mudzakkar salim", "Mubtada' marfu' dengan dhammah", "Fa'il marfu' dengan wawu", "Khabar marfu' dengan wawu"],
    "الْمُسْلِمُونَ adalah mubtada'. Jamak mudzakkar salim di-rafa'-kan dengan wawu. إِخْوَةٌ adalah khabarnya."),
  battle('mubtada-khabar', 'intermediate', 'Khabar pada kalimat berikut berbentuk …', 'الْكِتَابُ عَلَى الْمَكْتَبِ',
    ['Syibhu jumlah (jar-majrur)', 'Mufrad', "Jumlah fi'liyyah", 'Jumlah ismiyyah'],
    "Khabarnya عَلَى الْمَكْتَبِ: huruf jar + isim majrur, disebut syibhu jumlah. Ia berkaitan dengan khabar yang dibuang (مَوْجُودٌ/كَائِنٌ)."),
  battle('mubtada-khabar', 'advanced', 'Khabar pada kalimat berikut berbentuk …', 'زَيْدٌ أَبُوهُ كَرِيمٌ',
    ['Jumlah ismiyyah', 'Mufrad', "Jumlah fi'liyyah", 'Syibhu jumlah'],
    "Khabar dari زَيْدٌ adalah jumlah أَبُوهُ كَرِيمٌ (mubtada' kedua + khabarnya), yaitu jumlah ismiyyah yang menempati posisi rafa'. Dhamir هُ menghubungkannya dengan mubtada'."),
  detektif('mubtada-khabar', 'intermediate', "kesesuaian mubtada' dan khabar",
    ['الْبِنْتُ مُجْتَهِدٌ', 'الْبِنْتُ مُجْتَهِدَةٌ', 'الْوَلَدُ مُجْتَهِدٌ', 'الْبَنَاتُ مُجْتَهِدَاتٌ'],
    "Khabar mufrad harus sesuai dengan mubtada' dalam jenis. الْبِنْتُ muannats, maka khabarnya مُجْتَهِدَةٌ. Jadi الْبِنْتُ مُجْتَهِدٌ salah."),

  // ---- Fa'il ----
  irab('fail', 'beginner', 'قَرَأَ [[الطَّالِبُ]] الْقُرْآنَ',
    ["Fa'il marfu' dengan dhammah", "Maf'ul bih manshub dengan fathah", "Mubtada' marfu' dengan dhammah", "Na'at marfu' dengan dhammah"],
    "الطَّالِبُ adalah pelaku perbuatan قَرَأَ, maka fa'il, marfu' dengan dhammah."),
  irab('fail', 'intermediate', 'حَضَرَ [[الْمُعَلِّمَانِ]]',
    ["Fa'il marfu' dengan alif karena mutsanna", "Fa'il marfu' dengan dhammah", "Mubtada' marfu' dengan alif", "Maf'ul bih manshub dengan ya'"],
    "الْمُعَلِّمَانِ adalah fa'il dari حَضَرَ. Mutsanna di-rafa'-kan dengan alif."),
  irab('fail', 'advanced', 'جَاءَ [[أَبُوكَ]]',
    ["Fa'il marfu' dengan wawu karena asmaul khamsah", "Fa'il marfu' dengan dhammah", "Mubtada' marfu' dengan wawu", "Fa'il marfu' dengan wawu karena jamak"],
    "أَبُوكَ termasuk al-asma' al-khamsah (أَبٌ، أَخٌ، حَمٌ، فُو، ذُو) yang di-rafa'-kan dengan wawu jika di-idhafah-kan selain kepada ya' mutakallim. Kedudukannya fa'il."),
  battle('fail', 'intermediate', "Pilih fi'il yang tepat untuk melengkapi kalimat.", 'ـــــ الطَّالِبَاتُ الدَّرْسَ',
    ['كَتَبَتِ', 'كَتَبْنَ', 'كَتَبُوا', 'كَتَبَا'],
    "Jika fa'il berupa isim zhahir, fi'il tetap mufrad meskipun fa'il-nya jamak. Fa'il-nya muannats, maka fi'il diberi ta' ta'nits: كَتَبَتِ الطَّالِبَاتُ (ta' dikasrah karena bertemu sukun)."),
  detektif('fail', 'advanced', "bentuk fi'il sebelum fa'il jamak",
    ['ذَهَبُوا الطُّلَّابُ', 'ذَهَبَ الطُّلَّابُ', 'الطُّلَّابُ ذَهَبُوا', 'ذَهَبَتِ الطَّالِبَاتُ'],
    "Dalam bahasa Arab fusha, fi'il yang fa'il-nya isim zhahir tetap mufrad: ذَهَبَ الطُّلَّابُ. Bentuk ذَهَبُوا الطُّلَّابُ (lughah akaluni al-baraghits) tidak dipakai dalam bahasa standar. Jika fa'il disebut lebih dulu, fi'il mengikuti: الطُّلَّابُ ذَهَبُوا."),

  // ---- Maf'ul bih ----
  irab('maful-bih', 'beginner', 'شَرِبَ الْوَلَدُ [[الْحَلِيبَ]]',
    ["Maf'ul bih manshub dengan fathah", "Fa'il marfu' dengan dhammah", "Khabar marfu' dengan dhammah", "Hal manshub dengan fathah"],
    "الْحَلِيبَ adalah yang dikenai perbuatan شَرِبَ, maka maf'ul bih, manshub dengan fathah."),
  irab('maful-bih', 'intermediate', 'زُرْتُ [[أَخَاكَ]]',
    ["Maf'ul bih manshub dengan alif karena asmaul khamsah", "Maf'ul bih manshub dengan fathah", "Fa'il marfu' dengan alif", "Maf'ul bih manshub dengan alif karena mutsanna"],
    "أَخَاكَ adalah maf'ul bih. أَخٌ termasuk al-asma' al-khamsah yang di-nashab-kan dengan alif."),
  irab('maful-bih', 'intermediate', 'قَرَأْتُ [[كِتَابَيْنِ]]',
    ["Maf'ul bih manshub dengan ya' karena mutsanna", "Maf'ul bih manshub dengan ya' karena jamak mudzakkar salim", "Isim majrur dengan ya'", "Maf'ul bih manshub dengan fathah"],
    "كِتَابَيْنِ adalah maf'ul bih berbentuk mutsanna, di-nashab-kan dengan ya' (sebelumnya fathah: ـَيْنِ). Jamak mudzakkar salim diakhiri ـِينَ (kasrah sebelum ya')."),
  irab('maful-bih', 'advanced', '[[إِيَّاكَ]] نَعْبُدُ',
    ["Maf'ul bih muqaddam, dhamir munfashil mabni fi mahalli nashb", "Mubtada' mabni fi mahalli raf'", "Fa'il mabni fi mahalli raf'", "Maf'ul bih manshub dengan fathah"],
    "إِيَّاكَ adalah dhamir munfashil untuk nashab. Ia maf'ul bih bagi نَعْبُدُ yang didahulukan untuk pengkhususan (hashr): hanya kepada-Mu kami menyembah. Dhamir itu mabni, jadi i'rabnya mahalli."),
  detektif('maful-bih', 'intermediate', "tanda nashab maf'ul bih",
    ['رَأَيْتُ الْمُعَلِّمُونَ', 'رَأَيْتُ الْمُعَلِّمِينَ', 'رَأَيْتُ الْمُعَلِّمَ', 'رَأَيْتُ الْمُعَلِّمَاتِ'],
    "Maf'ul bih jamak mudzakkar salim harus manshub dengan ya': الْمُعَلِّمِينَ. Bentuk الْمُعَلِّمُونَ (dengan wawu) adalah bentuk rafa'."),

  // ---- Na'at ----
  irab('naat', 'beginner', 'هَذِهِ سَيَّارَةٌ [[جَدِيدَةٌ]]',
    ["Na'at marfu' dengan dhammah", "Khabar marfu' dengan dhammah", "Hal manshub dengan fathah", "Mubtada' marfu' dengan dhammah"],
    "جَدِيدَةٌ adalah na'at bagi سَيَّارَةٌ (khabar yang marfu'), maka ikut marfu', muannats, dan nakirah."),
  battle('naat', 'beginner', "Pilih na'at yang tepat untuk melengkapi kalimat.", 'جَاءَ الطَّالِبُ ـــــ',
    ['الْمُجْتَهِدُ', 'مُجْتَهِدٌ', 'الْمُجْتَهِدَ', 'الْمُجْتَهِدَةُ'],
    "Man'ut الطَّالِبُ ma'rifah, marfu', mudzakkar. Na'at harus sama dalam ketiganya: الْمُجْتَهِدُ. مُجْتَهِدٌ (nakirah) di sini menjadi hal jika manshub (مُجْتَهِدًا)."),
  battle('naat', 'intermediate', "Pilih na'at yang tepat untuk melengkapi kalimat.", 'سَلَّمْتُ عَلَى الْمُدَرِّسَاتِ ـــــ',
    ['الْفَاضِلَاتِ', 'الْفَاضِلَاتُ', 'فَاضِلَاتٍ', 'الْفَاضِلِينَ'],
    "الْمُدَرِّسَاتِ majrur (setelah عَلَى), ma'rifah, jamak muannats. Na'at-nya mengikuti: الْفَاضِلَاتِ (majrur dengan kasrah)."),
  irab('naat', 'advanced', 'رَأَيْتُ رَجُلًا [[يَقْرَأُ]] الْقُرْآنَ',
    ["Jumlah fi'liyyah sebagai na'at fi mahalli nashb", "Fi'il mudhari' sebagai hal manshub", "Maf'ul bih kedua manshub", "Khabar fi mahalli raf'"],
    "Jumlah setelah isim nakirah (رَجُلًا) menjadi na'at baginya. Jumlah يَقْرَأُ الْقُرْآنَ menempati posisi nashab mengikuti رَجُلًا. Kaidah: الْجُمَلُ بَعْدَ النَّكِرَاتِ صِفَاتٌ."),

  // ---- Idhafah ----
  irab('idhafah', 'beginner', 'هَذَا بَابُ [[الْبَيْتِ]]',
    ["Mudhaf ilaih majrur dengan kasrah", "Isim majrur dengan huruf jar", "Na'at majrur dengan kasrah", "Maf'ul bih manshub dengan fathah"],
    "الْبَيْتِ adalah mudhaf ilaih dari بَابُ. Mudhaf ilaih selalu majrur, tandanya kasrah."),
  irab('idhafah', 'intermediate', 'هَذَا [[كِتَابُ]] الطَّالِبِ',
    ["Khabar marfu' dengan dhammah dan sebagai mudhaf", "Mubtada' marfu' dengan dhammah", "Mudhaf ilaih majrur", "Badal marfu' dengan dhammah"],
    "هَذَا mubtada', كِتَابُ khabar marfu'. Ia juga mudhaf, karena itu tanpa tanwin dan tanpa ال. الطَّالِبِ mudhaf ilaih."),
  irab('idhafah', 'advanced', 'سَافَرْتُ مَعَ [[أَبِي]]',
    ["Mudhaf ilaih majrur dengan kasrah muqaddarah", "Isim majrur dengan ya' karena asmaul khamsah", "Isim majrur oleh huruf jar مَعَ", "Maf'ul ma'ah manshub"],
    "مَعَ bukan huruf jar, melainkan zharaf yang menjadi mudhaf; maka أَبِي adalah mudhaf ilaih (majrur). Karena di-idhafah-kan ke ya' mutakallim, أَبٌ tidak di-i'rab dengan huruf seperti asmaul khamsah. Tanda jarr-nya kasrah muqaddarah: huruf akhirnya sudah ditempati kasrah yang menyesuaikan ya'."),
  detektif('idhafah', 'intermediate', 'bentuk mudhaf',
    ['هَذَا قَلَمٌ مُحَمَّدٍ', 'هَذَا قَلَمُ مُحَمَّدٍ', 'هَذَا قَلَمٌ جَمِيلٌ', 'هَذَا قَلَمُ الْأُسْتَاذِ'],
    "Mudhaf tidak boleh bertanwin. Yang benar قَلَمُ مُحَمَّدٍ. Pada قَلَمٌ مُحَمَّدٍ, tanwin pada قَلَمٌ memutus idhafah."),
  battle('idhafah', 'intermediate', 'Pilih bentuk yang benar untuk melengkapi kalimat.', 'جَاءَ ـــــ الْمَدْرَسَةِ',
    ['مُدِيرُ', 'الْمُدِيرُ', 'مُدِيرٌ', 'مُدِيرَ'],
    "Kata yang kosong adalah fa'il (marfu') sekaligus mudhaf, maka tanpa ال dan tanpa tanwin: مُدِيرُ الْمَدْرَسَةِ."),

  // ---- Hal ----
  irab('hal', 'beginner', 'جَاءَ الطَّالِبُ [[مُسْرِعًا]]',
    ["Hal manshub dengan fathah", "Maf'ul bih manshub dengan fathah", "Na'at manshub dengan fathah", "Tamyiz manshub dengan fathah"],
    "مُسْرِعًا menjelaskan keadaan fa'il ketika datang (dengan tergesa-gesa). Hal adalah isim nakirah manshub."),
  irab('hal', 'intermediate', 'رَجَعَتِ الْبِنْتُ مِنَ الْمَدْرَسَةِ [[فَرِحَةً]]',
    ["Hal manshub dengan fathah", "Na'at manshub dengan fathah", "Khabar manshub dengan fathah", "Maf'ul li ajlih manshub"],
    "فَرِحَةً menerangkan keadaan الْبِنْتُ (shahibul hal) saat kembali: dalam keadaan gembira. Hal sesuai dengan shahibul hal dalam jenis (muannats)."),
  battle('hal', 'intermediate', 'Pilih hal yang tepat untuk melengkapi kalimat.', 'دَخَلَ الطُّلَّابُ الْفَصْلَ ـــــ',
    ['مُبْتَسِمِينَ', 'مُبْتَسِمُونَ', 'الْمُبْتَسِمِينَ', 'مُبْتَسِمٌ'],
    "Hal harus nakirah, manshub, dan sesuai shahibul hal (الطُّلَّابُ, jamak mudzakkar): مُبْتَسِمِينَ (manshub dengan ya')."),
  battle('hal', 'advanced', 'Kata yang ditandai pada kalimat berikut berkedudukan sebagai …', 'جَاءَ زَيْدٌ [[وَالشَّمْسُ طَالِعَةٌ]]',
    ['Hal berupa jumlah ismiyyah', "Na'at berupa jumlah", "Khabar kedua", "Ma'thuf dengan wawu"],
    "وَالشَّمْسُ طَالِعَةٌ adalah jumlah ismiyyah yang menjelaskan keadaan saat Zaid datang (ketika matahari terbit). Wawu-nya disebut wawu haliyah. Jumlah ini fi mahalli nashb sebagai hal."),

  // ---- Tamyiz ----
  irab('tamyiz', 'beginner', 'اِشْتَرَيْتُ كِيلُو [[سُكَّرًا]]',
    ["Tamyiz manshub dengan fathah", "Maf'ul bih manshub dengan fathah", "Hal manshub dengan fathah", "Na'at manshub dengan fathah"],
    "سُكَّرًا menjelaskan jenis takaran كِيلُو yang samar (satu kilo apa?), maka tamyiz, manshub. Boleh juga dibaca majrur sebagai mudhaf ilaih: كِيلُو سُكَّرٍ."),
  irab('tamyiz', 'intermediate', 'فِي الْفَصْلِ عِشْرُونَ [[طَالِبًا]]',
    ["Tamyiz manshub dengan fathah", "Mudhaf ilaih majrur", "Hal manshub dengan fathah", "Badal marfu'"],
    "Tamyiz bilangan 11–99 adalah isim mufrad yang manshub: عِشْرُونَ طَالِبًا."),
  irab('tamyiz', 'advanced', 'مُحَمَّدٌ أَكْثَرُ مِنْكَ [[عِلْمًا]]',
    ["Tamyiz manshub dengan fathah", "Hal manshub dengan fathah", "Maf'ul bih manshub", "Maf'ul muthlaq manshub"],
    "عِلْمًا menjelaskan sisi kelebihan yang samar pada isim tafdhil أَكْثَرُ (lebih banyak dalam hal apa?). Ini tamyiz nisbah, manshub."),
  battle('tamyiz', 'intermediate', 'Pilih tamyiz yang tepat untuk melengkapi kalimat.', 'قَرَأْتُ أَحَدَ عَشَرَ ـــــ',
    ['كِتَابًا', 'كُتُبًا', 'كِتَابٍ', 'كُتُبٍ'],
    "Tamyiz bilangan 11–99 berupa isim mufrad manshub: أَحَدَ عَشَرَ كِتَابًا."),

  // ---- Nawasikh ----
  irab('nawasikh', 'beginner', 'كَانَ [[الْجَوُّ]] حَارًّا',
    ["Isim kana marfu' dengan dhammah", "Khabar kana manshub", "Fa'il marfu' dengan dhammah", "Mubtada' marfu' dengan dhammah"],
    "كَانَ me-rafa'-kan isimnya dan me-nashab-kan khabarnya. الْجَوُّ adalah isim kana (marfu'), حَارًّا khabar kana (manshub)."),
  irab('nawasikh', 'beginner', 'إِنَّ [[الصَّلَاةَ]] عِمَادُ الدِّينِ',
    ["Isim inna manshub dengan fathah", "Khabar inna marfu'", "Maf'ul bih manshub", "Mubtada' marfu'"],
    "إِنَّ me-nashab-kan isimnya dan me-rafa'-kan khabarnya. الصَّلَاةَ isim inna (manshub), عِمَادُ khabar inna (marfu')."),
  irab('nawasikh', 'intermediate', 'أَصْبَحَ الطُّلَّابُ [[نَشِيطِينَ]]',
    ["Khabar ashbaha manshub dengan ya' karena jamak mudzakkar salim", "Hal manshub dengan ya'", "Isim ashbaha marfu' dengan wawu", "Na'at manshub dengan ya'"],
    "أَصْبَحَ termasuk saudara kana. نَشِيطِينَ adalah khabarnya, manshub dengan ya' karena jamak mudzakkar salim."),
  irab('nawasikh', 'intermediate', 'لَيْسَ الطَّالِبُ [[كَسْلَانَ]]',
    ["Khabar laisa manshub dengan fathah", "Isim laisa marfu'", "Hal manshub dengan fathah", "Khabar laisa majrur"],
    "لَيْسَ beramal seperti kana. كَسْلَانَ khabarnya, manshub dengan fathah tanpa tanwin karena mamnu' min ash-sharf (wazan فَعْلَانُ yang muannatsnya فَعْلَى)."),
  battle('nawasikh', 'intermediate', 'Pilih bentuk yang benar untuk melengkapi kalimat.', 'كَانَ الطَّالِبَانِ ـــــ',
    ['مُجْتَهِدَيْنِ', 'مُجْتَهِدَانِ', 'مُجْتَهِدِينَ', 'مُجْتَهِدًا'],
    "Yang kosong adalah khabar kana, maka manshub. Khabarnya mutsanna (sesuai الطَّالِبَانِ), di-nashab-kan dengan ya': مُجْتَهِدَيْنِ."),
  battle('nawasikh', 'advanced', 'Pilih bentuk yang benar untuk melengkapi kalimat.', 'لَعَلَّ ـــــ قَرِيبٌ',
    ['الْفَرَجَ', 'الْفَرَجُ', 'الْفَرَجِ', 'فَرَجٌ'],
    "لَعَلَّ termasuk saudara inna (berarti harapan/semoga). Isimnya manshub: لَعَلَّ الْفَرَجَ قَرِيبٌ."),
  detektif('nawasikh', 'advanced', "i'rab isim inna",
    ['إِنَّ الطَّالِبُ مُجْتَهِدٌ', 'إِنَّ الطَّالِبَ مُجْتَهِدٌ', 'كَانَ الطَّالِبُ مُجْتَهِدًا', 'لَيْتَ الطَّالِبَ مُجْتَهِدٌ'],
    "Isim inna harus manshub: إِنَّ الطَّالِبَ مُجْتَهِدٌ. Maka إِنَّ الطَّالِبُ salah."),

  // ---- Majrurat ----
  irab('majrurat', 'beginner', 'جَلَسْتُ فِي [[الْحَدِيقَةِ]]',
    ["Isim majrur dengan kasrah karena huruf jar", "Mudhaf ilaih majrur", "Maf'ul fih manshub", "Na'at majrur"],
    "فِي adalah huruf jar, maka الْحَدِيقَةِ isim majrur dengan kasrah."),
  irab('majrurat', 'intermediate', 'سَلَّمْتُ عَلَى [[إِبْرَاهِيمَ]]',
    ["Isim majrur dengan fathah karena mamnu' min ash-sharf", "Isim majrur dengan kasrah", "Maf'ul bih manshub dengan fathah", "Badal manshub"],
    "إِبْرَاهِيمَ majrur oleh عَلَى. Nama non-Arab ('ajam) termasuk mamnu' min ash-sharf, sehingga di-jarr-kan dengan fathah sebagai pengganti kasrah."),
  irab('majrurat', 'intermediate', 'مَرَرْتُ بِـ[[الْمُسْلِمِينَ]]',
    ["Isim majrur dengan ya' karena jamak mudzakkar salim", "Maf'ul bih manshub dengan ya'", "Isim majrur dengan kasrah", "Mudhaf ilaih majrur dengan ya'"],
    "الْمُسْلِمِينَ majrur oleh huruf jar بِـ. Jamak mudzakkar salim di-jarr-kan dengan ya'."),
  battle('majrurat', 'advanced', 'Pilih bentuk yang benar untuk melengkapi kalimat.', 'صَلَّيْتُ فِي ـــــ كَثِيرَةٍ',
    ['مَسَاجِدَ', 'مَسَاجِدِ', 'مَسَاجِدٍ', 'مَسَاجِدُ'],
    "مَسَاجِدُ berwazan shighah muntahal jumu' (مَفَاعِلُ), termasuk mamnu' min ash-sharf. Saat nakirah dan majrur, tandanya fathah tanpa tanwin: فِي مَسَاجِدَ كَثِيرَةٍ."),

  // ---- Tawabi' ----
  irab('tawabi', 'intermediate', 'جَاءَ مُحَمَّدٌ [[وَعَلِيٌّ]]',
    ["Ma'thuf marfu' dengan dhammah (mengikuti fa'il)", "Mubtada' marfu'", "Na'at marfu'", "Maf'ul ma'ah manshub"],
    "عَلِيٌّ di-'athaf-kan dengan wawu kepada مُحَمَّدٌ (fa'il), maka ikut marfu'. Ini 'athaf, salah satu tawabi'."),
  irab('tawabi', 'intermediate', 'حَضَرَ الضُّيُوفُ [[جَمِيعُهُمْ]]',
    ["Taukid marfu' dengan dhammah", "Badal marfu'", "Na'at marfu'", "Mubtada' marfu'"],
    "جَمِيعُهُمْ menguatkan الضُّيُوفُ agar dipahami semuanya hadir. Ini taukid ma'nawi, mengikuti yang dikuatkan (marfu')."),
  irab('tawabi', 'advanced', 'قَرَأْتُ الْكِتَابَ [[نِصْفَهُ]]',
    ["Badal ba'dh min kull manshub dengan fathah", "Taukid manshub", "Na'at manshub", "Hal manshub"],
    "نِصْفَهُ (separuhnya) adalah sebagian dari الْكِتَابَ, maka badal ba'dh min kull. Ia mengikuti mubdal minhu yang manshub dan wajib memuat dhamir yang kembali kepadanya."),
  battle('tawabi', 'intermediate', "Pilih ma'thuf yang tepat untuk melengkapi kalimat.", 'رَأَيْتُ زَيْدًا ثُمَّ ـــــ',
    ['عَمْرًا', 'عَمْرٌو', 'عَمْرٍو', 'لِعَمْرٍو'],
    "ثُمَّ adalah huruf 'athaf (berurutan dengan jeda). Ma'thuf mengikuti ma'thuf 'alaih زَيْدًا yang manshub: عَمْرًا."),

  // ---- Macam-macam jumlah ----
  { cat: 'anwa-jumal', type: 'sentence_analysis', level: 'beginner', prompt: JUMLAH, ar: 'الْمَسْجِدُ نَظِيفٌ',
    options: ['Jumlah ismiyyah', "Jumlah fi'liyyah", 'Syibhu jumlah'],
    explanation: "Diawali isim (الْمَسْجِدُ, mubtada') dan diikuti khabar (نَظِيفٌ), maka jumlah ismiyyah." },
  { cat: 'anwa-jumal', type: 'sentence_analysis', level: 'beginner', prompt: JUMLAH, ar: 'نَزَلَ الْمَطَرُ',
    options: ["Jumlah fi'liyyah", 'Jumlah ismiyyah', 'Syibhu jumlah'],
    explanation: "Diawali fi'il (نَزَلَ) lalu fa'il (الْمَطَرُ), maka jumlah fi'liyyah." },
  { cat: 'anwa-jumal', type: 'sentence_analysis', level: 'intermediate', prompt: JUMLAH, ar: 'الطَّالِبُ يَكْتُبُ الدَّرْسَ',
    options: ['Jumlah ismiyyah', "Jumlah fi'liyyah", 'Syibhu jumlah'],
    explanation: "Jenis jumlah ditentukan oleh kata pertama. Diawali isim (الطَّالِبُ) sebagai mubtada', maka jumlah ismiyyah. يَكْتُبُ الدَّرْسَ adalah khabarnya yang berbentuk jumlah fi'liyyah." },
  { cat: 'anwa-jumal', type: 'sentence_analysis', level: 'intermediate', prompt: 'Termasuk apakah susunan berikut?', ar: 'فِي الْفَصْلِ',
    options: ['Syibhu jumlah', 'Jumlah ismiyyah', "Jumlah fi'liyyah"],
    explanation: "Susunan huruf jar + isim majrur (atau zharaf + mudhaf ilaih) disebut syibhu jumlah (menyerupai kalimat). Ia belum menjadi kalimat sempurna." },
  { cat: 'anwa-jumal', type: 'identify_word', level: 'beginner', prompt: KALIMAH, ar: 'الطَّالِبُ [[يَدْرُسُ]]',
    options: ["Fi'il", 'Isim', 'Huruf'],
    explanation: "يَدْرُسُ adalah fi'il mudhari': menunjukkan perbuatan dan waktu, diawali huruf mudhara'ah يَـ." },
  { cat: 'anwa-jumal', type: 'identify_word', level: 'intermediate', prompt: KALIMAH, ar: '[[هُوَ]] طَالِبٌ',
    options: ['Isim', 'Huruf', "Fi'il"],
    explanation: "هُوَ adalah dhamir (kata ganti), dan dhamir termasuk isim. Ia mabni dan di sini berkedudukan sebagai mubtada'." },
  { cat: 'anwa-jumal', type: 'identify_word', level: 'advanced', prompt: KALIMAH, ar: '[[نِعْمَ]] الرَّجُلُ زَيْدٌ',
    options: ["Fi'il", 'Isim', 'Huruf'],
    explanation: "نِعْمَ adalah fi'il madhi jamid untuk memuji. Buktinya ia menerima ta' ta'nits sakinah: نِعْمَتِ الْمَرْأَةُ." },

  // =================== SHOROF ===================
  // ---- Fi'il Madhi ----
  jenisFiil('madhi', 'beginner', 'ذَهَبَ', ["Fi'il madhi", "Fi'il mudhari'", "Fi'il amr"],
    "ذَهَبَ adalah fi'il madhi: menunjukkan perbuatan lampau dan diakhiri fathah."),
  tashrif('madhi', 'beginner', 'Ubah ذَهَبَ untuk dhamir أَنَا.', ['ذَهَبْتُ', 'ذَهَبْتَ', 'ذَهَبَتْ', 'ذَهَبْنَا'],
    "أَنَا → ta' fa'il berharakat dhammah: ذَهَبْتُ. ذَهَبْتَ untuk أَنْتَ, ذَهَبَتْ untuk هِيَ, ذَهَبْنَا untuk نَحْنُ."),
  tashrif('madhi', 'intermediate', 'Ubah جَلَسَ untuk dhamir نَحْنُ.', ['جَلَسْنَا', 'جَلَسُوا', 'جَلَسْتُمْ', 'جَلَسْنَ'],
    "نَحْنُ → nun-alif (نَا fa'il), huruf sebelumnya disukunkan: جَلَسْنَا. جَلَسُوا untuk هُمْ, جَلَسْتُمْ untuk أَنْتُمْ, جَلَسْنَ untuk هُنَّ."),
  tashrif('madhi', 'intermediate', 'Ubah فَتَحَ untuk dhamir هُمَا (dua orang laki-laki).', ['فَتَحَا', 'فَتَحَتَا', 'فَتَحْتُمَا', 'فَتَحُوا'],
    "هُمَا (mudzakkar) → alif itsnain: فَتَحَا. فَتَحَتَا untuk هُمَا muannats, فَتَحْتُمَا untuk أَنْتُمَا, فَتَحُوا untuk هُمْ."),
  tashrif('madhi', 'advanced', 'Ubah دَعَا untuk dhamir أَنَا.', ['دَعَوْتُ', 'دَعَيْتُ', 'دَعْتُ', 'دَعَاتُ'],
    "دَعَا fi'il naqish wawi (asal دَعَوَ). Saat bersambung dengan ta' fa'il, alifnya kembali ke asal wawu: دَعَوْتُ."),
  tashrif('madhi', 'advanced', 'Ubah بَاعَ untuk dhamir أَنْتَ.', ['بِعْتَ', 'بُعْتَ', 'بَاعْتَ', 'بَيَعْتَ'],
    "بَاعَ ajwaf ya'i (asal بَيَعَ). Saat lam fi'il disukunkan karena ta' fa'il, alif dibuang dan fa' fi'il dikasrah sebagai tanda asal ya': بِعْتَ."),

  // ---- Fi'il Mudhari' ----
  jenisFiil('mudhari', 'beginner', 'يَشْرَبُ', ["Fi'il mudhari'", "Fi'il madhi", "Fi'il amr"],
    "يَشْرَبُ fi'il mudhari': diawali huruf mudhara'ah (أ، ن، ي، ت) dan menunjukkan waktu sekarang/akan datang."),
  tashrif('mudhari', 'beginner', "Apa fi'il mudhari' dari جَلَسَ untuk dhamir أَنَا?", ['أَجْلِسُ', 'يَجْلِسُ', 'نَجْلِسُ', 'تَجْلِسُ'],
    "أَنَا → huruf mudhara'ah أَ: أَجْلِسُ (bab ضَرَبَ – يَضْرِبُ, 'ain mudhari' dikasrah)."),
  tashrif('mudhari', 'intermediate', "Apa fi'il mudhari' dari كَتَبَ untuk dhamir أَنْتُمْ?", ['تَكْتُبُونَ', 'يَكْتُبُونَ', 'تَكْتُبْنَ', 'تَكْتُبَانِ'],
    "أَنْتُمْ → تَـ + wawu jama'ah + nun: تَكْتُبُونَ. يَكْتُبُونَ untuk هُمْ, تَكْتُبْنَ untuk أَنْتُنَّ, تَكْتُبَانِ untuk أَنْتُمَا."),
  tashrif('mudhari', 'intermediate', "Apa fi'il mudhari' dari دَرَسَ untuk dhamir أَنْتِ?", ['تَدْرُسِينَ', 'تَدْرُسُ', 'يَدْرُسْنَ', 'تَدْرُسْنَ'],
    "أَنْتِ → تَـ + ya' mukhathabah + nun: تَدْرُسِينَ. تَدْرُسُ untuk أَنْتَ/هِيَ, تَدْرُسْنَ untuk أَنْتُنَّ."),
  tashrif('mudhari', 'advanced', "Apa fi'il mudhari' dari قَالَ untuk dhamir هُوَ?", ['يَقُولُ', 'يَقِيلُ', 'يَقَالُ', 'يَقْوُلُ'],
    "قَالَ ajwaf wawi (asal قَوَلَ), mudhari'-nya يَقُولُ (asal يَقْوُلُ, harakat wawu dipindahkan ke qaf)."),
  tashrif('mudhari', 'advanced', "Apa fi'il mudhari' dari عَلَّمَ untuk dhamir هُوَ?", ['يُعَلِّمُ', 'يَعْلَمُ', 'يَتَعَلَّمُ', 'يُعْلِمُ'],
    "عَلَّمَ berwazan فَعَّلَ, mudhari'-nya يُفَعِّلُ: يُعَلِّمُ (huruf mudhara'ah didhammah). يَعْلَمُ dari عَلِمَ, يَتَعَلَّمُ dari تَعَلَّمَ, يُعْلِمُ dari أَعْلَمَ."),

  // ---- Fi'il Amr ----
  jenisFiil('amr', 'beginner', 'اِجْلِسْ', ["Fi'il amr", "Fi'il madhi", "Fi'il mudhari'"],
    "اِجْلِسْ adalah fi'il amr (perintah): duduklah! Akhirnya sukun dan diawali hamzah washl."),
  tashrif('amr', 'beginner', "Apa fi'il amr dari يَفْتَحُ (untuk أَنْتَ)?", ['اِفْتَحْ', 'اُفْتُحْ', 'فْتَحْ', 'تَفْتَحْ'],
    "Buang huruf mudhara'ah → فْتَحُ, sukunkan akhirnya, tambah hamzah washl berharakat kasrah (karena 'ain fi'il fathah): اِفْتَحْ."),
  tashrif('amr', 'intermediate', "Apa fi'il amr dari تَكْتُبِينَ (untuk أَنْتِ)?", ['اُكْتُبِي', 'اُكْتُبْ', 'اُكْتُبِينَ', 'اِكْتِبِي'],
    "Amr untuk أَنْتِ: buang huruf mudhara'ah dan nun (seperti majzum), tambah hamzah washl berdhammah: اُكْتُبِي."),
  tashrif('amr', 'intermediate', "Apa fi'il amr dari يُرْسِلُ (untuk أَنْتَ)?", ['أَرْسِلْ', 'اِرْسِلْ', 'رْسِلْ', 'أُرْسِلْ'],
    "يُرْسِلُ dari أَرْسَلَ (wazan أَفْعَلَ). Amr-nya memakai hamzah qath' berharakat fathah: أَرْسِلْ."),
  tashrif('amr', 'advanced', "Apa fi'il amr dari يَدْعُو (untuk أَنْتَ)?", ['اُدْعُ', 'اُدْعُو', 'دْعُ', 'اِدْعُ'],
    "Fi'il naqish: amr dibentuk dengan membuang huruf illat di akhir: اُدْعُ (hamzah washl berdhammah karena 'ain fi'il dhammah)."),
  tashrif('amr', 'advanced', "Apa fi'il amr dari يَبِيعُ (untuk أَنْتَ)?", ['بِعْ', 'بِيعْ', 'اِبِعْ', 'بَعْ'],
    "بِيعُ → disukunkan بِيعْ → iltiqa' sakinain (ya' dan 'ain) sehingga ya' dibuang: بِعْ."),

  // ---- Mashdar ----
  tashrif('mashdar', 'beginner', 'Apa mashdar dari دَرَسَ?', ['دِرَاسَةٌ', 'مَدْرَسَةٌ', 'دَارِسٌ', 'مَدْرُوسٌ'],
    "Mashdar دَرَسَ yang umum dipakai adalah دِرَاسَةٌ (juga دَرْسٌ). مَدْرَسَةٌ isim makan, دَارِسٌ isim fa'il, مَدْرُوسٌ isim maf'ul."),
  tashrif('mashdar', 'intermediate', 'Apa mashdar dari أَكْرَمَ?', ['إِكْرَامٌ', 'تَكْرِيمٌ', 'كَرَمٌ', 'مُكْرِمٌ'],
    "أَكْرَمَ berwazan أَفْعَلَ, mashdarnya إِفْعَالٌ: إِكْرَامٌ. تَكْرِيمٌ mashdar كَرَّمَ, مُكْرِمٌ isim fa'il."),
  tashrif('mashdar', 'intermediate', 'Apa mashdar dari قَاتَلَ?', ['مُقَاتَلَةٌ / قِتَالٌ', 'قَتْلٌ', 'تَقْتِيلٌ', 'اِقْتِتَالٌ'],
    "قَاتَلَ berwazan فَاعَلَ, mashdarnya مُفَاعَلَةٌ atau فِعَالٌ: مُقَاتَلَةٌ / قِتَالٌ. قَتْلٌ mashdar قَتَلَ, اِقْتِتَالٌ mashdar اِقْتَتَلَ."),
  tashrif('mashdar', 'advanced', 'Apa mashdar dari اِجْتَمَعَ?', ['اِجْتِمَاعٌ', 'تَجَمُّعٌ', 'جَمْعٌ', 'مُجْتَمَعٌ'],
    "اِجْتَمَعَ berwazan اِفْتَعَلَ, mashdarnya اِفْتِعَالٌ: اِجْتِمَاعٌ. تَجَمُّعٌ mashdar تَجَمَّعَ, مُجْتَمَعٌ = masyarakat (isim maf'ul/makan)."),
  tashrif('mashdar', 'advanced', 'Apa mashdar dari تَعَاوَنَ?', ['تَعَاوُنٌ', 'مُعَاوَنَةٌ', 'إِعَانَةٌ', 'عَوْنٌ'],
    "تَعَاوَنَ berwazan تَفَاعَلَ, mashdarnya تَفَاعُلٌ: تَعَاوُنٌ (huruf sebelum akhir didhammah). مُعَاوَنَةٌ mashdar عَاوَنَ, إِعَانَةٌ mashdar أَعَانَ."),

  // ---- Isim Fa'il ----
  tashrif('isim-fail', 'beginner', "Apa isim fa'il dari عَلِمَ?", ['عَالِمٌ', 'مَعْلُومٌ', 'عِلْمٌ', 'مُعَلِّمٌ'],
    "Isim fa'il tsulatsi berwazan فَاعِلٌ: عَالِمٌ (orang yang mengetahui). مَعْلُومٌ isim maf'ul, عِلْمٌ mashdar, مُعَلِّمٌ isim fa'il dari عَلَّمَ."),
  tashrif('isim-fail', 'intermediate', "Apa isim fa'il dari اِسْتَمَعَ?", ['مُسْتَمِعٌ', 'مُسْتَمَعٌ', 'سَامِعٌ', 'اِسْتِمَاعٌ'],
    "Dari يَسْتَمِعُ: ganti huruf mudhara'ah dengan مُـ dan kasrahkan huruf sebelum akhir: مُسْتَمِعٌ (pendengar)."),
  tashrif('isim-fail', 'advanced', "Apa isim fa'il dari قَالَ?", ['قَائِلٌ', 'قَاوِلٌ', 'مَقُولٌ', 'قَوْلٌ'],
    "Wazan فَاعِلٌ dari قَوَلَ menjadi قَاوِلٌ; wawu setelah alif tambahan diganti hamzah: قَائِلٌ. مَقُولٌ isim maf'ul, قَوْلٌ mashdar."),

  // ---- Isim Maf'ul ----
  tashrif('isim-maful', 'beginner', "Apa isim maf'ul dari شَرِبَ?", ['مَشْرُوبٌ', 'شَارِبٌ', 'شَرَابٌ', 'مَشْرَبٌ'],
    "Isim maf'ul tsulatsi berwazan مَفْعُولٌ: مَشْرُوبٌ (yang diminum). شَارِبٌ isim fa'il, مَشْرَبٌ isim makan."),
  tashrif('isim-maful', 'intermediate', "Apa isim maf'ul dari اِسْتَخْدَمَ?", ['مُسْتَخْدَمٌ', 'مُسْتَخْدِمٌ', 'خَادِمٌ', 'اِسْتِخْدَامٌ'],
    "Dari يَسْتَخْدِمُ: ganti huruf mudhara'ah dengan مُـ dan fathahkan huruf sebelum akhir: مُسْتَخْدَمٌ (yang digunakan). مُسْتَخْدِمٌ (kasrah) isim fa'il = pengguna."),
  tashrif('isim-maful', 'advanced', "Apa isim maf'ul dari بَاعَ?", ['مَبِيعٌ', 'مَبْيُوعٌ', 'بَائِعٌ', 'مُبَاعٌ'],
    "Wazan مَفْعُولٌ dari بَيَعَ asalnya مَبْيُوعٌ, lalu diringkas (i'lal) menjadi مَبِيعٌ (barang yang dijual)."),

  // ---- Tashrif ----
  tashrif('tashrif', 'intermediate', "Lengkapi tashrif ishthilahi: نَصَرَ – يَنْصُرُ – نَصْرًا – … (isim fa'il)", ['نَاصِرٌ', 'مَنْصُورٌ', 'اُنْصُرْ', 'مَنْصَرٌ'],
    "Urutan tashrif ishthilahi: madhi – mudhari' – mashdar – isim fa'il – isim maf'ul – amr – nahi – isim zaman/makan – isim alat. Setelah mashdar: isim fa'il نَاصِرٌ."),
  tashrif('tashrif', 'advanced', "Lengkapi tashrif ishthilahi: ضَرَبَ – يَضْرِبُ – ضَرْبًا – ضَارِبٌ – مَضْرُوبٌ – … (amr)", ['اِضْرِبْ', 'اُضْرُبْ', 'ضْرِبْ', 'لَا تَضْرِبْ'],
    "Setelah isim maf'ul datang fi'il amr: اِضْرِبْ (hamzah washl berkasrah karena 'ain mudhari'-nya kasrah). لَا تَضْرِبْ adalah fi'il nahi, sesudahnya."),
  tashrif('tashrif', 'advanced', "Fi'il كَرُمَ – يَكْرُمُ termasuk bab apa?", ['فَعُلَ – يَفْعُلُ', 'فَعَلَ – يَفْعُلُ', 'فَعِلَ – يَفْعَلُ', 'فَعَلَ – يَفْعِلُ'],
    "كَرُمَ – يَكْرُمُ: 'ain madhi dhammah dan 'ain mudhari' dhammah, yaitu bab ke-5 (فَعُلَ – يَفْعُلُ). Bab ini untuk sifat yang melekat."),

  // ---- Mizan ----
  mizan('beginner', 'مَكْتُوبٌ', ['مَفْعُولٌ', 'فَاعِلٌ', 'مَفْعَلٌ', 'فُعُولٌ'],
    "Huruf asli ك–ت–ب ditimbang ف–ع–ل; mim dan wawu tambahan tetap ditulis: مَفْعُولٌ."),
  mizan('intermediate', 'تَعَلَّمَ', ['تَفَعَّلَ', 'تَفَاعَلَ', 'فَعَّلَ', 'اِفْتَعَلَ'],
    "Huruf asli ع–ل–م; tambahan ta' di depan dan tasydid pada 'ain: تَفَعَّلَ."),
  mizan('intermediate', 'مَسَاجِدُ', ['مَفَاعِلُ', 'فَعَالِلُ', 'مَفَاعِيلُ', 'فَوَاعِلُ'],
    "Huruf asli س–ج–د; mim di depan dan alif setelah huruf pertama adalah tambahan: مَفَاعِلُ (shighah muntahal jumu')."),
  mizan('advanced', 'وَعَدَ', ['فَعَلَ', 'وَعَلَ', 'فَاعَلَ', 'عَدَلَ'],
    "Semua huruf وَعَدَ asli (و–ع–د), maka mizan-nya فَعَلَ. Huruf asli selalu diganti ف–ع–ل, termasuk huruf illat."),
  mizan('advanced', 'اِسْتِقْبَالٌ', ['اِسْتِفْعَالٌ', 'اِفْتِعَالٌ', 'اِنْفِعَالٌ', 'تَفْعِيلٌ'],
    "Huruf asli ق–ب–ل; tambahan اِسْتِـ dan alif sebelum huruf akhir: اِسْتِفْعَالٌ (mashdar اِسْتَفْعَلَ)."),

  // ---- Mujarrad & Mazid ----
  { cat: 'mujarrad-mazid', type: 'complete_rule', level: 'beginner', prompt: "Fi'il berikut termasuk mujarrad atau mazid?", ar: 'كَتَبَ',
    options: ["Tsulatsi mujarrad", "Tsulatsi mazid satu huruf", "Tsulatsi mazid dua huruf", "Ruba'i mujarrad"],
    explanation: "كَتَبَ terdiri dari tiga huruf asli tanpa tambahan, maka tsulatsi mujarrad." },
  { cat: 'mujarrad-mazid', type: 'complete_rule', level: 'intermediate', prompt: "Fi'il berikut termasuk mujarrad atau mazid?", ar: 'اِنْكَسَرَ',
    options: ["Tsulatsi mazid dua huruf", "Tsulatsi mazid satu huruf", "Tsulatsi mazid tiga huruf", "Ruba'i mujarrad"],
    explanation: "Huruf asli ك–س–ر; tambahannya hamzah washl dan nun (اِنْـ): dua huruf, wazan اِنْفَعَلَ." },
  { cat: 'mujarrad-mazid', type: 'complete_rule', level: 'advanced', prompt: "Fi'il berikut termasuk mujarrad atau mazid?", ar: 'زَلْزَلَ',
    options: ["Ruba'i mujarrad", "Tsulatsi mazid satu huruf", "Ruba'i mazid", "Tsulatsi mujarrad"],
    explanation: "زَلْزَلَ terdiri dari empat huruf asli (ز–ل–ز–ل) tanpa tambahan, berwazan فَعْلَلَ: ruba'i mujarrad." },
  { cat: 'mujarrad-mazid', type: 'complete_rule', level: 'intermediate', prompt: "Faedah (makna) wazan فَاعَلَ pada kata berikut adalah …", ar: 'شَارَكَ',
    options: ['Musyarakah (saling/bersama)', "Ta'diyah (menjadikan transitif)", "Thalab (meminta)", "Muthawa'ah (menerima akibat)"],
    explanation: "Wazan فَاعَلَ umumnya bermakna musyarakah: perbuatan yang melibatkan dua pihak, misalnya شَارَكَ = berserikat/ikut serta bersama." },
  { cat: 'mujarrad-mazid', type: 'complete_rule', level: 'advanced', prompt: "Faedah (makna) wazan اِسْتَفْعَلَ pada kata berikut adalah …", ar: 'اِسْتَغْفَرَ',
    options: ["Thalab (meminta)", 'Musyarakah (saling)', "Ta'diyah", "Muthawa'ah"],
    explanation: "Wazan اِسْتَفْعَلَ sering bermakna thalab (meminta): اِسْتَغْفَرَ = meminta ampunan (غُفْرَانٌ)." },

  // ---- Shahih & Mu'tal ----
  { cat: 'shahih-mutal', type: 'complete_rule', level: 'beginner', prompt: "Fi'il berikut termasuk jenis apa?", ar: 'وَصَلَ',
    options: ['Mitsal', 'Ajwaf', 'Naqish', 'Shahih salim'],
    explanation: "Fa' fi'il-nya huruf illat (wawu), maka disebut mu'tal mitsal (mitsal wawi)." },
  { cat: 'shahih-mutal', type: 'complete_rule', level: 'intermediate', prompt: "Fi'il berikut termasuk jenis apa?", ar: 'رَمَى',
    options: ['Naqish', 'Ajwaf', 'Mitsal', 'Mudha\'af'],
    explanation: "Lam fi'il-nya huruf illat (asal ya': رَمَيَ), maka disebut naqish (naqish ya'i)." },
  { cat: 'shahih-mutal', type: 'complete_rule', level: 'intermediate', prompt: "Fi'il berikut termasuk jenis apa?", ar: 'مَدَّ',
    options: ['Shahih mudha\'af', 'Shahih mahmuz', 'Shahih salim', 'Ajwaf'],
    explanation: "مَدَّ asalnya مَدَدَ: 'ain dan lam fi'il-nya huruf yang sama, maka disebut mudha'af (termasuk fi'il shahih)." },
  { cat: 'shahih-mutal', type: 'complete_rule', level: 'advanced', prompt: "Fi'il berikut termasuk jenis apa?", ar: 'وَقَى',
    options: ['Lafif mafruq', 'Lafif maqrun', 'Mitsal', 'Naqish'],
    explanation: "وَقَى memiliki dua huruf illat yang terpisah: fa' fi'il (و) dan lam fi'il (ي). Ini disebut lafif mafruq. Jika keduanya berdampingan (seperti طَوَى) disebut lafif maqrun." },

  // =================== I'RAB ===================
  // ---- Rafa' ----
  irab('rafa', 'beginner', '[[يَكْتُبُ]] الطَّالِبُ',
    ["Fi'il mudhari' marfu' dengan dhammah", "Fi'il madhi mabni 'ala al-fath", "Fi'il mudhari' manshub", "Fi'il mudhari' majzum"],
    "Fi'il mudhari' yang tidak didahului 'amil nashab atau jazm adalah marfu', tandanya dhammah."),
  irab('rafa', 'intermediate', 'الطُّلَّابُ [[يَدْرُسُونَ]]',
    ["Fi'il mudhari' marfu' dengan tsubut an-nun", "Fi'il mudhari' marfu' dengan dhammah", "Fi'il mudhari' manshub dengan hadzf an-nun", "Isim marfu' dengan wawu"],
    "يَدْرُسُونَ termasuk al-af'al al-khamsah; tanda rafa'-nya tetapnya nun (tsubut an-nun)."),

  // ---- Nashab ----
  irab('nashab', 'beginner', 'أُرِيدُ أَنْ [[أَذْهَبَ]]',
    ["Fi'il mudhari' manshub dengan fathah karena أَنْ", "Fi'il mudhari' marfu' dengan dhammah", "Fi'il mudhari' majzum", "Fi'il madhi mabni"],
    "أَنْ adalah huruf nashab, maka أَذْهَبَ manshub dengan fathah."),
  irab('nashab', 'intermediate', 'لَنْ [[يَنْجَحُوا]] بِدُونِ اجْتِهَادٍ',
    ["Fi'il mudhari' manshub dengan hadzf an-nun", "Fi'il mudhari' majzum dengan hadzf an-nun", "Fi'il mudhari' marfu' dengan tsubut an-nun", "Fi'il madhi mabni 'ala adh-dhamm"],
    "لَنْ huruf nashab. يَنْجَحُوا dari al-af'al al-khamsah, tanda nashab-nya dibuangnya nun (hadzf an-nun). Alif setelah wawu adalah alif fariqah."),
  battle('nashab', 'intermediate', 'Pilih bentuk yang benar untuk melengkapi kalimat.', 'جِئْتُ لِـ ـــــ الْعِلْمَ',
    ['أَطْلُبَ', 'أَطْلُبُ', 'أَطْلُبْ', 'طَلَبْتُ'],
    "Lam ta'lil (لِـ) me-nashab-kan fi'il mudhari' dengan أَنْ yang tersembunyi: لِأَطْلُبَ الْعِلْمَ (agar aku menuntut ilmu)."),

  // ---- Jarr ----
  irab('jarr', 'beginner', 'كَتَبْتُ بِـ[[الْقَلَمِ]]',
    ["Isim majrur dengan kasrah karena huruf jar بِـ", "Mudhaf ilaih majrur", "Maf'ul bih manshub", "Na'at majrur"],
    "بِـ adalah huruf jar, maka الْقَلَمِ majrur dengan kasrah."),
  irab('jarr', 'intermediate', 'سَلَّمْتُ عَلَى [[الطَّالِبَيْنِ]]',
    ["Isim majrur dengan ya' karena mutsanna", "Isim majrur dengan ya' karena jamak mudzakkar salim", "Maf'ul bih manshub dengan ya'", "Isim majrur dengan kasrah"],
    "الطَّالِبَيْنِ mutsanna (ـَيْنِ, fathah sebelum ya'), majrur oleh عَلَى dengan ya'."),

  // ---- Jazm ----
  irab('jazm', 'beginner', 'لَمْ [[يَذْهَبْ]] الطَّالِبُ',
    ["Fi'il mudhari' majzum dengan sukun karena لَمْ", "Fi'il mudhari' manshub dengan fathah", "Fi'il mudhari' marfu' dengan dhammah", "Fi'il amr mabni 'ala as-sukun"],
    "لَمْ adalah huruf jazm, maka يَذْهَبْ majzum dengan sukun."),
  irab('jazm', 'intermediate', 'لَا [[تَكْذِبُوا]]',
    ["Fi'il mudhari' majzum dengan hadzf an-nun karena لَا nahiyah", "Fi'il mudhari' manshub dengan hadzf an-nun", "Fi'il mudhari' marfu'", "Fi'il amr mabni"],
    "لَا di sini adalah lam nahiyah (larangan) yang men-jazm-kan. تَكْذِبُوا (al-af'al al-khamsah) majzum dengan dibuangnya nun."),
  irab('jazm', 'advanced', 'لَمْ [[يَدْعُ]] اللّٰهَ',
    ["Fi'il mudhari' majzum dengan hadzf harf al-'illah", "Fi'il mudhari' majzum dengan sukun", "Fi'il amr mabni", "Fi'il mudhari' manshub dengan fathah muqaddarah"],
    "يَدْعُو adalah fi'il mudhari' naqish (berakhir wawu). Saat majzum oleh لَمْ, tandanya dibuangnya huruf illat: لَمْ يَدْعُ."),
  battle('jazm', 'advanced', 'Pilih bentuk yang benar untuk melengkapi kalimat syarat.', 'إِنْ تَدْرُسْ ـــــ',
    ['تَنْجَحْ', 'تَنْجَحُ', 'تَنْجَحَ', 'نَجَحْتَ'],
    "إِنْ syarthiyyah men-jazm-kan dua fi'il: fi'il syarat (تَدْرُسْ) dan jawab syarat (تَنْجَحْ)."),

  // ---- Tanda i'rab asli & cabang ----
  { cat: 'alamat-irab', type: 'complete_rule', level: 'beginner', prompt: "Apa tanda i'rab asli untuk rafa'?",
    options: ['Dhammah', 'Fathah', 'Kasrah', 'Sukun'],
    explanation: "Tanda asli: rafa' dengan dhammah, nashab dengan fathah, jarr dengan kasrah, jazm dengan sukun." },
  { cat: 'alamat-irab', type: 'complete_rule', level: 'intermediate', prompt: "Isim mutsanna ketika rafa' ditandai dengan …",
    options: ['Alif', 'Wawu', 'Dhammah', "Ya'"],
    explanation: "Mutsanna di-rafa'-kan dengan alif (الطَّالِبَانِ), di-nashab dan di-jarr-kan dengan ya' (الطَّالِبَيْنِ)." },
  { cat: 'alamat-irab', type: 'complete_rule', level: 'intermediate', prompt: "Isim mamnu' min ash-sharf ketika majrur (tanpa ال dan tidak di-idhafah-kan) ditandai dengan …",
    options: ['Fathah', 'Kasrah', "Ya'", 'Sukun'],
    explanation: "Mamnu' min ash-sharf di-jarr-kan dengan fathah sebagai pengganti kasrah, kecuali jika diberi ال atau di-idhafah-kan. Contoh: مَرَرْتُ بِأَحْمَدَ." },
  { cat: 'alamat-irab', type: 'complete_rule', level: 'advanced', prompt: "Al-af'al al-khamsah ketika manshub dan majzum ditandai dengan …",
    options: ['Dibuangnya nun', 'Tetapnya nun', 'Fathah dan sukun', 'Dibuangnya huruf illat'],
    explanation: "Al-af'al al-khamsah (يَفْعَلَانِ، تَفْعَلَانِ، يَفْعَلُونَ، تَفْعَلُونَ، تَفْعَلِينَ) di-rafa'-kan dengan tetapnya nun, sedangkan di-nashab dan di-jazm-kan dengan dibuangnya nun." },

  // ---- I'rab kata dalam kalimat ----
  irab('irab-jumlah', 'intermediate', 'إِنَّ فِي ذَلِكَ [[لَآيَاتٍ]]',
    ["Isim inna muakhkhar manshub dengan kasrah karena jamak muannats salim", "Khabar inna marfu'", "Isim majrur dengan kasrah", "Tamyiz manshub"],
    "Khabar inna (فِي ذَلِكَ) didahulukan, dan آيَاتٍ adalah isim inna yang diakhirkan, diawali lam ibtida' (lam muzahlaqah). Jamak muannats salim manshub dengan kasrah."),
  irab('irab-jumlah', 'advanced', 'وَاتَّقُوا اللّٰهَ [[لَعَلَّكُمْ]] تُفْلِحُونَ',
    ["Huruf nashab (saudara inna) dan dhamir كُمْ sebagai isimnya fi mahalli nashb", "Fi'il madhi dan fa'il", "Huruf jar dan majrur", "Isim marfu' sebagai mubtada'"],
    "لَعَلَّ adalah saudara inna yang bermakna harapan (tarajji). كُمْ isimnya (mabni, fi mahalli nashb), dan jumlah تُفْلِحُونَ adalah khabarnya (fi mahalli raf')."),
  irab('irab-jumlah', 'advanced', 'الْحَمْدُ [[لِلّٰهِ]] رَبِّ الْعَالَمِينَ',
    ["Jar-majrur yang berkaitan dengan khabar yang dibuang", "Mudhaf ilaih", "Na'at majrur", "Maf'ul bih ghairu sharih"],
    "لِلّٰهِ adalah huruf jar lam + lafzhul jalalah yang majrur. Syibhu jumlah ini berkaitan dengan khabar mubtada' الْحَمْدُ yang dibuang (تَقْدِيرُهُ: كَائِنٌ / ثَابِتٌ). رَبِّ adalah na'at/badal bagi lafzhul jalalah."),
]
