import { useI18n } from '../../hooks/use-i18n';
import { Tooltip } from './tooltip';

export function LanguageSwitcher(): JSX.Element {
  const { currentLanguage, changeLanguage } = useI18n();

  const toggleLanguage = (): void => {
    changeLanguage(currentLanguage === 'en' ? 'zh' : 'en');
  };

  const flag = currentLanguage === 'en' ? '🇺🇸' : '🇨🇳';
  const label = currentLanguage === 'en' ? 'English' : '中文';

  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={toggleLanguage}
        className="flex h-7 w-7 items-center justify-center rounded border border-[#30363d] text-sm transition-all hover:border-[#58a6ff] hover:bg-[#58a6ff20]"
        style={{ color: '#8b949e' }}
        aria-label={`Switch to ${currentLanguage === 'en' ? '中文' : 'English'}`}
      >
        {flag}
      </button>
    </Tooltip>
  );
}