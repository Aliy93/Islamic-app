import { Language } from '@/context/language-context';

const HIJRI_MONTH_NAMES: Record<Language, string[]> = {
  en: [
    'Muharram',
    'Safar',
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    "Zul al-Qi'dah",
    'Zul al-Hijjah',
  ],
  ar: [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الآخر',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
  ],
  am: [
    'ሙሀራም',
    'ሳፈር',
    'ራቢዕ አል-አወል',
    'ራቢዕ አል-ቲኒ',
    'ጁማዱ አል-አወል',
    'ጁማዱ አል-አኺር',
    'ረጀብ',
    'ሻዕባን',
    'ረመዳን',
    'ሸዋል',
    "ዙል-ቃዕዳ",
    "ዙል-ሂጃ",
  ],
  om: [
    'Muharram',
    'Safar',
    "Rabi'ul-Awwal",
    "Rabi'ul-Thani",
    'Jumada I',
    'Jumada II',
    'Rajab',
    "Sha'ban",
    'Ramadaan',
    'Shawwaal',
    "Zul-Qi'dah",
    "Zul-Hijjah",
  ],
};

export function getHijriMonthName(month: number, lang: Language): string {
  const normalizedMonthIndex = Math.max(0, Math.min(11, month - 1));
  return HIJRI_MONTH_NAMES[lang][normalizedMonthIndex] ?? HIJRI_MONTH_NAMES.en[normalizedMonthIndex];
}

export function getDefaultHijriMonthNames(month: number): { monthName: string; monthNameAr: string } {
  return {
    monthName: getHijriMonthName(month, 'en'),
    monthNameAr: getHijriMonthName(month, 'ar'),
  };
}