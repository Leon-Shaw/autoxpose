import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, type ProviderStatus } from '../../lib/api';
import { ProviderForm } from './provider-form';
import { useI18n } from '../../hooks/use-i18n';

const DNS_PROVIDERS = ['cloudflare', 'netlify'];
type Props = { current: ProviderStatus | null };

function ConfigDisplay({ current }: Props): JSX.Element | null {
  const { t } = useI18n();
  if (!current?.configured) return null;
  return (
    <div className="mt-3 text-xs text-neutral-500 space-y-1">
      <p>
        <span className="text-neutral-400">{t('settings.provider')}:</span> {current.provider}
      </p>
      {current.config?.zoneId && (
        <p>
          <span className="text-neutral-400">{t('settings.zone_id')}:</span> {current.config.zoneId}
        </p>
      )}
      {current.config?.token && (
        <p>
          <span className="text-neutral-400">{t('settings.token')}:</span> {current.config.token}
        </p>
      )}
    </div>
  );
}

export function DnsConfigCard({ current }: Props): JSX.Element {
  const { t } = useI18n();
  const [provider, setProvider] = useState(current?.provider || 'cloudflare');
  const [token, setToken] = useState('');
  const [zoneId, setZoneId] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (current?.provider) setProvider(current.provider);
    if (current?.config?.zoneId) setZoneId(current.config.zoneId);
  }, [current]);

  const mutation = useMutation({
    mutationFn: () => api.settings.saveDns(provider, { token, zoneId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setToken('');
    },
  });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <h3 className="font-medium">{t('settings.dns')}</h3>
      <p className="mt-1 text-sm text-neutral-500">{t('settings.configure_proxy_first')}</p>
      <ProviderForm
        providers={DNS_PROVIDERS}
        provider={provider}
        onProviderChange={setProvider}
        onSubmit={() => mutation.mutate()}
        isPending={mutation.isPending}
        isSuccess={mutation.isSuccess}
        isError={mutation.isError}
        buttonText={t('settings.save_dns')}
      >
        <input
          type="password"
          placeholder={current?.config?.token ? `${t('settings.api_key')} (${t('settings.saved')})` : t('settings.api_key')}
          value={token}
          onChange={e => setToken(e.target.value)}
          className="w-full rounded border border-neutral-300 p-2 text-sm"
        />
        <input
          type="text"
          placeholder={t('settings.zone_id')}
          value={zoneId}
          onChange={e => setZoneId(e.target.value)}
          className="w-full rounded border border-neutral-300 p-2 text-sm"
        />
      </ProviderForm>
      <ConfigDisplay current={current} />
    </div>
  );
}
