import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Cpu, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex items-center justify-center relative p-6 mesh-gradient overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brandIndigo/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brandViolet/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Banner */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brandIndigo to-brandViolet text-white shadow-lg shadow-brandIndigo/25 animate-float mb-2">
            <Cpu className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-sm text-gray-400">
            Sign in to access your test cases and automation pipeline
          </p>
        </div>

        {/* Login Form Panel */}
        <div className="glass-panel p-8 rounded-3xl border border-darkBorder shadow-xl space-y-6 indigo-glow">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-darkBorder rounded-xl text-sm text-gray-100 focus:outline-none focus:border-brandIndigo focus:ring-1 focus:ring-brandIndigo transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-darkBorder rounded-xl text-sm text-gray-100 focus:outline-none focus:border-brandIndigo focus:ring-1 focus:ring-brandIndigo transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brandIndigo to-brandViolet hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-brandIndigo/20 hover:shadow-brandIndigo/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Sandbox Login Box */}
          <div className="p-3 bg-white/5 rounded-xl border border-darkBorder text-center text-xs space-y-1">
            <span className="text-gray-400">Default Demo Credentials:</span>
            <div className="flex justify-center gap-3 font-mono text-brandIndigo font-bold">
              <span>user@test.com / password123</span>
            </div>
          </div>
        </div>

        {/* Navigation back */}
        <p className="text-center mt-6 text-sm text-gray-400">
          New to the platform?{' '}
          <Link to="/signup" className="text-brandIndigo hover:text-indigo-400 font-semibold transition-all">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
