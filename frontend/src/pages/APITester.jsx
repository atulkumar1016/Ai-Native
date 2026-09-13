import React, { useState } from 'react';
import client from '../api/client';
import {
  Globe,
  Send,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Save,
  Cpu,
  CornerDownRight,
  Database
} from 'lucide-react';

const APITester = () => {
  const activeProjectId = localStorage.getItem('activeProject');
  const activeProjectName = localStorage.getItem('activeProjectName');

  // Input states
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [body, setBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [expectedStatus, setExpectedStatus] = useState(200);

  // Assertions state
  const [assertions, setAssertions] = useState([
    { type: 'status_code', property: '', value: '200' }
  ]);

  // App States
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Save test case states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const addHeader = () => {
    setHeaders(prev => [...prev, { key: '', value: '' }]);
  };

  const removeHeader = (idx) => {
    setHeaders(prev => prev.filter((_, i) => i !== idx));
  };

  const updateHeader = (idx, field, val) => {
    setHeaders(prev => {
      const copy = [...prev];
      copy[idx][field] = val;
      return copy;
    });
  };

  const addAssertion = () => {
    setAssertions(prev => [...prev, { type: 'status_code', property: '', value: '' }]);
  };

  const removeAssertion = (idx) => {
    setAssertions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateAssertion = (idx, field, val) => {
    setAssertions(prev => {
      const copy = [...prev];
      copy[idx][field] = val;
      return copy;
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSaveSuccess(false);

    // Format headers array to object
    const headersObj = {};
    headers.forEach(h => {
      if (h.key.trim()) {
        headersObj[h.key.trim()] = h.value.trim();
      }
    });

    try {
      const res = await client.post('/executions/run-adhoc', {
        url,
        method,
        headers: headersObj,
        body,
        expectedStatus,
        assertions
      });

      setResult(res.data.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'API request process failed to execute');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTestCase = async (e) => {
    e.preventDefault();
    if (!activeProjectId) {
      alert('Please select an active project from Dashboard or Projects tab first.');
      return;
    }
    if (!testTitle) return;

    setSaveLoading(true);
    
    // Format headers array to object
    const headersObj = {};
    headers.forEach(h => {
      if (h.key.trim()) {
        headersObj[h.key.trim()] = h.value.trim();
      }
    });

    const payload = {
      project: activeProjectId,
      title: testTitle,
      description: testDesc,
      type: 'api',
      priority: 'medium',
      steps: [
        `Send ${method} request to URL: ${url}`,
        `Verify response code equals ${expectedStatus}`
      ],
      assertions: assertions.map(a => `${a.type.toUpperCase()} ${a.property ? 'on ' + a.property : ''} matches "${a.value}"`),
      tags: ['api', 'rest'],
      apiConfig: {
        url,
        method,
        headers: headersObj,
        body,
        expectedStatus,
        assertions
      }
    };

    try {
      await client.post('/testcases', payload);
      setSaveSuccess(true);
      setShowSaveModal(false);
      setTestTitle('');
      setTestDesc('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save test case');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-white">REST API Tester</h2>
          <p className="text-sm text-gray-400">Postman-like testing console. Set assertions, verify JSON paths, and view timing stats</p>
        </div>
        
        {result && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brandIndigo to-brandViolet text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-md active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save as Test Case
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          API test saved successfully into Project Scope: <span className="underline font-bold">{activeProjectName}</span>!
        </div>
      )}

      {/* Main split dashboard panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Request designer panel */}
        <div className="space-y-6">
          <form onSubmit={handleSend} className="glass-panel p-6 rounded-3xl border border-darkBorder space-y-6 indigo-glow">
            {/* Method + URL */}
            <div className="flex gap-3">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="bg-darkCard border border-darkBorder rounded-xl text-sm font-bold text-white py-3 px-4 focus:outline-none focus:border-brandIndigo"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="url"
                required
                placeholder="https://api.example.com/endpoint"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-black/40 border border-darkBorder rounded-xl px-4 text-sm text-gray-200 focus:outline-none focus:border-brandIndigo placeholder:text-gray-600 font-mono"
              />

              <button
                type="submit"
                disabled={loading}
                className="px-6 bg-brandIndigo hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-brandIndigo/25 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>

            {/* Request Headers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">HTTP Headers</label>
                <button
                  type="button"
                  onClick={addHeader}
                  className="text-brandIndigo hover:text-indigo-400 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Header
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {headers.map((h, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Header key"
                      value={h.key}
                      onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/20 border border-darkBorder rounded-lg text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={h.value}
                      onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/20 border border-darkBorder rounded-lg text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(idx)}
                      className="p-2 border border-darkBorder hover:border-red-500/25 hover:bg-red-500/5 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Body (JSON) */}
            {['POST', 'PUT'].includes(method) && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">JSON Body</label>
                <textarea
                  rows="5"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-4 bg-black/40 border border-darkBorder rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-brandIndigo resize-none"
                ></textarea>
              </div>
            )}

            {/* Assertions Builder */}
            <div className="space-y-4 pt-4 border-t border-darkBorder/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Test Assertions</label>
                <button
                  type="button"
                  onClick={addAssertion}
                  className="text-brandIndigo hover:text-indigo-400 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Assertion
                </button>
              </div>

              <div className="space-y-2">
                {assertions.map((a, idx) => (
                  <div key={idx} className="flex gap-2 items-center text-xs">
                    <select
                      value={a.type}
                      onChange={(e) => updateAssertion(idx, 'type', e.target.value)}
                      className="bg-darkCard border border-darkBorder rounded-lg p-2 font-semibold text-gray-300 focus:outline-none"
                    >
                      <option value="status_code">Status Code</option>
                      <option value="response_time">Response Time (ms)</option>
                      <option value="json_contains">JSON Path Check</option>
                      <option value="text_contains">Text Contains</option>
                      <option value="header_exists">Header Exists</option>
                    </select>

                    {a.type === 'json_contains' && (
                      <input
                        type="text"
                        placeholder="Path e.g. data.id"
                        value={a.property}
                        onChange={(e) => updateAssertion(idx, 'property', e.target.value)}
                        className="flex-1 px-2.5 py-2 bg-black/20 border border-darkBorder rounded-lg font-mono text-xs"
                      />
                    )}

                    {a.type === 'header_exists' && (
                      <input
                        type="text"
                        placeholder="Header name"
                        value={a.property}
                        onChange={(e) => updateAssertion(idx, 'property', e.target.value)}
                        className="flex-1 px-2.5 py-2 bg-black/20 border border-darkBorder rounded-lg font-mono text-xs"
                      />
                    )}

                    {a.type !== 'header_exists' && (
                      <input
                        type="text"
                        placeholder="Expected value"
                        value={a.value}
                        onChange={(e) => updateAssertion(idx, 'value', e.target.value)}
                        className="flex-1 px-2.5 py-2 bg-black/20 border border-darkBorder rounded-lg font-mono text-xs"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => removeAssertion(idx)}
                      className="p-2 border border-darkBorder hover:border-red-500/25 hover:bg-red-500/5 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Response panel */}
        <div className="space-y-6">
          {loading ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-brandIndigo/20 h-full flex flex-col justify-center items-center gap-4">
              <div className="w-8 h-8 border-3 border-brandIndigo border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-xs animate-pulse">Waiting for server response...</p>
            </div>
          ) : result ? (
            <div className="glass-panel p-6 rounded-3xl border border-darkBorder h-full flex flex-col justify-between violet-glow">
              {/* Response Stats */}
              <div className="space-y-4">
                <div className="flex items-center gap-6 border-b border-darkBorder/60 pb-4">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Status</span>
                    <span className={`text-md font-bold ${
                      result.status === 'passed' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {result.responseStatus || 'N/A'} {result.status === 'passed' ? 'OK' : 'FAIL'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Time</span>
                    <span className="text-md font-bold text-gray-300 flex items-center gap-1 font-mono">
                      <Clock className="w-4 h-4 text-brandViolet" />
                      {result.runDuration} ms
                    </span>
                  </div>
                </div>

                {/* Assertions report */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Test Results</span>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {result.assertionsResult?.map((a, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-black/10 rounded-xl border border-darkBorder/40">
                        <span className="text-gray-300 font-mono flex items-center gap-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-brandViolet" />
                          {a.assertion}
                        </span>
                        <div className="flex items-center gap-1">
                          {a.passed ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-semibold text-[10px] uppercase">
                              <CheckCircle className="w-4 h-4 text-emerald-500" /> Pass
                            </span>
                          ) : (
                            <span className="text-red-400 flex flex-col items-end gap-0.5 text-[9px] font-mono leading-none">
                              <span className="flex items-center gap-1 font-semibold text-[10px] uppercase text-red-500">
                                <XCircle className="w-4 h-4 text-red-500" /> Fail
                              </span>
                              <span className="text-[9px] text-gray-500">{a.error}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body display */}
                <div className="space-y-2 flex-1 flex flex-col">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Response Body</span>
                  <pre className="p-4 bg-black/40 border border-darkBorder rounded-xl text-xs font-mono text-indigo-300 overflow-auto max-h-80 max-w-full">
                    {result.responseBody || 'No response body returned.'}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-3xl border border-darkBorder h-full flex flex-col justify-center items-center gap-3">
              <Globe className="w-12 h-12 text-gray-700 animate-float" />
              <h3 className="text-md font-bold text-white">Send API Request</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Configure URL, headers, and expected assertions in the designer. Trigger requests from our Node backend to inspect metrics directly.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Test Case Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-darkBorder shadow-2xl p-6 relative animate-float">
            <button
              onClick={() => setShowSaveModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-white mb-4">Save API Test</h3>
            
            <div className="p-3 bg-white/5 rounded-xl border border-darkBorder mb-4 text-[10px] space-y-0.5">
              <span className="text-gray-500">Destination Project Scope:</span>
              <div className="flex items-center gap-1.5 font-bold text-brandIndigo text-xs">
                <Database className="w-3.5 h-3.5" />
                {activeProjectName || 'No scope selected'}
              </div>
            </div>

            <form onSubmit={handleSaveTestCase} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Test Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify customer profile API"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-darkBorder rounded-xl text-sm text-gray-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Description</label>
                <textarea
                  placeholder="A short summary of this API test case's parameters..."
                  rows="2"
                  value={testDesc}
                  onChange={(e) => setTestDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-darkBorder rounded-xl text-sm text-gray-200 focus:outline-none resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full py-3 bg-gradient-to-r from-brandIndigo to-brandViolet text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saveLoading ? 'Saving...' : 'Confirm Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default APITester;
