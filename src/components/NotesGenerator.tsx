import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  FileText,
  Flame,
  Radio,
  Crown,
  Zap,
  HelpCircle,
  Loader2,
  RefreshCw,
  Skull,
  ShieldAlert,
  Newspaper,
  Printer,
  DollarSign,
  Settings2,
} from 'lucide-react';
import Markdown from 'react-markdown';
import {
  WeekStats,
  ChoppedWeekStats,
  NoteTone,
  LeagueFormat,
  SidePotConfig,
  GazetteReportData,
} from '../types';
import { generateTemplateNotes, generateChoppedTemplateNotes } from '../utils/calc';
import {
  buildGazetteReportData,
  gazetteToMarkdown,
  DEFAULT_SIDE_POT_CONFIG,
} from '../utils/gazetteCalc';
import { WeeklyGazetteReport } from './WeeklyGazetteReport';

interface NotesGeneratorProps {
  leagueName: string;
  format?: LeagueFormat;
  stats?: WeekStats | null;
  choppedStats?: ChoppedWeekStats | null;
  selectedWeek: number;
}

export const NotesGenerator: React.FC<NotesGeneratorProps> = ({
  leagueName,
  format = 'head_to_head',
  stats,
  choppedStats,
  selectedWeek,
}) => {
  const isChopped = format === 'chopped' || !!choppedStats;

  const [tone, setTone] = useState<NoteTone>(isChopped ? 'grim_reaper' : 'roast');
  const [announcements, setAnnouncements] = useState('');
  const [duesNote, setDuesNote] = useState('');
  const [includePowerRankings, setIncludePowerRankings] = useState(true);
  const [includeWaiverAdvice, setIncludeWaiverAdvice] = useState(true);

  // Side Pot & Gazette Settings
  const [showSidePotSettings, setShowSidePotSettings] = useState(false);
  const [sidePotConfig, setSidePotConfig] = useState<SidePotConfig>({
    ...DEFAULT_SIDE_POT_CONFIG,
    totalEntries: stats ? stats.matchups.length * 2 : 12,
    totalPot: (stats ? stats.matchups.length * 2 : 12) * DEFAULT_SIDE_POT_CONFIG.entryFee,
    pointsWinnerPayout:
      ((stats ? stats.matchups.length * 2 : 12) * DEFAULT_SIDE_POT_CONFIG.entryFee) / 2,
    blowoutWinnerPayout:
      ((stats ? stats.matchups.length * 2 : 12) * DEFAULT_SIDE_POT_CONFIG.entryFee) / 2,
  });
  const [motto, setMotto] = useState('SAME LEAGUE. DIFFERENT LEVELS.');
  const [editionTag, setEditionTag] = useState(
    isChopped ? 'SURVIVAL ELIMINATION' : 'INAUGURAL DYNASTY SEASON'
  );

  // View Mode: 'gazette' (Newspaper), 'preview' (Markdown formatted), 'raw' (Sleeper chat text)
  const [viewMode, setViewMode] = useState<'gazette' | 'preview' | 'raw'>('gazette');

  // Compute Initial Gazette Data
  const initialGazetteData = useMemo(() => {
    return buildGazetteReportData(
      leagueName,
      stats,
      choppedStats,
      format,
      sidePotConfig,
      motto,
      editionTag
    );
  }, [leagueName, stats, choppedStats, format, sidePotConfig, motto, editionTag]);

  const [gazetteData, setGazetteData] = useState<GazetteReportData>(initialGazetteData);
  const [generatedNotes, setGeneratedNotes] = useState<string>(() =>
    gazetteToMarkdown(initialGazetteData)
  );

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generationSource, setGenerationSource] = useState<'ai' | 'builtin' | null>('builtin');
  const [copied, setCopied] = useState(false);

  // Keep gazette data synchronized when league, stats, or side-pot changes
  useEffect(() => {
    const updated = buildGazetteReportData(
      leagueName,
      stats,
      choppedStats,
      format,
      sidePotConfig,
      motto,
      editionTag
    );
    setGazetteData(updated);
    setGeneratedNotes(gazetteToMarkdown(updated));
    if (isChopped) {
      setTone('grim_reaper');
      setEditionTag('SURVIVAL ELIMINATION');
    } else {
      setTone('roast');
      setEditionTag('INAUGURAL DYNASTY SEASON');
    }
  }, [leagueName, isChopped, stats, choppedStats, sidePotConfig, motto, editionTag, format]);

  // Handle entry fee / entries count change in side pot
  const updateSidePot = (field: keyof SidePotConfig, value: any) => {
    const updated = { ...sidePotConfig, [field]: value };
    if (field === 'entryFee' || field === 'totalEntries') {
      const fee = field === 'entryFee' ? Number(value) : sidePotConfig.entryFee;
      const count = field === 'totalEntries' ? Number(value) : sidePotConfig.totalEntries;
      const pot = fee * count;
      updated.totalPot = pot;
      updated.pointsWinnerPayout = Number((pot / 2).toFixed(2));
      updated.blowoutWinnerPayout = Number((pot / 2).toFixed(2));
    }
    setSidePotConfig(updated);
  };

  const standardToneOptions: { id: NoteTone; label: string; icon: any; desc: string }[] = [
    {
      id: 'roast',
      label: 'Savage Roast & Trash Talk',
      icon: Flame,
      desc: 'Playful burns on the blowout loser and bad beats',
    },
    {
      id: 'espn',
      label: 'ESPN SportsCenter Anchor',
      icon: Radio,
      desc: 'Professional, dramatic television breakdown',
    },
    {
      id: 'commish',
      label: 'Benevolent Commish',
      icon: Crown,
      desc: 'Authoritative, balanced, and encouraging',
    },
    {
      id: 'hype',
      label: 'Gladiatorial Hype',
      icon: Zap,
      desc: 'High-octane energy, caps lock, and fanfare',
    },
    {
      id: 'conspiracy',
      label: 'RNG Conspiracy Theorist',
      icon: HelpCircle,
      desc: 'Humorously questions the Sleeper schedule algorithms',
    },
  ];

  const choppedToneOptions: { id: NoteTone; label: string; icon: any; desc: string }[] = [
    {
      id: 'grim_reaper',
      label: '🪓 The Executioner / Grim Reaper',
      icon: Skull,
      desc: 'Solemn yet hilarious funeral eulogy for the chopped team',
    },
    {
      id: 'hunger_games',
      label: '🏹 Hunger Games Announcer',
      icon: ShieldAlert,
      desc: 'High-drama survival spectacle: "May the odds be ever in your favor"',
    },
    {
      id: 'roast',
      label: '🔥 Savage Roast & Mockery',
      icon: Flame,
      desc: 'Mercilessly mock the chopped manager & close-call survivors',
    },
    {
      id: 'espn',
      label: '📻 SportsCenter Eliminator',
      icon: Radio,
      desc: 'Tactical survival analysis and waiver wire goldrush report',
    },
    {
      id: 'commish',
      label: '👑 The Commish Proclamation',
      icon: Crown,
      desc: 'Authoritative waiver drop instructions, deadlines & FAAB rules',
    },
    {
      id: 'hype',
      label: '⚡ Apex Predator Hype',
      icon: Zap,
      desc: 'Gladiatorial celebration for the top surviving warlords',
    },
  ];

  const activeToneOptions = isChopped ? choppedToneOptions : standardToneOptions;

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const res = await fetch('/api/gemini/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueName,
          week: selectedWeek,
          format: isChopped ? 'chopped' : 'head_to_head',
          stats,
          choppedStats,
          tone,
          announcements,
          duesNote,
          includePowerRankings,
          includeWaiverAdvice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      if (data.notes) {
        setGeneratedNotes(data.notes);
        setGenerationSource(data.isAi ? 'ai' : 'builtin');
        // Also update the lead story in the gazette data
        setGazetteData((prev) => ({
          ...prev,
          leadStory: `${data.notes.slice(0, 320)}...`,
        }));
      } else {
        throw new Error('No content returned');
      }
    } catch (err: any) {
      console.warn('Note generation notice:', err.message);
      setGenerationSource('builtin');
      handleGenerateTemplate();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateTemplate = () => {
    setAiError(null);
    setGenerationSource('builtin');
    const updated = buildGazetteReportData(
      leagueName,
      stats,
      choppedStats,
      format,
      sidePotConfig,
      motto,
      editionTag
    );
    setGazetteData(updated);
    setGeneratedNotes(gazetteToMarkdown(updated));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedNotes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedNotes], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${leagueName.replace(/[^a-zA-Z0-9]/g, '_')}_Week_${selectedWeek}_Gazette.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Top Header & View Modes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              {isChopped ? '🪓 The Guillotine Gazette & Report' : 'The Commissioner Gazette & Notes'}
            </h3>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold">
              3-Page Edition
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full executive report with Blowout of the Week, GM of the Week, Galaxy Brain Move, Side
            Pot Desk, Power Rankings & Commissioner's Notebook.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start lg:self-auto">
          <button
            type="button"
            id="view-toggle-gazette"
            onClick={() => setViewMode('gazette')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'gazette'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Gazette Newspaper</span>
          </button>

          <button
            type="button"
            id="view-toggle-preview"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Markdown View</span>
          </button>

          <button
            type="button"
            id="view-toggle-raw"
            onClick={() => setViewMode('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Raw Chat Text</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls & Customization */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {isChopped ? 'Select Execution & Survival Tone' : 'Select Commissioner Tone'}
            </label>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {activeToneOptions.map((t) => {
                const Icon = t.icon;
                const isSelected = tone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? isChopped
                          ? 'bg-rose-950/40 border-rose-500 text-white shadow-sm'
                          : 'bg-emerald-950/50 border-emerald-500 text-white shadow-sm'
                        : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isSelected
                          ? isChopped
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-bold truncate">{t.label}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side Pot Desk Collapsible Config */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Side Pot Desk Settings</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSidePotSettings(!showSidePotSettings)}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Settings2 className="w-3 h-3" />
                <span>{showSidePotSettings ? 'Hide' : 'Configure'}</span>
              </button>
            </div>

            {showSidePotSettings && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sidePotConfig.enabled}
                    onChange={(e) => updateSidePot('enabled', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>Enable Side Pot Desk in Gazette</span>
                </label>

                {sidePotConfig.enabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Entry Fee ($)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={sidePotConfig.entryFee}
                        onChange={(e) => updateSidePot('entryFee', Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-white font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Entries Count
                      </label>
                      <input
                        type="number"
                        min="2"
                        value={sidePotConfig.totalEntries}
                        onChange={(e) => updateSidePot('totalEntries', Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-white font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick summary of side pot */}
            {sidePotConfig.enabled && (
              <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                <span>Total Pot: ${sidePotConfig.totalPot.toFixed(2)}</span>
                <span className="text-emerald-400 font-medium">
                  50/50 (#1 Pts / Blowout)
                </span>
              </div>
            )}
          </div>

          {/* Newspaper Taglines */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                League Motto Banner
              </label>
              <input
                type="text"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="e.g. SAME LEAGUE. DIFFERENT LEVELS."
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Edition Subtitle
              </label>
              <input
                type="text"
                value={editionTag}
                onChange={(e) => setEditionTag(e.target.value)}
                placeholder="e.g. INAUGURAL DYNASTY SEASON"
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Announcements */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Custom Announcement / Deadlines
            </label>
            <textarea
              value={announcements}
              onChange={(e) => setAnnouncements(e.target.value)}
              placeholder="e.g. Remember waiver wire runs Wednesday at midnight. Pay your side pot before TNF!"
              rows={2}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Generation Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              id="generate-ai-notes-btn"
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className={`w-full py-3 px-4 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isChopped
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-950/50'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50'
              }`}
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Drafting Weekly Gazette Report...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate / Refresh Gazette Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="generate-template-notes-btn"
              onClick={handleGenerateTemplate}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Instant Recalculate (Offline Engine)</span>
            </button>
          </div>

          {/* Engine Status Indicator */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              {generationSource === 'ai' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300 font-medium">Gemini AI Active</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300 font-medium">Built-in Engine</span>
                </>
              )}
            </span>
            <span className="text-slate-400">
              {generationSource === 'ai' ? 'Cloud Model' : 'No API Key Required'}
            </span>
          </div>
        </div>

        {/* Right Column: Output Preview and Gazette */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {/* Action Bar: Copy, Download, Print */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              {viewMode === 'gazette' ? (
                <>
                  <Newspaper className="w-4 h-4 text-emerald-400" />
                  <span>The Weekly Gazette (3 Pages)</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>{viewMode === 'preview' ? 'Markdown Document' : 'Raw Text for Sleeper'}</span>
                </>
              )}
            </span>

            <div className="flex items-center gap-2">
              {viewMode === 'gazette' && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              )}

              <button
                type="button"
                id="copy-notes-btn"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="download-notes-btn"
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Download Markdown file"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Container */}
          <div className="flex-1 min-h-[500px] overflow-y-auto">
            {viewMode === 'gazette' ? (
              <WeeklyGazetteReport
                data={gazetteData}
                onUpdateData={(updated) => {
                  setGazetteData(updated);
                  setGeneratedNotes(gazetteToMarkdown(updated));
                }}
                onResetData={handleGenerateTemplate}
              />
            ) : viewMode === 'preview' ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 min-h-[500px]">
                <div className="prose prose-invert prose-emerald max-w-none text-slate-200 text-xs leading-relaxed space-y-3">
                  <Markdown>{generatedNotes}</Markdown>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[500px]">
                <textarea
                  readOnly
                  value={generatedNotes}
                  className="w-full h-full min-h-[480px] bg-transparent text-slate-300 font-mono text-xs focus:outline-none resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
