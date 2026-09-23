import React from 'react';
import { Trophy } from 'lucide-react';
import { WeekSelector } from './WeekSelector';

interface NavbarProps {
  selectedWeek?: number;
  onSelectWeek?: (week: number) => void;
  isDualWeek?: boolean;
  onToggleDualWeek?: () => void;
  isChopped?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedWeek,
  onSelectWeek,
  isDualWeek = false,
  onToggleDualWeek,
  isChopped = false,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold shrink-0">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                FFWeeklyRecap
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                2026 Season
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Weekly Commissioner Gazette, Blowouts & Sleeper League Honors
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Week Selector in Header */}
          {selectedWeek !== undefined && onSelectWeek && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline">
                Week:
              </span>
              <WeekSelector
                currentWeek={selectedWeek}
                onSelectWeek={onSelectWeek}
                isDualWeek={isDualWeek}
                onToggleDualWeek={onToggleDualWeek}
                isChopped={isChopped}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

