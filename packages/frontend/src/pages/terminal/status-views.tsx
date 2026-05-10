import { CommandPrompt } from '../../components/terminal';
import { useI18n } from '../../hooks/use-i18n';

interface ScanNoticeData {
  created: number;
  updated: number;
  autoExposed?: number;
  autoExposingServices?: Array<{ id: string; name: string; subdomain: string }>;
}

export function ScanSuccessNotice({ data }: { data: ScanNoticeData }): JSX.Element {
  const { t } = useI18n();
  const hasAutoExpose = data.autoExposed && data.autoExposed > 0;
  const serviceNames = data.autoExposingServices?.map(s => s.name).join(', ') || '';

  return (
    <div className="rounded border border-[#238636] bg-[#23863620] px-4 py-2 text-sm">
      <div>
        <span className="text-[#3fb950]">{'✓'}</span> {t('scan.complete', { created: data.created, updated: data.updated })}
      </div>
      {hasAutoExpose && (
        <div className="mt-1 text-[#8b949e]">
          <span className="text-[#f0883e]">{'⚡'}</span> {t('scan.auto_exposing', { names: serviceNames })}
        </div>
      )}
    </div>
  );
}

export function LoadingView(): JSX.Element {
  const { t } = useI18n();
  return (
    <div className="flex h-screen items-center justify-center bg-[#0d1117] font-mono text-[#c9d1d9]">
      <CommandPrompt command={t('scan.loading_services')} />
    </div>
  );
}

export function ErrorView(): JSX.Element {
  const { t } = useI18n();
  return (
    <div className="flex h-screen items-center justify-center bg-[#0d1117] font-mono text-[#f85149]">
      {t('scan.error_load_failed')}
    </div>
  );
}
