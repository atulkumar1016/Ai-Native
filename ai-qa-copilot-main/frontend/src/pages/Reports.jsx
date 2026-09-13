import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { FileText, Download, BarChart3, AlertCircle, Database, HelpCircle } from 'lucide-react';

const Reports = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await client.get('/projects');
        setProjects(res.data.data);
        const activeScope = localStorage.getItem('activeProject');
        if (activeScope) {
          setSelectedProject(activeScope);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleDownloadReport = (format) => {
    setDownloading(true);
    
    // Fetch report as blob to properly pass JWT in headers
    const downloadBlob = async () => {
      try {
        let url = `/executions/report/${format}`;
        if (selectedProject) {
          url += `?project=${selectedProject}`;
        }

        const response = await client.get(url, {
          responseType: 'blob'
        });

        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        
        const fileName = `execution-report-${Date.now()}.${format}`;
        link.setAttribute('download', fileName);
        
        document.body.appendChild(link);
        link.click();
        
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error(err);
        alert('Failed to generate report. Make sure you have active execution logs.');
      } finally {
        setDownloading(false);
      }
    };

    downloadBlob();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold font-display text-white">Reports Center</h2>
        <p className="text-sm text-gray-400">Generate and export certified PDF summaries and raw CSV execution statistics</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass-panel p-8 rounded-3xl border border-darkBorder space-y-6 indigo-glow">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brandIndigo" /> Compile Export Setup
          </h3>

          {loading ? (
            <div className="py-4 text-center text-xs text-gray-500">Loading project scopes...</div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Scope filter</label>
              <div className="relative">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-darkBorder rounded-xl text-sm text-gray-200 focus:outline-none focus:border-brandIndigo"
                >
                  <option value="">All Projects Scope (Combined summary)</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Database className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-darkBorder/40">
            <div className="p-5 rounded-2xl border border-darkBorder/85 bg-black/10 flex flex-col justify-between h-44 hover:border-brandIndigo/40 transition-colors group">
              <div>
                <FileText className="w-8 h-8 text-brandIndigo group-hover:scale-110 transition-transform mb-3" />
                <h4 className="text-sm font-bold text-white">Executive PDF Report</h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  Polished documentation featuring stats summaries, metrics grids, and lists of recent runs.
                </p>
              </div>
              <button
                onClick={() => handleDownloadReport('pdf')}
                disabled={downloading}
                className="w-full py-2 bg-brandIndigo hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brandIndigo/15 mt-3"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-darkBorder/85 bg-black/10 flex flex-col justify-between h-44 hover:border-brandViolet/40 transition-colors group">
              <div>
                <FileText className="w-8 h-8 text-brandViolet group-hover:scale-110 transition-transform mb-3" />
                <h4 className="text-sm font-bold text-white">Raw Datatable CSV</h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  Raw executions history list containing timings, targets, status codes, and trace descriptions.
                </p>
              </div>
              <button
                onClick={() => handleDownloadReport('csv')}
                disabled={downloading}
                className="w-full py-2 bg-brandViolet hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brandViolet/15 mt-3"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 bg-white/5 rounded-2xl border border-darkBorder text-[10px] text-gray-400 leading-normal">
          <HelpCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
          <span>
            Blob downloads query execution databases automatically. If files fail to save, verify that your test suites have been executed at least once to log run statistics.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Reports;
