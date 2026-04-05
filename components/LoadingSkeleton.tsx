'use client';

export function LoadingSkeleton() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 -mt-14 gap-4 animate-pulse">
      <div className="w-48 h-8 bg-slate-700 rounded-lg" />
      <div className="w-32 h-4 bg-slate-800 rounded" />
      <div className="w-full max-w-xs h-14 bg-slate-700 rounded-xl mt-4" />
      <div className="w-full max-w-xs h-14 bg-slate-800 rounded-xl" />
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="min-h-[100dvh] flex flex-col -mt-14 pt-14 animate-pulse">
      <div className="h-10 bg-slate-700 w-full" />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[100vw] aspect-square bg-slate-800 rounded-xl" />
      </div>
      <div className="pb-6 pt-2 flex flex-col items-center gap-2">
        <div className="w-20 h-20 bg-slate-700 rounded-2xl" />
      </div>
    </div>
  );
}
