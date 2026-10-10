import type { PluginQuotaState } from '@/types';
import { fetchPluginQuota } from '@/services/api/pluginQuota';
import { isDisabledAuthFile, isPluginQuotaFile } from '@/utils/quota';
import type { QuotaProviderData } from '../types';

export { fetchPluginQuota, normalizePluginQuotaSummary } from '@/services/api/pluginQuota';

type PluginQuotaData = Awaited<ReturnType<typeof fetchPluginQuota>>;

export const PLUGIN_CONFIG: QuotaProviderData<PluginQuotaState, PluginQuotaData> = {
  type: 'plugin',
  i18nPrefix: 'plugin_quota',
  filterFn: (file) => isPluginQuotaFile(file) && !isDisabledAuthFile(file),
  fetchQuota: fetchPluginQuota,
  storeSelector: (state) => state.pluginQuota,
  storeSetter: 'setPluginQuota',
  buildLoadingState: () => ({ status: 'loading', groups: [], subscription: null, summary: [] }),
  buildSuccessState: (data) => ({ status: 'success', ...data }),
  buildErrorState: (error, errorStatus) => ({
    status: 'error',
    groups: [],
    subscription: null,
    summary: [],
    error,
    errorStatus,
  }),
};
