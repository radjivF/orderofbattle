"use client";

type Props = {
  fury: number;
  rage: number;
  onClick: () => void;
  className?: string;
};

export function ScourgeOfAqshyChip({ fury, rage, onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-ember/15 to-aether/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-ember/30 backdrop-blur-sm transition hover:ring-ember/50 ${className}`}
      aria-label="Open Scourge of Aqshy fury and rage tracker"
    >
      <span className="flex items-center gap-1">
        <span className="text-ember" aria-label="Fury level">
          🔥 {fury}
        </span>
      </span>
      <span className="h-3 w-px bg-parchment-ink/20" aria-hidden="true" />
      <span className="flex items-center gap-1">
        <span className="text-aether" aria-label="Rage dice">
          ⚡ {rage}
        </span>
      </span>
    </button>
  );
}
