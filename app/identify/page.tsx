'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AVATAR_COLORS,
  getIdentity,
  saveIdentity,
  getInitials,
} from '@/lib/identity';

export default function IdentifyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    const existing = getIdentity();
    if (existing) {
      router.replace('/lobby');
    }
  }, [router]);

  const isValid = name.trim().length > 0 && selectedColor !== null;

  function handleSubmit() {
    if (!isValid || !selectedColor) return;
    const cleanName = name.trim();
    saveIdentity({
      displayName: cleanName,
      avatarColor: selectedColor,
      guestId: crypto.randomUUID(),
    });
    router.push('/lobby');
  }

  function handleNameChange(value: string) {
    const filtered = value.replace(/[^a-zA-Z0-9 ]/g, '');
    if (filtered.length <= 20) {
      setName(filtered);
    }
  }

  const initials = getInitials(name) || '?';

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 -mt-14">
      <h1 className="text-3xl font-bold text-white mb-2">Ludo Online</h1>
      <p className="text-slate-400 mb-8">Choose your name and avatar</p>

      {/* Preview */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div
          className="rounded-full flex items-center justify-center font-bold text-white text-2xl w-20 h-20"
          style={{
            backgroundColor: selectedColor || '#475569',
          }}
        >
          {initials}
        </div>
        <span className="text-slate-300 text-sm">
          {name.trim() || 'Your Name'}
        </span>
      </div>

      {/* Name input */}
      <label className="block w-full max-w-xs mb-6">
        <span className="text-slate-300 text-sm mb-1 block">
          Your display name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="w-full h-12 px-4 rounded-lg bg-slate-800 border border-slate-600 text-white text-lg placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />
        <span className="text-slate-500 text-xs mt-1 block text-right">
          {name.length}/20
        </span>
      </label>

      {/* Avatar colour picker */}
      <div className="mb-8">
        <span className="text-slate-300 text-sm mb-3 block text-center">
          Pick your colour
        </span>
        <div className="flex flex-wrap justify-center gap-3">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className="rounded-full flex items-center justify-center font-bold text-white transition-transform active:scale-95"
              style={{
                backgroundColor: color,
                width: 52,
                height: 52,
                fontSize: 18,
                boxShadow:
                  selectedColor === color
                    ? `0 0 0 3px white, 0 0 0 5px ${color}`
                    : 'none',
              }}
              aria-label={`Select colour ${color}`}
            >
              {initials}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full max-w-xs h-14 rounded-xl text-lg font-bold transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white active:bg-blue-700"
      >
        Let&apos;s Play
      </button>
    </div>
  );
}
