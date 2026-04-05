'use client';

import { useState } from 'react';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
  disabled: boolean;
  rolling?: boolean;
}

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [25, 25],
    [75, 75],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [25, 25],
    [75, 25],
    [25, 75],
    [75, 75],
  ],
  5: [
    [25, 25],
    [75, 25],
    [50, 50],
    [25, 75],
    [75, 75],
  ],
  6: [
    [25, 25],
    [75, 25],
    [25, 50],
    [75, 50],
    [25, 75],
    [75, 75],
  ],
};

export function Dice({ value, onRoll, disabled, rolling = false }: DiceProps) {
  const [shaking, setShaking] = useState(false);
  const displayValue = value || 1;
  const dots = DOT_POSITIONS[displayValue] || [];

  function handleRoll() {
    if (disabled) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    onRoll();
  }

  return (
    <button
      onClick={handleRoll}
      disabled={disabled}
      className={`w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center
        active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed
        ${shaking || rolling ? 'animate-dice-shake' : ''}`}
      aria-label={`Dice showing ${displayValue}. Tap to roll.`}
    >
      <svg viewBox="0 0 100 100" className="w-14 h-14">
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={10} fill="#0f172a" />
        ))}
      </svg>
    </button>
  );
}
