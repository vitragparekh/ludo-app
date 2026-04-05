export const IDENTITY_KEY = 'ludo_identity';

export interface PlayerIdentity {
  displayName: string;
  avatarColor: string;
  guestId: string;
}

export const AVATAR_COLORS = [
  '#E63946',
  '#F4A261',
  '#2A9D8F',
  '#457B9D',
  '#6A4C93',
  '#F77F00',
  '#4CC9F0',
  '#06D6A0',
] as const;

export function getIdentity(): PlayerIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerIdentity;
  } catch {
    return null;
  }
}

export function saveIdentity(identity: PlayerIdentity): void {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

export function clearIdentity(): void {
  localStorage.removeItem(IDENTITY_KEY);
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function addDuplicateSuffix(name: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${name} #${suffix}`;
}
