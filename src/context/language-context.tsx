'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export const supportedLanguages = [
  { value: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr', locale: 'en-US' },
  { value: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', locale: 'ar' },
  { value: 'am', label: 'Amharic', nativeLabel: 'አማርኛ', dir: 'ltr', locale: 'am-ET' },
  { value: 'om', label: 'Afan Oromo', nativeLabel: 'Oromoo', dir: 'ltr', locale: 'om-ET' },
] as const;

export type Language = (typeof supportedLanguages)[number]['value'];

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = 'language';

function isSupportedLanguage(value: string | null): value is Language {
  return supportedLanguages.some((language) => language.value === value);
}

export function isRtlLanguage(lang: Language): boolean {
  return supportedLanguages.find((language) => language.value === lang)?.dir === 'rtl';
}

export function usesEasternArabicNumerals(lang: Language): boolean {
  return lang === 'ar';
}

export function getLocaleTag(lang: Language): string {
  return supportedLanguages.find((language) => language.value === lang)?.locale ?? 'en-US';
}

export function getLanguageDefinition(lang: Language) {
  return supportedLanguages.find((language) => language.value === lang) ?? supportedLanguages[0];
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(savedLanguage)) {
      setLang(savedLanguage);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = getLocaleTag(lang);
    document.documentElement.dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
  }, [lang]);

  const toggleLang = () => {
    setLang((currentLang) => {
      const currentIndex = supportedLanguages.findIndex((language) => language.value === currentLang);
      const nextIndex = (currentIndex + 1) % supportedLanguages.length;
      return supportedLanguages[nextIndex].value;
    });
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
