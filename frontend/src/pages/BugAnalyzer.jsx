import React, { useState } from 'react';
import client from '../api/client';
import {
  Bug,
  Sparkles,
  Terminal,
  FileCode,
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Cpu,
  RefreshCw
} from 'lucide-react';

const BugAnalyzer = () => {
  const [stackTrace, setStackTrace] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!stackTrace.trim()) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await client.post('/ai/analyze-bug', { stackTrace });
      setAnalysis(res.data.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error occurred during AI analysis');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const getProgressBarColor = (score) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold font-display text-white">AI Bug Analyzer</h2>
        <p className="text-sm text-gray-400">Paste raw stack traces or terminal console logs to determine root causes and get fix recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Input Pane */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleAnalyze} className="glass-panel p-6 rounded-3xl border border-darkBorder space-y-4 indigo-glow flex flex-col h-[65vh]">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-brandIndigo" /> Error Console Logs
            </span>

            <textarea
              required
              placeholder="Paste stack trace / log output here...&#10;e.g. TimeoutError: locator.click: Timeout 30000ms exceeded."
              value={stackTrace}
              onChange={(e) => setStackTrace(e.target.value)}
              className="flex-1 w-full p-4 bg-black/40 border border-darkBorder rounded-2xl text-xs font-mono text-rose-400 focus:outline-none focus:border-brandIndigo resize-none placeholder:text-gray-700"
            ></textarea>

            <button
              type="submit"
              disabled={loading || !stackTrace.trim()}
              className="w-full py-3 bg-gradient-to-r from-brandIndigo to-brandViolet text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing log logs...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Logs
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Analysis Report */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-brandIndigo/25 bg-brandIndigo/5 h-[65vh] flex flex-col justify-center items-center gap-4">
              <div className="p-4 bg-brandIndigo/10 rounded-2xl animate-float">
                <Bug className="w-8 h-8 text-brandIndigo animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white animate-pulse">Consulting AI Debugger...</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Deconstructing stack frame targets. Pinpointing files line counts and recommending refactoring suggestions...
              </p>
            </div>
          ) : analysis ? (
            <div className="glass-panel p-6 rounded-3xl border border-darkBorder h-[65vh] flex flex-col justify-between overflow-y-auto space-y-6 violet-glow">
              <div className="space-y-6">
                {/* Confidence banner */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${getScoreColor(analysis.confidenceScore)}`}>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">AI Confidence Score</span>
                      <p className="text-sm font-extrabold text-white">{analysis.confidenceScore}% certainty</p>
                    </div>
                  </div>
                  <div className="w-24 bg-black/40 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressBarColor(analysis.confidenceScore)}`}
                      style={{ width: `${analysis.confidenceScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Root cause */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Root Cause Analysis
                  </h4>
                  <div className="p-4 bg-black/20 border border-darkBorder/40 rounded-2xl text-xs text-gray-300 leading-relaxed font-sans">
                    {analysis.rootCause}
                  </div>
                </div>

                {/* Suggestion */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-brandIndigo" /> Suggested Fix
                  </h4>
                  <pre className="p-4 bg-black/40 border border-darkBorder rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-56">
                    {analysis.fixSuggestion}
                  </pre>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-500 flex items-center justify-center gap-1.5 border-t border-darkBorder/40 pt-4 mt-2">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Double-check configuration parameters if suggestion does not resolve error logs.</span>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-3xl border border-darkBorder h-[65vh] flex flex-col justify-center items-center gap-3">
              <Cpu className="w-12 h-12 text-gray-700 animate-float" />
              <h3 className="text-md font-bold text-white">Diagnostic Dashboard</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Paste error details in the panel on the left and start diagnostic processing. Gemini will analyze the traces to isolate target exceptions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BugAnalyzer;
