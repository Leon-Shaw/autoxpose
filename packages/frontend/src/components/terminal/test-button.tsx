import { TERMINAL_COLORS } from './theme';
import { useI18n } from '../../hooks/use-i18n';

export type TestStatus = 'idle' | 'testing' | 'success' | 'error';
export type TestState = { status: TestStatus; error?: string };

interface TestButtonProps {
  status: TestStatus;
  error?: string;
  onTest: () => void;
}

export function TestConnectionButton({ status, error, onTest }: TestButtonProps): JSX.Element {
  const { t } = useI18n();
  
  const getButtonContent = (): string => {
    if (status === 'testing') return t('test.testing');
    if (status === 'success') return t('test.connected');
    if (status === 'error') return t('test.failed');
    return t('test.test_connection');
  };

  const getButtonStyle = (): string => {
    if (status === 'success') return `${TERMINAL_COLORS.success}`;
    if (status === 'error') return `${TERMINAL_COLORS.error}`;
    return '#58a6ff';
  };

  return (
    <div className="mt-3 space-y-2">
      <button
        onClick={onTest}
        disabled={status === 'testing'}
        className="text-xs hover:underline disabled:opacity-50"
        style={{ color: getButtonStyle() }}
      >
        {getButtonContent()}
      </button>
      {error && (
        <div className="rounded border border-[#f85149]/30 bg-[#f85149]/10 px-2 py-1.5 text-xs text-[#f85149]">
          {error}
        </div>
      )}
    </div>
  );
}
