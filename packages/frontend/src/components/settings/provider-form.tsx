import type { ReactNode } from 'react';
import { useI18n } from '../../hooks/use-i18n';

type Props = {
  providers: string[];
  provider: string;
  onProviderChange: (p: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  buttonText: string;
  children: ReactNode;
};

export function ProviderForm(props: Props): JSX.Element {
  const { t } = useI18n();
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    props.onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <select
        value={props.provider}
        onChange={e => props.onProviderChange(e.target.value)}
        className="w-full rounded border border-neutral-300 p-2 text-sm"
      >
        {props.providers.map(p => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      {props.children}
      <button
        type="submit"
        disabled={props.isPending}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {props.isPending ? t('common.saving') : props.buttonText}
      </button>
      {props.isSuccess && <p className="text-sm text-emerald-600">{t('settings.saved')}</p>}
      {props.isError && <p className="text-sm text-red-600">{t('settings.failed_to_save')}</p>}
    </form>
  );
}
