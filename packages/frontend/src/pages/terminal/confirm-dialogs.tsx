import { useState } from 'react';
import { ConfirmDialog } from '../../components/terminal';
import { type ServiceRecord } from '../../lib/api';
import { useI18n } from '../../hooks/use-i18n';

export type ConfirmAction =
  | { type: 'expose-all' }
  | { type: 'unexpose-all' }
  | { type: 'delete'; service: ServiceRecord; shouldUnexpose?: boolean }
  | null;

interface ConfirmDialogsProps {
  action: ConfirmAction;
  serviceCount: number;
  exposedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  onUnexposeChange?: (shouldUnexpose: boolean) => void;
}

export function ConfirmDialogs({
  action,
  serviceCount,
  exposedCount,
  onConfirm,
  onCancel,
  onUnexposeChange,
}: ConfirmDialogsProps): JSX.Element {
  const { t } = useI18n();
  const unexposedCount = serviceCount - exposedCount;
  const deleteName = action?.type === 'delete' ? action.service.name : '';
  const hasResources =
    action?.type === 'delete' &&
    (action.service.dnsRecordId !== null || action.service.proxyHostId !== null);
  const defaultUnexpose = hasResources ? true : false;
  const [unexposeChecked, setUnexposeChecked] = useState(defaultUnexpose);

  const handleUnexposeChange = (checked: boolean): void => {
    setUnexposeChecked(checked);
    onUnexposeChange?.(checked);
  };

  const deleteMessage = hasResources
    ? t('confirm.remove_exposed_message', { name: deleteName })
    : t('confirm.remove_unexposed_message', { name: deleteName });

  return (
    <>
      <ConfirmDialog
        isOpen={action?.type === 'expose-all'}
        title={t('confirm.expose_all_title')}
        message={t('confirm.expose_all_message', { count: unexposedCount })}
        confirmText={t('confirm.expose_all_button')}
        variant="default"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        isOpen={action?.type === 'unexpose-all'}
        title={t('confirm.unexpose_all_title')}
        message={t('confirm.unexpose_all_message', { count: exposedCount })}
        confirmText={t('confirm.unexpose_all_button')}
        variant="warning"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        isOpen={action?.type === 'delete'}
        title={t('confirm.remove_service_title')}
        message={deleteMessage}
        confirmText={t('confirm.remove_button')}
        variant="danger"
        showCheckbox={hasResources}
        checkboxLabel={t('confirm.also_remove_dns_proxy')}
        checkboxChecked={unexposeChecked}
        onCheckboxChange={handleUnexposeChange}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </>
  );
}
