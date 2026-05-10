import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, type WildcardConfig, type WildcardDetection } from '../../../lib/api';
import { wildcardDetectionMatchesDomain } from '../../../lib/wildcard-domain';
import { FormInput } from '../form-components';
import { TERMINAL_COLORS } from '../theme';
import { useI18n } from '../../../hooks/use-i18n';

interface DnsHeaderProps {
  isConfigured: boolean;
  isEditing: boolean;
  isWildcardMode: boolean;
  onEdit: () => void;
}

export function DnsHeader({
  isConfigured,
  isEditing,
  isWildcardMode,
  onEdit,
}: DnsHeaderProps): JSX.Element {
  const { t } = useI18n();
  const title = isWildcardMode ? t('wildcard.wildcard_mode') : t('wildcard.dns_provider');
  const badgeText = isWildcardMode ? t('settings.wildcard') : t('settings.configured');

  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#c9d1d9]">{title}</span>
        {(isConfigured || isWildcardMode) && (
          <span
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{ background: `${TERMINAL_COLORS.success}20`, color: TERMINAL_COLORS.success }}
          >
            {badgeText}
          </span>
        )}
      </div>
      {isConfigured && !isEditing && !isWildcardMode && (
        <button onClick={onEdit} className="text-xs text-[#58a6ff] hover:underline">
          {t('settings.edit')}
        </button>
      )}
    </div>
  );
}

export function DnsDisabledState(): JSX.Element {
  const { t } = useI18n();
  return (
    <div className="rounded border border-[#30363d] bg-[#161b22] p-4 opacity-50">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-medium text-[#c9d1d9]">{t('wildcard.dns_provider')}</span>
        <span className="rounded bg-[#30363d] px-1.5 py-0.5 text-[10px] text-[#8b949e]">
          {t('settings.step_2')}
        </span>
      </div>
      <div className="flex items-center justify-center py-6 text-center">
        <p className="text-xs text-[#8b949e]">{t('settings.configure_proxy_first')}</p>
      </div>
    </div>
  );
}

interface WildcardModeDisplayProps {
  wildcardConfig?: WildcardConfig | null;
  wildcardDetection?: WildcardDetection | null;
}

export function WildcardModeDisplay({
  wildcardConfig,
  wildcardDetection,
}: WildcardModeDisplayProps): JSX.Element {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const domain = wildcardConfig?.domain || wildcardDetection?.domain || 'unknown';
  const hasCert = wildcardConfig?.certId !== null && wildcardConfig?.certId !== undefined;

  const disableMutation = useMutation({
    mutationFn: () => api.settings.saveWildcard(false, ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['wildcard-detection'] });
    },
  });

  const addCertNote = t('wildcard.add_ssl_cert_note').replace('{domain}', domain);

  return (
    <div className="rounded border border-[#30363d] bg-[#161b22] p-4">
      <DnsHeader isConfigured={false} isEditing={false} isWildcardMode={true} onEdit={() => {}} />
      <div className="space-y-2 text-xs text-[#8b949e]">
        <p className="font-mono text-[#58a6ff]">*.{domain}</p>
        <p>
          <span className="text-[#484f58]">DNS:</span> {t('wildcard.dns_skipped')}
        </p>
        <p>
          <span className="text-[#484f58]">SSL:</span>{' '}
          {hasCert ? t('wildcard.wildcard_cert_linked') : t('wildcard.no_cert_detected')}
        </p>
        {!hasCert && (
          <p className="mt-2 rounded border border-[#f0883e50] bg-[#f0883e15] px-2 py-1.5 text-[#f0883e]">
            {addCertNote}
          </p>
        )}
        <button
          onClick={() => disableMutation.mutate()}
          disabled={disableMutation.isPending}
          className="mt-2 text-[#58a6ff] hover:underline disabled:opacity-50"
        >
          {disableMutation.isPending ? t('wildcard.switching') : t('wildcard.switch_to_dns_mode')}
        </button>
      </div>
    </div>
  );
}

interface WildcardChoiceSectionProps {
  wildcardDetection?: WildcardDetection | null;
  currentDomain?: string | null;
  isConfigured: boolean;
}

interface WildcardChoiceCopy {
  intro: JSX.Element;
  mismatchNote: JSX.Element | null;
  showDomainInput: boolean;
}

function shouldShowWildcardChoice(
  wildcardDetection?: WildcardDetection | null,
  currentDomain?: string | null,
  isConfigured?: boolean
): boolean {
  return Boolean(wildcardDetection?.detected || currentDomain || isConfigured);
}

function wildcardIntro(copy: WildcardChoiceCopy): JSX.Element {
  return copy.intro;
}

function wildcardActionLabel(isPending: boolean, isConfigured: boolean, t: (key: string) => string): string {
  if (isPending) return t('wildcard.switching');
  return isConfigured ? t('wildcard.enable_wildcard') : t('wildcard.use_wildcard');
}

function getWildcardChoiceCopy(
  wildcardDetection: WildcardDetection | null | undefined,
  currentDomain: string | null | undefined,
  isConfigured: boolean,
  matchesCurrentDomain: boolean,
  t: (key: string) => string
): WildcardChoiceCopy {
  if (matchesCurrentDomain) {
    return {
      intro: (
        <>
          {t('wildcard.wildcard_ready')}: <span className="font-mono">{wildcardDetection?.fullDomain}</span>
        </>
      ),
      mismatchNote: null,
      showDomainInput: false,
    };
  }

  if (wildcardDetection?.detected && currentDomain) {
    return {
      intro: (
        <>
          {t('wildcard.npm_wildcard')}: <span className="font-mono">*.{wildcardDetection.domain}</span>
        </>
      ),
      mismatchNote: (
        <>
          {t('wildcard.switch_to_wildcard')} <span className="font-mono">*.{currentDomain}</span>
        </>
      ),
      showDomainInput: false,
    };
  }

  return {
    intro: isConfigured ? (
      <>{t('wildcard.switch_to_wildcard')}</>
    ) : (
      <>{t('wildcard.use_wildcard_instead')}</>
    ),
    mismatchNote: null,
    showDomainInput: !currentDomain,
  };
}

export function WildcardChoiceSection({
  wildcardDetection,
  currentDomain,
  isConfigured,
}: WildcardChoiceSectionProps): JSX.Element | null {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const preferredDomain = currentDomain || wildcardDetection?.domain || '';
  const [domain, setDomain] = useState(preferredDomain);
  const matchesCurrentDomain = wildcardDetectionMatchesDomain(
    wildcardDetection?.domain,
    currentDomain
  );
  const choiceCopy = getWildcardChoiceCopy(
    wildcardDetection,
    currentDomain,
    isConfigured,
    matchesCurrentDomain,
    t
  );

  useEffect(() => {
    setDomain(preferredDomain);
  }, [preferredDomain]);

  const enableMutation = useMutation({
    mutationFn: () => api.settings.saveWildcard(true, domain.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['wildcard-detection'] });
    },
  });

  const hasDomain = domain.trim().length > 0;

  if (!shouldShowWildcardChoice(wildcardDetection, currentDomain, isConfigured)) return null;

  const wildcardUsesInstead = t('wildcard.wildcard_uses_instead').replace('{domain}', domain || 'domain.com');

  return (
    <div className="mb-4 rounded border border-[#238636] bg-[#23863615] p-3">
      <p className="mb-2 text-xs text-[#3fb950]">{wildcardIntro(choiceCopy)}</p>
      {choiceCopy.mismatchNote && (
        <p className="mb-3 text-xs text-[#8b949e]">{choiceCopy.mismatchNote}</p>
      )}
      {choiceCopy.showDomainInput && (
        <div className="mb-3">
          <FormInput
            label={t('settings.wildcard_domain')}
            placeholder="example.com"
            value={domain}
            onChange={setDomain}
          />
        </div>
      )}
      <p className="mb-2 text-xs text-[#8b949e]">
        {wildcardUsesInstead}
      </p>
      <button
        onClick={() => enableMutation.mutate()}
        disabled={enableMutation.isPending || !hasDomain}
        className="text-xs text-[#58a6ff] hover:underline disabled:opacity-50"
      >
        {wildcardActionLabel(enableMutation.isPending, isConfigured, t)}
      </button>
    </div>
  );
}
