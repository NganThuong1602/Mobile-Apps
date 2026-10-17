import { getLocales } from 'expo-localization';

import en from './en';
import vi from './vi';

type TranslationKey = keyof typeof vi;

function getLanguage() {
  const languageCode = getLocales()[0]?.languageCode;

  return languageCode === 'vi' ? 'vi' : 'en';
}

export function t(key: TranslationKey): string {
  const language = getLanguage();

  if (language === 'vi') {
    return vi[key];
  }

  return en[key];
}
