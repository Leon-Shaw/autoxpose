import type { ProgressEvent } from '../../lib/progress.types';
import { TERMINAL_COLORS } from './theme';
import { useI18n } from '../../hooks/use-i18n';

function parseSSLError(raw?: string): string {
  const { t } = useI18n();
  if (!raw) return t('result.ssl_cert_not_issued');
  if (raw.includes('No such authorization')) return t('result.dns_not_visible');
  if (raw.includes('Internal Error')) return t('result.ca_unreachable');
  return t('result.ssl_request_failed');
}

interface ResultDisplayProps {
  result: NonNullable<ProgressEvent['result']>;
  action: 'expose' | 'unexpose';
  serviceId: string | null;
  onRetrySsl?: () => void;
  isRetrying?: boolean;
  retryResult?: { success: boolean; error?: string } | null;
}

function SslPendingResult(props: ResultDisplayProps): JSX.Element {
  const { t } = useI18n();
  const { result, onRetrySsl, isRetrying, retryResult } = props;
  if (retryResult?.success) {
    const url = `https://${result.domain}`;
    return (
      <div className="mt-4 pl-4 font-mono text-sm" style={{ color: TERMINAL_COLORS.success }}>
        <span className="mr-2">{'\u2713'}</span>
        {t('result.ssl_issued')} -{' '}
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
          {url}
        </a>
      </div>
    );
  }
  const errorMsg = retryResult ? parseSSLError(retryResult.error) : parseSSLError(result.sslError);
  return (
    <div className="mt-4 pl-4 font-mono text-sm">
      <div style={{ color: TERMINAL_COLORS.warning }}>
        <span className="mr-2">{'\u26A0'}</span>{t('result.exposed_http', { domain: result.domain })}
      </div>
      <div className="mt-2 text-xs" style={{ color: TERMINAL_COLORS.textMuted }}>
        {errorMsg}
      </div>
      {onRetrySsl && (
        <button
          onClick={onRetrySsl}
          disabled={isRetrying}
          className="mt-2 rounded border border-[#30363d] px-2 py-1 text-xs hover:border-[#58a6ff] disabled:opacity-50"
          style={{ color: TERMINAL_COLORS.accent }}
        >
          {isRetrying ? t('result.retrying') : t('result.retry_ssl')}
        </button>
      )}
    </div>
  );
}

export function ResultDisplay(props: ResultDisplayProps): JSX.Element {
  const { t } = useI18n();
  const { result, action } = props;
  if (result.success && result.sslPending) return <SslPendingResult {...props} />;
  if (result.success) {
    const url = result.domain ? `https://${result.domain}` : '';
    const msg =
      action === 'expose' && url ? (
        <>
          {t('result.exposed_at')}{' '}
          <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
            {url}
          </a>
        </>
      ) : action === 'expose' ? (
        t('result.service_exposed')
      ) : (
        t('result.service_unexposed')
      );
    return (
      <div className="mt-4 pl-4 font-mono text-sm" style={{ color: TERMINAL_COLORS.success }}>
        <span className="mr-2">{'\u2713'}</span>
        {msg}
      </div>
    );
  }
  return (
    <div className="mt-4 pl-4 font-mono text-sm" style={{ color: TERMINAL_COLORS.error }}>
      <span className="mr-2">{'\u2717'}</span>
      {result.error || t('result.operation_failed')}
    </div>
  );
}
