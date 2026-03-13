export type QuranResource = {
  id: string;
  title: string;
  titleAr: string;
  reference: string;
  referenceAr: string;
  description: string;
  descriptionAr: string;
  url: string;
};

export type QuranPlanItem = {
  day: string;
  dayAr: string;
  title: string;
  titleAr: string;
  reference: string;
  referenceAr: string;
  focus: string;
  focusAr: string;
};

export const featuredQuranResources: QuranResource[] = [
  {
    id: 'fatiha',
    title: 'Opening Prayer',
    titleAr: 'فاتحة الكتاب',
    reference: 'Surah Al-Fatihah · 1:1-7',
    referenceAr: 'سورة الفاتحة · ١:١-٧',
    description: 'Begin with the chapter recited in every prayer.',
    descriptionAr: 'ابدأ بالسورة التي تتكرر في كل صلاة.',
    url: 'https://quran.com/1',
  },
  {
    id: 'ayat-al-kursi',
    title: 'Ayat al-Kursi',
    titleAr: 'آية الكرسي',
    reference: 'Surah Al-Baqarah · 2:255',
    referenceAr: 'سورة البقرة · ٢:٢٥٥',
    description: 'A widely memorized verse for reflection and protection.',
    descriptionAr: 'آية يتكرر حفظها للتدبر وطلب الحفظ.',
    url: 'https://quran.com/2/255',
  },
  {
    id: 'kahf',
    title: 'Friday Reading',
    titleAr: 'ورد يوم الجمعة',
    reference: 'Surah Al-Kahf · 18',
    referenceAr: 'سورة الكهف · ١٨',
    description: 'Keep your weekly Kahf reading one tap away.',
    descriptionAr: 'اجعل قراءة الكهف الأسبوعية قريبة منك بلمسة واحدة.',
    url: 'https://quran.com/18',
  },
  {
    id: 'yasin',
    title: 'Heart of the Quran',
    titleAr: 'قلب القرآن',
    reference: 'Surah Ya-Sin · 36',
    referenceAr: 'سورة يس · ٣٦',
    description: 'Open a familiar surah often chosen for steady daily reading.',
    descriptionAr: 'افتح سورة مألوفة يكثر اختيارها للورد اليومي.',
    url: 'https://quran.com/36',
  },
  {
    id: 'rahman',
    title: 'Mercy and Balance',
    titleAr: 'الرحمة والميزان',
    reference: 'Surah Ar-Rahman · 55',
    referenceAr: 'سورة الرحمن · ٥٥',
    description: 'A lyrical recitation centered on gratitude and signs.',
    descriptionAr: 'تلاوة مؤثرة تدور حول الشكر وآيات الله.',
    url: 'https://quran.com/55',
  },
  {
    id: 'waqiah',
    title: 'Day of Reality',
    titleAr: 'سورة الواقعة',
    reference: 'Surah Al-Waqi‘ah · 56',
    referenceAr: 'سورة الواقعة · ٥٦',
    description: 'A passage many readers keep in their evening routine.',
    descriptionAr: 'سورة يضمها كثير من القراء إلى ورد المساء.',
    url: 'https://quran.com/56',
  },
  {
    id: 'mulk',
    title: 'Protection Before Sleep',
    titleAr: 'ورد قبل النوم',
    reference: 'Surah Al-Mulk · 67',
    referenceAr: 'سورة الملك · ٦٧',
    description: 'Set apart a nightly reading with a direct shortcut.',
    descriptionAr: 'خصص ورداً ليلياً برابط مباشر سريع.',
    url: 'https://quran.com/67',
  },
  {
    id: 'muawwidhat',
    title: 'Closing Refuge',
    titleAr: 'المعوذات',
    reference: 'Surahs Al-Ikhlas, Al-Falaq, An-Nas',
    referenceAr: 'سور الإخلاص والفلق والناس',
    description: 'Keep the final short surahs ready for morning and evening adhkar.',
    descriptionAr: 'اجعل السور القصار الأخيرة جاهزة لأذكار الصباح والمساء.',
    url: 'https://quran.com/112-114',
  },
];

export const quranWeeklyPlan: QuranPlanItem[] = [
  {
    day: 'Day 1',
    dayAr: 'اليوم ١',
    title: 'Begin with Presence',
    titleAr: 'ابدأ بحضور القلب',
    reference: 'Al-Fatihah + Al-Baqarah 1-20',
    referenceAr: 'الفاتحة + البقرة ١-٢٠',
    focus: 'Read slowly and note one dua to repeat today.',
    focusAr: 'اقرأ بهدوء واختر دعاءً واحداً تكرره اليوم.',
  },
  {
    day: 'Day 2',
    dayAr: 'اليوم ٢',
    title: 'Anchor Your Creed',
    titleAr: 'ثبّت معاني الإيمان',
    reference: 'Al-Baqarah 21-141',
    referenceAr: 'البقرة ٢١-١٤١',
    focus: 'Track verses about guidance, gratitude, and covenant.',
    focusAr: 'تتبع آيات الهداية والشكر والميثاق.',
  },
  {
    day: 'Day 3',
    dayAr: 'اليوم ٣',
    title: 'Carry a Midday Portion',
    titleAr: 'ورد منتصف اليوم',
    reference: 'Al-Baqarah 142-252',
    referenceAr: 'البقرة ١٤٢-٢٥٢',
    focus: 'Pause at Ayat al-Kursi and revisit it after prayer.',
    focusAr: 'توقف عند آية الكرسي وارجع إليها بعد الصلاة.',
  },
  {
    day: 'Day 4',
    dayAr: 'اليوم ٤',
    title: 'Finish the Foundation',
    titleAr: 'أتم السورة الجامعة',
    reference: 'Al-Baqarah 253-286',
    referenceAr: 'البقرة ٢٥٣-٢٨٦',
    focus: 'Close with the final supplications before sleep.',
    focusAr: 'اختم بالأدعية الأخيرة قبل النوم.',
  },
  {
    day: 'Day 5',
    dayAr: 'اليوم ٥',
    title: 'Renew Hope',
    titleAr: 'جدّد الرجاء',
    reference: 'Surah Maryam or Ya-Sin',
    referenceAr: 'سورة مريم أو يس',
    focus: 'Listen to a recitation after reading the same section yourself.',
    focusAr: 'استمع إلى التلاوة بعد قراءة المقطع بنفسك.',
  },
  {
    day: 'Day 6',
    dayAr: 'اليوم ٦',
    title: 'Read for Reflection',
    titleAr: 'اقرأ للتدبر',
    reference: 'Surah Ar-Rahman + Surah Al-Waqi‘ah',
    referenceAr: 'سورة الرحمن + سورة الواقعة',
    focus: 'Repeat the verses that move you instead of rushing onward.',
    focusAr: 'كرر الآيات المؤثرة بدلاً من الاستعجال في الإكمال.',
  },
  {
    day: 'Day 7',
    dayAr: 'اليوم ٧',
    title: 'Prepare for the Week Ahead',
    titleAr: 'تهيأ للأسبوع القادم',
    reference: 'Surah Al-Kahf or Surah Al-Mulk',
    referenceAr: 'سورة الكهف أو سورة الملك',
    focus: 'Choose the surah you want to keep returning to next week.',
    focusAr: 'اختر السورة التي ستجعلها محور وردك في الأسبوع القادم.',
  },
];