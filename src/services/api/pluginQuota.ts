import type { TFunction } from 'i18next';
import type {
  AntigravityQuotaSubscription,
  AntigravityQuotaSummaryPayload,
  AuthFileItem,
  PluginListEntry,
  PluginQuotaMetric,
  PluginQuotaState,
} from '@/types';
import { apiClient } from './client';
import { pluginsApi } from './plugins';
import { normalizeAuthIndex } from '@/utils/authIndex';
import { buildAntigravityQuotaGroups } from '@/utils/quota';

type PluginQuotaPayload = AntigravityQuotaSummaryPayload & {
  subscription?: Partial<AntigravityQuotaSubscription> | null;
  summary?: Array<Partial<PluginQuotaMetric>>;
};

type PluginQuotaData = {
  groups: PluginQuotaState['groups'];
  subscription: AntigravityQuotaSubscription | null;
  summary: PluginQuotaMetric[];
};

export const normalizePluginQuotaSummary = (
  summary: PluginQuotaPayload['summary']
): PluginQuotaMetric[] => {
  if (!Array.isArray(summary)) return [];
  return summary.flatMap((metric) => {
    if (!metric || typeof metric !== 'object') return [];
    const key = typeof metric.key === 'string' ? metric.key.trim() : '';
    const label = typeof metric.label === 'string' ? metric.label.trim() : '';
    if (!key || !label || typeof metric.value !== 'number' || !Number.isFinite(metric.value))
      return [];
    const format =
      metric.format === 'currency' || metric.format === 'number' ? metric.format : undefined;
    const unit =
      typeof metric.unit === 'string' && metric.unit.trim() ? metric.unit.trim() : undefined;
    const currency =
      format === 'currency' &&
      typeof metric.currency === 'string' &&
      /^[A-Z]{3}$/.test(metric.currency)
        ? metric.currency
        : undefined;
    return [{ key, label, value: metric.value, unit, format, currency }];
  });
};

const normalizeSubscription = (
  subscription: PluginQuotaPayload['subscription']
): AntigravityQuotaSubscription | null => {
  if (!subscription) return null;
  const value = (field: unknown) =>
    typeof field === 'string' && field.trim() ? field.trim() : null;
  return {
    plan: value(subscription.plan),
    tierName: value(subscription.tierName),
    tierId: value(subscription.tierId),
  };
};

const normalizeProviderId = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

/**
 * v8 serves plugin quotas at /plugins/:id/quota. Its plugin list exposes quota, plugin,
 * and auth identifiers, but omits DescribeQuota aliases and backend priority order.
 * Only route a unique advertised match; never guess a plugin for a credential.
 */
export const resolveQuotaPluginId = (
  plugins: readonly PluginListEntry[],
  provider: string
): string | null => {
  const target = normalizeProviderId(provider);
  if (!target) return null;
  const matches = plugins.filter(
    (plugin) =>
      plugin.registered &&
      plugin.supportsQuota &&
      [plugin.quotaProvider, plugin.id, plugin.oauthProvider].some(
        (identifier) => normalizeProviderId(identifier) === target
      )
  );
  return matches.length === 1 ? matches[0].id : null;
};

const PLUGIN_LIST_TTL_MS = 30_000;
let pluginListCache: {
  revision: number;
  expiresAt: number;
  promise: Promise<PluginListEntry[]>;
} | null = null;

/** Refresh-all fans out per credential; share one plugin list per connection. */
const loadQuotaPlugins = (): Promise<PluginListEntry[]> => {
  const revision = apiClient.getConnectionRevision();
  const now = Date.now();
  if (pluginListCache && pluginListCache.revision === revision && pluginListCache.expiresAt > now) {
    return pluginListCache.promise;
  }
  const promise = pluginsApi.list().then((response) => response.plugins);
  const entry = { revision, expiresAt: now + PLUGIN_LIST_TTL_MS, promise };
  pluginListCache = entry;
  promise.catch(() => {
    if (pluginListCache === entry) pluginListCache = null;
  });
  return promise;
};

export const resetPluginQuotaRouteCache = () => {
  pluginListCache = null;
};

export const fetchPluginQuota = async (
  file: AuthFileItem,
  t: TFunction
): Promise<PluginQuotaData> => {
  const authIndex = normalizeAuthIndex(file.authIndex ?? file['auth_index']);
  if (!authIndex) throw new Error(t('plugin_quota.missing_auth_index'));

  const provider = String(file.quotaProvider ?? file['quota_provider'] ?? '').trim();

  // Declarative quota_probe credentials have no v8 management route.
  if (!provider) throw new Error(t('plugin_quota.probe_unsupported'));

  const revision = apiClient.getConnectionRevision();
  const pluginId = resolveQuotaPluginId(await loadQuotaPlugins(), provider);
  if (revision !== apiClient.getConnectionRevision()) {
    throw new DOMException('The management connection changed.', 'AbortError');
  }
  if (!pluginId) throw new Error(t('plugin_quota.plugin_not_found', { provider }));

  const payload = await apiClient.post<PluginQuotaPayload>(
    `/plugins/${encodeURIComponent(pluginId)}/quota`,
    { auth_index: authIndex }
  );
  return {
    groups: buildAntigravityQuotaGroups(payload),
    subscription: normalizeSubscription(payload.subscription),
    summary: normalizePluginQuotaSummary(payload.summary),
  };
};
