import { useTranslation, Trans } from 'react-i18next';

export function useI18n() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: 'en' | 'zh') => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  return {
    t,
    changeLanguage,
    currentLanguage,
    Trans,
    i18n,
  };
}