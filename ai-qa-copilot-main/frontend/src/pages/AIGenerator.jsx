import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import {
  Sparkles,
  FolderOpen,
  ChevronRight,
  Info,
  CheckSquare,
  Square,
  ListTodo,
  FileCode,
  AlertCircle,
  FolderPlus
} from 'lucide-react';

const AIGenerator = () => {
  const activeProjectId = localStorage.getItem('activeProject');
  const activeProjectName = localStorage.getItem('activeProjectName');

  // Input states
  const [pageDescription, setPageDescription] = useState('');
  const [features, setFeatures] = useState('');
  const [requirements, setRequirements] = useState('');
  const [priority, setPriority] = useState('medium');
  const [type, setType] = useState('manual');
  
  // App States
  const [loading, setLoading] = useState(false);
  const [generatedCases, setGeneratedCases] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!pageDescription && !features) {
      alert('Please specify either a page description or list of features.');
      return;
    }

    setLoading(true);
    setGeneratedCases([]);
    setSelectedIndices([]);
    setSaveSuccess(false);

    try {
      const res = await client.post('/ai/generate', {
        pageDescription,
        features,
        requirements,
        priority,
        type,
      });

      setGeneratedCases(res.data.data);
      // Select all by default
      setSelectedIndices(res.data.data.map((_, idx) => idx));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'AI Generation process encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectCase = (idx) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(prev => prev.filter(i => i !== idx));
    } else {
      setSelectedIndices(prev => [...prev, idx]);
    }
  };

  const handleSaveToDatabase = async () => {
    if (selectedIndices.length === 0) return;
    
    setSaveLoading(true);
    setSaveSuccess(false);

    const testCasesToSave = generatedCases.filter((_, idx) => selectedIndices.includes(idx));

    try {
      await client.post('/testcases/bulk', {
        project: activeProjectId,
        testCases: testCasesToSave,
      });
      
      setSaveSuccess(true);
      // Clear generated test cases on success so user feels they are finished
      setGeneratedCases([]);
      setSelectedIndices([]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save generated test cases.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (!activeProjectId) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-darkBorder max-w-lg mx-auto space-y-4 my-12">
        <FolderOpen className="w-12 h-12 text-brandIndigo mx-auto animate-pulse" />
        <h3 className="text-xl font-bold text-white">No active project scope</h3>
        <p className="text-sm text-gray-400">
          You must select or create a project workspace before leveraging the AI generator.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brandIndigo text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-all"
        >
          Browse Projects <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandIndigo/20 text-brandIndigo font-bold uppercase tracking-wider">
            Project Scope
          </span>
          <span className="text-sm font-semibold text-gray-300 font-display">{activeProjectName}</span>
        </div>
        <h2 className="text-3xl font-extrabold font-display text-white">AI Test Case Generator</h2>
        <p className="text-sm text-gray-400">Automatically draft test suites covering positive, negative, boundary, and security cases</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Prompt parameters sidebar Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-darkBorder space-y-4 violet-glow">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brandViolet" /> Configure Prompt
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-gray-400 font-semibold uppercase tracking-wider">Page / Context Description</label>
                <textarea
                  required
                  placeholder="e.g. Login page containing email, password, keep me signed in checkbox, and submit button."
                  rows="3"
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-darkBorder rounded-xl text-xs text-gray-200 focus:outline-none focus:border-brandIndigo resize-none"
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400 font-semibold uppercase tracking-wider">Key Features to verify</label>
                <textarea
                  placeholder="e.g. Validate email format, enforce password length of 6+ chars, display forgot password link."
                  rows="3"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-darkBorder rounded-xl text-xs text-gray-200 focus:outline-none focus:border-brandIndigo resize-none"
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400 font-semibold uppercase tracking-wider">Additional Constraints</label>
                <input
                  type="text"
                  placeholder="e.g. Block SQL Inject payloads, protect login brute force"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/40 border border-darkBorder rounded-xl text-xs text-gray-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-semibold uppercase tracking-wider">Target Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-2 py-2 bg-darkCard border border-darkBorder rounded-xl text-xs text-gray-200 focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400 font-semibold uppercase tracking-wider">TestCase Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-2 py-2 bg-darkCard border border-darkBorder rounded-xl text-xs text-gray-200 focus:outline-none"
                  >
                    <option value="manual">Manual Steps</option>
                    <option value="playwright">Playwright Spec</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-brandIndigo to-brandViolet text-white font-semibold rounded-xl hover:shadow-brandIndigo/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating suite...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Tests
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Generated test lists results */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-brandIndigo/25 bg-brandIndigo/5 h-full flex flex-col justify-center items-center gap-4">
              <div className="p-4 bg-brandIndigo/10 rounded-2xl animate-float">
                <Sparkles className="w-8 h-8 text-brandIndigo animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white animate-pulse">Gemini Generating Test Suites...</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Consulting QA model agent. Generating Positive, Negative, Boundary, and Security/Edge test cases...
              </p>
            </div>
          ) : saveSuccess ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-emerald-500/25 bg-emerald-500/5 h-full flex flex-col justify-center items-center gap-4">
              <div className="p-4 bg-emerald-500/10 rounded-2xl">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Import Successful!</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Test cases have been added to your project's TestCase Suite. You can run them programmatically or view step guides.
              </p>
              <Link
                to="/testcases"
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-all"
              >
                View TestCase Suite
              </Link>
            </div>
          ) : generatedCases.length > 0 ? (
            <div className="space-y-6 h-full flex flex-col justify-between">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-brandIndigo" /> Generated Cases ({generatedCases.length})
                </h4>
                <button
                  onClick={handleSaveToDatabase}
                  disabled={selectedIndices.length === 0 || saveLoading}
                  className="px-4 py-2 bg-brandIndigo hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-brandIndigo/25 disabled:opacity-50"
                >
                  {saveLoading ? 'Importing...' : `Save ${selectedIndices.length} Selected`}
                </button>
              </div>

              {/* Scroll list */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {generatedCases.map((tc, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectCase(idx)}
                      className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${
                        isSelected ? 'border-brandIndigo bg-zinc-900/60' : 'border-darkBorder hover:border-white/10'
                      }`}
                    >
                      <div className="pt-0.5">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-brandIndigo" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-600" />
                        )}
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span className="bg-white/5 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{tc.priority}</span>
                          <span className="text-brandViolet font-bold font-mono">#{tc.tags?.[0] || 'ai'}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">{tc.title}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">{tc.description}</p>
                        
                        {/* Show preview details */}
                        <div className="pt-2 grid grid-cols-2 gap-4 border-t border-darkBorder/40 text-[10px] text-gray-400">
                          <div>
                            <span className="font-bold text-gray-200">Steps:</span>
                            <ul className="list-disc list-inside">
                              {tc.steps?.slice(0, 2).map((s, i) => <li key={i} className="truncate">{s}</li>)}
                            </ul>
                          </div>
                          <div>
                            <span className="font-bold text-gray-200">Assertions:</span>
                            <ul className="list-disc list-inside">
                              {tc.assertions?.slice(0, 2).map((a, i) => <li key={i} className="truncate">{a}</li>)}
                            </ul>
                          </div>
                        </div>

                        {tc.code && (
                          <div className="pt-2">
                            <span className="text-[10px] font-bold text-gray-200 flex items-center gap-1">
                              <FileCode className="w-3.5 h-3.5 text-brandIndigo" /> Generated Playwright Code
                            </span>
                            <pre className="p-2 bg-black/40 rounded border border-darkBorder text-[9px] font-mono text-emerald-400 truncate max-h-16 overflow-y-hidden">
                              {tc.code}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-3xl border border-darkBorder h-full flex flex-col justify-center items-center gap-3">
              <Sparkles className="w-12 h-12 text-gray-700 animate-float" />
              <h3 className="text-md font-bold text-white">Generate with Gemini</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Provide feature details in the configuration panel on the left and trigger Gemini models to build high-quality test lists for your suite.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGenerator;
