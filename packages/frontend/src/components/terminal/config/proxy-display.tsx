import { useState } from 'react';
import { api, type SettingsStatus } from '../../../lib/api';
import { TestConnectionButton, type TestState } from '../test-button';
import { useI18n } from '../../../hooks/use-i18n';

export const PROXY_PROVIDERS = [
  { value: 'npm', label: 'Nginx Proxy Manager' },
  { value: 'caddy', label: 'Caddy' },
];

interface ProxyDisplayProps {
  current: SettingsStatus['proxy'] | null;
}

export function ProxyDisplay({ current }: ProxyDisplayProps): JSX.Element {
  const { t } = useI18n();
  const [testState, setTestState] = useState<TestState>({ status: 'idle' });
  const providerLabel = PROXY_PROVIDERS.find(p => p.value === current?.provider)?.label;
  const isNpm = current?.provider === 'npm';

  const handleTest = async (): Promise<void> => {
    setTestState({ status: 'testing' });
    try {
      const result = await api.settings.testProxy();
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
      <p>
        <span className="text-[#484f58]">{t('settings.provider')}:</span> {providerLabel}
      </p>
      <p>
        <span className="text-[#484f58]">{t('settings.url')}:</span> {current?.config?.url}
      </p>
      {isNpm && (
        <p>
          <span className="text-[#484f58]">{t('settings.username')}:</span> {current?.config?.username}
        </p>
      )}
      {isNpm && (
        <p>
          <span className="text-[#484f58]">{t('settings.password')}:</span> {t('settings.saved')}
        </p>
      )}
      <TestConnectionButton status={testState.status} error={testState.error} onTest={handleTest} />
    </div>
  );
}
