// Bank soal awal & kategori. Ubah file ini lalu jalankan `npm run seed:build`
// untuk menghasilkan supabase/seed/seed.sql.
//
// Format soal:
//   cat      : slug kategori (lihat CATEGORIES)
//   type     : jenis permainan (enum game_type)
//   level    : beginner | intermediate | advanced
//   variety  : 'fusha' (default) | 'amiyah_mesir'
//   prompt   : instruksi dalam bahasa Indonesia
//   ar       : teks Arab berharakat yang ditampilkan besar (opsional)
//   options  : pilihan jawaban — JAWABAN BENAR SELALU DI URUTAN PERTAMA,
//              server mengacak urutannya saat ditampilkan (kecuali benar/salah)
//   answer   : khusus true_false → indeks jawaban benar (0 = Benar, 1 = Salah)
//   tiles    : khusus sentence_builder → potongan kata
//   accepted : khusus sentence_builder → semua susunan yang benar
//   explanation : wajib, ringkas dan benar

export const CATEGORIES = [
  {
    arena: 'mufrodat', slug: 'mufrodat-kosakata', name: 'Kosakata', name_ar: 'الْمُفْرَدَاتُ',
    children: [
      ['dasar', 'Kosakata dasar', 'مُفْرَدَاتٌ أَسَاسِيَّةٌ'],
      ['sekolah', 'Sekolah dan kelas', 'الْمَدْرَسَةُ وَالْفَصْلُ'],
      ['rumah', 'Rumah dan keluarga', 'الْبَيْتُ وَالْأُسْرَةُ'],
      ['makanan', 'Makanan dan minuman', 'الطَّعَامُ وَالشَّرَابُ'],
      ['aktivitas', 'Aktivitas sehari-hari', 'الْأَنْشِطَةُ الْيَوْمِيَّةُ'],
      ['perjalanan', 'Perjalanan', 'السَّفَرُ'],
      ['kampus', 'Kampus', 'الْجَامِعَةُ'],
    ],
  },
  {
    arena: 'mufrodat', slug: 'mufrodat-percakapan', name: 'Ungkapan & Percakapan', name_ar: 'الْمُحَادَثَةُ',
    children: [
      ['salam', 'Perkenalan dan salam', 'التَّعَارُفُ وَالتَّحِيَّةُ'],
      ['pasar', 'Pasar dan restoran', 'السُّوقُ وَالْمَطْعَمُ'],
      ['ungkapan', 'Ungkapan sehari-hari', 'تَعْبِيرَاتٌ يَوْمِيَّةٌ'],
      ['fusha', 'Percakapan Fusha', 'مُحَادَثَةٌ بِالْفُصْحَى'],
      ['amiyah', 'Percakapan Amiyah Mesir', 'مُحَادَثَةٌ بِالْعَامِّيَّةِ الْمِصْرِيَّةِ'],
    ],
  },
  {
    arena: 'qowaid', slug: 'qowaid-nahwu', name: 'Nahwu', name_ar: 'النَّحْوُ',
    children: [
      ['mubtada-khabar', "Mubtada' & Khabar", 'الْمُبْتَدَأُ وَالْخَبَرُ'],
      ['fail', "Fa'il", 'الْفَاعِلُ'],
      ['maful-bih', "Maf'ul bih", 'الْمَفْعُولُ بِهِ'],
      ['naat', "Na'at", 'النَّعْتُ'],
      ['idhafah', 'Idhafah', 'الْإِضَافَةُ'],
      ['hal', 'Hal', 'الْحَالُ'],
      ['tamyiz', 'Tamyiz', 'التَّمْيِيزُ'],
      ['nawasikh', 'Nawasikh', 'النَّوَاسِخُ'],
      ['majrurat', 'Majrurat', 'الْمَجْرُورَاتُ'],
      ['tawabi', "Tawabi'", 'التَّوَابِعُ'],
      ['anwa-jumal', 'Macam-macam jumlah', 'أَنْوَاعُ الْجُمَلِ'],
    ],
  },
  {
    arena: 'qowaid', slug: 'qowaid-shorof', name: 'Shorof', name_ar: 'الصَّرْفُ',
    children: [
      ['madhi', "Fi'il Madhi", 'الْفِعْلُ الْمَاضِي'],
      ['mudhari', "Fi'il Mudhari'", 'الْفِعْلُ الْمُضَارِعُ'],
      ['amr', "Fi'il Amr", 'فِعْلُ الْأَمْرِ'],
      ['mashdar', 'Mashdar', 'الْمَصْدَرُ'],
      ['isim-fail', "Isim Fa'il", 'اسْمُ الْفَاعِلِ'],
      ['isim-maful', "Isim Maf'ul", 'اسْمُ الْمَفْعُولِ'],
      ['tashrif', "Tashrif al-Af'al", 'تَصْرِيفُ الْأَفْعَالِ'],
      ['mizan', 'Mizan Sharfi', 'الْمِيزَانُ الصَّرْفِيُّ'],
      ['mujarrad-mazid', 'Mujarrad & Mazid', 'الْمُجَرَّدُ وَالْمَزِيدُ'],
      ['shahih-mutal', "Shahih & Mu'tal", 'الصَّحِيحُ وَالْمُعْتَلُّ'],
    ],
  },
  {
    arena: 'qowaid', slug: 'qowaid-irab', name: "I'rab", name_ar: 'الْإِعْرَابُ',
    children: [
      ['rafa', "Rafa'", 'الرَّفْعُ'],
      ['nashab', 'Nashab', 'النَّصْبُ'],
      ['jarr', 'Jarr', 'الْجَرُّ'],
      ['jazm', 'Jazm', 'الْجَزْمُ'],
      ['alamat-irab', "Tanda i'rab asli & cabang", 'عَلَامَاتُ الْإِعْرَابِ الْأَصْلِيَّةُ وَالْفَرْعِيَّةُ'],
      ['irab-jumlah', "I'rab kata dalam kalimat", 'إِعْرَابُ الْكَلِمَاتِ دَاخِلَ الْجُمَلِ'],
    ],
  },
]

const ARTI = 'Apa arti kata berikut?'
const KE_ARAB = (id) => `Apa bahasa Arabnya "${id}"?`
const TF = 'Benar atau salah?'
const RESPON = 'Pilih respons yang paling tepat.'

export const QUESTIONS = [
  // ---------------- Kosakata dasar ----------------
  { cat: 'dasar', type: 'vocabulary_challenge', level: 'beginner', prompt: ARTI, ar: 'بَابٌ',
    options: ['Pintu', 'Jendela', 'Dinding', 'Lantai'],
    explanation: 'بَابٌ artinya pintu. Bentuk jamaknya أَبْوَابٌ.' },
  { cat: 'dasar', type: 'vocabulary_challenge', level: 'beginner', prompt: ARTI, ar: 'نَافِذَةٌ',
    options: ['Jendela', 'Pintu', 'Atap', 'Kursi'],
    explanation: 'نَافِذَةٌ artinya jendela. Bentuk jamaknya نَوَافِذُ.' },
  { cat: 'dasar', type: 'true_false', level: 'beginner', prompt: `${TF} شَمْسٌ artinya "bulan".`, ar: 'شَمْسٌ',
    options: ['Benar', 'Salah'], answer: 1,
    explanation: 'Salah. شَمْسٌ artinya matahari, sedangkan bulan adalah قَمَرٌ.' },
  { cat: 'dasar', type: 'arabic_translation', level: 'beginner', prompt: KE_ARAB('air'),
    options: ['مَاءٌ', 'نَارٌ', 'هَوَاءٌ', 'تُرَابٌ'],
    explanation: 'مَاءٌ = air. Pilihan lain: نَارٌ = api, هَوَاءٌ = udara, تُرَابٌ = tanah/debu.' },
  { cat: 'dasar', type: 'arabic_translation', level: 'intermediate', prompt: 'Apa lawan kata (ضِدّ) dari kata berikut?', ar: 'قَرِيبٌ',
    options: ['بَعِيدٌ', 'كَبِيرٌ', 'طَوِيلٌ', 'سَرِيعٌ'],
    explanation: 'قَرِيبٌ (dekat) lawannya بَعِيدٌ (jauh). كَبِيرٌ = besar, طَوِيلٌ = panjang/tinggi, سَرِيعٌ = cepat.' },
  { cat: 'dasar', type: 'vocabulary_challenge', level: 'advanced', prompt: 'Apa bentuk jamak dari kata berikut?', ar: 'كِتَابٌ',
    options: ['كُتُبٌ', 'كِتَابَاتٌ', 'كَتَبَةٌ', 'مَكَاتِبُ'],
    explanation: 'Jamak كِتَابٌ adalah كُتُبٌ (jamak taksir). كِتَابَاتٌ jamak dari كِتَابَةٌ (tulisan), كَتَبَةٌ jamak dari كَاتِبٌ (penulis), مَكَاتِبُ jamak dari مَكْتَبٌ (meja/kantor).' },

  // ---------------- Sekolah dan kelas ----------------
  { cat: 'sekolah', type: 'vocabulary_challenge', level: 'beginner', prompt: ARTI, ar: 'سَبُّورَةٌ',
    options: ['Papan tulis', 'Buku tulis', 'Penghapus', 'Tas'],
    explanation: 'سَبُّورَةٌ artinya papan tulis.' },
  { cat: 'sekolah', type: 'vocabulary_challenge', level: 'beginner', prompt: ARTI, ar: 'مُدَرِّسٌ',
    options: ['Guru', 'Murid', 'Kepala sekolah', 'Penjaga sekolah'],
    explanation: 'مُدَرِّسٌ adalah isim fa\'il dari دَرَّسَ (mengajar), artinya pengajar/guru. Murid = طَالِبٌ atau تِلْمِيذٌ.' },
  { cat: 'sekolah', type: 'arabic_translation', level: 'beginner', prompt: KE_ARAB('buku tulis'),
    options: ['كُرَّاسَةٌ', 'كِتَابٌ', 'مِمْسَحَةٌ', 'مِسْطَرَةٌ'],
    explanation: 'كُرَّاسَةٌ = buku tulis. كِتَابٌ = buku (bacaan), مِمْسَحَةٌ = penghapus, مِسْطَرَةٌ = penggaris.' },
  { cat: 'sekolah', type: 'context_challenge', level: 'intermediate', prompt: 'Kamu ingin meminjam pena temanmu. Kalimat yang tepat adalah …',
    options: ['هَلْ يُمْكِنُ أَنْ أَسْتَعِيرَ قَلَمَكَ؟', 'أَيْنَ قَلَمُكَ؟', 'هَذَا قَلَمِي.', 'اِشْتَرَيْتُ قَلَمًا.'],
    explanation: 'أَسْتَعِيرُ = saya meminjam; هَلْ يُمْكِنُ أَنْ ... = bolehkah .... Pilihan lain berarti: "Di mana penamu?", "Ini penaku.", "Aku membeli pena."' },

  // ---------------- Rumah dan keluarga ----------------
  { cat: 'rumah', type: 'vocabulary_challenge', level: 'beginner', prompt: ARTI, ar: 'مَطْبَخٌ',
    options: ['Dapur', 'Kamar tidur', 'Kamar mandi', 'Ruang tamu'],
    explanation: 'مَطْبَخٌ berwazan مَفْعَلٌ (isim makan) dari طَبَخَ (memasak): tempat memasak = dapur.' },
  { cat: 'rumah', type: 'vocabulary_challenge', level: 'beginner', prompt: ARTI, ar: 'جَدَّةٌ',
    options: ['Nenek', 'Bibi', 'Kakek', 'Ibu'],
    explanation: 'جَدَّةٌ = nenek, جَدٌّ = kakek. Ibu = أُمٌّ, bibi = عَمَّةٌ (saudari ayah) atau خَالَةٌ (saudari ibu).' },
  { cat: 'rumah', type: 'arabic_translation', level: 'beginner', prompt: KE_ARAB('saudara laki-laki'),
    options: ['أَخٌ', 'أُخْتٌ', 'اِبْنٌ', 'أَبٌ'],
    explanation: 'أَخٌ = saudara laki-laki. أُخْتٌ = saudara perempuan, اِبْنٌ = anak laki-laki, أَبٌ = ayah.' },
  { cat: 'rumah', type: 'vocabulary_challenge', level: 'intermediate', prompt: ARTI, ar: 'عَمٌّ',
    options: ['Paman (saudara ayah)', 'Paman (saudara ibu)', 'Kakek', 'Sepupu'],
    explanation: 'عَمٌّ = saudara laki-laki ayah. Saudara laki-laki ibu disebut خَالٌ.' },

  // ---------------- Makanan dan minuman ----------------
  { cat: 'makanan', type: 'vocabulary_challenge', level: 'beginner', prompt: ARTI, ar: 'خُبْزٌ',
    options: ['Roti', 'Nasi', 'Daging', 'Keju'],
    explanation: 'خُبْزٌ = roti. Nasi = أَرُزٌّ, daging = لَحْمٌ, keju = جُبْنٌ.' },
  { cat: 'makanan', type: 'arabic_translation', level: 'beginner', prompt: KE_ARAB('susu'),
    options: ['حَلِيبٌ', 'عَصِيرٌ', 'شَايٌ', 'قَهْوَةٌ'],
    explanation: 'حَلِيبٌ = susu. عَصِيرٌ = jus, شَايٌ = teh, قَهْوَةٌ = kopi.' },
  // Gambar sementara memakai emoji; gambar asli diunggah lewat Bank Soal (Tahap 6).
  { cat: 'makanan', type: 'picture_vocabulary', level: 'beginner', prompt: 'Apa nama buah pada gambar dalam bahasa Arab?', ar: '🍎',
    options: ['تُفَّاحٌ', 'مَوْزٌ', 'بُرْتُقَالٌ', 'عِنَبٌ'],
    explanation: 'تُفَّاحٌ = apel. مَوْزٌ = pisang, بُرْتُقَالٌ = jeruk, عِنَبٌ = anggur.' },
  { cat: 'makanan', type: 'picture_vocabulary', level: 'beginner', prompt: 'Apa nama buah pada gambar dalam bahasa Arab?', ar: '🍌',
    options: ['مَوْزٌ', 'تُفَّاحٌ', 'رُمَّانٌ', 'تَمْرٌ'],
    explanation: 'مَوْزٌ = pisang. تُفَّاحٌ = apel, رُمَّانٌ = delima, تَمْرٌ = kurma.' },

  // ---------------- Aktivitas sehari-hari ----------------
  { cat: 'aktivitas', type: 'vocabulary_challenge', level: 'beginner', prompt: ARTI, ar: 'يَنَامُ',
    options: ['Tidur', 'Makan', 'Mandi', 'Bangun'],
    explanation: 'نَامَ – يَنَامُ = tidur.' },
  { cat: 'aktivitas', type: 'vocabulary_challenge', level: 'intermediate', prompt: ARTI, ar: 'يَسْتَيْقِظُ',
    options: ['Bangun tidur', 'Berwudu', 'Berangkat', 'Beristirahat'],
    explanation: 'اِسْتَيْقَظَ – يَسْتَيْقِظُ = bangun (dari tidur).' },
  { cat: 'aktivitas', type: 'true_false', level: 'beginner', prompt: `${TF} أَتَوَضَّأُ artinya "saya berwudu".`, ar: 'أَتَوَضَّأُ',
    options: ['Benar', 'Salah'], answer: 0,
    explanation: 'Benar. تَوَضَّأَ – يَتَوَضَّأُ = berwudu; huruf أَ di awal fi\'il mudhari\' menunjukkan "saya".' },
  { cat: 'aktivitas', type: 'sentence_builder', level: 'intermediate',
    prompt: 'Susun menjadi kalimat: "Saya pergi ke sekolah setiap hari."',
    tiles: ['أَذْهَبُ', 'إِلَى', 'الْمَدْرَسَةِ', 'كُلَّ', 'يَوْمٍ'],
    accepted: ['أَذْهَبُ إِلَى الْمَدْرَسَةِ كُلَّ يَوْمٍ', 'كُلَّ يَوْمٍ أَذْهَبُ إِلَى الْمَدْرَسَةِ'],
    explanation: 'أَذْهَبُ إِلَى الْمَدْرَسَةِ كُلَّ يَوْمٍ. Keterangan waktu كُلَّ يَوْمٍ juga boleh diletakkan di awal kalimat.' },

  // ---------------- Perjalanan ----------------
  { cat: 'perjalanan', type: 'vocabulary_challenge', level: 'beginner', prompt: ARTI, ar: 'مَطَارٌ',
    options: ['Bandara', 'Stasiun', 'Pelabuhan', 'Terminal'],
    explanation: 'مَطَارٌ (dari طَارَ = terbang) = bandara. Stasiun = مَحَطَّةٌ, pelabuhan = مِينَاءٌ.' },
  { cat: 'perjalanan', type: 'arabic_translation', level: 'intermediate', prompt: KE_ARAB('tiket'),
    options: ['تَذْكِرَةٌ', 'حَقِيبَةٌ', 'جَوَازُ السَّفَرِ', 'طَائِرَةٌ'],
    explanation: 'تَذْكِرَةٌ = tiket. حَقِيبَةٌ = tas/koper, جَوَازُ السَّفَرِ = paspor, طَائِرَةٌ = pesawat.' },
  { cat: 'perjalanan', type: 'context_challenge', level: 'intermediate', prompt: 'Kamu ingin bertanya di mana stasiun kereta. Kalimat yang tepat adalah …',
    options: ['أَيْنَ مَحَطَّةُ الْقِطَارِ؟', 'مَتَى يَصِلُ الْقِطَارُ؟', 'كَمْ ثَمَنُ التَّذْكِرَةِ؟', 'هَلْ هَذَا مَقْعَدُكَ؟'],
    explanation: 'أَيْنَ = di mana; مَحَطَّةُ الْقِطَارِ = stasiun kereta. Pilihan lain: "Kapan kereta tiba?", "Berapa harga tiketnya?", "Apakah ini kursimu?"' },

  // ---------------- Kampus ----------------
  { cat: 'kampus', type: 'vocabulary_challenge', level: 'intermediate', prompt: ARTI, ar: 'مُحَاضَرَةٌ',
    options: ['Kuliah (perkuliahan)', 'Ujian', 'Asrama', 'Perpustakaan'],
    explanation: 'مُحَاضَرَةٌ = kuliah/ceramah ilmiah. Ujian = اِمْتِحَانٌ, perpustakaan = مَكْتَبَةٌ.' },
  { cat: 'kampus', type: 'vocabulary_challenge', level: 'intermediate', prompt: ARTI, ar: 'كُلِّيَّةٌ',
    options: ['Fakultas', 'Jurusan', 'Universitas', 'Kelas'],
    explanation: 'كُلِّيَّةٌ = fakultas. Jurusan = قِسْمٌ, universitas = جَامِعَةٌ, kelas = فَصْلٌ.' },
  { cat: 'kampus', type: 'vocabulary_challenge', level: 'advanced', prompt: ARTI, ar: 'مَرْجِعٌ',
    options: ['Referensi (rujukan)', 'Ringkasan', 'Daftar isi', 'Catatan kaki'],
    explanation: 'مَرْجِعٌ (jamak: مَرَاجِعُ) = referensi/rujukan. Ringkasan = مُلَخَّصٌ, daftar isi = فِهْرِسٌ, catatan kaki = هَامِشٌ.' },
  { cat: 'kampus', type: 'arabic_translation', level: 'advanced', prompt: KE_ARAB('pengumuman'),
    options: ['إِعْلَانٌ', 'إِعْلَامٌ', 'اِسْتِعْلَامٌ', 'تَعْلِيمٌ'],
    explanation: 'إِعْلَانٌ = pengumuman. Kata lain berakar mirip: إِعْلَامٌ = media/pemberitahuan, اِسْتِعْلَامٌ = bagian informasi, تَعْلِيمٌ = pengajaran.' },

  // ---------------- Perkenalan dan salam ----------------
  { cat: 'salam', type: 'daily_conversation', level: 'beginner', prompt: `Temanmu berkata: السَّلَامُ عَلَيْكُمْ. ${RESPON}`, ar: 'السَّلَامُ عَلَيْكُمْ',
    options: ['وَعَلَيْكُمُ السَّلَامُ', 'صَبَاحَ النُّورِ', 'مَعَ السَّلَامَةِ', 'شُكْرًا'],
    explanation: 'Jawaban salam adalah وَعَلَيْكُمُ السَّلَامُ. مَعَ السَّلَامَةِ diucapkan saat berpisah.' },
  { cat: 'salam', type: 'daily_conversation', level: 'beginner', prompt: `Ustadz menyapa: صَبَاحَ الْخَيْرِ. ${RESPON}`, ar: 'صَبَاحَ الْخَيْرِ',
    options: ['صَبَاحَ النُّورِ', 'مَسَاءَ النُّورِ', 'عَفْوًا', 'إِلَى اللِّقَاءِ'],
    explanation: 'صَبَاحَ الْخَيْرِ (selamat pagi) dijawab صَبَاحَ النُّورِ. مَسَاءَ النُّورِ untuk sore/malam.' },
  { cat: 'salam', type: 'daily_conversation', level: 'beginner', prompt: `Seseorang bertanya: مَا اسْمُكَ؟ ${RESPON}`, ar: 'مَا اسْمُكَ؟',
    options: ['اِسْمِي أَحْمَدُ.', 'أَنَا مِنْ إِنْدُونِيسِيَا.', 'عُمْرِي عِشْرُونَ سَنَةً.', 'أَنَا بِخَيْرٍ.'],
    explanation: 'مَا اسْمُكَ؟ = Siapa namamu? Jawabannya اِسْمِي ... (namaku ...).' },
  { cat: 'salam', type: 'daily_conversation', level: 'intermediate', prompt: `Seseorang bertanya: مِنْ أَيْنَ أَنْتَ؟ ${RESPON}`, ar: 'مِنْ أَيْنَ أَنْتَ؟',
    options: ['أَنَا مِنْ إِنْدُونِيسِيَا.', 'اِسْمِي أَحْمَدُ.', 'أَسْكُنُ فِي الْقَاهِرَةِ مُنْذُ سَنَةٍ.', 'أَنَا طَالِبٌ.'],
    explanation: 'مِنْ أَيْنَ أَنْتَ؟ = Dari mana asalmu? Jawabannya أَنَا مِنْ ... . "أَسْكُنُ فِي الْقَاهِرَةِ" menjawab tempat tinggal, bukan asal.' },
  { cat: 'salam', type: 'complete_expression', level: 'beginner', prompt: 'Lengkapi ungkapan "Apa kabarmu?"', ar: 'كَيْفَ ـــــ ؟',
    options: ['حَالُكَ', 'اسْمُكَ', 'بَيْتُكَ', 'عُمْرُكَ'],
    explanation: 'كَيْفَ حَالُكَ؟ = Bagaimana keadaanmu/apa kabarmu? Untuk perempuan: كَيْفَ حَالُكِ؟' },

  // ---------------- Pasar dan restoran ----------------
  { cat: 'pasar', type: 'vocabulary_challenge', level: 'beginner', prompt: ARTI, ar: 'سُوقٌ',
    options: ['Pasar', 'Toko', 'Masjid', 'Jalan'],
    explanation: 'سُوقٌ = pasar (jamak: أَسْوَاقٌ). Toko = دُكَّانٌ atau مَحَلٌّ, jalan = شَارِعٌ.' },
  { cat: 'pasar', type: 'daily_conversation', level: 'beginner', prompt: 'Di pasar kamu mendengar: بِكَمْ هَذَا؟ Artinya …', ar: 'بِكَمْ هَذَا؟',
    options: ['Berapa harga ini?', 'Di mana ini?', 'Apa ini?', 'Milik siapa ini?'],
    explanation: 'بِكَمْ = dengan (harga) berapa. Di mana = أَيْنَ, apa = مَا, milik siapa = لِمَنْ.' },
  { cat: 'pasar', type: 'context_challenge', level: 'intermediate', prompt: 'Di restoran kamu ingin meminta daftar menu. Kalimat yang tepat adalah …',
    options: ['مِنْ فَضْلِكَ، أَعْطِنِي قَائِمَةَ الطَّعَامِ.', 'أَنَا شَبْعَانُ.', 'الْحِسَابُ مِنْ فَضْلِكَ.', 'الطَّعَامُ لَذِيذٌ.'],
    explanation: 'قَائِمَةُ الطَّعَامِ = daftar menu. أَنَا شَبْعَانُ = saya kenyang, الْحِسَابُ = tagihan, لَذِيذٌ = lezat.' },

  // ---------------- Ungkapan sehari-hari ----------------
  { cat: 'ungkapan', type: 'complete_expression', level: 'beginner', prompt: 'Ketika bersin, kita disunnahkan mengucapkan …', ar: 'ـــــ لِلّٰهِ',
    options: ['الْحَمْدُ', 'الشُّكْرُ', 'السَّلَامُ', 'الْعَفْوُ'],
    explanation: 'Sunnah ketika bersin adalah mengucapkan الْحَمْدُ لِلّٰهِ.' },
  { cat: 'ungkapan', type: 'complete_expression', level: 'intermediate', prompt: 'Temanmu bersin lalu mengucap الْحَمْدُ لِلّٰهِ. Kamu menjawab …', ar: 'ـــــ اللّٰهُ',
    options: ['يَرْحَمُكَ', 'يَهْدِيكُمُ', 'يَحْفَظُكَ', 'يُبَارِكُ'],
    explanation: 'Pendengar menjawab يَرْحَمُكَ اللّٰهُ. Lalu yang bersin membalas يَهْدِيكُمُ اللّٰهُ وَيُصْلِحُ بَالَكُمْ.' },
  { cat: 'ungkapan', type: 'vocabulary_challenge', level: 'beginner', prompt: 'Apa arti ungkapan berikut ketika menjawab شُكْرًا?', ar: 'عَفْوًا',
    options: ['Sama-sama', 'Terima kasih', 'Selamat tinggal', 'Silakan masuk'],
    explanation: 'عَفْوًا sebagai jawaban شُكْرًا berarti "sama-sama". Dalam konteks lain ia juga berarti "maaf/permisi".' },
  { cat: 'ungkapan', type: 'true_false', level: 'intermediate', prompt: `${TF} إِنْ شَاءَ اللّٰهُ diucapkan untuk sesuatu yang sudah terjadi.`, ar: 'إِنْ شَاءَ اللّٰهُ',
    options: ['Benar', 'Salah'], answer: 1,
    explanation: 'Salah. إِنْ شَاءَ اللّٰهُ diucapkan untuk rencana di masa depan. Untuk kekaguman atas sesuatu yang ada diucapkan مَا شَاءَ اللّٰهُ.' },

  // ---------------- Percakapan Fusha ----------------
  { cat: 'fusha', type: 'daily_conversation', level: 'intermediate', prompt: RESPON, ar: 'هَلْ تَتَكَلَّمُ اللُّغَةَ الْعَرَبِيَّةَ؟',
    options: ['نَعَمْ، أَتَكَلَّمُهَا قَلِيلًا.', 'نَعَمْ، أَنَا طَالِبٌ.', 'لَا، أَنَا جَائِعٌ.', 'نَعَمْ، الْكِتَابُ جَدِيدٌ.'],
    explanation: 'Pertanyaan: "Apakah kamu berbicara bahasa Arab?" Jawaban yang sesuai: "Ya, saya berbicara sedikit." (أَتَكَلَّمُهَا = saya berbicara dengannya).' },
  { cat: 'fusha', type: 'daily_conversation', level: 'advanced', prompt: RESPON, ar: 'مَاذَا تَدْرُسُ فِي الْجَامِعَةِ؟',
    options: ['أَدْرُسُ فِي كُلِّيَّةِ أُصُولِ الدِّينِ.', 'أَسْكُنُ قَرِيبًا مِنَ الْجَامِعَةِ.', 'دَرَسْتُ أَمْسِ مَعَ صَدِيقِي.', 'الْجَامِعَةُ كَبِيرَةٌ جِدًّا.'],
    explanation: 'Pertanyaan: "Apa yang kamu pelajari di universitas?" Jawaban yang tepat menyebut bidang studi. دَرَسْتُ أَمْسِ menjawab waktu belajar (fi\'il madhi), bukan bidang studi.' },
  { cat: 'fusha', type: 'sentence_builder', level: 'advanced',
    prompt: 'Susun menjadi jumlah fi\'liyyah (diawali fi\'il): "Mahasiswa itu telah membaca buku di perpustakaan."',
    tiles: ['قَرَأَ', 'الطَّالِبُ', 'الْكِتَابَ', 'فِي', 'الْمَكْتَبَةِ'],
    accepted: ['قَرَأَ الطَّالِبُ الْكِتَابَ فِي الْمَكْتَبَةِ', 'قَرَأَ الطَّالِبُ فِي الْمَكْتَبَةِ الْكِتَابَ'],
    explanation: 'Urutan dasar jumlah fi\'liyyah: fi\'il (قَرَأَ) – fa\'il marfu\' (الطَّالِبُ) – maf\'ul bih manshub (الْكِتَابَ) – keterangan tempat (فِي الْمَكْتَبَةِ).' },
  { cat: 'fusha', type: 'context_challenge', level: 'intermediate', prompt: 'Kamu terlambat masuk kelas. Kalimat yang sopan kepada ustadz adalah …',
    options: ['عَفْوًا يَا أُسْتَاذُ، تَأَخَّرْتُ.', 'أَيْنَ الْأُسْتَاذُ؟', 'أَنَا مُسْتَعْجِلٌ.', 'إِلَى اللِّقَاءِ يَا أُسْتَاذُ.'],
    explanation: 'تَأَخَّرْتُ = saya terlambat; diawali عَفْوًا (maaf). Pilihan lain: "Di mana ustadz?", "Saya terburu-buru.", "Sampai jumpa, ustadz."' },

  // ---------------- Amiyah Mesir ----------------
  { cat: 'amiyah', variety: 'amiyah_mesir', type: 'amiyah_challenge', level: 'beginner', prompt: 'Apa arti ungkapan Amiyah Mesir ini?', ar: 'إِزَّيَّك؟',
    options: ['Apa kabar?', 'Di mana kamu?', 'Siapa namamu?', 'Mau ke mana?'],
    explanation: 'إِزَّيَّك = apa kabar? (Fusha: كَيْفَ حَالُكَ؟). Untuk perempuan diucapkan إِزَّيِّك.' },
  { cat: 'amiyah', variety: 'amiyah_mesir', type: 'amiyah_challenge', level: 'beginner', prompt: 'Apa arti kata Amiyah Mesir ini?', ar: 'عَايِز',
    options: ['Mau / ingin', 'Tahu', 'Bisa', 'Punya'],
    explanation: 'عَايِز (laki-laki) / عَايْزَة (perempuan) = mau/ingin. Padanan Fusha: أُرِيدُ.' },
  { cat: 'amiyah', variety: 'amiyah_mesir', type: 'amiyah_challenge', level: 'intermediate', prompt: 'Apa padanan Fusha dari kata Amiyah ini?', ar: 'دِلْوَقْتِي',
    options: ['الْآنَ', 'غَدًا', 'أَمْسِ', 'بَعْدَ قَلِيلٍ'],
    explanation: 'دِلْوَقْتِي = sekarang, padanan Fusha الْآنَ. غَدًا = besok, أَمْسِ = kemarin, بَعْدَ قَلِيلٍ = sebentar lagi.' },
  { cat: 'amiyah', variety: 'amiyah_mesir', type: 'amiyah_challenge', level: 'intermediate', prompt: 'Apa arti ungkapan Amiyah Mesir ini?', ar: 'مِشْ عَارِف',
    options: ['Saya tidak tahu', 'Saya tidak mau', 'Saya belum makan', 'Saya tidak bisa'],
    explanation: 'مِشْ = tidak (negasi Amiyah), عَارِف = tahu. Padanan Fusha: لَا أَعْرِفُ.' },
  { cat: 'amiyah', variety: 'amiyah_mesir', type: 'amiyah_challenge', level: 'advanced', prompt: 'Sopir taksi di Kairo bertanya kepadamu. Maksudnya …', ar: 'رَايِح فِين؟',
    options: ['Mau ke mana?', 'Dari mana?', 'Kapan berangkat?', 'Berapa orang?'],
    explanation: 'رَايِح = pergi/menuju (Fusha: ذَاهِبٌ), فِين = di mana/ke mana (Fusha: أَيْنَ). Jadi: إِلَى أَيْنَ أَنْتَ ذَاهِبٌ؟' },
  { cat: 'amiyah', variety: 'amiyah_mesir', type: 'amiyah_challenge', level: 'advanced', prompt: 'Ungkapan Amiyah Mesir ini biasanya dipakai untuk …', ar: 'مَعْلِش',
    options: ['Menenangkan/memaafkan: "tidak apa-apa"', 'Menolak dengan tegas', 'Memuji makanan', 'Memanggil pelayan'],
    explanation: 'مَعْلِش (dari مَا عَلَيْهِ شَيْءٌ) = tidak apa-apa / maaf ya. Sangat sering dipakai di Mesir.' },
]
