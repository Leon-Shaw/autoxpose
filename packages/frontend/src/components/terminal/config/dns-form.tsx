import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, type SettingsStatus } from '../../../lib/api';
import { FormActions, FormInput, FormSelect } from '../form-components';
import { TestConnectionButton, type TestState } from '../test-button';
import { useI18n } from '../../../hooks/use-i18n';

export const DNS_PROVIDERS = [
  { value: 'cloudflare', label: 'Cloudflare' },
  { value: 'netlify', label: 'Netlify' },
  { value: 'digitalocean', label: 'DigitalOcean' },
  { value: 'porkbun', label: 'Porkbun' },
];

export const DNS_PROVIDER_LABELS: Record<string, string> = {
  cloudflare: 'Cloudflare',
  netlify: 'Netlify',
  digitalocean: 'DigitalOcean',
  porkbun: 'Porkbun',
};

interface DnsFieldsProps {
  provider: string;
  token: string;
  zoneId: string;
  domain: string;
  apiKey: string;
  secretKey: string;
  hasToken: boolean;
  hasApiKey: boolean;
  onProviderChange: (v: string) => void;
  onTokenChange: (v: string) => void;
  onZoneIdChange: (v: string) => void;
  onDomainChange: (v: string) => void;
  onApiKeyChange: (v: string) => void;
  onSecretKeyChange: (v: string) => void;
}

function PorkbunFields(props: {
  apiKey: string;
  secretKey: string;
  apiKeyPlaceholder: string;
  onApiKeyChange: (v: string) => void;
  onSecretKeyChange: (v: string) => void;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <>
      <FormInput
        label={t('settings.api_key')}
        type="password"
        placeholder={props.apiKeyPlaceholder}
        value={props.apiKey}
        onChange={props.onApiKeyChange}
      />
      <FormInput
        label={t('settings.secret_key')}
        type="password"
        placeholder={t('service_status.enter_secret_key')}
        value={props.secretKey}
        onChange={props.onSecretKeyChange}
      />
    </>
  );
}

function DnsFormFields(props: DnsFieldsProps): JSX.Element {
  const { t } = useI18n();
  const isPorkbun = props.provider === 'porkbun';
  const needsZone = props.provider === 'cloudflare' || props.provider === 'netlify';
  const tokenPlaceholder = props.hasToken ? t('settings.saved') : t('settings.enter_token');
  const apiKeyPlaceholder = props.hasApiKey ? t('settings.saved') : t('settings.enter_api_key');

  return (
    <>
      <FormInput
        label={t('settings.base_domain')}
        placeholder="example.com"
        value={props.domain}
        onChange={props.onDomainChange}
      />
      <FormSelect
        label={t('settings.provider')}
        value={props.provider}
        onChange={props.onProviderChange}
        options={DNS_PROVIDERS}
      />
      {isPorkbun ? (
        <PorkbunFields
          apiKey={props.apiKey}
          secretKey={props.secretKey}
          apiKeyPlaceholder={apiKeyPlaceholder}
          onApiKeyChange={props.onApiKeyChange}
          onSecretKeyChange={props.onSecretKeyChange}
        />
      ) : (
        <FormInput
          label={t('settings.token')}
          type="password"
          placeholder={tokenPlaceholder}
          value={props.token}
          onChange={props.onTokenChange}
        />
      )}
      {needsZone && (
        <FormInput
          label={t('settings.zone_id')}
          placeholder={t('settings.zone_id')}
          value={props.zoneId}
          onChange={props.onZoneIdChange}
        />
      )}
    </>
  );
}

type DnsFormState = {
  provider: string;
  token: string;
  zoneId: string;
  domain: string;
  apiKey: string;
  secretKey: string;
  isPending: boolean;
  isError: boolean;
  mutate: () => void;
  isConfigured: boolean;
  canSave: boolean;
  setProvider: (v: string) => void;
  setToken: (v: string) => void;
  setZoneId: (v: string) => void;
  setDomain: (v: string) => void;
  setApiKey: (v: string) => void;
  setSecretKey: (v: string) => void;
  hasToken: boolean;
  hasApiKey: boolean;
};

function useDnsForm(current: SettingsStatus['dns'] | null, onDone: () => void): DnsFormState {
  const [provider, setProvider] = useState(current?.provider || 'cloudflare');
  const [token, setToken] = useState('');
  const [zoneId, setZoneId] = useState(current?.config?.zoneId || '');
  const [domain, setDomain] = useState(current?.domain || '');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (current?.provider) setProvider(current.provider);
    if (current?.config?.zoneId) setZoneId(current.config.zoneId);
    if (current?.domain) setDomain(current.domain);
  }, [current]);

  const buildConfig = (): Record<string, string> => {
    if (provider === 'porkbun') return { apiKey, secretKey, domain };
    if (provider === 'digitalocean') return { token, domain };
    return { token, zoneId, domain };
  };

  const mutation = useMutation({
    mutationFn: () => api.settings.saveDns(provider, buildConfig()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      onDone();
    },
  });

  const isConfigured = current?.configured ?? false;
  const hasCredentials = provider === 'porkbun' ? apiKey || isConfigured : token || isConfigured;

  return {
    provider,
    token,
    zoneId,
    domain,
    apiKey,
    secretKey,
    isConfigured,
    isPending: mutation.isPending,
    isError: mutation.isError,
    mutate: () => mutation.mutate(),
    canSave: Boolean(hasCredentials && domain),
    setProvider,
    setToken,
    setZoneId,
    setDomain,
    setApiKey,
    setSecretKey,
    hasToken: Boolean(current?.config?.token),
    hasApiKey: Boolean(current?.config?.apiKey),
  };
}

interface DnsEditFormProps {
  current: SettingsStatus['dns'] | null;
  onDone: () => void;
}

export function DnsEditForm({ current, onDone }: DnsEditFormProps): JSX.Element {
  const { t } = useI18n();
  const form = useDnsForm(current, onDone);

  return (
    <div className="space-y-3">
      <DnsFormFields
        provider={form.provider}
        token={form.token}
        zoneId={form.zoneId}
        domain={form.domain}
        apiKey={form.apiKey}
        secretKey={form.secretKey}
        hasToken={form.hasToken}
        hasApiKey={form.hasApiKey}
        onProviderChange={form.setProvider}
        onTokenChange={form.setToken}
        onZoneIdChange={form.setZoneId}
        onDomainChange={form.setDomain}
        onApiKeyChange={form.setApiKey}
        onSecretKeyChange={form.setSecretKey}
      />
      <FormActions
        isPending={form.isPending}
        canSave={form.canSave}
        showCancel={form.isConfigured}
        onSave={form.mutate}
        onCancel={onDone}
      />
      {form.isError && <p className="text-xs text-[#f85149]">{t('settings.failed_to_save')}</p>}
    </div>
  );
}

export function DnsDisplay({ current }: { current: SettingsStatus['dns'] | null }): JSX.Element {
  const { t } = useI18n();
  const [testState, setTestState] = useState<TestState>({ status: 'idle' });
  const providerLabel = DNS_PROVIDERS.find(p => p.value === current?.provider)?.label;

  const handleTest = async (): Promise<void> => {
    setTestState({ status: 'testing' });
    try {
      const result = await api.settings.testDns();
      setTestState(
        result.ok
          ? { status: 'success' }
          : { status: 'error', error: result.error || t('settings.connection_test_failed') }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : t('settings.connection_test_failed');
      setTestState({ status: 'error', error: message });
    }
  };

  return (
    <div className="space-y-2 text-xs text-[#8b949e]">
      {current?.domain && (
        <p>
          <span className="text-[#484f58]">{t('settings.domain')}:</span> {current.domain}
        </p>
      )}
      <p>
        <span className="text-[#484f58]">{t('settings.provider')}:</span> {providerLabel}
      </p>
      {current?.config?.zoneId && (
        <p>
          <span className="text-[#484f58]">{t('settings.zone_id')}:</span> {current.config.zoneId}
        </p>
      )}
      <p>
        <span className="text-[#484f58]">{t('settings.credentials')}:</span> {t('settings.saved')}
      </p>
      <TestConnectionButton status={testState.status} error={testState.error} onTest={handleTest} />
    </div>
  );
}
