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
  Download,
  FileDown,
  Loader2,
  Moon,
  Sun,
} from 'lucide-react';
import { GazetteReportData } from '../types';
import { printGazetteElement, downloadGazetteHTML } from '../utils/printGazette';
import { exportGazetteToPdf } from '../utils/exportPdf';

interface WeeklyGazetteReportProps {
  data: GazetteReportData;
  onUpdateData?: (updated: GazetteReportData) => void;
  onResetData?: () => void;
}

function cleanDisplayStory(text: string): string {
  if (!text) return '';
  return text
    // Remove tone labels e.g. *Tone: ROAST*, Tone: ROAST, Tone Requirements: ...
    .replace(/^\*?Tone\s*:\s*[A-Z_a-z\s-]+\*?\s*/gim, '')
    .replace(/^Tone\s+(?:Requirements?|Guidelines?):[^\r\n]*\r?\n?/gim, '')
    // Strip leading markdown headers e.g. # ... or ## ...
    .replace(/^#+\s+[^\r\n]*\r?\n?/gm, '')
    // Strip bullet points at start of line
    .replace(/^[-*]\s+/gm, '')
    // Strip bold/italic markdown marks
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim();
}

export const WeeklyGazetteReport: React.FC<WeeklyGazetteReportProps> = ({
  data,
  onUpdateData,
  onResetData,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState<GazetteReportData>(data);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gazette_dark_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gazette_dark_mode', String(next));
      } catch {}
      return next;
    });
  };

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

  const handleBlunderTextChange = (index: number, newBlurb: string) => {
    if (!localData.positionalBlunders) return;
    const updated = [...localData.positionalBlunders];
    updated[index] = { ...updated[index], blurb: newBlurb };
    const updatedData = { ...localData, positionalBlunders: updated };
    if (index === 0) {
      updatedData.topPositionalBlunder = updated[0];
      if (updatedData.commissionerNotebook) {
        updatedData.commissionerNotebook = {
          ...updatedData.commissionerNotebook,
          bonehead: newBlurb,
        };
      }
    }
    setLocalData(updatedData);
    if (onUpdateData) onUpdateData(updatedData);
  };

  const handleShuffleBlunder = (index: number) => {
    if (!localData.positionalBlunders) return;
    const current = localData.positionalBlunders[index];
    if (!current) return;
    const pool = [current.blurb, ...(current.alternativeBlurbs || [])];
    if (pool.length <= 1) return;
    const currentIndex = pool.indexOf(current.blurb);
    const nextIndex = (currentIndex + 1) % pool.length;
    const nextBlurb = pool[nextIndex];

    const updated = [...localData.positionalBlunders];
    updated[index] = {
      ...current,
      blurb: nextBlurb,
    };
    const updatedData = { ...localData, positionalBlunders: updated };
    if (index === 0) {
      updatedData.topPositionalBlunder = updated[0];
      if (updatedData.commissionerNotebook) {
        updatedData.commissionerNotebook = {
          ...updatedData.commissionerNotebook,
          bonehead: nextBlurb,
        };
      }
    }
    setLocalData(updatedData);
    if (onUpdateData) onUpdateData(updatedData);
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');

  const handleDirectSavePdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfProgress('Initializing PDF engine...');
    try {
      await exportGazetteToPdf({
        leagueName: localData.leagueName,
        week: localData.week,
        isDarkMode,
        onProgress: (prog) => {
          setPdfProgress(prog.message);
        },
      });
    } catch (err) {
      console.error('Failed to generate PDF directly:', err);
      alert('Could not generate PDF directly. You can also try "Print / System PDF" or "Save Standalone HTML".');
    } finally {
      setIsExportingPdf(false);
      setPdfProgress('');
    }
  };

  const handlePrint = () => {
    printGazetteElement('gazette-document', isDarkMode);
  };

  const handleDownloadStandalone = () => {
    downloadGazetteHTML(
      document.getElementById('gazette-document'),
      localData.leagueName,
      localData.week,
      isDarkMode
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl print:hidden">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 text-[11px]">
            Gazette View
          </span>
          <span>3-Page Executive Weekly League Newspaper</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            id="gazette-theme-toggle-btn"
            onClick={handleToggleDarkMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title={isDarkMode ? 'Switch to Classic Newsprint (Light Mode)' : 'Switch to Midnight Edition (Dark Mode)'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            type="button"
            id="gazette-customize-text-btn"
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
              id="gazette-reset-data-btn"
              onClick={onResetData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Reset to default calculations"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Direct Save to PDF Button (Retains Dark Background and Colors) */}
          <button
            type="button"
            id="gazette-direct-pdf-btn"
            onClick={handleDirectSavePdf}
            disabled={isExportingPdf}
            className={`px-3.5 py-1.5 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer ${
              isExportingPdf
                ? 'bg-indigo-800 opacity-90 cursor-wait'
                : isDarkMode
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 ring-1 ring-emerald-400/50'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
            title="Download 3-page PDF directly preserving exact dark background, fonts, and graphics"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>
              {isExportingPdf
                ? (pdfProgress || 'Saving PDF...')
                : isDarkMode
                ? 'Save PDF (Dark Mode)'
                : 'Save as PDF'}
            </span>
          </button>

          <button
            type="button"
            id="gazette-download-html-btn"
            onClick={handleDownloadStandalone}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Download standalone HTML file with pre-formatted print styles"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Save HTML</span>
          </button>

          <button
            type="button"
            id="gazette-top-print-btn"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Open system print dialog"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Generating PDF progress banner */}
      {isExportingPdf && (
        <div className="bg-indigo-950/90 border border-indigo-700 text-indigo-100 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-xl print:hidden animate-pulse">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />
            <div>
              <p className="font-bold text-sm text-white">{pdfProgress || 'Generating 3-Page PDF...'}</p>
              <p className="text-[11px] text-indigo-200">
                Capturing pages at 2x high resolution with full {isDarkMode ? 'dark background' : 'light'} fidelity.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 bg-indigo-900 border border-indigo-600 rounded text-amber-300 font-bold">
            {isDarkMode ? 'Midnight Canvas' : 'Print Canvas'}
          </span>
        </div>
      )}

      {/* Gazette Document Container (A4 / Letter Print Friendly) */}
      <div
        id="gazette-document"
        className={`${
          isDarkMode
            ? 'gazette-dark bg-[#0b0f19] text-slate-100 border border-slate-800'
            : 'bg-white text-slate-900'
        } font-sans shadow-2xl rounded-2xl print:rounded-none overflow-hidden print:overflow-visible print:shadow-none print:m-0 transition-colors duration-200`}
      >
        {/* ========================================================
            PAGE 1: THE FRONT PAGE / REST OF WEEK 1 & HEADLINE STORY
            ======================================================== */}
        <section
          data-gazette-page="1"
          id="gazette-page-1"
          className={`p-8 sm:p-12 min-h-[1050px] flex flex-col justify-between border-b-4 border-dashed print:border-none print:break-after-page print:p-8 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div>
            {/* Masthead */}
            <header className={`border-b-2 pb-4 mb-6 ${isDarkMode ? 'border-slate-700' : 'border-slate-900'}`}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2">
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={localData.leagueName}
                      onChange={(e) => handleFieldChange('leagueName', e.target.value)}
                      className={`w-full text-3xl sm:text-4xl font-black uppercase tracking-tight border-b focus:outline-none ${isDarkMode ? 'text-white bg-transparent border-amber-400' : 'text-slate-950 border-amber-400'}`}
                    />
                  ) : (
                    <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                      THE {localData.leagueName}
                    </h1>
                  )}
                  <p className={`text-xs sm:text-sm font-bold tracking-wider uppercase mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    WEEK {localData.week} • {localData.editionTag} • {localData.date}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded-sm ${isDarkMode ? 'bg-slate-800 text-amber-300 border border-slate-700' : 'bg-slate-900 text-white'}`}>
                    {localData.motto}
                  </span>
                </div>
              </div>
            </header>

            {/* Highlights Grid & Standings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
              {/* Left 3 Columns: Blowout, GM of Week, Galaxy Brain Move */}
              <div className="lg:col-span-8 space-y-4">
                <h2 className={`text-xs font-black uppercase tracking-widest pb-1 border-b ${isDarkMode ? 'text-slate-200 border-slate-700' : 'text-slate-900 border-slate-900'}`}>
                  THE REST OF WEEK {localData.week}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card 1: Blowout of the Week or Scheduled Marquee Clash */}
                  <div className={`border rounded-sm p-3 flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-50/60 border-slate-200'}`}>
                    <div>
                      <div className={`flex items-center justify-between text-xs font-black mb-1 border-b pb-1 ${isDarkMode ? 'text-white border-slate-700' : 'text-slate-900 border-slate-200'}`}>
                        <span>{localData.isUpcoming ? 'Scheduled Marquee Clash' : 'Blowout of the Week'}</span>
                        {localData.isUpcoming ? (
                          <Zap className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <Flame className="w-3.5 h-3.5 text-rose-600" />
                        )}
                      </div>
                      <div className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        {localData.isUpcoming
                          ? `${localData.blowoutOfTheWeek.winner} vs ${localData.blowoutOfTheWeek.loser}`
                          : `${localData.blowoutOfTheWeek.winner} ${localData.blowoutOfTheWeek.winnerPts} | ${localData.blowoutOfTheWeek.loser} ${localData.blowoutOfTheWeek.loserPts}`}
                      </div>
                      <div className={`text-[11px] font-semibold mt-0.5 ${isDarkMode ? 'text-rose-400 font-bold' : 'text-rose-700'}`}>
                        {localData.isUpcoming
                          ? `Awaiting Week ${localData.week} Kickoff`
                          : `${localData.blowoutOfTheWeek.margin} point margin`}
                      </div>
                      <p className={`text-[11px] leading-snug mt-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {localData.blowoutOfTheWeek.recap}
                      </p>
                    </div>

                    <div className={`mt-3 pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="h-24 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-sm overflow-hidden relative flex items-center justify-around px-2 py-1 border border-slate-700">
                        {/* Winner/Team A Avatar */}
                        <div className="flex flex-col items-center z-10 max-w-[68px]">
                          <div className="relative">
                            <img
                              src={
                                localData.blowoutOfTheWeek.winnerAvatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(localData.blowoutOfTheWeek.winner)}`
                              }
                              alt={localData.blowoutOfTheWeek.winner}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-md bg-white"
                            />
                            {!localData.isUpcoming && (
                              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-black px-1 rounded-full shadow">
                                W
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-slate-200 mt-1 max-w-full truncate text-center">
                            {localData.blowoutOfTheWeek.winner}
                          </span>
                        </div>

                        {/* Center Score / Defeat Stamp */}
                        <div className="flex flex-col items-center justify-center z-10 px-1 text-center shrink-0">
                          <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider whitespace-nowrap">
                            {localData.isUpcoming ? 'VS' : `+${localData.blowoutOfTheWeek.margin} PT`}
                          </span>
                          <span className="text-[8px] font-serif italic text-slate-400">
                            {localData.isUpcoming ? 'SCHEDULED' : 'BLOWOUT'}
                          </span>
                        </div>

                        {/* Loser/Team B Avatar */}
                        <div className="flex flex-col items-center z-10 max-w-[68px]">
                          <div className="relative">
                            <img
                              src={
                                localData.blowoutOfTheWeek.loserAvatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(localData.blowoutOfTheWeek.loser)}`
                              }
                              alt={localData.blowoutOfTheWeek.loser}
                              referrerPolicy="no-referrer"
                              className={`w-10 h-10 rounded-full object-cover border-2 ${
                                localData.isUpcoming ? 'border-indigo-400' : 'border-rose-500/80 grayscale contrast-125'
                              } shadow-md bg-white`}
                            />
                            {!localData.isUpcoming && (
                              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black px-1 rounded-full shadow">
                                L
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 mt-1 max-w-full truncate text-center">
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
                  <div className={`border rounded-sm p-3 flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-50/60 border-slate-200'}`}>
                    <div>
                      <div className={`flex items-center justify-between text-xs font-black mb-1 border-b pb-1 ${isDarkMode ? 'text-white border-slate-700' : 'text-slate-900 border-slate-200'}`}>
                        <span>GM of the Week</span>
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {localData.gmOfTheWeek.manager}
                      </div>
                      <div className={`text-[11px] font-semibold mt-0.5 ${isDarkMode ? 'text-emerald-400 font-bold' : 'text-emerald-700'}`}>
                        {localData.gmOfTheWeek.points} pts • {localData.gmOfTheWeek.record}
                      </div>
                      <p className={`text-[11px] leading-snug mt-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {localData.gmOfTheWeek.rationale}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className={`h-24 rounded-sm overflow-hidden relative flex items-center p-2 border ${isDarkMode ? 'bg-gradient-to-b from-amber-950/50 to-slate-900 border-amber-500/40' : 'bg-gradient-to-b from-amber-500/10 to-amber-600/20 border-amber-300/80'}`}>
                        <div className="flex items-center gap-2.5 z-10 w-full px-1">
                          <div className="relative shrink-0">
                            <img
                              src={
                                localData.gmOfTheWeek.avatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(localData.gmOfTheWeek.manager)}`
                              }
                              alt={localData.gmOfTheWeek.manager}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border-2 border-amber-500 shadow-md bg-white"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow">
                              <Trophy className="w-2.5 h-2.5" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[10px] font-black uppercase tracking-wide block truncate ${isDarkMode ? 'text-amber-300' : 'text-amber-900'}`}>
                              {localData.gmOfTheWeek.teamName || localData.gmOfTheWeek.manager}
                            </span>
                            <span className={`text-xs font-black block truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {localData.gmOfTheWeek.manager}
                            </span>
                            <span className={`text-[10px] font-bold block ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
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
                  <div className={`border rounded-sm p-3 flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-50/60 border-slate-200'}`}>
                    <div>
                      <div className={`flex items-center justify-between text-xs font-black mb-1 border-b pb-1 ${isDarkMode ? 'text-white border-slate-700' : 'text-slate-900 border-slate-200'}`}>
                        <span>Galaxy Brain Move</span>
                        <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {localData.galaxyBrainMove.manager}
                      </div>
                      <p className={`text-[11px] leading-snug mt-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {localData.galaxyBrainMove.rationale}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className="h-24 bg-gradient-to-b from-indigo-950 to-slate-900 rounded-sm overflow-hidden relative flex items-center p-2 border border-indigo-400/50">
                        <div className="flex items-center gap-2.5 z-10 w-full px-1">
                          <div className="relative shrink-0">
                            <img
                              src={
                                localData.galaxyBrainMove.avatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(localData.galaxyBrainMove.manager)}`
                              }
                              alt={localData.galaxyBrainMove.manager}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400 shadow-md bg-white"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full shadow">
                              <Zap className="w-2.5 h-2.5" />
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
                <div className={`border border-t-0 text-[11px] ${isDarkMode ? 'border-slate-800 divide-y divide-slate-800' : 'border-slate-200 divide-y divide-slate-100'}`}>
                  <div className={`grid grid-cols-12 px-2 py-1 font-bold text-[10px] uppercase ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    <span className="col-span-2">#</span>
                    <span className="col-span-5">Manager</span>
                    <span className="col-span-2 text-center">Record</span>
                    <span className="col-span-3 text-right">Points</span>
                  </div>
                  {localData.pointsLeaderboard.slice(0, 12).map((team) => (
                    <div
                      key={team.rank}
                      className={`grid grid-cols-12 px-2 py-1 items-center transition-colors ${
                        team.rank % 2 === 0
                          ? isDarkMode ? 'bg-[#111827] text-slate-100' : 'bg-slate-50/80 text-slate-900'
                          : isDarkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-white text-slate-900'
                      }`}
                    >
                      <span className={`col-span-2 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{team.rank}</span>
                      <div className="col-span-5 flex items-center gap-1.5 min-w-0 pr-1">
                        {team.avatarUrl && (
                          <img
                            src={team.avatarUrl}
                            alt={team.manager}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-400 bg-white"
                          />
                        )}
                        <span className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {team.manager}
                        </span>
                      </div>
                      <span className={`col-span-2 text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {team.record}
                      </span>
                      <span className={`col-span-3 text-right font-mono font-bold ${isDarkMode ? 'text-amber-400' : 'text-slate-900'}`}>
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
                  className={`w-full text-xl sm:text-2xl font-black uppercase border-b focus:outline-none mb-2 ${
                    isDarkMode ? 'text-white bg-transparent border-amber-400' : 'text-slate-950 border-amber-400'
                  }`}
                />
              ) : (
                <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight mb-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-950'
                }`}>
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
                <p className={`text-xs sm:text-sm leading-relaxed font-serif ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {cleanDisplayStory(localData.leadStory)}
                </p>
              )}

              {/* Lead Feature Press Photo Box */}
              {localData.leadPhoto && (
                <div className={`my-3.5 border p-2.5 rounded-sm flex flex-col sm:flex-row items-center gap-3 ${
                  isDarkMode ? 'border-slate-700 bg-slate-900/80' : 'border-slate-300 bg-slate-100/90'
                }`}>
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
                        <span className={`text-xs font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>VS</span>
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
                      <span className={`text-[10px] font-bold uppercase truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {localData.leadPhoto.headline}
                      </span>
                    </div>
                    <p className={`text-[11px] font-serif leading-snug ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {localData.leadPhoto.caption}
                    </p>
                  </div>
                </div>
              )}

              {/* 3-Item Metrics Ribbon */}
              <div className="grid grid-cols-3 gap-0 bg-slate-900 text-white text-[11px] font-bold mt-4">
                <div className="p-2 border-r border-slate-700">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">
                    {localData.isUpcoming ? 'FEATURED CLASH' : 'GAME OF THE WEEK'}
                  </span>
                  <span className="font-semibold text-white truncate block">
                    {localData.isUpcoming
                      ? `${localData.blowoutOfTheWeek.winner} vs ${localData.blowoutOfTheWeek.loser}`
                      : `${localData.pointsLeaderboard[0]?.manager} ${localData.pointsLeaderboard[0]?.points} • ${localData.unluckyBastard?.manager || localData.pointsLeaderboard[1]?.manager} ${localData.unluckyBastard?.points || localData.pointsLeaderboard[1]?.points}`}
                  </span>
                </div>
                <div className="p-2 border-r border-slate-700">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">
                    {localData.isUpcoming ? 'MATCHUP STATUS' : 'BLOWOUT OF THE WEEK'}
                  </span>
                  <span className="font-semibold text-white truncate block">
                    {localData.isUpcoming
                      ? `Week ${localData.week} Kickoff Pending`
                      : `${localData.blowoutOfTheWeek.winner} ${localData.blowoutOfTheWeek.winnerPts} def. ${localData.blowoutOfTheWeek.loser} (${localData.blowoutOfTheWeek.margin} margin)`}
                  </span>
                </div>
                <div className="p-2">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">
                    {localData.isUpcoming ? 'LINEUP ADVISORY' : 'GM OF THE WEEK'}
                  </span>
                  <span className="font-semibold text-white truncate block">
                    {localData.isUpcoming
                      ? `Starters Lock at Kickoff`
                      : `${localData.gmOfTheWeek.manager} (${localData.gmOfTheWeek.points} pts • ${localData.gmOfTheWeek.record})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Monday Night Fallout & Unlucky Bastard Club */}
            <div className="space-y-4">
              <div>
                <h3 className={`text-xs font-black uppercase tracking-wider mb-1 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
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
                  <p className={`text-xs leading-relaxed font-serif ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    {localData.mondayNightFallout}
                  </p>
                )}
              </div>

              {localData.unluckyBastard && (
                <div className={`border rounded-sm p-2.5 ${isDarkMode ? 'border-rose-900/80 bg-rose-950/30' : 'border-rose-200/90 bg-rose-50/40'}`}>
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
                      <h3 className={`text-xs font-black uppercase tracking-wider mb-0.5 flex items-center justify-between ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                        <span>THE UNLUCKY BASTARD CLUB</span>
                        <span className={`text-[10px] font-bold font-mono ${isDarkMode ? 'text-rose-300' : 'text-slate-600'}`}>
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
                        <p className={`text-xs leading-relaxed font-serif ${isDarkMode ? 'text-rose-100' : 'text-slate-700'}`}>
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
          <footer className={`pt-6 border-t flex justify-between items-center text-[10px] font-mono ${
            isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-400'
          }`}>
            <span>
              {localData.leagueName} — {localData.editionTag}
            </span>
            <span>Page 1</span>
          </footer>
        </section>

        {/* ========================================================
            PAGE 2: THE WEEK LEDGER, POINTS LEADERBOARD & SIDE POT
            ======================================================== */}
        <section
          data-gazette-page="2"
          id="gazette-page-2"
          className={`p-8 sm:p-12 min-h-[1050px] flex flex-col justify-between border-b-4 border-dashed print:border-none print:break-after-page print:p-8 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div>
            {/* Header */}
            <div className="mb-6">
              <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-950'
              }`}>
                {localData.isUpcoming ? `THE WEEK ${localData.week} SCHEDULE & MATCHUPS` : `THE WEEK ${localData.week} LEDGER`}
              </h2>
              <p className={`text-xs font-serif italic mt-0.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {localData.isUpcoming
                  ? 'Scheduled head-to-head clashes. Lineups lock at kickoff.'
                  : 'Every matchup. Every result. Every excuse.'}
              </p>
            </div>

            {/* The Ledger Table */}
            <div className={`border mb-8 rounded-sm overflow-hidden ${isDarkMode ? 'border-slate-800' : 'border-slate-300'}`}>
              <div className={`grid grid-cols-12 font-bold text-[10px] uppercase tracking-wider px-3 py-2 ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-900 text-white'}`}>
                <span className="col-span-2">{localData.isUpcoming ? 'Team 1' : 'Winner'}</span>
                <span className="col-span-1 text-center">PTS</span>
                <span className="col-span-2">{localData.isUpcoming ? 'Team 2' : 'Loser'}</span>
                <span className="col-span-1 text-center">PTS</span>
                <span className="col-span-6 pl-2">{localData.isUpcoming ? 'Matchup Preview' : 'Recap'}</span>
              </div>
              <div className={`divide-y text-xs ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                {localData.matchupLedger.map((m, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 px-3 py-2 items-center transition-colors ${
                      idx % 2 === 0
                        ? isDarkMode ? 'bg-[#0b0f19]' : 'bg-white'
                        : isDarkMode ? 'bg-[#111827]' : 'bg-slate-50'
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
                      <span className={`font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.winner}</span>
                    </div>
                    <span className={`col-span-1 text-center font-mono font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-slate-800'}`}>
                      {m.winnerPts.toFixed(2)}
                    </span>
                    <div className="col-span-2 flex items-center gap-1.5 min-w-0 pr-1">
                      {m.loserAvatarUrl && (
                        <img
                          src={m.loserAvatarUrl}
                          alt={m.loser}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-400 bg-white"
                        />
                      )}
                      <span className={`font-medium truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{m.loser}</span>
                    </div>
                    <span className={`col-span-1 text-center font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {m.loserPts.toFixed(2)}
                    </span>
                    <span className={`col-span-6 pl-2 text-[11px] font-serif leading-snug ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {m.recap}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Points Leaderboard */}
            <div className="mb-8">
              <h3 className={`text-base font-black uppercase tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                FINAL POINTS LEADERBOARD
              </h3>
              <div className={`border rounded-sm overflow-hidden max-w-xl ${isDarkMode ? 'border-slate-800' : 'border-slate-300'}`}>
                <div className={`grid grid-cols-12 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-900 text-white'}`}>
                  <span className="col-span-2">#</span>
                  <span className="col-span-6">Manager</span>
                  <span className="col-span-2 text-right">PTS</span>
                  <span className="col-span-2 text-right">REC</span>
                </div>
                <div className={`divide-y text-xs ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                  {localData.pointsLeaderboard.map((team) => (
                    <div
                      key={team.rank}
                      className={`grid grid-cols-12 px-3 py-1.5 items-center transition-colors ${
                        team.rank % 2 === 0
                          ? isDarkMode ? 'bg-[#111827]' : 'bg-slate-50'
                          : isDarkMode ? 'bg-[#0b0f19]' : 'bg-white'
                      }`}
                    >
                      <span className={`col-span-2 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{team.rank}</span>
                      <div className="col-span-6 flex items-center gap-1.5 min-w-0 pr-1">
                        {team.avatarUrl && (
                          <img
                            src={team.avatarUrl}
                            alt={team.manager}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-400 bg-white"
                          />
                        )}
                        <span className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {team.manager}
                        </span>
                      </div>
                      <span className={`col-span-2 text-right font-mono font-bold ${isDarkMode ? 'text-amber-400' : 'text-slate-900'}`}>
                        {team.points.toFixed(2)}
                      </span>
                      <span className={`col-span-2 text-right font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {team.record}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Pot Desk */}
            {localData.sidePotDesk.enabled && (
              <div className={`border-2 rounded-sm overflow-hidden mb-6 ${isDarkMode ? 'border-red-900 bg-red-950/20' : 'border-red-800'}`}>
                <div className="bg-red-800 text-white px-3 py-1.5 flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span>SIDE POT DESK</span>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className={`grid grid-cols-3 divide-x text-xs ${isDarkMode ? 'divide-red-900/60 bg-red-950/40 text-slate-100' : 'divide-red-200 bg-red-50/50 text-slate-900'}`}>
                  <div className="p-3">
                    <span className={`block text-[10px] font-bold uppercase ${isDarkMode ? 'text-red-300' : 'text-red-900'}`}>
                      WEEK {localData.week} {localData.isUpcoming ? 'ACTIVE POT' : 'TOTAL POT'}
                    </span>
                    <span className={`text-base font-black font-mono block mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      ${localData.sidePotDesk.totalPot.toFixed(2)}
                    </span>
                    <span className={`text-[10px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {localData.isUpcoming
                        ? `${localData.sidePotDesk.entriesCount} entries locked • Kickoff pending`
                        : `${localData.sidePotDesk.entriesCount} entries × $${localData.sidePotDesk.entryFee}`}
                    </span>
                  </div>

                  <div className="p-3 flex items-center gap-2.5">
                    {!localData.isUpcoming && localData.sidePotDesk.pointsWinnerAvatarUrl && (
                      <img
                        src={localData.sidePotDesk.pointsWinnerAvatarUrl}
                        alt={localData.sidePotDesk.pointsWinnerName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border-2 border-amber-500 shadow-sm shrink-0 bg-white"
                      />
                    )}
                    <div className="min-w-0">
                      <span className={`block text-[10px] font-bold uppercase ${isDarkMode ? 'text-red-300' : 'text-red-900'}`}>
                        {localData.isUpcoming ? '👑 #1 POINTS BOUNTY' : '#1 POINTS'}
                      </span>
                      <span className={`text-sm font-bold block mt-0.5 truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {localData.isUpcoming ? 'Pending Kickoff' : localData.sidePotDesk.pointsWinnerName}
                      </span>
                      <span className={`text-xs font-bold font-mono ${isDarkMode ? 'text-rose-300' : 'text-red-700'}`}>
                        ${localData.sidePotDesk.pointsPayout.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 flex items-center gap-2.5">
                    {!localData.isUpcoming && localData.sidePotDesk.blowoutWinnerAvatarUrl && (
                      <img
                        src={localData.sidePotDesk.blowoutWinnerAvatarUrl}
                        alt={localData.sidePotDesk.blowoutWinnerName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border-2 border-red-500 shadow-sm shrink-0 bg-white"
                      />
                    )}
                    <div className="min-w-0">
                      <span className={`block text-[10px] font-bold uppercase ${isDarkMode ? 'text-red-300' : 'text-red-900'}`}>
                        {localData.isUpcoming ? '💥 BLOWOUT BOUNTY' : 'BIGGEST BLOWOUT'}
                      </span>
                      <span className={`text-sm font-bold block mt-0.5 truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {localData.isUpcoming ? 'Pending Kickoff' : localData.sidePotDesk.blowoutWinnerName}
                      </span>
                      <span className={`text-xs font-bold font-mono ${isDarkMode ? 'text-rose-300' : 'text-red-700'}`}>
                        ${localData.sidePotDesk.blowoutPayout.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`px-3 py-1.5 text-[11px] font-semibold border-t flex justify-between ${
                  isDarkMode ? 'bg-red-950/70 text-red-200 border-red-900' : 'bg-red-100/70 text-red-900 border-red-200'
                }`}>
                  <span>
                    {localData.isUpcoming
                      ? `WEEK ${localData.week}: Side pot locked • Payouts awarded after MNF`
                      : `WEEK ${localData.week + 1}: Entry fee: $${localData.sidePotDesk.nextWeekFee}`}
                  </span>
                  <span>{localData.isUpcoming ? 'All games pending' : 'Due before TNF kickoff'}</span>
                </div>
              </div>
            )}

            {/* Hindsight 20/20: Positional Bench Regrets & "If Only..." Desk */}
            {localData.positionalBlunders && localData.positionalBlunders.length > 0 && (() => {
              const seenTeams = new Set<string>();
              const uniqueBlundersWithIdx: { b: (typeof localData.positionalBlunders)[0]; originalIndex: number }[] = [];
              localData.positionalBlunders.forEach((blunder, origIdx) => {
                const teamKey = (blunder.teamName || blunder.manager).toLowerCase().trim();
                if (!seenTeams.has(teamKey)) {
                  seenTeams.add(teamKey);
                  uniqueBlundersWithIdx.push({ b: blunder, originalIndex: origIdx });
                }
              });

              if (uniqueBlundersWithIdx.length === 0) return null;

              return (
                <div className={`border-2 rounded-sm overflow-hidden mb-6 ${isDarkMode ? 'border-amber-600/80' : 'border-amber-500'}`}>
                  <div className="bg-amber-600 text-white px-3 py-1.5 flex items-center justify-between text-xs font-black uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <span>HINDSIGHT 20/20: BENCH REGRETS & "IF ONLY..." DESK</span>
                    </div>
                    <span className="text-[10px] bg-amber-800/80 px-1.5 py-0.5 rounded font-mono font-bold">
                      {uniqueBlundersWithIdx.length} MISMANAGED {uniqueBlundersWithIdx.length === 1 ? 'TEAM' : 'TEAMS'}
                    </span>
                  </div>
                  <div className={`divide-y text-xs ${isDarkMode ? 'divide-amber-900/60 bg-amber-950/25' : 'divide-amber-200 bg-amber-50/40'}`}>
                    {uniqueBlundersWithIdx.slice(0, 3).map(({ b, originalIndex }, idx) => {
                      const isFlipped = b.wouldHaveWonMatchup;
                      const badgeClass = isFlipped
                        ? 'bg-rose-600 text-white'
                        : b.pointsDifference >= 15
                        ? 'bg-amber-600 text-white'
                        : isDarkMode ? 'bg-slate-800 text-amber-300' : 'bg-slate-900 text-amber-300';
                      const tagLabel = b.flavorTag || (isFlipped ? 'MATCHUP FLIPPER' : `${b.position} SWAP`);

                      return (
                        <div key={idx} className="p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              {b.avatarUrl && (
                                <img
                                  src={b.avatarUrl}
                                  alt={b.manager}
                                  referrerPolicy="no-referrer"
                                  className="w-5 h-5 rounded-full object-cover border border-amber-400 shrink-0 bg-white"
                                />
                              )}
                              <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{b.manager}</span>
                              <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>({b.teamName})</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'}`}>
                                {b.position}
                              </span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide ${badgeClass}`}>
                                {tagLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {b.alternativeBlurbs && b.alternativeBlurbs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleShuffleBlunder(originalIndex)}
                                  title="Shuffle angle / varied wording"
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors print:hidden ${
                                    isDarkMode
                                      ? 'text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60'
                                      : 'text-amber-800 hover:text-amber-950 bg-amber-200/70 hover:bg-amber-200'
                                  }`}
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>Shuffle Angle</span>
                                </button>
                              )}
                              {isFlipped && (
                                <span className={`text-[9px] font-black border px-1.5 py-0.5 rounded uppercase tracking-wide ${
                                  isDarkMode ? 'bg-rose-950/80 text-rose-300 border-rose-700' : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}>
                                  WOULD HAVE WON!
                                </span>
                              )}
                            </div>
                          </div>

                          {b.headline && (
                            <h5 className={`font-sans font-black text-[11px] uppercase tracking-wide mb-1 ${isDarkMode ? 'text-amber-300' : 'text-amber-950'}`}>
                              {b.headline}
                            </h5>
                          )}

                          {isEditing ? (
                            <textarea
                              value={b.blurb}
                              onChange={(e) => handleBlunderTextChange(originalIndex, e.target.value)}
                              rows={2}
                              className={`w-full p-2 text-xs border rounded font-serif italic mb-2 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                isDarkMode ? 'text-amber-200 bg-slate-900 border-amber-600' : 'text-amber-950 bg-white border-amber-300'
                              }`}
                            />
                          ) : (
                            <p className={`font-serif italic text-xs leading-relaxed p-2 rounded border-l-2 mb-2 ${
                              isDarkMode
                                ? 'bg-amber-950/60 text-amber-100 border-amber-500'
                                : 'bg-amber-100/60 text-amber-950 border-amber-600'
                            }`}>
                              "{b.blurb}"
                            </p>
                          )}

                          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>
                              Benched: <strong className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>{b.benchPlayerName}</strong> ({b.benchPlayerPoints} pts)
                            </span>
                            <span className={isDarkMode ? 'text-slate-600' : 'text-slate-400'}>•</span>
                            <span>
                              Started: <strong className={`font-semibold ${isDarkMode ? 'text-rose-400' : 'text-rose-800'}`}>{b.starterPlayerName}</strong> ({b.starterPlayerPoints} pts)
                            </span>
                            <span className={isDarkMode ? 'text-slate-600' : 'text-slate-400'}>•</span>
                            <span className={`font-mono font-bold ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                              +{b.pointsDifference} pt swing
                            </span>
                            {b.opponentName && (
                              <>
                                <span className={isDarkMode ? 'text-slate-600' : 'text-slate-400'}>•</span>
                                <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  vs {b.opponentName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Page 2 Footer */}
          <footer className={`pt-6 border-t flex justify-between items-center text-[10px] font-mono ${
            isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-400'
          }`}>
            <span>
              {localData.leagueName} — {localData.editionTag}
            </span>
            <span>Page 2</span>
          </footer>
        </section>

        {/* ========================================================
            PAGE 3: POWER RANKINGS & THE COMMISSIONER'S NOTEBOOK
            ======================================================== */}
        <section
          data-gazette-page="3"
          id="gazette-page-3"
          className="p-8 sm:p-12 min-h-[1050px] flex flex-col justify-between print:p-8"
        >
          <div>
            {/* Header */}
            <div className="mb-4">
              <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                POWER RANKINGS
              </h2>
              <p className={`text-xs font-serif italic mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Subjective. Unapologetic. Based on one week of evidence.
              </p>
            </div>

            {/* Power Rankings Table */}
            <div className={`border rounded-sm overflow-hidden mb-8 ${isDarkMode ? 'border-slate-800' : 'border-slate-300'}`}>
              <div className={`grid grid-cols-12 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-900 text-white'}`}>
                <span className="col-span-1">#</span>
                <span className="col-span-3">Manager</span>
                <span className="col-span-8">Assessment / Evidence</span>
              </div>
              <div className={`divide-y text-xs ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                {localData.powerRankings.map((p) => (
                  <div
                    key={p.rank}
                    className={`grid grid-cols-12 px-3 py-1.5 items-center transition-colors ${
                      p.rank % 2 === 0
                        ? isDarkMode ? 'bg-[#111827]' : 'bg-slate-50'
                        : isDarkMode ? 'bg-[#0b0f19]' : 'bg-white'
                    }`}
                  >
                    <span className={`col-span-1 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{p.rank}</span>
                    <div className="col-span-3 flex items-center gap-1.5 min-w-0 pr-1">
                      {p.avatarUrl && (
                        <img
                          src={p.avatarUrl}
                          alt={p.manager}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-400 bg-white"
                        />
                      )}
                      <span className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {p.manager}
                      </span>
                    </div>
                    <span className={`col-span-8 text-[11px] font-serif leading-snug ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {p.rationale}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* The Commissioner's Notebook */}
            <div className="mb-6 space-y-3">
              <h3 className={`text-lg font-black uppercase tracking-tight border-b-2 pb-1 ${isDarkMode ? 'text-white border-slate-700' : 'text-slate-950 border-slate-900'}`}>
                THE COMMISSIONER'S NOTEBOOK
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs font-serif">
                <div>
                  <h4 className={`font-sans font-black uppercase text-[11px] ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                    FRAUD WATCH
                  </h4>
                  <p className={`mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{localData.commissionerNotebook.fraudWatch}</p>
                </div>

                <div>
                  <h4 className={`font-sans font-black uppercase text-[11px] ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                    STOCK UP
                  </h4>
                  <p className={`mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{localData.commissionerNotebook.stockUp}</p>
                </div>

                <div>
                  <h4 className={`font-sans font-black uppercase text-[11px] ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                    STOCK DOWN
                  </h4>
                  <p className={`mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{localData.commissionerNotebook.stockDown}</p>
                </div>

                <div>
                  <h4 className={`font-sans font-black uppercase text-[11px] ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                    GALAXY BRAIN MOVE
                  </h4>
                  <p className={`mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{localData.commissionerNotebook.galaxyBrain}</p>
                </div>

                <div className={`-mx-2 p-2.5 rounded-sm border-l-2 ${isDarkMode ? 'bg-rose-950/40 border-rose-500 text-rose-200' : 'bg-rose-50/70 border-rose-500 text-slate-800'}`}>
                  <h4 className={`font-sans font-black uppercase text-[11px] flex items-center justify-between ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                    <span>BONEHEAD MOVE / BENCH REGRET</span>
                    {localData.topPositionalBlunder && (
                      <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-sans font-bold">
                        +{localData.topPositionalBlunder.pointsDifference} PTS LOST
                      </span>
                    )}
                  </h4>
                  <p className={`font-serif italic text-xs mt-1 leading-snug ${isDarkMode ? 'text-rose-100' : 'text-slate-800'}`}>
                    {localData.commissionerNotebook.bonehead}
                  </p>
                </div>

                <div>
                  <h4 className={`font-sans font-black uppercase text-[11px] ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                    LEAGUE CANON
                  </h4>
                  <p className={`mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{localData.commissionerNotebook.leagueCanon}</p>
                </div>

                <div>
                  <h4 className={`font-sans font-black uppercase text-[11px] ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                    AROUND THE LEAGUE
                  </h4>
                  <p className={`mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{localData.commissionerNotebook.aroundTheLeague}</p>
                </div>

                <div>
                  <h4 className={`font-sans font-black uppercase text-[11px] ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                    WEEK {localData.week + 1} WARNING
                  </h4>
                  <p className={`mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{localData.commissionerNotebook.nextWeekWarning}</p>
                </div>
              </div>
            </div>

            {/* Final Word */}
            <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-black uppercase tracking-wider mb-1 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                FINAL WORD
              </h3>
              <p className={`text-xs sm:text-sm font-serif font-semibold leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                {localData.commissionerNotebook.finalWord}
              </p>
            </div>
          </div>

          {/* Page 3 Footer */}
          <footer className={`pt-6 border-t flex justify-between items-center text-[10px] font-mono ${
            isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-400'
          }`}>
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
