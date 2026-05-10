import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type ServiceRecord } from '../../lib/api';
import { TERMINAL_COLORS } from './theme';
import { Tooltip } from './tooltip';
import { SubdomainDialog } from './subdomain-dialog';
import { useI18n } from '../../hooks/use-i18n';

interface StatusBadgeProps {
  serviceId: string;
  isExposed: boolean;
  service: ServiceRecord;
  onProtocolChange: (protocol: 'https' | 'http' | null) => void;
  scanTrigger?: number;
  bulkStatus?: { online: boolean; protocol: string | null };
  isWildcardMode: boolean;
}

export function StatusBadge({
  serviceId,
  isExposed,
  service,
  onProtocolChange,
  scanTrigger,
  bulkStatus,
  isWildcardMode,
}: StatusBadgeProps): JSX.Element {
  const [liveStatus, setLiveStatus] = useState<'checking' | 'online' | 'offline' | null>(null);
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.services.sync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  useEffect(() => {
    if (!isExposed) {
      setLiveStatus(null);
      onProtocolChange(null);
      return;
    }

    if (bulkStatus) {
      const isOnline = bulkStatus.online;
      setLiveStatus(isOnline ? 'online' : 'offline');
      onProtocolChange(
        bulkStatus.protocol === 'https' || bulkStatus.protocol === 'http'
          ? bulkStatus.protocol
          : null
      );

      if (!isOnline && !service.configWarnings && !syncMutation.isPending) {
        syncMutation.mutate(serviceId);
      }
    } else {
      setLiveStatus('checking');
    }
  }, [
    serviceId,
    isExposed,
    onProtocolChange,
    scanTrigger,
    bulkStatus,
    service.configWarnings,
    syncMutation,
  ]);

  return (
    <div className="flex items-center gap-2">
      <StatusIndicator
        isExposed={isExposed}
        liveStatus={liveStatus}
        dnsExists={service.dnsExists}
        proxyExists={service.proxyExists}
        sslPending={service.sslPending}
      />
      <ServiceWarnings
        service={service}
        isExposed={isExposed}
        liveStatus={liveStatus}
        isWildcardMode={isWildcardMode}
      />
    </div>
  );
}

function ServiceWarnings({
  service,
  isExposed,
  liveStatus,
  isWildcardMode,
}: {
  service: ServiceRecord;
  isExposed: boolean;
  liveStatus: string | null;
  isWildcardMode: boolean;
}): JSX.Element {
  const { t } = useI18n();
  const warnings = parseWarnings(service.configWarnings);
  const showUnreachableReasons = isExposed && liveStatus === 'offline';
  const badges = buildWarningBadges(warnings, showUnreachableReasons, service, isWildcardMode, t);
  const exposureIcons = [
    service.exposureSource === 'discovered' && {
      type: 'discovered',
      msg: t('service_status.discovered_config'),
    },
    service.exposureSource === 'auto' && { type: 'auto', msg: t('service_status.auto_exposed') },
  ].filter(Boolean) as Array<{ type: string; msg: string }>;

  return (
    <>
      {badges.map((w, i) => w.show && <WarningBadge key={i} type={w.type} message={w.msg} />)}
      <MigrateSubdomainButton service={service} warnings={warnings} />
      <PartialExposureButtons
        service={service}
        showUnreachableReasons={showUnreachableReasons}
        isWildcardMode={isWildcardMode}
      />
      {exposureIcons.map((ic, i) => (
        <ExposureIcon key={i} type={ic.type} message={ic.msg} />
      ))}
    </>
  );
}

function MigrateSubdomainButton({
  service,
  warnings,
}: {
  service: ServiceRecord;
  warnings: ReturnType<typeof parseWarnings>;
}): JSX.Element | null {
  const { t } = useI18n();
  const [showDialog, setShowDialog] = useState(false);

  if (!warnings.subdomain_mismatch) return null;

  return (
    <>
      <Tooltip content={t('service_status.resolve_conflict')}>
        <button
          onClick={() => setShowDialog(true)}
          className="px-2 py-0.5 text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-700/50 rounded hover:bg-yellow-900/50"
        >
          {t('service_status.resolve')}
        </button>
      </Tooltip>
      {showDialog && <SubdomainDialog service={service} onClose={() => setShowDialog(false)} />}
    </>
  );
}

function PartialExposureButtons({
  service,
  isWildcardMode,
}: {
  service: ServiceRecord;
  showUnreachableReasons: boolean;
  isWildcardMode: boolean;
}): JSX.Element | null {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const dnsOnlyMutation = useMutation({
    mutationFn: (id: string) => api.services.exposeDnsOnly(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const proxyOnlyMutation = useMutation({
    mutationFn: (id: string) => api.services.exposeProxyOnly(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const hasMismatch = service.dnsExists !== service.proxyExists;
  const showDnsButton = !isWildcardMode && hasMismatch && service.proxyExists && !service.dnsExists;
  const showProxyButton = hasMismatch && service.dnsExists && !service.proxyExists;

  if (!showDnsButton && !showProxyButton) return null;

  return (
    <>
      {showDnsButton && (
        <PartialButton
          onClick={() => dnsOnlyMutation.mutate(service.id)}
          isPending={dnsOnlyMutation.isPending}
          label={t('service_status.create_dns')}
          title={t('service_status.create_dns_record')}
        />
      )}
      {showProxyButton && (
        <PartialButton
          onClick={() => proxyOnlyMutation.mutate(service.id)}
          isPending={proxyOnlyMutation.isPending}
          label={t('service_status.create_proxy')}
          title={t('service_status.create_proxy_host')}
        />
      )}
    </>
  );
}

function PartialButton({
  onClick,
  isPending,
  label,
  title,
}: {
  onClick: () => void;
  isPending: boolean;
  label: string;
  title: string;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <Tooltip content={title}>
      <button
        onClick={onClick}
        disabled={isPending}
        className="px-2 py-0.5 text-xs bg-red-900/30 text-red-400 border border-red-700/50 rounded hover:bg-red-900/50 disabled:opacity-50"
      >
        {isPending ? t('common.creating') : label}
      </button>
    </Tooltip>
  );
}

function calculatePropagationState(service: ServiceRecord): {
  isPropagating: boolean;
  hideUnreachable: boolean;
} {
  const recentlyExposed = service.updatedAt
    ? Date.now() - new Date(service.updatedAt).getTime() < 30000
    : false;
  const isUnreachable = service.reachabilityStatus === 'unreachable';
  const isPropagating =
    Boolean(service.enabled) && recentlyExposed && !service.lastReachabilityCheck && isUnreachable;
  return { isPropagating, hideUnreachable: isPropagating };
}

function isLocalDnsLag(service: ServiceRecord, showUnreachableReasons: boolean): boolean {
  if (!showUnreachableReasons) return false;
  const properlyConfigured =
    Boolean(service.enabled) &&
    service.dnsExists === true &&
    service.proxyExists === true &&
    (!service.configWarnings || service.configWarnings === '[]');
  const isUnreachable = service.reachabilityStatus === 'unreachable';
  const recentlyConfigured = service.updatedAt
    ? Date.now() - new Date(service.updatedAt).getTime() < 300000
    : false;
  const { isPropagating } = calculatePropagationState(service);
  return properlyConfigured && isUnreachable && recentlyConfigured && !isPropagating;
}

function showDnsMissingBadge(service: ServiceRecord, isWildcardMode: boolean): boolean {
  if (isWildcardMode) return false;
  const hasMismatch = service.dnsExists !== service.proxyExists;
  return hasMismatch && service.dnsExists === false && service.proxyExists === true;
}

function buildWarningBadges(
  warnings: ReturnType<typeof parseWarnings>,
  showUnreachableReasons: boolean,
  service: ServiceRecord,
  isWildcardMode: boolean,
  t: any
): Array<{ show: boolean; type: string; msg: string }> {
  const hasMismatch = service.dnsExists !== service.proxyExists;
  const { isPropagating, hideUnreachable } = calculatePropagationState(service);
  const shouldHide = hideUnreachable && showUnreachableReasons;
  const localDnsLag = isLocalDnsLag(service, showUnreachableReasons);
  const showUnknown = showUnreachableReasons && !shouldHide;

  return [
    { show: isPropagating, type: t('service_status.propagating'), msg: t('service_status.dns_propagating_wait') },
    {
      show: localDnsLag,
      type: t('service_status.local_dns'),
      msg: t('service_status.may_work_externally'),
    },
    { show: showDnsMissingBadge(service, isWildcardMode), type: 'DNS', msg: t('service_status.dns_missing') },
    {
      show: hasMismatch && service.proxyExists === false && service.dnsExists === true,
      type: 'Proxy',
      msg: t('service_status.proxy_missing'),
    },
    { show: showUnknown && service.dnsExists === null, type: 'DNS?', msg: t('service_status.dns_unknown') },
    {
      show: showUnknown && service.proxyExists === null,
      type: 'Proxy?',
      msg: t('service_status.proxy_unknown'),
    },
    { show: warnings.port_mismatch, type: 'Port', msg: t('service_status.port_mismatch') },
    { show: warnings.scheme_mismatch, type: 'Scheme', msg: t('service_status.scheme_mismatch') },
    { show: warnings.ip_mismatch, type: 'IP', msg: t('service_status.ip_mismatch') },
    {
      show: warnings.subdomain_mismatch,
      type: 'Subdomain',
      msg: t('service_status.subdomain_mismatch', { exposed: service.exposedSubdomain, label: service.subdomain }),
    },
  ];
}

function StatusIndicator({
  isExposed,
  liveStatus,
  sslPending,
}: {
  isExposed: boolean;
  liveStatus: string | null;
  dnsExists: boolean | null;
  proxyExists: boolean | null;
  sslPending: boolean | null;
}): JSX.Element {
  const { t } = useI18n();
  const getStatus = (): { tip: string; color: string; label: string } => {
    if (!isExposed)
      return {
        tip: t('service_status.not_exposed'),
        color: TERMINAL_COLORS.textMuted,
        label: `\u25CB ${t('service_status.offline_label')}`,
      };
    if (liveStatus === 'checking')
      return { tip: t('service_status.checking'), color: TERMINAL_COLORS.warning, label: `\u25CF ${t('service_status.checking_label')}` };
    if (liveStatus === 'online' && sslPending)
      return {
        tip: t('service_status.http_only_tip'),
        color: TERMINAL_COLORS.warning,
        label: `\u25CF ${t('service_status.http_only_label')}`,
      };
    if (liveStatus === 'online')
      return { tip: t('service_status.domain_reachable'), color: TERMINAL_COLORS.success, label: `\u25CF ${t('service_status.online_label')}` };
    return {
      tip: t('service_status.domain_not_reachable'),
      color: TERMINAL_COLORS.error,
      label: `\u25CF ${t('service_status.unreachable_label')}`,
    };
  };

  const { tip, color, label } = getStatus();
  return (
    <Tooltip content={tip}>
      <span
        className="rounded px-2 py-0.5 text-xs font-medium"
        style={{ background: `${color}20`, color }}
      >
        {label}
      </span>
    </Tooltip>
  );
}

function WarningBadge({ type, message }: { type: string; message: string }): JSX.Element {
  const isError = type === 'DNS' || type === 'Proxy';
  const color = isError ? TERMINAL_COLORS.error : TERMINAL_COLORS.warning;
  return (
    <Tooltip content={message}>
      <span
        className="rounded px-2 py-0.5 text-xs font-medium"
        style={{ background: `${color}20`, color }}
      >
        {type}
      </span>
    </Tooltip>
  );
}

function ExposureIcon({ type, message }: { type: string; message: string }): JSX.Element {
  const icon = type === 'discovered' ? '\u2315' : '\u26A1\uFE0E';
  return (
    <Tooltip content={message}>
      <span className="text-sm">{icon}</span>
    </Tooltip>
  );
}

function parseWarnings(configWarnings: string | null): Record<string, boolean> {
  if (!configWarnings) return {};
  try {
    const parsed = JSON.parse(configWarnings);
    if (!Array.isArray(parsed)) return {};
    return Object.fromEntries(parsed.map((w: string) => [w, true]));
  } catch {
    return {};
  }
}
