import { type ServiceRecord } from '../../lib/api';
import { useI18n } from '../../hooks/use-i18n';

interface WildcardModeHintProps {
  services: ServiceRecord[];
  baseDomain: string | null;
  isWildcardMode: boolean;
  isDnsConfigured: boolean;
}

interface WildcardHintCopy {
  className: string;
  titleClassName: string;
  title: string;
  body: string;
}

function hasPerServiceDnsGaps(services: ServiceRecord[]): boolean {
  return services.some(service => service.proxyExists && !service.dnsExists);
}

function getHintCopy(baseDomain: string, t: any): WildcardHintCopy {
  return {
    className: 'border-[#58a6ff50] bg-[#58a6ff15]',
    titleClassName: 'text-[#79c0ff]',
    title: t('wildcard_hint.dns_mode_on', { domain: baseDomain }),
    body: t('wildcard_hint.dns_badges_expected', { domain: baseDomain }),
  };
}

export function WildcardModeHint({
  services,
  baseDomain,
  isWildcardMode,
  isDnsConfigured,
}: WildcardModeHintProps): JSX.Element | null {
  const { t } = useI18n();
  const showHint = Boolean(
    baseDomain && isDnsConfigured && !isWildcardMode && hasPerServiceDnsGaps(services)
  );

  if (!showHint || !baseDomain) return null;

  const hint = getHintCopy(baseDomain, t);

  return (
    <div className={`rounded border px-4 py-3 text-sm ${hint.className}`}>
      <div className={hint.titleClassName}>{hint.title}</div>
      <div className="mt-1 text-xs leading-relaxed text-[#8b949e]">{hint.body}</div>
    </div>
  );
}
