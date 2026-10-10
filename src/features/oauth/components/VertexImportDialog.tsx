import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { usePageTransitionLayer } from '@/components/common/PageTransitionLayer';
import { maskAccountEmail, presentAuthFileName } from '@/features/authFiles/presentation';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { IconFileText, IconLoader2, IconUpload } from '@/components/ui/icons';
import type { VertexImportState } from '../hooks/useVertexImport';
import { DialogTitle, type DialogHeading } from './OAuthFlowDialog';
import dialogStyles from './OAuthFlowDialog.module.scss';
import styles from './VertexImportDialog.module.scss';

export interface VertexImportDialogProps {
  open: boolean;
  heading: DialogHeading;
  vertex: VertexImportState;
  onPickFile: (file: File | undefined) => void;
  onLocationChange: (value: string) => void;
  onImport: () => void;
  onImportAnother: () => void;
  onViewAuthFiles: () => void;
  onClose: () => void;
}

export function VertexImportDialog({
  open,
  heading,
  vertex,
  onPickFile,
  onLocationChange,
  onImport,
  onImportAnother,
  onViewAuthFiles,
  onClose,
}: VertexImportDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileHintId = useId();
  const [dragging, setDragging] = useState(false);
  const result = vertex.result;
  const route = useLocation();
  const isCurrentLayer = usePageTransitionLayer()?.isCurrentLayer ?? true;
  const [reveal, setReveal] = useState<{
    file: File;
    routeKey: string;
    result: typeof result;
  } | null>(null);
  const revealed = Boolean(
    open &&
    isCurrentLayer &&
    vertex.file &&
    reveal?.file === vertex.file &&
    reveal.routeKey === route.key &&
    reveal.result === result
  );
  useEffect(() => {
    if (!open || !isCurrentLayer) setReveal(null);
  }, [open, isCurrentLayer]);
  const email = result?.email ?? '';
  const hiddenName = t('auth_files.hidden_auth_file_name');
  const fileName = (name: string) => presentAuthFileName(name, email, revealed, hiddenName);
  const revealable = Boolean(
    email || vertex.file?.name.includes('@') || result?.authFile?.includes('@')
  );
  const revealButton = revealable && (
    <button
      type="button"
      className={dialogStyles.secondary}
      aria-pressed={revealed}
      onClick={() =>
        setReveal(
          revealed || !vertex.file ? null : { file: vertex.file, routeKey: route.key, result }
        )
      }
    >
      {t(revealed ? 'auth_files.hide_email' : 'auth_files.show_email')}
    </button>
  );

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    onPickFile(event.dataTransfer.files?.[0]);
  };

  const resultRows = result
    ? [
        { key: 'result_project', value: result.projectId },
        {
          key: 'result_email',
          value: result.email
            ? revealed
              ? result.email
              : (maskAccountEmail(result.email) ?? t('auth_files.hidden_email'))
            : undefined,
        },
        { key: 'result_location', value: result.location },
        { key: 'result_file', value: result.authFile ? fileName(result.authFile) : undefined },
      ].filter((row): row is { key: string; value: string } => Boolean(row.value))
    : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={500}
      className={dialogStyles.dialog}
      title={<DialogTitle {...heading} />}
    >
      <div className={dialogStyles.view} key={result ? 'result' : 'form'}>
        {result ? (
          <div className={dialogStyles.result} role="status">
            <svg className={dialogStyles.successMark} viewBox="0 0 52 52" aria-hidden="true">
              <circle className={dialogStyles.successRing} cx="26" cy="26" r="24" />
              <path className={dialogStyles.successCheck} d="M16 27l7 7 14-15" />
            </svg>
            <div className={dialogStyles.resultTitle}>{t('vertex_import.result_title')}</div>
            {vertex.file && <p>{fileName(vertex.file.name)}</p>}
            {revealButton}
            {resultRows.length > 0 && (
              <dl className={styles.facts}>
                {resultRows.map((row) => (
                  <div className={styles.fact} key={row.key}>
                    <dt>{t(`vertex_import.${row.key}`)}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className={dialogStyles.resultActions}>
              <button type="button" className={dialogStyles.secondary} onClick={onViewAuthFiles}>
                {t('auth_login.view_auth_files')}
              </button>
              <button type="button" className={dialogStyles.primary} onClick={onImportAnother}>
                {t('vertex_import.import_another')}
              </button>
            </div>
          </div>
        ) : (
          <div className={dialogStyles.stack}>
            <p className={dialogStyles.hint}>{t('vertex_import.description')}</p>

            <div className={styles.field}>
              <span className={styles.label}>{t('vertex_import.file_label')}</span>
              <button
                type="button"
                className={styles.dropZone}
                data-dragging={dragging}
                data-filled={Boolean(vertex.file)}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                aria-describedby={fileHintId}
              >
                <span className={styles.dropGlyph} aria-hidden="true">
                  {vertex.file ? <IconFileText size={18} /> : <IconUpload size={18} />}
                </span>
                <span className={styles.dropText}>
                  <span className={vertex.file ? styles.fileName : styles.dropTitle}>
                    {vertex.file ? fileName(vertex.file.name) : t('vertex_import.drop_hint')}
                  </span>
                  <span className={styles.dropHint} id={fileHintId}>
                    {vertex.file ? t('vertex_import.choose_file') : t('vertex_import.file_hint')}
                  </span>
                </span>
              </button>
              {revealButton}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(event) => {
                  onPickFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </div>

            <div className={styles.locationField}>
              <Input
                label={t('vertex_import.location_label')}
                hint={t('vertex_import.location_hint')}
                value={vertex.location}
                onChange={(event) => onLocationChange(event.target.value)}
                placeholder={t('vertex_import.location_placeholder')}
                spellCheck={false}
              />
            </div>

            {vertex.error && (
              <div className={dialogStyles.alert} role="alert">
                {vertex.error}
              </div>
            )}

            <div>
              <button
                type="button"
                className={dialogStyles.primary}
                onClick={onImport}
                disabled={!vertex.file || vertex.loading}
              >
                {vertex.loading && (
                  <IconLoader2 size={14} className={dialogStyles.spinning} aria-hidden="true" />
                )}
                {t('vertex_import.import_button')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
