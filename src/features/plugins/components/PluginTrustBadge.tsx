import { useTranslation } from 'react-i18next';
import { IconAlertTriangle } from '@/components/ui/icons';
import type { PluginStoreEntry } from '@/types';
import { requiresThirdPartyPluginWarning } from '../pluginResources';
import styles from '../PluginStorePage.module.scss';

export function PluginTrustBadge({ entry }: { entry: PluginStoreEntry }) {
  const { t } = useTranslation();

  return requiresThirdPartyPluginWarning(entry) ? (
    <span className={styles.badgeUntrusted}>
      <IconAlertTriangle size={11} />
      {t('plugin_store.badge_untrusted')}
    </span>
  ) : (
    <span className={styles.badge}>{t('plugin_store.badge_upstream_published')}</span>
  );
}
