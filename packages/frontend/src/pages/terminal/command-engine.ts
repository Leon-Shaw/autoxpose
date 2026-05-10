import { api, type ServiceRecord, type SettingsStatus } from '../../lib/api';
import { getLuckyLine } from './command-lucky';
import { resolveService } from './command-utils';
import i18n from '../../i18n';

const t = i18n.t.bind(i18n);

export type CommandTone = 'info' | 'success' | 'error' | 'muted';

export type OutputLine = { text: string; tone: CommandTone };

export type CommandResult = {
  lines: OutputLine[];
  clearOutput?: boolean;
  openSettings?: boolean;
  exposeServiceId?: string;
  unexposeServiceId?: string;
  openUrl?: string;
  scan?: boolean;
};

export type CommandContext = { services: ServiceRecord[]; settings: SettingsStatus | undefined };

export type CommandSuggestion = { id: string; label: string; value: string };

export const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export function toneColor(tone: CommandTone): string {
  if (tone === 'success') return '#3fb950';
  if (tone === 'error') return '#f85149';
  if (tone === 'muted') return '#8b949e';
  return '#58a6ff';
}

type ParsedCommand = { name: string; arg: string };
type HandlerMap = Record<
  string,
  (arg: string, ctx: CommandContext) => CommandResult | Promise<CommandResult>
>;

const SIMPLE_HANDLERS: HandlerMap = {
  help: (arg: string): CommandResult => helpResult(arg),
  list: (_arg: string, ctx: CommandContext): CommandResult => ({ lines: listLines(ctx.services) }),
  status: (_arg: string, ctx: CommandContext): CommandResult => ({
    lines: [statusLine(ctx.services, ctx.settings)],
  }),
  config: (): CommandResult => ({
    lines: [{ text: t('command.opening_settings'), tone: 'info' }],
    openSettings: true,
  }),
  clear: (): CommandResult => ({ lines: [], clearOutput: true }),
  iamfeelinglucky: (): CommandResult => ({ lines: [{ text: getLuckyLine(), tone: 'info' }] }),
};

export async function executeCommand(raw: string, ctx: CommandContext): Promise<CommandResult> {
  const parsed = parseCommand(raw);
  if (!parsed) return { lines: [] };
  const simple = SIMPLE_HANDLERS[parsed.name];
  if (simple) {
    const out = simple(parsed.arg, ctx);
    return out instanceof Promise ? await out : out;
  }
  if (parsed.name === 'expose' || parsed.name === 'unexpose')
    return exposeResult(parsed.name, parsed.arg, ctx.services);
  if (parsed.name === 'test') return testResult(parsed.arg);
  if (parsed.name === 'open') return openResult(parsed.arg, ctx.services, ctx.settings);
  if (parsed.name === 'scan') return scanResult();
  if (parsed.name === 'wildcard') return wildcardResult(parsed.arg, ctx.settings);
  return { lines: [{ text: t('command.unknown_command'), tone: 'error' }] };
}

function parseCommand(raw: string): ParsedCommand | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const [cmd, ...rest] = trimmed.split(' ');
  return { name: cmd.toLowerCase(), arg: rest.join(' ').trim() };
}

function helpResult(arg: string): CommandResult {
  const entries: { cmd: string; desc: string }[] = [
    { cmd: 'help', desc: t('command.help_help') },
    { cmd: 'list', desc: t('command.help_list') },
    { cmd: 'status', desc: t('command.help_status') },
    { cmd: 'expose', desc: t('command.help_expose') },
    { cmd: 'unexpose', desc: t('command.help_unexpose') },
    { cmd: 'test', desc: t('command.help_test') },
    { cmd: 'open', desc: t('command.help_open') },
    { cmd: 'config', desc: t('command.help_config') },
    { cmd: 'clear', desc: t('command.help_clear') },
    { cmd: 'iamfeelinglucky', desc: t('command.help_lucky') },
    { cmd: 'scan', desc: t('command.help_scan') },
    { cmd: 'wildcard', desc: t('command.help_wildcard') },
  ];
  const key = arg.trim().toLowerCase();
  if (!key) {
    const lines: OutputLine[] = [{ text: t('command.commands_label'), tone: 'info' }];
    return {
      lines: [
        ...lines,
        ...entries.map(entry => ({
          text: `${entry.cmd.padEnd(14, ' ')} - ${entry.desc}`,
          tone: 'muted' as const,
        })),
      ],
    };
  }
  const match = entries.find(e => e.cmd === key);
  if (!match) return { lines: [{ text: t('command.unknown_help'), tone: 'error' }] };
  return { lines: [{ text: match.desc, tone: 'info' }] };
}

function listLines(services: ServiceRecord[]): OutputLine[] {
  if (services.length === 0) {
    return [{ text: t('command.no_services_found'), tone: 'muted' }];
  }
  return services.map((svc, idx) => {
    const status = svc.enabled ? 'exposed' : 'hidden';
    return {
      text: `${idx + 1}. ${svc.name} | ${svc.subdomain || 'no-domain'} | ${status}`,
      tone: 'info',
    };
  });
}

function statusLine(services: ServiceRecord[], settings: SettingsStatus | undefined): OutputLine {
  const isWildcard = settings?.wildcard?.enabled ?? false;
  const dnsOk = isWildcard ? 'wildcard' : settings?.dns?.configured ? 'ok' : 'missing';
  const proxyOk = settings?.proxy?.configured ? 'ok' : 'missing';
  const count = `${services.filter(s => s.enabled).length}/${services.length} exposed`;
  const warnings: string[] = [];
  const serverState = settings?.network?.serverIpState;
  const lanState = settings?.network?.lanIpState;
  if (serverState && !['valid', 'mismatch'].includes(serverState)) warnings.push('server ip issue');
  if (lanState && !['valid', 'bridge-autodetected', 'mismatch'].includes(lanState))
    warnings.push('lan ip issue');
  const warnText = warnings.length > 0 ? ` | warnings: ${warnings.join(', ')}` : '';
  return {
    text: `DNS: ${dnsOk} | Proxy: ${proxyOk} | Services: ${count}${warnText}`,
    tone: 'info',
  };
}

function exposeResult(name: string, arg: string, services: ServiceRecord[]): CommandResult {
  const svc = resolveService(arg, services);
  if (!svc)
    return { lines: [{ text: t('command.service_not_found'), tone: 'error' }] };
  if (name === 'expose' && svc.enabled) {
    return { lines: [{ text: t('command.already_exposed', { name: svc.name }), tone: 'muted' }] };
  }
  if (name === 'unexpose' && !svc.enabled) {
    return { lines: [{ text: t('command.not_exposed', { name: svc.name }), tone: 'muted' }] };
  }
  const actionKey = name === 'expose' ? 'command.exposing' : 'command.unexposing';
  const lines: OutputLine[] = [
    { text: t(actionKey, { name: svc.name, subdomain: svc.subdomain }), tone: 'info' },
  ];
  return name === 'expose'
    ? { lines, exposeServiceId: svc.id }
    : { lines, unexposeServiceId: svc.id };
}

async function testResult(arg: string): Promise<CommandResult> {
  if (arg !== 'dns' && arg !== 'proxy') {
    return { lines: [{ text: t('command.test_usage'), tone: 'error' }] };
  }
  try {
    const fn = arg === 'dns' ? api.settings.testDns : api.settings.testProxy;
    const res = await fn();
    if (res.ok) return { lines: [{ text: t('command.test_passed', { target: arg }), tone: 'success' }] };
    return {
      lines: [{ text: t('command.test_failed', { target: arg, error: res.error || 'unknown error' }), tone: 'error' }],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : t('command.request_failed');
    return { lines: [{ text: t('command.test_failed', { target: arg, error: msg }), tone: 'error' }] };
  }
}

function openResult(
  arg: string,
  services: ServiceRecord[],
  settings: SettingsStatus | undefined
): CommandResult {
  const svc = resolveService(arg, services);
  if (!svc) return { lines: [{ text: t('command.service_not_found'), tone: 'error' }] };
  if (!svc.enabled)
    return { lines: [{ text: t('command.service_not_exposed'), tone: 'error' }] };
  const url = buildUrl(svc, settings);
  if (!url) return { lines: [{ text: t('command.no_domain_found'), tone: 'error' }] };
  return { lines: [{ text: t('command.open_url', { url }), tone: 'info' }], openUrl: url };
}

function scanResult(): CommandResult {
  return {
    lines: [
      { text: t('command.scanning'), tone: 'info' },
      { text: t('command.scan_started'), tone: 'muted' },
    ],
    scan: true,
  };
}

function buildUrl(service: ServiceRecord, settings: SettingsStatus | undefined): string | null {
  const base = service.subdomain || '';
  if (!base) return null;
  const baseDomain =
    settings?.wildcard?.enabled && settings?.wildcard?.domain
      ? settings.wildcard.domain
      : settings?.dns?.domain;
  const domain = base.includes('.') || !baseDomain ? base : `${base}.${baseDomain}`;
  return domain.startsWith('http') ? domain : `https://${domain}`;
}

function wildcardStatusResult(settings: SettingsStatus | undefined): CommandResult {
  const enabled = settings?.wildcard?.enabled ?? false;
  const domain = settings?.wildcard?.domain;
  const hasCert = settings?.wildcard?.certId !== null && settings?.wildcard?.certId !== undefined;

  if (!enabled) {
    return { lines: [{ text: t('command.wildcard_disabled'), tone: 'muted' }] };
  }

  const certStatus = hasCert ? t('command.wildcard_cert_linked') : t('command.wildcard_cert_not_detected');
  return {
    lines: [
      { text: t('command.wildcard_enabled'), tone: 'success' },
      { text: t('command.wildcard_domain', { domain }), tone: 'info' },
      { text: certStatus, tone: hasCert ? 'info' : 'muted' },
    ],
  };
}

async function wildcardEnableResult(domain: string | undefined): Promise<CommandResult> {
  if (!domain) {
    return { lines: [{ text: t('command.wildcard_enable_usage'), tone: 'error' }] };
  }
  try {
    await api.settings.saveWildcard(true, domain);
    return {
      lines: [
        { text: t('command.wildcard_enabled_for', { domain }), tone: 'success' },
        { text: t('command.dns_skipped_new'), tone: 'muted' },
      ],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : t('command.failed_enable_wildcard');
    return { lines: [{ text: msg, tone: 'error' }] };
  }
}

async function wildcardDisableResult(): Promise<CommandResult> {
  try {
    await api.settings.saveWildcard(false, '');
    return {
      lines: [
        { text: t('command.wildcard_disabled_dns_per_service'), tone: 'success' },
      ],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : t('command.failed_disable_wildcard');
    return { lines: [{ text: msg, tone: 'error' }] };
  }
}

async function wildcardResult(
  arg: string,
  settings: SettingsStatus | undefined
): Promise<CommandResult> {
  const parts = arg.trim().split(' ');
  const subcommand = parts[0]?.toLowerCase() || 'status';

  if (subcommand === 'status') return wildcardStatusResult(settings);
  if (subcommand === 'enable') return wildcardEnableResult(parts[1]);
  if (subcommand === 'disable') return wildcardDisableResult();

  return { lines: [{ text: t('command.wildcard_usage'), tone: 'error' }] };
}
