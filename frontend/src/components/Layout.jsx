import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderOpen,
  FileCode,
  Sparkles,
  Globe,
  Bug,
  BarChart3,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  Cpu
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderOpen },
    { name: 'Test Cases', path: '/testcases', icon: FileCode },
    { name: 'AI Generator', path: '/ai-generator', icon: Sparkles },
    { name: 'API Tester', path: '/api-tester', icon: Globe },
    { name: 'Automation', path: '/playwright-runner', icon: Cpu },
    { name: 'Bug Analyzer', path: '/bug-analyzer', icon: Bug },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  // Admin routing check
  if (user && user.role === 'admin') {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: ShieldAlert });
  }

  return (
    <div className="flex h-screen bg-darkBg text-gray-100 font-sans overflow-hidden mesh-gradient">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-darkBorder flex flex-col h-full z-10">
        {/* Logo Banner */}
        <div className="p-6 border-b border-darkBorder flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brandIndigo to-brandViolet text-white shadow-md shadow-brandIndigo/20 animate-float">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display tracking-tight leading-none bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              ANTIGRAVITY
            </h1>
            <span className="text-[10px] text-brandIndigo font-semibold tracking-wider uppercase font-display">
              AI-Native QA
            </span>
          </div>
        </div>

        {/* Sidebar Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brandIndigo text-white shadow-md shadow-brandIndigo/25'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer profile & logout */}
        <div className="p-4 border-t border-darkBorder bg-black/20 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 rounded-full bg-darkBorder text-gray-300">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate leading-none mb-1 text-gray-200">
                {user?.name}
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandIndigo/20 text-brandIndigo font-bold uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-darkBorder hover:bg-red-500/10 hover:border-red-500/20 text-gray-400 hover:text-red-400 text-xs font-semibold transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content body panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-darkBorder px-8 flex items-center justify-between bg-darkBg/60 backdrop-blur-md z-10">
          <h2 className="text-xl font-bold font-display text-white">
            {navItems.find((item) => item.path === location.pathname)?.name || 'Platform'}
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>System Status: <span className="text-emerald-500 font-semibold">Active</span></span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </header>

        {/* Dynamic Page Router Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-950/40">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
