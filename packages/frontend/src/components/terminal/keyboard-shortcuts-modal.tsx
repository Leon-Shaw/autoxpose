import { useEffect, useMemo } from 'react';
import { usePlatform } from '../../hooks/use-platform';
import { useI18n } from '../../hooks/use-i18n';

type KeyboardShortcutsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const BORDER_COLOR = '#30363d';
const TEXT_COLOR = '#8b949e';
const LABEL_COLOR = '#c9d1d9';
const ACCENT_COLOR = '#58a6ff';
const DIVIDER_COLOR = '#21262d';

function Box({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div
      className="inline-block min-w-[520px] rounded border font-mono text-sm"
      style={{ borderColor: BORDER_COLOR }}
    >
      {children}
    </div>
  );
}

function TitleBar({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div
      className="px-6 py-2 text-center font-bold tracking-widest"
      style={{ color: ACCENT_COLOR, borderBottom: `1px solid ${BORDER_COLOR}` }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="mt-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: LABEL_COLOR }}>
      {children}
    </div>
  );
}

function Divider(): JSX.Element {
  return <div className="mx-6 mt-1 h-px" style={{ backgroundColor: DIVIDER_COLOR }} />;
}

function Row({ shortcut, description }: { shortcut: string; description: string }): JSX.Element {
  return (
    <div className="flex items-baseline gap-4 px-6 py-0.5">
      <span className="w-44 shrink-0 text-right text-xs" style={{ color: ACCENT_COLOR }}>
        {shortcut}
      </span>
      <span className="text-xs" style={{ color: TEXT_COLOR }}>
        {description}
      </span>
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div
      className="mt-3 px-6 py-2 text-center text-xs"
      style={{ color: TEXT_COLOR, borderTop: `1px solid ${BORDER_COLOR}` }}
    >
      {children}
    </div>
  );
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps): JSX.Element | null {
  const { modKey, altKey } = usePlatform();
  const { t } = useI18n();

  const shortcuts = useMemo(() => {
    return {
      settings: `${modKey} + ,`,
      exposeAll: `${modKey} + ${altKey} + E`,
      unexposeAll: `${modKey} + ${altKey} + U`,
      scan: `${modKey} + ${altKey} + S`,
    };
  }, [modKey, altKey]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    const cleanup = (): void => window.removeEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleEscape);
    return cleanup;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="rounded bg-[#0d1117] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Box>
          <TitleBar>{t('keyboard_shortcuts.title')}</TitleBar>
          <div className="py-2">
            <SectionTitle>{t('keyboard_shortcuts.global_shortcuts')}</SectionTitle>
            <Divider />
            <div className="mt-2">
              <Row shortcut={shortcuts.settings} description={t('keyboard_shortcuts.toggle_settings')} />
              <Row shortcut={shortcuts.exposeAll} description={t('keyboard_shortcuts.expose_all')} />
              <Row shortcut={shortcuts.unexposeAll} description={t('keyboard_shortcuts.unexpose_all')} />
              <Row shortcut={shortcuts.scan} description={t('keyboard_shortcuts.scan_containers')} />
            </div>

            <SectionTitle>{t('keyboard_shortcuts.command_console')}</SectionTitle>
            <Divider />
            <div className="mt-2">
              <Row shortcut="Tab" description={t('keyboard_shortcuts.tab_select')} />
              <Row shortcut="Shift + Tab" description={t('keyboard_shortcuts.shift_tab_select')} />
              <Row shortcut="↑" description={t('keyboard_shortcuts.up_navigate')} />
              <Row shortcut="↓" description={t('keyboard_shortcuts.down_navigate')} />
              <Row shortcut="Enter" description={t('keyboard_shortcuts.enter_execute')} />
            </div>
          </div>
          <Footer>{t('keyboard_shortcuts.press_escape_close')}</Footer>
        </Box>
      </div>
    </div>
  );
}
