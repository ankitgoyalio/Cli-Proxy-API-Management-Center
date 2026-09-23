import type { AuthFileItem } from '@/types';
import { maskAccountEmail, presentAuthFileName } from '@/features/authFiles/presentation';
import { getQuotaDisplayName } from '@/utils/quota/identity';

/** Keep cache and request identities raw; only labels pass through this boundary. */
export function presentQuotaName(
  file: AuthFileItem,
  revealed: boolean,
  hiddenName: string,
  hiddenEmail: string
): string {
  const email = typeof file.email === 'string' ? file.email.trim() : '';
  const maskedEmail = email ? maskAccountEmail(email) : null;
  const displayName = getQuotaDisplayName(file);
  const name = presentAuthFileName(file.name, email, revealed, hiddenName);
  const suffix =
    displayName.slice(file.name.length) ||
    (email && (!file.name.includes(email) || !maskedEmail) ? ` · ${email}` : '');
  return `${name}${revealed || !email ? suffix : suffix.replace(email, maskedEmail ?? hiddenEmail)}`;
}

export function presentQuotaFileName(file: AuthFileItem, hiddenName: string): string {
  return presentAuthFileName(file.name, file.email ?? '', false, hiddenName);
}

export function canRevealQuotaName(file: AuthFileItem): boolean {
  return Boolean(file.email?.trim() || file.name.includes('@'));
}
