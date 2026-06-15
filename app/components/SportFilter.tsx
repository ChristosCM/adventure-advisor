"use client";

import { ACTIVITIES } from "@/data/activities";
import type { ActivityId } from "@/lib/types";

const ALL_IDS = Object.keys(ACTIVITIES) as ActivityId[];

export function SportFilter({
  selected,
  onToggle,
  onClear,
}: {
  selected: Set<ActivityId>;
  onToggle: (id: ActivityId) => void;
  onClear: () => void;
}) {
  const allActive = selected.size === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip active={allActive} onClick={onClear} label="All sports" />
      {ALL_IDS.map((id) => {
        const cfg = ACTIVITIES[id];
        return (
          <Chip
            key={id}
            active={selected.has(id)}
            onClick={() => onToggle(id)}
            label={cfg.label}
            emoji={cfg.emoji}
          />
        );
      })}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  emoji,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  emoji?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 text-sm font-medium transition " +
        (active
          ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10")
      }
    >
      {emoji && <span className="mr-1">{emoji}</span>}
      {label}
    </button>
  );
}
