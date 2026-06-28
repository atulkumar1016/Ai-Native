import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { FolderPlus, Search, Folder, Trash2, ArrowRight, Plus, X, Edit, FolderOpen } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await client.get('/projects');
      setProjects(res.data.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setModalLoading(true);

    try {
      await client.post('/projects', { name, description });
      setName('');
      setDescription('');
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create project');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProject = async (id, name) => {
    const confirm = window.confirm(`WARNING: Are you sure you want to delete project "${name}"? This will delete all associated test cases and test executions!`);
    if (!confirm) return;

    try {
      await client.delete(`/projects/${id}`);
      fetchProjects();
      // Remove scoping if this project was active
      if (localStorage.getItem('activeProject') === id) {
        localStorage.removeItem('activeProject');
        localStorage.removeItem('activeProjectName');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleSelectProject = (proj) => {
    localStorage.setItem('activeProject', proj._id);
    localStorage.setItem('activeProjectName', proj.name);
    // Alert user or visual indicator is shown in local components
    window.location.href = '/testcases'; // Redirect to test cases scoped under this project
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-white">Project Management</h2>
          <p className="text-sm text-gray-400">Create, delete, and scope test suites by application context</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brandIndigo to-brandViolet hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-brandIndigo/25 active:scale-[0.98]"
        >
          <FolderPlus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Control bar */}
      <div className="glass-panel p-4 rounded-2xl border border-darkBorder flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-500 ml-1" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm focus:outline-none text-gray-200 placeholder:text-gray-600"
        />
      </div>

      {/* Project Listings Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-brandIndigo border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-xs">Loading projects list...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const isSelected = localStorage.getItem('activeProject') === proj._id;

            return (
              <div
                key={proj._id}
                className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between h-56 transition-all duration-300 relative group ${
                  isSelected ? 'border-brandIndigo indigo-glow bg-zinc-900/85' : 'border-darkBorder hover:border-white/10'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${isSelected ? 'bg-brandIndigo/20 text-brandIndigo' : 'bg-white/5 text-gray-400'}`}>
                    <Folder className="w-6 h-6" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandIndigo/20 text-brandIndigo font-bold uppercase tracking-wider">
                      Active Scope
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="my-4 space-y-1">
                  <h3 className="text-lg font-bold text-white font-display truncate leading-snug">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-darkBorder/40 pt-4 mt-2">
                  <button
                    onClick={() => handleSelectProject(proj)}
                    className="flex items-center gap-1.5 text-xs text-brandIndigo font-bold hover:text-indigo-400 transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Open Project
                  </button>

                  <button
                    onClick={() => handleDeleteProject(proj._id, proj.name)}
                    className="p-1.5 rounded-lg border border-darkBorder hover:border-red-500/20 text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-2xl border border-darkBorder space-y-3">
          <Folder className="w-12 h-12 text-gray-700 mx-auto" />
          <h3 className="text-md font-bold text-white">No projects found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Get started by creating a new testing project space to associate test suites and automation routines.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brandIndigo hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      )}

      {/* Create Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-darkBorder shadow-2xl p-6 relative animate-float">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-white mb-6">Create New Project</h3>
            
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shopping App Platform"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-darkBorder rounded-xl text-sm text-gray-200 focus:outline-none focus:border-brandIndigo transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Description</label>
                <textarea
                  placeholder="A short summary of this application area..."
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-darkBorder rounded-xl text-sm text-gray-200 focus:outline-none focus:border-brandIndigo transition-all resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-3 bg-gradient-to-r from-brandIndigo to-brandViolet text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-brandIndigo/25 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {modalLoading ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
