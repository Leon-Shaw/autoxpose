import { useState } from 'react';
import { TERMINAL_COLORS } from './theme';
import { Tooltip } from './tooltip';
import { TrafficLightButton } from './traffic-light';
import { TopologyPanel } from './topology-panel';
import { LanguageSwitcher } from './language-switcher';
import { usePlatform } from '../../hooks/use-platform';
import { useTagPreferences } from '../../hooks/use-tag-preferences';
import { useI18n } from '../../hooks/use-i18n';
import { Logo } from '../logo';

interface ServiceItem {
  id: string;
  name: string;
  subdomain: string;
  enabled: boolean;
}

interface TerminalHeaderProps {
  serviceCount: number;
  exposedCount: number;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  serverName?: string;
  onExposeAll: () => void;
  onUnexposeAll: () => void;
  onScan: () => void;
  isScanning?: boolean;
  canExpose: boolean;
  dnsProvider?: string | null;
  proxyProvider?: string | null;
  services?: ServiceItem[];
  dnsConfigured?: boolean;
  proxyConfigured?: boolean;
  onHelp: () => void;
  platformName?: string | null;
}

function getStatusInfo(status: TerminalHeaderProps['connectionStatus'], t: (key: string) => string): [string, string] {
  if (status === 'connected') return [TERMINAL_COLORS.success, t('common.connected')];
  if (status === 'connecting') return [TERMINAL_COLORS.warning, t('common.connecting')];
  return [TERMINAL_COLORS.error, t('common.disconnected')];
}

interface TrafficLightsProps {
  onUnexposeAll: () => void;
  onScan: () => void;
  onExposeAll: () => void;
  exposedCount: number;
  serviceCount: number;
  isScanning?: boolean;
  canExpose: boolean;
}

function TrafficLights(p: TrafficLightsProps): JSX.Element {
  const { modKey, altKey } = usePlatform();
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <TrafficLightButton
        color="red"
        tooltip={t('header.unexpose_all')}
        shortcut={`${modKey}+${altKey}+U`}
        onClick={p.onUnexposeAll}
        disabled={p.exposedCount === 0}
      />
      <TrafficLightButton
        color="yellow"
        tooltip={t('header.scan_containers')}
        shortcut={`${modKey}+${altKey}+S`}
        onClick={p.onScan}
        disabled={p.isScanning}
      />
      <TrafficLightButton
        color="green"
        tooltip={t('header.expose_all')}
        shortcut={`${modKey}+${altKey}+E`}
        onClick={p.onExposeAll}
        disabled={p.serviceCount === 0 || p.exposedCount === p.serviceCount || !p.canExpose}
      />
    </div>
  );
}

function ServerStatus({
  statusColor,
  statusText,
  serverName,
  pulseClass,
}: {
  statusColor: string;
  statusText: string;
  serverName: string;
  pulseClass: string;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <Tooltip content={t('common.connected_to', { status: statusText, server: serverName })}>
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`inline-block h-2 w-2 rounded-full ${pulseClass}`}
          style={{ backgroundColor: statusColor }}
        />
        <span className="text-[#8b949e]">{serverName}</span>
      </div>
    </Tooltip>
  );
}

export function TerminalHeader(props: TerminalHeaderProps): JSX.Element {
  const { t } = useI18n();
  const {
    serviceCount,
    exposedCount,
    connectionStatus,
    serverName = 'localhost',
    services = [],
    dnsProvider,
    proxyProvider,
    dnsConfigured = false,
    proxyConfigured = false,
  } = props;
  const [statusColor, statusText] = getStatusInfo(connectionStatus, t);
  const svcLabel = serviceCount === 1 ? t('common.service') : t('common.services');
  const [topologyOpen, setTopologyOpen] = useState(false);
  const pulseClass = connectionStatus === 'connected' ? 'animate-pulse' : '';
  const handleLogoClick = (): void => {
    window.location.href = '/';
  };

  return (
    <div className="relative flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-4 py-2">
      <HeaderLeftSection
        {...props}
        serviceCount={serviceCount}
        svcLabel={svcLabel}
        exposedCount={exposedCount}
        topologyOpen={topologyOpen}
        onTopologyToggle={() => setTopologyOpen(!topologyOpen)}
        onLogoClick={handleLogoClick}
      />
      <ServerStatus
        statusColor={statusColor}
        statusText={statusText}
        serverName={serverName}
        pulseClass={pulseClass}
      />

      <TopologyPanel
        isOpen={topologyOpen}
        onClose={() => setTopologyOpen(false)}
        dnsProvider={dnsProvider}
        proxyProvider={proxyProvider}
        services={services}
        dnsConfigured={dnsConfigured}
        proxyConfigured={proxyConfigured}
        platformName={props.platformName}
      />
    </div>
  );
}

interface HeaderLeftSectionProps extends TerminalHeaderProps {
  serviceCount: number;
  svcLabel: string;
  exposedCount: number;
  topologyOpen: boolean;
  onTopologyToggle: () => void;
  onLogoClick: () => void;
}

function HeaderLeftSection(props: HeaderLeftSectionProps): JSX.Element {
  const { showTags, setShowTags } = useTagPreferences();
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={props.onLogoClick}
        className="group flex items-center focus:outline-none"
      >
        <Logo
          size={36}
          isAnimating={props.isScanning}
          className="text-white transition-all duration-300 group-hover:rotate-[15deg] group-hover:text-[#58a6ff]"
        />
      </button>
      <LanguageSwitcher />
      <TrafficLights
        onUnexposeAll={props.onUnexposeAll}
        onScan={props.onScan}
        onExposeAll={props.onExposeAll}
        exposedCount={props.exposedCount}
        serviceCount={props.serviceCount}
        isScanning={props.isScanning}
        canExpose={props.canExpose}
      />
      <span className="text-xs text-[#8b949e]">
        {props.serviceCount} {props.svcLabel} | {props.exposedCount} {t('common.exposed')}
      </span>
      <Tooltip content={t('header.network_topology')}>
        <button
          type="button"
          onClick={props.onTopologyToggle}
          className={`ml-2 rounded border px-2 py-1 text-xs transition-colors ${
            props.topologyOpen
              ? 'border-[#58a6ff] bg-[#388bfd1a] text-[#58a6ff]'
              : 'border-[#30363d] bg-[#21262d] text-[#8b949e] hover:border-[#58a6ff] hover:bg-[#30363d] hover:text-[#c9d1d9]'
          }`}
        >
          ∴
        </button>
      </Tooltip>
      <Tooltip content={showTags ? t('header.hide_tags') : t('header.show_tags')}>
        <button
          type="button"
          onClick={() => setShowTags(!showTags)}
          className={`rounded border px-2 py-1 text-xs transition-colors ${
            showTags
              ? 'border-[#58a6ff] bg-[#388bfd1a] text-[#58a6ff]'
              : 'border-[#30363d] bg-[#21262d] text-[#8b949e] hover:border-[#58a6ff] hover:bg-[#30363d] hover:text-[#c9d1d9]'
          }`}
        >
          #
        </button>
      </Tooltip>
    </div>
  );
}
