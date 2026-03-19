import { type ServiceRecord } from '../../lib/api';

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

function getHintCopy(baseDomain: string): WildcardHintCopy {
  return {
    className: 'border-[#58a6ff50] bg-[#58a6ff15]',
    titleClassName: 'text-[#79c0ff]',
    title: `DNS mode is on for ${baseDomain}`,
    body: `Those DNS badges are expected. To stop creating one record per app, add *.${baseDomain} in NPM and switch wildcard on in Configuration.`,
  };
}

export function WildcardModeHint({
  services,
  baseDomain,
  isWildcardMode,
  isDnsConfigured,
}: WildcardModeHintProps): JSX.Element | null {
  const showHint = Boolean(
    baseDomain && isDnsConfigured && !isWildcardMode && hasPerServiceDnsGaps(services)
  );

  if (!showHint || !baseDomain) return null;

  const hint = getHintCopy(baseDomain);

  return (
    <div className={`rounded border px-4 py-3 text-sm ${hint.className}`}>
      <div className={hint.titleClassName}>{hint.title}</div>
      <div className="mt-1 text-xs leading-relaxed text-[#8b949e]">{hint.body}</div>
    </div>
  );
}
