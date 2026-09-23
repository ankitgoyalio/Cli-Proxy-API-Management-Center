import type { AuthFileItem } from '@/types';
import { presentAuthFileName } from '@/features/authFiles/presentation';
import { getQuotaDisplayName } from '@/utils/quota/identity';

/** Keep cache and request identities raw; only labels pass through this boundary. */
export function presentQuotaName(
  file: AuthFileItem,
  revealed: boolean,
  hiddenName: string
): string {
  return presentAuthFileName(getQuotaDisplayName(file), file.email ?? '', revealed, hiddenName);
}

export function presentQuotaFileName(file: AuthFileItem, hiddenName: string): string {
  return presentAuthFileName(file.name, file.email ?? '', false, hiddenName);
}

export function canRevealQuotaName(file: AuthFileItem): boolean {
  return getQuotaDisplayName(file).includes('@');
}
