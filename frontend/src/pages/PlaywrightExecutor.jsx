import React, { useState } from 'react';
import client from '../api/client';
import {
  Play,
  Terminal,
  Image,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
  FileCode,
  Sparkles
} from 'lucide-react';

const PlaywrightExecutor = () => {
  const [code, setCode] = useState(`const { test, expect } = require('@playwright/test');

test('Verify title on Playwright home page', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});`);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleExecute = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await client.post('/executions/run-adhoc-playwright', { code });
      setResult(res.data.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Playwright execution process encountered a shell error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold font-display text-white">Playwright Executor</h2>
        <p className="text-sm text-gray-400">Run Node.js Playwright automation scripts headlessly on the server and view screenshots</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Code Input */}
        <div className="space-y-4">
          <form onSubmit={handleExecute} className="glass-panel p-6 rounded-3xl border border-darkBorder space-y-4 indigo-glow flex flex-col h-[70vh]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-brandIndigo" /> Code Editor
              </span>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-brandIndigo hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brandIndigo/25 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white text-transparent" />}
                Run Code
              </button>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full p-4 bg-black/40 border border-darkBorder rounded-2xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-brandIndigo resize-none"
            ></textarea>
          </form>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {loading ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-brandIndigo/20 h-[70vh] flex flex-col justify-center items-center gap-4">
              <div className="w-10 h-10 border-4 border-brandIndigo border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-xs animate-pulse">Running headless chromium instance...</p>
              <span className="text-[10px] text-gray-500 max-w-xs mx-auto">
                Playwright is dynamically writing the spec to disk, compiling the execution, running the assertions, and capturing screenshots.
              </span>
            </div>
          ) : result ? (
            <div className="glass-panel p-6 rounded-3xl border border-darkBorder h-[70vh] flex flex-col justify-between overflow-y-auto space-y-6 violet-glow">
              {/* Header result status */}
              <div className="flex items-center justify-between border-b border-darkBorder/60 pb-4">
                <div className="flex items-center gap-3">
                  {result.status === 'passed' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Execution Status</span>
                    <span className={`text-md font-bold ${
                      result.status === 'passed' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Duration</span>
                  <span className="text-sm font-bold text-gray-300 font-mono">
                    {(result.runDuration / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>

              {/* Logs display */}
              <div className="space-y-2 flex-1 flex flex-col">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-brandViolet" /> Output Logs
                </span>
                <pre className="flex-1 p-4 bg-black/40 border border-darkBorder rounded-xl text-[10px] font-mono text-gray-300 overflow-auto max-h-48 whitespace-pre-wrap">
                  {result.logs || result.errorMsg || 'No output logged.'}
                </pre>
              </div>

              {/* Failure screenshot display */}
              {result.screenshotPath && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-brandViolet" /> Failure Screenshot
                  </span>
                  <div className="border border-darkBorder rounded-xl overflow-hidden bg-black max-h-48 flex items-center justify-center">
                    <img
                      src={result.screenshotPath}
                      alt="Failure screenshot"
                      className="max-h-44 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-3xl border border-darkBorder h-[70vh] flex flex-col justify-center items-center gap-3">
              <Cpu className="w-12 h-12 text-gray-700 animate-float" />
              <h3 className="text-md font-bold text-white">Execution Console</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Submit a Playwright automation script to compile and run. On test failures, a full screenshot of the viewport will be loaded here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaywrightExecutor;
