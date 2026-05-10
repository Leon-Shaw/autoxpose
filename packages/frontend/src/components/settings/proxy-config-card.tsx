import { useProxyConfig } from '../../hooks/use-proxy-config';
import type { ProviderStatus } from '../../lib/api';
import { ConfigDisplay } from '../ui';
import { ProviderForm } from './provider-form';
import { useI18n } from '../../hooks/use-i18n';

const PROVIDERS = ['npm'];
type Props = { current: ProviderStatus | null };

export function ProxyConfigCard({ current }: Props): JSX.Element {
  const { t } = useI18n();
  const cfg = useProxyConfig(current);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <h3 className="font-medium">{t('settings.proxy_provider')}</h3>
      <p className="mt-1 text-sm text-neutral-500">{t('settings.configure_proxy_first')}</p>
      <ProviderForm
        providers={PROVIDERS}
        provider={cfg.provider}
        onProviderChange={cfg.setProvider}
        onSubmit={() => cfg.mutation.mutate()}
        isPending={cfg.mutation.isPending}
        isSuccess={cfg.mutation.isSuccess}
        isError={cfg.mutation.isError}
        buttonText={t('settings.save_proxy')}
      >
        <input
          type="text"
          placeholder={t('proxy.npm_url')}
          value={cfg.url}
          onChange={e => cfg.setUrl(e.target.value)}
          className="w-full rounded border border-neutral-300 p-2 text-sm"
        />
        <input
          type="text"
          placeholder={t('settings.username')}
          value={cfg.username}
          onChange={e => cfg.setUsername(e.target.value)}
          className="w-full rounded border border-neutral-300 p-2 text-sm"
        />
        <input
          type="password"
          placeholder={current?.config?.password ? `${t('settings.password')} (${t('settings.saved')})` : t('settings.password')}
          value={cfg.password}
          onChange={e => cfg.setPassword(e.target.value)}
          className="w-full rounded border border-neutral-300 p-2 text-sm"
        />
      </ProviderForm>
      <ConfigDisplay current={current} />
    </div>
  );
}
