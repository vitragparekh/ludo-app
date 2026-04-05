'use client';

import { getInitials } from '@/lib/identity';

interface AvatarCircleProps {
  color: string;
  name: string;
  size?: number;
  selected?: boolean;
}

export function AvatarCircle({
  color,
  name,
  size = 44,
  selected = false,
}: AvatarCircleProps) {
  const initials = getInitials(name);
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.36,
        boxShadow: selected ? `0 0 0 3px white, 0 0 0 5px ${color}` : 'none',
      }}
    >
      {initials || '?'}
    </div>
  );
}
