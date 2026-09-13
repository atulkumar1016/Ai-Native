import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import {
  FolderOpen,
  Search,
  Plus,
  Play,
  Trash2,
  SlidersHorizontal,
  Tags,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Info,
  Clock,
  ExternalLink,
  Code
} from 'lucide-react';

const TestCases = () => {
  const navigate = useNavigate();
  const activeProjectId = localStorage.getItem('activeProject');
  const activeProjectName = localStorage.getItem('activeProjectName');

  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Selected Test Case for Detail Modal
  const [selectedTC, setSelectedTC] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [execsLoading, setExecsLoading] = useState(false);
  
  // Execution status
  const [runningTestId, setRunningTestId] = useState(null);
  const [runResult, setRunResult] = useState(null);

  // Add Test Case Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newType, setNewType] = useState('manual');
  const [newSteps, setNewSteps] = useState('');
  const [newAssertions, setNewAssertions] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newApiUrl, setNewApiUrl] = useState('');
  const [newApiMethod, setNewApiMethod] = useState('GET');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (!activeProjectId) return;

    const fetchTestCases = async () => {
      try {
        setLoading(true);
        let url = `/testcases?project=${activeProjectId}`;
        if (search) url += `&search=${search}`;
        if (typeFilter) url += `&type=${typeFilter}`;
        if (priorityFilter) url += `&priority=${priorityFilter}`;

        const res = await client.get(url);
        setTestCases(res.data.data);
      } catch (err) {
        console.error('Error fetching test cases:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestCases();
  }, [activeProjectId, search, typeFilter, priorityFilter, refreshKey]);

  // Fetch execution history when a test case is selected
  useEffect(() => {
    if (!selectedTC) return;

    const fetchExecutions = async () => {
      try {
        setExecsLoading(true);
        const res = await client.get(`/executions?testCase=${selectedTC._id}`);
        setExecutions(res.data.data);
      } catch (err) {
        console.error('Error fetching executions:', err);
      } finally {
        setExecsLoading(false);
      }
    };

    fetchExecutions();
  }, [selectedTC]);

  const handleRunTestCase = async (e, tc) => {
    e.stopPropagation();
    setRunningTestId(tc._id);
    setRunResult(null);

    try {
      const res = await client.post(`/executions/run/${tc._id}`, {});
      setRunResult(res.data.data);
      setRefreshKey(prev => prev + 1); // refresh list execution status checks
      
      // If modal is open, refresh executions
      if (selectedTC && selectedTC._id === tc._id) {
        const fetchRes = await client.get(`/executions?testCase=${tc._id}`);
        setExecutions(fetchRes.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error running test case');
    } finally {
      setRunningTestId(null);
    }
  };

  const handleDeleteTestCase = async (e, id) => {
    e.stopPropagation();
    const confirm = window.confirm('Are you sure you want to delete this test case and all its run logs?');
    if (!confirm) return;

    try {
      await client.delete(`/testcases/${id}`);
      setRefreshKey(prev => prev + 1);
      if (selectedTC && selectedTC._id === id) {
        setSelectedTC(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete test case');
    }
  };

  const handleAddTestCase = async (e) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      const stepsArray = newSteps.split('\n').filter(s => s.trim() !== '');
      const assertionsArray = newAssertions.split('\n').filter(a => a.trim() !== '');
      const tagsArray = newTags.split(',').map(t => t.trim()).filter(t => t !== '');

      const payload = {
        project: activeProjectId,
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        type: newType,
        steps: stepsArray,
        assertions: assertionsArray,
        tags: tagsArray,
        code: newType === 'playwright' ? newCode : undefined,
        apiConfig: newType === 'api' ? {
          url: newApiUrl,
          method: newApiMethod,
          expectedStatus: 200,
        } : undefined
      };

      await client.post('/testcases', payload);
      
      // Reset forms
      setNewTitle('');
      setNewDesc('');
      setNewSteps('');
      setNewAssertions('');
      setNewTags('');
      setNewCode('');
      setNewApiUrl('');
      setShowAddModal(false);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create test case');
    } finally {
      setAddLoading(false);
    }
  };

  // If no project is selected
  if (!activeProjectId) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-darkBorder max-w-lg mx-auto space-y-4 my-12">
        <FolderOpen className="w-12 h-12 text-brandIndigo mx-auto animate-pulse" />
        <h3 className="text-xl font-bold text-white">No active project scope</h3>
        <p className="text-sm text-gray-400">
          You must select or create a project workspace before managing test cases. Scopes associate tests together for execution logging and reports generation.
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandIndigo/20 text-brandIndigo font-bold uppercase tracking-wider">
              Project
            </span>
            <span className="text-sm font-semibold text-gray-300 font-display">{activeProjectName}</span>
          </div>
          <h2 className="text-3xl font-extrabold font-display text-white">TestCase Suite</h2>
          <p className="text-sm text-gray-400">Manage manual steps, API configs, and automation tests in one dashboard</p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/ai-generator"
            className="flex items-center gap-1.5 px-4 py-3 border border-brandIndigo bg-brandIndigo/10 text-brandIndigo hover:bg-brandIndigo hover:text-white rounded-xl text-sm font-semibold transition-all duration-200"
          >
            <Sparkles className="w-4 h-4" />
            AI Generator
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-brandIndigo to-brandViolet text-white rounded-xl text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-brandIndigo/25 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            New Test Case
          </button>
        </div>
      </div>

      {/* Scopes / Filters bar */}
      <div className="glass-panel p-4 rounded-2xl border border-darkBorder flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl w-full">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search test cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-200 focus:outline-none w-full placeholder:text-gray-600"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-darkCard border border-darkBorder rounded-xl text-xs py-2 px-3 focus:outline-none focus:border-brandIndigo"
          >
            <option value="">All Types</option>
            <option value="manual">Manual</option>
            <option value="api">API Test</option>
            <option value="playwright">Playwright</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-darkCard border border-darkBorder rounded-xl text-xs py-2 px-3 focus:outline-none focus:border-brandIndigo"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Run result feedback box */}
      {runResult && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-md ${
          runResult.status === 'passed'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : (runResult.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400')
        }`}>
          <div className="flex items-center gap-3">
            {runResult.status === 'passed' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <div>
              <p className="text-sm font-bold text-white">Execution Result: {runResult.status.toUpperCase()}</p>
              <p className="text-xs text-gray-400">Duration: {(runResult.runDuration / 1000).toFixed(2)}s | Action: Recorded in execution histories</p>
            </div>
          </div>
          <button
            onClick={() => setRunResult(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TestCase Grid List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brandIndigo border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-xs">Fetching test cases...</p>
        </div>
      ) : testCases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testCases.map((tc) => {
            const hasCode = tc.type === 'playwright' && tc.code;
            const hasApi = tc.type === 'api' && tc.apiConfig;

            return (
              <div
                key={tc._id}
                onClick={() => setSelectedTC(tc)}
                className="glass-panel p-6 rounded-2xl border border-darkBorder hover:border-white/10 transition-all cursor-pointer flex flex-col justify-between h-48 hover:-translate-y-0.5 group"
              >
                <div>
                  {/* Badge & priorities */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      tc.type === 'playwright'
                        ? 'bg-brandIndigo/20 text-brandIndigo'
                        : (tc.type === 'api' ? 'bg-indigo-400/20 text-indigo-400' : 'bg-gray-800 text-gray-400')
                    }`}>
                      {tc.type}
                    </span>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      tc.priority === 'high'
                        ? 'bg-red-500/10 text-red-400'
                        : (tc.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400')
                    }`}>
                      {tc.priority}
                    </span>
                  </div>

                  <h3 className="text-md font-bold text-white group-hover:text-brandIndigo transition-colors truncate">
                    {tc.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {tc.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-darkBorder/40 pt-4 mt-3">
                  {/* Tags */}
                  <div className="flex items-center gap-1 overflow-hidden max-w-[200px]">
                    {tc.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                    {tc.tags.length > 2 && (
                      <span className="text-[9px] text-gray-600">+{tc.tags.length - 2}</span>
                    )}
                  </div>

                  {/* Run / Delete */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleRunTestCase(e, tc)}
                      disabled={runningTestId === tc._id}
                      className="p-2 rounded-xl bg-brandIndigo hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center disabled:opacity-40"
                      title="Run Test Case"
                    >
                      {runningTestId === tc._id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white text-transparent" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleDeleteTestCase(e, tc._id)}
                      className="p-2 rounded-xl border border-darkBorder hover:border-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                      title="Delete Test Case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-2xl border border-darkBorder space-y-4">
          <Info className="w-12 h-12 text-gray-700 mx-auto" />
          <h3 className="text-md font-bold text-white">No test cases matching filters</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Create manual/automation test cases, or jump into our AI Generator to batch compile tests with Gemini.
          </p>
        </div>
      )}

      {/* TestCase Detail Modal */}
      {selectedTC && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-3xl border border-darkBorder shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-hidden">
            {/* Close */}
            <button
              onClick={() => setSelectedTC(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <RefreshCw className="w-5 h-5 hover:rotate-180 transition-transform duration-500" />
            </button>

            {/* Title / Badges */}
            <div className="border-b border-darkBorder/60 pb-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandIndigo/20 text-brandIndigo font-bold uppercase tracking-wider">
                  {selectedTC.type}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                  {selectedTC.priority} Priority
                </span>
              </div>
              <h3 className="text-2xl font-bold font-display text-white">{selectedTC.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{selectedTC.description}</p>
            </div>

            {/* Split panels: Details on left, run logs on right */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1">
              {/* Left detail panel */}
              <div className="space-y-4">
                {/* Steps */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-brandIndigo" /> Steps
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-gray-400">
                    {selectedTC.steps?.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    )) || <li>No steps defined.</li>}
                  </ol>
                </div>

                {/* Assertions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-brandIndigo" /> Assertions
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-400">
                    {selectedTC.assertions?.map((ass, idx) => (
                      <li key={idx}>{ass}</li>
                    )) || <li>No assertions defined.</li>}
                  </ul>
                </div>

                {/* Playwright Code or API config */}
                {selectedTC.type === 'playwright' && selectedTC.code && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-brandIndigo" /> Playwright Script
                    </h4>
                    <pre className="p-3 bg-black/40 border border-darkBorder rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-40">
                      {selectedTC.code}
                    </pre>
                  </div>
                )}

                {selectedTC.type === 'api' && selectedTC.apiConfig && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-brandIndigo" /> API Endpoint Config
                    </h4>
                    <div className="p-3 bg-black/40 border border-darkBorder rounded-xl text-xs space-y-1 font-mono text-gray-300">
                      <div>Method: <span className="text-brandIndigo font-bold">{selectedTC.apiConfig.method}</span></div>
                      <div className="truncate">URL: <span className="text-emerald-400">{selectedTC.apiConfig.url}</span></div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedTC.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] bg-darkCard text-brandIndigo px-2 py-0.5 border border-darkBorder rounded-full">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Execution history panel */}
              <div className="space-y-4 border-t md:border-t-0 md:border-l border-darkBorder/60 pt-4 md:pt-0 md:pl-6 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brandIndigo" /> Run History
                  </h4>
                  <button
                    onClick={(e) => handleRunTestCase(e, selectedTC)}
                    disabled={runningTestId === selectedTC._id}
                    className="px-3 py-1.5 bg-brandIndigo hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    {runningTestId === selectedTC._id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white text-transparent" />
                        Run Now
                      </>
                    )}
                  </button>
                </div>

                {execsLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-brandIndigo border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-gray-500">Loading history...</span>
                  </div>
                ) : executions.length > 0 ? (
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                    {executions.map((exec) => (
                      <div key={exec._id} className="p-3 bg-black/20 border border-darkBorder rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                            exec.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {exec.status.toUpperCase()}
                          </span>
                          <span className="text-[9px] text-gray-500">
                            {new Date(exec.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono line-clamp-2">
                          Duration: {exec.runDuration}ms
                          {exec.errorMsg && `\nError: ${exec.errorMsg}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 border border-dashed border-darkBorder rounded-2xl">
                    <p className="text-xs text-gray-500 text-center">No runs logged for this test case.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add TestCase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-darkBorder shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-white mb-6">Create New Test Case</h3>

            <form onSubmit={handleAddTestCase} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Test Case Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Verify sign in validation"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-darkBorder rounded-xl text-sm text-gray-200 focus:outline-none focus:border-brandIndigo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Test Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full px-3 py-2.5 bg-darkCard border border-darkBorder rounded-xl text-sm text-gray-200 focus:outline-none focus:border-brandIndigo"
                    >
                      <option value="manual">Manual Steps</option>
                      <option value="api">API Endpoint</option>
                      <option value="playwright">Playwright Spec</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full px-3 py-2.5 bg-darkCard border border-darkBorder rounded-xl text-sm text-gray-200 focus:outline-none focus:border-brandIndigo"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Description</label>
                <textarea
                  placeholder="Short explanation of test intent..."
                  rows="2"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-darkBorder rounded-xl text-sm text-gray-200 focus:outline-none focus:border-brandIndigo resize-none"
                ></textarea>
              </div>

              {/* Conditional Type Configs */}
              {newType === 'api' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white/5 rounded-2xl border border-darkBorder">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">API URL</label>
                    <input
                      type="url"
                      placeholder="https://api.example.com/health"
                      required={newType === 'api'}
                      value={newApiUrl}
                      onChange={(e) => setNewApiUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-darkBorder rounded-xl text-xs text-gray-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Method</label>
                    <select
                      value={newApiMethod}
                      onChange={(e) => setNewApiMethod(e.target.value)}
                      className="w-full px-2 py-2 bg-darkCard border border-darkBorder rounded-xl text-xs text-gray-200 focus:outline-none"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                </div>
              )}

              {newType === 'playwright' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Playwright Spec Code</label>
                  <textarea
                    placeholder="const { test, expect } = require('@playwright/test');&#10;&#10;test('Run title verify', async ({ page }) => { ... });"
                    rows="6"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full p-4 bg-black/40 border border-darkBorder rounded-xl text-xs text-emerald-400 font-mono focus:outline-none focus:border-brandIndigo resize-none"
                  ></textarea>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Steps (One per line)</label>
                  <textarea
                    placeholder="Step 1: Open site&#10;Step 2: Submit credentials"
                    rows="3"
                    value={newSteps}
                    onChange={(e) => setNewSteps(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-darkBorder rounded-xl text-xs text-gray-200 focus:outline-none"
                  ></textarea>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Assertions (One per line)</label>
                  <textarea
                    placeholder="Verify welcome card is shown&#10;Confirm dashboard renders"
                    rows="3"
                    value={newAssertions}
                    onChange={(e) => setNewAssertions(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/40 border border-darkBorder rounded-xl text-xs text-gray-200 focus:outline-none"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="smoke, checkout, cart"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-darkBorder rounded-xl text-sm text-gray-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={addLoading}
                className="w-full py-3 bg-gradient-to-r from-brandIndigo to-brandViolet text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-brandIndigo/25 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {addLoading ? 'Creating...' : 'Create Test Case'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCases;
