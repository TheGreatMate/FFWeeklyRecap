import React, { useState } from 'react';
import {
  Printer,
  Edit3,
  Check,
  RotateCcw,
  Trophy,
  Skull,
  Zap,
  Flame,
  Award,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { GazetteReportData } from '../types';

interface WeeklyGazetteReportProps {
  data: GazetteReportData;
  onUpdateData?: (updated: GazetteReportData) => void;
  onResetData?: () => void;
}

export const WeeklyGazetteReport: React.FC<WeeklyGazetteReportProps> = ({
  data,
  onUpdateData,
  onResetData,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState<GazetteReportData>(data);

  // Sync when prop updates
  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleFieldChange = (field: keyof GazetteReportData, value: any) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    if (onUpdateData) onUpdateData(updated);
  };

  const handleNestedChange = (
    section: 'commissionerNotebook' | 'blowoutOfTheWeek' | 'gmOfTheWeek' | 'galaxyBrainMove' | 'boneheadMove' | 'unluckyBastard',
    field: string,
    value: any
  ) => {
    const currentSection = (localData as any)[section];
    if (!currentSection) return;
    const updatedSection = { ...currentSection, [field]: value };
    const updated = { ...localData, [section]: updatedSection };
    setLocalData(updated);
    if (onUpdateData) onUpdateData(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl print:hidden">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 text-[11px]">
            Gazette View
          </span>
          <span>3-Page Executive Weekly League Newspaper (Print & PDF Ready)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isEditing
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Done Editing' : 'Customize Text'}</span>
          </button>

          {onResetData && (
            <button
              type="button"
              onClick={onResetData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Reset to default calculations"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Gazette Document Container (A4 / Letter Print Friendly) */}
      <div
        id="gazette-document"
        className="bg-white text-slate-900 font-sans shadow-2xl rounded-2xl print:rounded-none overflow-hidden print:overflow-visible print:shadow-none print:m-0"
      >
        {/* ========================================================
            PAGE 1: THE FRONT PAGE / REST OF WEEK 1 & HEADLINE STORY
            ======================================================== */}
        <section className="p-8 sm:p-12 min-h-[1050px] flex flex-col justify-between border-b-4 border-dashed border-slate-200 print:border-none print:break-after-page print:p-8">
          <div>
            {/* Masthead */}
            <header className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2">
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={localData.leagueName}
                      onChange={(e) => handleFieldChange('leagueName', e.target.value)}
                      className="w-full text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-950 border-b border-amber-400 focus:outline-none"
                    />
                  ) : (
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-slate-950">
                      THE {localData.leagueName}
                    </h1>
                  )}
                  <p className="text-xs sm:text-sm font-bold tracking-wider text-slate-600 uppercase mt-1">
                    WEEK {localData.week} • {localData.editionTag} • {localData.date}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-sm">
                    {localData.motto}
                  </span>
                </div>
              </div>
            </header>

            {/* Highlights Grid & Standings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
              {/* Left 3 Columns: Blowout, GM of Week, Galaxy Brain Move */}
              <div className="lg:col-span-8 space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-900 pb-1">
                  THE REST OF WEEK {localData.week}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card 1: Blowout of the Week */}
                  <div className="border border-slate-200 rounded-sm p-3 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-black text-slate-900 mb-1 border-b border-slate-200 pb-1">
                        <span>Blowout of the Week</span>
                        <Flame className="w-3.5 h-3.5 text-rose-600" />
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        {localData.blowoutOfTheWeek.winner} {localData.blowoutOfTheWeek.winnerPts} | {localData.blowoutOfTheWeek.loser} {localData.blowoutOfTheWeek.loserPts}
                      </div>
                      <div className="text-[11px] font-semibold text-rose-700 mt-0.5">
                        {localData.blowoutOfTheWeek.margin} point margin
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug mt-1.5">
                        {localData.blowoutOfTheWeek.recap}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className="h-24 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-sm overflow-hidden relative flex items-center justify-around px-2 py-1 border border-slate-300">
                        {/* Winner Team Avatar */}
                        <div className="flex flex-col items-center z-10">
                          <div className="relative">
                            <img
                              src={
                                localData.blowoutOfTheWeek.winnerAvatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(localData.blowoutOfTheWeek.winner)}`
                              }
                              alt={localData.blowoutOfTheWeek.winner}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md bg-white"
                            />
                            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-black px-1 rounded-full shadow">
                              W
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-200 mt-1 max-w-[70px] truncate text-center">
                            {localData.blowoutOfTheWeek.winner}
                          </span>
                        </div>

                        {/* Center Score / Defeat Stamp */}
                        <div className="flex flex-col items-center justify-center z-10 px-1 text-center">
                          <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
                            +{localData.blowoutOfTheWeek.margin} PT
                          </span>
                          <span className="text-[8px] font-serif italic text-slate-400">
                            BLOWOUT
                          </span>
                        </div>

                        {/* Loser Team Avatar */}
                        <div className="flex flex-col items-center z-10">
                          <div className="relative">
                            <img
                              src={
                                localData.blowoutOfTheWeek.loserAvatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(localData.blowoutOfTheWeek.loser)}`
                              }
                              alt={localData.blowoutOfTheWeek.loser}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-full object-cover border-2 border-rose-500/80 grayscale contrast-125 shadow-md bg-white"
                            />
                            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black px-1 rounded-full shadow">
                              L
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 mt-1 max-w-[70px] truncate text-center">
                            {localData.blowoutOfTheWeek.loser}
                          </span>
                        </div>

                        {/* Bottom caption banner */}
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-1 py-0.5 text-center">
                          <span className="text-[8px] text-slate-300 font-medium truncate block">
                            {localData.blowoutOfTheWeek.reactionCaption}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: GM of the Week */}
                  <div className="border border-slate-200 rounded-sm p-3 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-black text-slate-900 mb-1 border-b border-slate-200 pb-1">
                        <span>GM of the Week</span>
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="text-xs font-black text-slate-900">
                        {localData.gmOfTheWeek.manager}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                        {localData.gmOfTheWeek.points} pts • {localData.gmOfTheWeek.record}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug mt-1.5">
                        {localData.gmOfTheWeek.rationale}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className="h-24 bg-gradient-to-b from-amber-500/10 to-amber-600/20 rounded-sm overflow-hidden relative flex items-center justify-center p-2 border border-amber-300/80">
                        <div className="flex items-center gap-3 z-10 w-full px-1">
                          <div className="relative shrink-0">
                            <img
                              src={
                                localData.gmOfTheWeek.avatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(localData.gmOfTheWeek.manager)}`
                              }
                              alt={localData.gmOfTheWeek.manager}
                              referrerPolicy="no-referrer"
                              className="w-13 h-13 rounded-full object-cover border-2 border-amber-500 shadow-md bg-white"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow">
                              <Trophy className="w-3 h-3" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-amber-900 uppercase tracking-wide block truncate">
                              {localData.gmOfTheWeek.teamName || localData.gmOfTheWeek.manager}
                            </span>
                            <span className="text-xs font-black text-slate-900 block truncate">
                              {localData.gmOfTheWeek.manager}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 block">
                              {localData.gmOfTheWeek.points} pts • {localData.gmOfTheWeek.record}
                            </span>
                          </div>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-amber-950/85 px-1 py-0.5 text-center">
                          <span className="text-[8px] text-amber-200 font-medium truncate block">
                            {localData.gmOfTheWeek.manager} sets the standard.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Galaxy Brain Move */}
                  <div className="border border-slate-200 rounded-sm p-3 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-black text-slate-900 mb-1 border-b border-slate-200 pb-1">
                        <span>Galaxy Brain Move</span>
                        <Zap className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div className="text-xs font-black text-slate-900">
                        {localData.galaxyBrainMove.manager}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug mt-1.5">
                        {localData.galaxyBrainMove.rationale}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className="h-24 bg-gradient-to-b from-indigo-950 to-slate-900 rounded-sm overflow-hidden relative flex items-center justify-center p-2 border border-indigo-400/50">
                        <div className="flex items-center gap-3 z-10 w-full px-1">
                          <div className="relative shrink-0">
                            <img
                              src={
                                localData.galaxyBrainMove.avatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(localData.galaxyBrainMove.manager)}`
                              }
                              alt={localData.galaxyBrainMove.manager}
                              referrerPolicy="no-referrer"
                              className="w-13 h-13 rounded-full object-cover border-2 border-indigo-400 shadow-md bg-white"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full shadow">
                              <Zap className="w-3 h-3" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wide block truncate">
                              {localData.galaxyBrainMove.moveTitle}
                            </span>
                            <span className="text-xs font-black text-white block truncate">
                              {localData.galaxyBrainMove.manager}
                            </span>
                            <span className="text-[10px] text-slate-300 block truncate">
                              {localData.galaxyBrainMove.teamName || 'Roster Mastermind'}
                            </span>
                          </div>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-1 py-0.5 text-center">
                          <span className="text-[8px] text-indigo-200 font-medium truncate block">
                            {localData.galaxyBrainMove.caption}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Week Standings */}
              <div className="lg:col-span-4">
                <div className="bg-slate-900 text-white text-xs font-black px-2.5 py-1 uppercase tracking-wider flex items-center justify-between">
                  <span>WEEK {localData.week} STANDINGS</span>
                </div>
                <div className="border border-slate-200 border-t-0 divide-y divide-slate-100 text-[11px]">
                  <div className="grid grid-cols-12 px-2 py-1 bg-slate-100 font-bold text-slate-600 text-[10px] uppercase">
                    <span className="col-span-2">#</span>
                    <span className="col-span-5">Manager</span>
                    <span className="col-span-2 text-center">Record</span>
                    <span className="col-span-3 text-right">Points</span>
                  </div>
                  {localData.pointsLeaderboard.slice(0, 12).map((team) => (
                    <div
                      key={team.rank}
                      className={`grid grid-cols-12 px-2 py-1 items-center ${
                        team.rank % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'
                      }`}
                    >
                      <span className="col-span-2 font-bold text-slate-500">{team.rank}</span>
                      <div className="col-span-5 flex items-center gap-1.5 min-w-0 pr-1">
                        {team.avatarUrl && (
                          <img
                            src={team.avatarUrl}
                            alt={team.manager}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-300 bg-white"
                          />
                        )}
                        <span className="font-semibold text-slate-900 truncate">
                          {team.manager}
                        </span>
                      </div>
                      <span className="col-span-2 text-center text-slate-600 font-medium">
                        {team.record}
                      </span>
                      <span className="col-span-3 text-right font-mono font-bold text-slate-900">
                        {team.points.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lead Headline & Feature Story */}
            <div className="mb-6">
              {isEditing ? (
                <input
                  type="text"
                  value={localData.leadHeadline}
                  onChange={(e) => handleFieldChange('leadHeadline', e.target.value)}
                  className="w-full text-xl sm:text-2xl font-black uppercase text-slate-950 border-b border-amber-400 focus:outline-none mb-2"
                />
              ) : (
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 mb-2">
                  {localData.leadHeadline}
                </h2>
              )}

              {isEditing ? (
                <textarea
                  value={localData.leadStory}
                  onChange={(e) => handleFieldChange('leadStory', e.target.value)}
                  rows={3}
                  className="w-full p-2 text-xs text-slate-700 border border-slate-300 rounded focus:outline-none"
                />
              ) : (
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif">
                  {localData.leadStory}
                </p>
              )}

              {/* Lead Feature Press Photo Box */}
              {localData.leadPhoto && (
                <div className="my-3.5 border border-slate-300 bg-slate-100/90 p-2.5 rounded-sm flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2.5 shrink-0">
                    {localData.leadPhoto.primaryAvatarUrl && (
                      <div className="relative">
                        <img
                          src={localData.leadPhoto.primaryAvatarUrl}
                          alt={localData.leadPhoto.primaryName || 'Featured Team'}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-full object-cover border-2 border-slate-900 shadow bg-white"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[8px] font-black px-1 rounded uppercase">
                          👑
                        </span>
                      </div>
                    )}
                    {localData.leadPhoto.opponentAvatarUrl && (
                      <>
                        <span className="text-xs font-black text-slate-400">VS</span>
                        <div className="relative">
                          <img
                            src={localData.leadPhoto.opponentAvatarUrl}
                            alt={localData.leadPhoto.opponentName || 'Opponent'}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border border-slate-400 shadow bg-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-xs">
                        {localData.leadPhoto.badgeText || 'LEAGUE ARCHIVES'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-900 uppercase truncate">
                        {localData.leadPhoto.headline}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-serif leading-snug">
                      {localData.leadPhoto.caption}
                    </p>
                  </div>
                </div>
              )}

              {/* 3-Item Metrics Ribbon */}
              <div className="grid grid-cols-3 gap-0 bg-slate-900 text-white text-[11px] font-bold mt-4">
                <div className="p-2 border-r border-slate-700">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">
                    GAME OF THE WEEK
                  </span>
                  <span className="font-semibold text-white">
                    {localData.pointsLeaderboard[0]?.manager} {localData.pointsLeaderboard[0]?.points} •{' '}
                    {localData.unluckyBastard?.manager || localData.pointsLeaderboard[1]?.manager}{' '}
                    {localData.unluckyBastard?.points || localData.pointsLeaderboard[1]?.points}
                  </span>
                </div>
                <div className="p-2 border-r border-slate-700">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">
                    BLOWOUT OF THE WEEK
                  </span>
                  <span className="font-semibold text-white">
                    {localData.blowoutOfTheWeek.winner} {localData.blowoutOfTheWeek.winnerPts} def.{' '}
                    {localData.blowoutOfTheWeek.loser} ({localData.blowoutOfTheWeek.margin} margin)
                  </span>
                </div>
                <div className="p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">
                    GM OF THE WEEK
                  </span>
                  <span className="font-semibold text-white">
                    {localData.gmOfTheWeek.manager} ({localData.gmOfTheWeek.points} pts • {localData.gmOfTheWeek.record})
                  </span>
                </div>
              </div>
            </div>

            {/* Monday Night Fallout & Unlucky Bastard Club */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 mb-1">
                  MONDAY NIGHT FALLOUT
                </h3>
                {isEditing ? (
                  <textarea
                    value={localData.mondayNightFallout}
                    onChange={(e) => handleFieldChange('mondayNightFallout', e.target.value)}
                    rows={2}
                    className="w-full p-2 text-xs text-slate-700 border border-slate-300 rounded focus:outline-none"
                  />
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed font-serif">
                    {localData.mondayNightFallout}
                  </p>
                )}
              </div>

              {localData.unluckyBastard && (
                <div className="border border-rose-200/90 rounded-sm p-2.5 bg-rose-50/40">
                  <div className="flex items-start gap-3">
                    {localData.unluckyBastard.avatarUrl && (
                      <div className="relative shrink-0 mt-0.5">
                        <img
                          src={localData.unluckyBastard.avatarUrl}
                          alt={localData.unluckyBastard.manager}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border-2 border-rose-400 shadow-sm bg-white"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[8px] font-black px-1 rounded-full">
                          💔
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-black uppercase tracking-wider text-rose-700 mb-0.5 flex items-center justify-between">
                        <span>THE UNLUCKY BASTARD CLUB</span>
                        <span className="text-[10px] font-bold text-slate-600 font-mono">
                          {localData.unluckyBastard.points} pts in defeat
                        </span>
                      </h3>
                      {isEditing ? (
                        <textarea
                          value={localData.unluckyBastard.blurb}
                          onChange={(e) => handleNestedChange('unluckyBastard', 'blurb', e.target.value)}
                          rows={2}
                          className="w-full p-2 text-xs text-slate-700 border border-slate-300 rounded focus:outline-none"
                        />
                      ) : (
                        <p className="text-xs text-slate-700 leading-relaxed font-serif">
                          {localData.unluckyBastard.blurb}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Page 1 Footer */}
          <footer className="pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>
              {localData.leagueName} — {localData.editionTag}
            </span>
            <span>Page 1</span>
          </footer>
        </section>

        {/* ========================================================
            PAGE 2: THE WEEK LEDGER, POINTS LEADERBOARD & SIDE POT
            ======================================================== */}
        <section className="p-8 sm:p-12 min-h-[1050px] flex flex-col justify-between border-b-4 border-dashed border-slate-200 print:border-none print:break-after-page print:p-8">
          <div>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-950">
                THE WEEK {localData.week} LEDGER
              </h2>
              <p className="text-xs font-serif italic text-slate-600 mt-0.5">
                Every matchup. Every result. Every excuse.
              </p>
            </div>

            {/* The Ledger Table */}
            <div className="border border-slate-300 mb-8 rounded-sm overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-2">
                <span className="col-span-2">Winner</span>
                <span className="col-span-1 text-center">PTS</span>
                <span className="col-span-2">Loser</span>
                <span className="col-span-1 text-center">PTS</span>
                <span className="col-span-6 pl-2">Recap</span>
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                {localData.matchupLedger.map((m, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 px-3 py-2 items-center ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <div className="col-span-2 flex items-center gap-1.5 min-w-0 pr-1">
                      {m.winnerAvatarUrl && (
                        <img
                          src={m.winnerAvatarUrl}
                          alt={m.winner}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover shrink-0 border border-emerald-500 bg-white"
                        />
                      )}
                      <span className="font-bold text-slate-900 truncate">{m.winner}</span>
                    </div>
                    <span className="col-span-1 text-center font-mono font-semibold text-slate-800">
                      {m.winnerPts.toFixed(2)}
                    </span>
                    <div className="col-span-2 flex items-center gap-1.5 min-w-0 pr-1">
                      {m.loserAvatarUrl && (
                        <img
                          src={m.loserAvatarUrl}
                          alt={m.loser}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-300 bg-white"
                        />
                      )}
                      <span className="font-medium text-slate-700 truncate">{m.loser}</span>
                    </div>
                    <span className="col-span-1 text-center font-mono text-slate-600">
                      {m.loserPts.toFixed(2)}
                    </span>
                    <span className="col-span-6 pl-2 text-[11px] text-slate-600 font-serif leading-snug">
                      {m.recap}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Points Leaderboard */}
            <div className="mb-8">
              <h3 className="text-base font-black uppercase tracking-tight text-slate-950 mb-2">
                FINAL POINTS LEADERBOARD
              </h3>
              <div className="border border-slate-300 rounded-sm overflow-hidden max-w-xl">
                <div className="grid grid-cols-12 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5">
                  <span className="col-span-2">#</span>
                  <span className="col-span-6">Manager</span>
                  <span className="col-span-2 text-right">PTS</span>
                  <span className="col-span-2 text-right">REC</span>
                </div>
                <div className="divide-y divide-slate-200 text-xs">
                  {localData.pointsLeaderboard.map((team) => (
                    <div
                      key={team.rank}
                      className={`grid grid-cols-12 px-3 py-1.5 items-center ${
                        team.rank % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                      }`}
                    >
                      <span className="col-span-2 font-bold text-slate-500">{team.rank}</span>
                      <div className="col-span-6 flex items-center gap-1.5 min-w-0 pr-1">
                        {team.avatarUrl && (
                          <img
                            src={team.avatarUrl}
                            alt={team.manager}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-300 bg-white"
                          />
                        )}
                        <span className="font-semibold text-slate-900 truncate">
                          {team.manager}
                        </span>
                      </div>
                      <span className="col-span-2 text-right font-mono font-bold text-slate-900">
                        {team.points.toFixed(2)}
                      </span>
                      <span className="col-span-2 text-right text-slate-600 font-medium">
                        {team.record}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Pot Desk */}
            {localData.sidePotDesk.enabled && (
              <div className="border-2 border-red-800 rounded-sm overflow-hidden mb-6">
                <div className="bg-red-800 text-white px-3 py-1.5 flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span>SIDE POT DESK</span>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="grid grid-cols-3 divide-x divide-red-200 bg-red-50/50 text-xs text-slate-900">
                  <div className="p-3">
                    <span className="block text-[10px] font-bold text-red-900 uppercase">
                      WEEK {localData.week} TOTAL POT
                    </span>
                    <span className="text-base font-black font-mono text-slate-900 block mt-0.5">
                      ${localData.sidePotDesk.totalPot.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {localData.sidePotDesk.entriesCount} entries × ${localData.sidePotDesk.entryFee}
                    </span>
                  </div>

                  <div className="p-3 flex items-center gap-2.5">
                    {localData.sidePotDesk.pointsWinnerAvatarUrl && (
                      <img
                        src={localData.sidePotDesk.pointsWinnerAvatarUrl}
                        alt={localData.sidePotDesk.pointsWinnerName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border-2 border-amber-500 shadow-sm shrink-0 bg-white"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold text-red-900 uppercase">
                        #1 POINTS
                      </span>
                      <span className="text-sm font-bold text-slate-900 block mt-0.5 truncate">
                        {localData.sidePotDesk.pointsWinnerName}
                      </span>
                      <span className="text-xs font-bold font-mono text-red-700">
                        ${localData.sidePotDesk.pointsPayout.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 flex items-center gap-2.5">
                    {localData.sidePotDesk.blowoutWinnerAvatarUrl && (
                      <img
                        src={localData.sidePotDesk.blowoutWinnerAvatarUrl}
                        alt={localData.sidePotDesk.blowoutWinnerName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border-2 border-red-500 shadow-sm shrink-0 bg-white"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold text-red-900 uppercase">
                        BIGGEST BLOWOUT
                      </span>
                      <span className="text-sm font-bold text-slate-900 block mt-0.5 truncate">
                        {localData.sidePotDesk.blowoutWinnerName}
                      </span>
                      <span className="text-xs font-bold font-mono text-red-700">
                        ${localData.sidePotDesk.blowoutPayout.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-100/70 px-3 py-1.5 text-[11px] text-red-900 font-semibold border-t border-red-200 flex justify-between">
                  <span>WEEK {localData.week + 1}: Entry fee: ${localData.sidePotDesk.nextWeekFee}</span>
                  <span>Due before TNF kickoff</span>
                </div>
              </div>
            )}
          </div>

          {/* Page 2 Footer */}
          <footer className="pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>
              {localData.leagueName} — {localData.editionTag}
            </span>
            <span>Page 2</span>
          </footer>
        </section>

        {/* ========================================================
            PAGE 3: POWER RANKINGS & THE COMMISSIONER'S NOTEBOOK
            ======================================================== */}
        <section className="p-8 sm:p-12 min-h-[1050px] flex flex-col justify-between print:p-8">
          <div>
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-950">
                POWER RANKINGS
              </h2>
              <p className="text-xs font-serif italic text-slate-600 mt-0.5">
                Subjective. Unapologetic. Based on one week of evidence.
              </p>
            </div>

            {/* Power Rankings Table */}
            <div className="border border-slate-300 rounded-sm overflow-hidden mb-8">
              <div className="grid grid-cols-12 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5">
                <span className="col-span-1">#</span>
                <span className="col-span-3">Manager</span>
                <span className="col-span-8">Assessment / Evidence</span>
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                {localData.powerRankings.map((p) => (
                  <div
                    key={p.rank}
                    className={`grid grid-cols-12 px-3 py-1.5 items-center ${
                      p.rank % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                    }`}
                  >
                    <span className="col-span-1 font-bold text-slate-500">{p.rank}</span>
                    <div className="col-span-3 flex items-center gap-1.5 min-w-0 pr-1">
                      {p.avatarUrl && (
                        <img
                          src={p.avatarUrl}
                          alt={p.manager}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-300 bg-white"
                        />
                      )}
                      <span className="font-semibold text-slate-900 truncate">
                        {p.manager}
                      </span>
                    </div>
                    <span className="col-span-8 text-[11px] text-slate-700 font-serif leading-snug">
                      {p.rationale}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* The Commissioner's Notebook */}
            <div className="mb-6 space-y-3">
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-950 border-b-2 border-slate-900 pb-1">
                THE COMMISSIONER'S NOTEBOOK
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs font-serif">
                <div>
                  <h4 className="font-sans font-black uppercase text-rose-600 text-[11px]">
                    FRAUD WATCH
                  </h4>
                  <p className="text-slate-700 mt-0.5">{localData.commissionerNotebook.fraudWatch}</p>
                </div>

                <div>
                  <h4 className="font-sans font-black uppercase text-rose-600 text-[11px]">
                    STOCK UP
                  </h4>
                  <p className="text-slate-700 mt-0.5">{localData.commissionerNotebook.stockUp}</p>
                </div>

                <div>
                  <h4 className="font-sans font-black uppercase text-rose-600 text-[11px]">
                    STOCK DOWN
                  </h4>
                  <p className="text-slate-700 mt-0.5">{localData.commissionerNotebook.stockDown}</p>
                </div>

                <div>
                  <h4 className="font-sans font-black uppercase text-rose-600 text-[11px]">
                    GALAXY BRAIN MOVE
                  </h4>
                  <p className="text-slate-700 mt-0.5">{localData.commissionerNotebook.galaxyBrain}</p>
                </div>

                <div>
                  <h4 className="font-sans font-black uppercase text-rose-600 text-[11px]">
                    BONEHEAD MOVE
                  </h4>
                  <p className="text-slate-700 mt-0.5">{localData.commissionerNotebook.bonehead}</p>
                </div>

                <div>
                  <h4 className="font-sans font-black uppercase text-rose-600 text-[11px]">
                    LEAGUE CANON
                  </h4>
                  <p className="text-slate-700 mt-0.5">{localData.commissionerNotebook.leagueCanon}</p>
                </div>

                <div>
                  <h4 className="font-sans font-black uppercase text-rose-600 text-[11px]">
                    AROUND THE LEAGUE
                  </h4>
                  <p className="text-slate-700 mt-0.5">{localData.commissionerNotebook.aroundTheLeague}</p>
                </div>

                <div>
                  <h4 className="font-sans font-black uppercase text-rose-600 text-[11px]">
                    WEEK {localData.week + 1} WARNING
                  </h4>
                  <p className="text-slate-700 mt-0.5">{localData.commissionerNotebook.nextWeekWarning}</p>
                </div>
              </div>
            </div>

            {/* Final Word */}
            <div className="pt-2 border-t border-slate-200">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 mb-1">
                FINAL WORD
              </h3>
              <p className="text-xs sm:text-sm font-serif font-semibold text-slate-900 leading-relaxed">
                {localData.commissionerNotebook.finalWord}
              </p>
            </div>
          </div>

          {/* Page 3 Footer */}
          <footer className="pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>
              {localData.leagueName} — {localData.editionTag}
            </span>
            <span>Page 3</span>
          </footer>
        </section>
      </div>
    </div>
  );
};
