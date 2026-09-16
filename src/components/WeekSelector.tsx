import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekSelectorProps {
  currentWeek: number;
  onSelectWeek: (week: number) => void;
  maxWeek?: number;
  disabled?: boolean;
  isChopped?: boolean;
  className?: string;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  currentWeek,
  onSelectWeek,
  maxWeek = 18,
  disabled = false,
  isChopped = false,
  className = '',
}) => {
  const weeks = Array.from({ length: maxWeek }, (_, i) => i + 1);

  const canPrev = currentWeek > 1;
  const canNext = currentWeek < maxWeek;

  const handlePrev = () => {
    if (canPrev && !disabled) {
      onSelectWeek(currentWeek - 1);
    }
  };

  const handleNext = () => {
    if (canNext && !disabled) {
      onSelectWeek(currentWeek + 1);
    }
  };

  return (
    <div
      id="week-selector-container"
      className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 shadow-inner ${className}`}
    >
      {/* Previous Week Arrow */}
      <button
        type="button"
        id="week-selector-prev-btn"
        onClick={handlePrev}
        disabled={!canPrev || disabled}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        title="Previous Week"
        aria-label="Previous Week"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Quick 1-Click Pills for Week 1 and Week 2 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          id="week-pill-1"
          onClick={() => onSelectWeek(1)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentWeek === 1
              ? isChopped
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30 ring-1 ring-rose-400/40'
                : 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 ring-1 ring-emerald-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
          title="Switch to Week 1"
        >
          <span>Wk 1</span>
        </button>

        <button
          type="button"
          id="week-pill-2"
          onClick={() => onSelectWeek(2)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentWeek === 2
              ? isChopped
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30 ring-1 ring-rose-400/40'
                : 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 ring-1 ring-emerald-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
          }`}
          title="Switch to Week 2"
        >
          <span>Wk 2</span>
        </button>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* Week Dropdown Selector for full Season 2026 (Weeks 1-18) */}
      <div className="relative flex items-center">
        <label htmlFor="week-dropdown-select" className="sr-only">
          Select NFL Week
        </label>
        <select
          id="week-dropdown-select"
          value={currentWeek}
          onChange={(e) => onSelectWeek(Number(e.target.value))}
          disabled={disabled}
          className={`appearance-none pl-7 pr-6 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 focus:outline-none focus:ring-1 cursor-pointer ${
            isChopped ? 'focus:ring-rose-500' : 'focus:ring-emerald-500'
          }`}
        >
          {weeks.map((w) => (
            <option key={w} value={w} className="bg-slate-900 text-slate-100">
              Week {w}
            </option>
          ))}
        </select>
        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
        <span className="text-[10px] text-slate-500 absolute right-1.5 pointer-events-none">▾</span>
      </div>

      {/* Next Week Arrow */}
      <button
        type="button"
        id="week-selector-next-btn"
        onClick={handleNext}
        disabled={!canNext || disabled}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        title="Next Week"
        aria-label="Next Week"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
