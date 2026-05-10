import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, type ServiceRecord } from '../../lib/api';
import { Tooltip } from './tooltip';
import { useI18n } from '../../hooks/use-i18n';

interface OrphansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrphansModal({ isOpen, onClose }: OrphansModalProps): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-[#30363d] bg-[#0d1117] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalContent onClose={onClose} />
      </div>
    </div>
  );
}

function ModalContent({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [working, setWorking] = useState<Record<string, boolean>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orphans'],
    queryFn: api.services.getOrphans,
    refetchInterval: 5000,
  });

  const cleanupMutation = useMutation({
    mutationFn: (id: string) => api.services.cleanup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orphans'] });
      void queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const handleCleanup = (id: string): void => {
    setWorking({ ...working, [id]: true });
    cleanupMutation.mutate(id, {
      onSettled: () => {
        setWorking({ ...working, [id]: false });
        void refetch();
      },
    });
  };

  const orphans = data?.orphans ?? [];

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between border-b border-[#30363d] pb-3">
        <div>
          <h3 className="text-lg font-semibold text-[#c9d1d9]">{t('orphans.title')}</h3>
          <p className="mt-1 text-xs text-[#8b949e]">{t('orphans.description')}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded px-3 py-1 text-sm text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#c9d1d9]"
        >
          {t('dialog.close')}
        </button>
      </div>
      {isLoading ? (
        <div className="py-8 text-center text-sm text-[#8b949e]">
          <div className="mb-2 text-2xl">⟳</div>
          {t('orphans.loading')}
        </div>
      ) : orphans.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mb-3 text-4xl text-[#58a6ff]">✓</div>
          <p className="text-sm text-[#8b949e]">{t('orphans.no_orphans')}</p>
          <button
            onClick={onClose}
            className="mt-4 rounded bg-[#30363d] px-4 py-2 text-sm text-[#c9d1d9] transition-colors hover:bg-[#21262d]"
          >
            {t('dialog.close')}
          </button>
        </div>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {orphans.map((orphan) => (
            <OrphanRow
              key={orphan.id}
              orphan={orphan}
              onCleanup={handleCleanup}
              isWorking={working[orphan.id] ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrphanRowProps {
  orphan: ServiceRecord;
  onCleanup: (id: string) => void;
  isWorking: boolean;
}

function OrphanRow({ orphan, onCleanup, isWorking }: OrphanRowProps): JSX.Element {
  const { t } = useI18n();
  const created = orphan.createdAt ? new Date(orphan.createdAt).toLocaleString() : t('orphans.unknown');

  return (
    <div className="flex items-center justify-between rounded border border-[#30363d] bg-[#161b22] p-3 transition-colors hover:border-[#f0883e50]">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#c9d1d9]">{orphan.name}</span>
          <span className="rounded bg-[#f0883e20] px-2 py-0.5 text-xs text-[#f0883e]">
            {t('status.orphaned')}
          </span>
        </div>
        <div className="mt-1 text-xs text-[#8b949e]">
          {orphan.subdomain}:{orphan.port} • {t('orphans.created')} {created}
        </div>
      </div>
      <Tooltip
        content={
          <div className="text-center">
            <div>{t('tooltip.remove_dns_proxy_configs')}</div>
            <div className="text-[10px] opacity-75">{t('tooltip.skip_restart_container')}</div>
          </div>
        }
      >
        <button
          onClick={() => onCleanup(orphan.id)}
          disabled={isWorking}
          className="rounded bg-[#da3633] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#e5534b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isWorking ? t('orphans.cleaning') : t('orphans.clean_up')}
        </button>
      </Tooltip>
    </div>
  );
}
