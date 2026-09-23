import type { AuthFileItem } from '@/types/authFile';
import { deriveAuthFileIdentity, type AuthFileIdentity } from './identity';

const emailPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}$/i;
const readText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export function maskAccountEmail(value: string): string | null {
  const email = value.trim();
  if (!emailPattern.test(email)) return null;
  const [local, domain] = email.split('@');
  const labels = domain.split('.');
  return `${local[0]}***@${labels[0][0]}***.${labels[labels.length - 1]}`;
}

export function presentAuthFileName(
  name: string,
  email: string,
  revealed: boolean,
  hiddenName: string
): string {
  if (revealed) return name;
  const normalizedEmail = email.trim();
  const known = maskAccountEmail(normalizedEmail);
  let display = name;
  if (known) {
    display = display.split(normalizedEmail).join(known);
  }
  const unresolved = known ? display.split(known).join('') : display;
  return unresolved.includes('@') ? hiddenName : display;
}

export function presentAuthFile(
  file: AuthFileItem,
  revealed: boolean,
  hiddenEmail: string,
  hiddenName: string
): AuthFileIdentity & { revealable: boolean } {
  const name = readText(file.name);
  const email = readText(file.email);
  const displayedEmail = email ? (revealed ? email : (maskAccountEmail(email) ?? hiddenEmail)) : '';
  const identity = deriveAuthFileIdentity({
    ...file,
    name: presentAuthFileName(name, email, revealed, hiddenName),
    email: displayedEmail,
  });
  return { ...identity, revealable: Boolean(email || name.includes('@')) };
}

export function distinguishAuthFiles(
  files: AuthFileItem[],
  hiddenEmail: string,
  hiddenName: string
): Map<string, string> {
  const groups = new Map<string, AuthFileItem[]>();
  for (const file of files) {
    const identity = presentAuthFile(file, false, hiddenEmail, hiddenName);
    const key = identity.primary;
    groups.set(key, [...(groups.get(key) ?? []), file]);
  }
  const result = new Map<string, string>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const file of group) {
      const index = readText(file.authIndex);
      const safeIndex = /^[a-zA-Z0-9_-]{1,24}$/.test(index) ? index : '';
      let hash = 0;
      for (const char of file.name) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
      result.set(file.name, safeIndex || hash.toString(36).padStart(6, '0').slice(-6));
    }
  }
  return result;
}
