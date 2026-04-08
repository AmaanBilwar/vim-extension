import React from 'react';

const motions = [
  ['j / k', 'Scroll down / up'],
  ['h / l', 'Scroll left / right'],
  ['d / u', 'Half-page down / up'],
  ['Ctrl+d / Ctrl+u', 'Half-page down / up'],
  ['gg / G', 'Top / bottom of page'],
  ['f', 'Hint mode for clicking elements'],
  ['Enter (in hints)', 'Confirm exact hint'],
  ['Esc', 'Exit hint/find mode'],
  ['/', 'Open page find mode'],
  ['Enter / Shift+Enter', 'Next / previous find result'],
  ['n / N', 'Next / previous result for last search'],
] as const;

export default function Popup() {
  return (
    <main className="h-full overflow-auto bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <section className="p-4">
        <h1 className="text-lg font-bold tracking-wide">Amaan&apos;s Vim Extension</h1>
        <p className="mt-1 text-xs text-slate-300">Keybind cheat sheet</p>

        <div className="mt-4 rounded-lg border border-slate-600/60 bg-slate-950/50">
          {motions.map(([keys, description]) => (
            <div
              key={keys}
              className="grid grid-cols-[130px_1fr] gap-2 border-b border-slate-700/70 px-3 py-2 last:border-b-0"
            >
              <code className="text-xs font-semibold text-cyan-300">{keys}</code>
              <p className="text-xs text-slate-200">{description}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          Tip: if hints share a prefix, type the label and press Enter to confirm exact match.
        </p>
      </section>
    </main>
  );
}
