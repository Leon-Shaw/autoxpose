import { useMemo } from 'react';
import { type IpState } from '../../lib/api';
import { useI18n } from '../../hooks/use-i18n';

export type IpMsg = {
  text: string;
  dismissible: boolean;
  severity: 'error' | 'warning' | 'info';
};

function getServerIpMessage(state: IpState, ip: string, detected: string | null, t: any): IpMsg {
  const msgs: Record<IpState, IpMsg> = {
    missing: {
      text: t('ip.server_ip_localhost'),
      dismissible: false,
      severity: 'error',
    },
    invalid: { text: t('ip.server_ip_invalid', { ip }), dismissible: false, severity: 'error' },
    placeholder: {
      text: t('ip.server_ip_placeholder', { ip }),
      dismissible: false,
      severity: 'error',
    },
    valid: { text: '', dismissible: false, severity: 'info' },
    'bridge-autodetected': { text: '', dismissible: false, severity: 'info' },
    mismatch: {
      text: detected ? t('ip.server_ip_mismatch', { ip, detected }) : '',
      dismissible: true,
      severity: 'warning',
    },
  };
  return msgs[state];
}

function getLanIpMessage(state: IpState, ip: string, t: any): IpMsg {
  const msgs: Record<IpState, IpMsg> = {
    missing: { text: '', dismissible: false, severity: 'info' },
    invalid: { text: t('ip.lan_ip_invalid', { ip }), dismissible: false, severity: 'error' },
    placeholder: {
      text: t('ip.lan_ip_placeholder', { ip }),
      dismissible: false,
      severity: 'error',
    },
    valid: { text: '', dismissible: false, severity: 'info' },
    'bridge-autodetected': {
      text: t('ip.lan_ip_autodetected', { ip }),
      dismissible: true,
      severity: 'info',
    },
    mismatch: { text: '', dismissible: false, severity: 'info' },
  };
  return msgs[state];
}

function buildIpMessages(p: {
  srv: IpState | undefined;
  lan: IpState | undefined;
  srvIp: string;
  lanIp: string;
  det: string | null;
  proxyCfg: boolean;
  dis: Set<string>;
  t: any;
}): Array<IpMsg & { key: string }> {
  const res: Array<IpMsg & { key: string }> = [];

  if (p.srv && p.srv !== 'valid') {
    const k = `server:${p.srv}:${p.srvIp}`;
    if (!p.dis.has(k)) {
      const m = getServerIpMessage(p.srv, p.srvIp, p.det, p.t);
      if (m.text) res.push({ ...m, key: k });
    }
  }

  if (p.lan && p.lan !== 'valid' && p.proxyCfg) {
    const k = `lan:${p.lan}:${p.lanIp}`;
    if (!p.dis.has(k)) {
      const m = getLanIpMessage(p.lan, p.lanIp, p.t);
      if (m.text) res.push({ ...m, key: k });
    }
  }

  return res;
}

export function useIpMessages(params: {
  serverIpState: IpState | undefined;
  lanIpState: IpState | undefined;
  serverIp: string | undefined;
  lanIp: string | undefined;
  detectedIp: string | null | undefined;
  proxyConfigured: boolean;
  dismissed: Set<string>;
}): Array<IpMsg & { key: string }> {
  const { t } = useI18n();
  const { serverIpState, lanIpState, serverIp, lanIp, detectedIp, proxyConfigured, dismissed } =
    params;
  return useMemo(
    () =>
      buildIpMessages({
        srv: serverIpState,
        lan: lanIpState,
        srvIp: serverIp || '',
        lanIp: lanIp || '',
        det: detectedIp || null,
        proxyCfg: proxyConfigured,
        dis: dismissed,
        t,
      }),
    [serverIpState, lanIpState, serverIp, lanIp, detectedIp, proxyConfigured, dismissed, t]
  );
}
