import React, { useState, useEffect } from 'react';
import client from '../api/client';
import StatCard from '../components/StatCard';
import {
  Folder,
  FileCode,
  Activity,
  Award,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentExecs, setRecentExecs] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await client.get('/executions/dashboard');
        
        const { stats, recentExecutions, timeline } = res.data.data;
        setStats(stats);
        setRecentExecs(recentExecutions);
        setTimelineData(timeline);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to connect to the backend API. Please make sure the backend server is running and database is active.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-brandIndigo border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm animate-pulse">Assembling analytics dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-darkBorder max-w-lg mx-auto text-center space-y-4 my-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
        <h3 className="text-lg font-bold text-white">Database Connection Check</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {error}
        </p>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="px-4 py-2 bg-brandIndigo text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-all flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  // Fallbacks if data empty
  const totalProjects = stats?.totalProjects || 0;
  const totalTestCases = stats?.totalTestCases || 0;
  const totalExecutions = stats?.totalExecutions || 0;
  const successRate = stats?.successRate || 0;

  // Chart 1: Timeline (Line Chart)
  const lineChartData = {
    labels: timelineData.map(t => t.date),
    datasets: [
      {
        label: 'Passed Executions',
        data: timelineData.map(t => t.passed),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Failed Executions',
        data: timelineData.map(t => t.failed),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#9ca3af', font: { family: 'Inter' } }
      }
    },
    scales: {
      x: { grid: { color: '#27272a' }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: '#27272a' }, ticks: { color: '#9ca3af', stepSize: 1 } }
    }
  };

  // Chart 2: Status Distribution (Doughnut Chart)
  const doughnutChartData = {
    labels: ['Passed', 'Failed', 'Error'],
    datasets: [
      {
        data: [
          stats?.statusDistribution?.passed || 0,
          stats?.statusDistribution?.failed || 0,
          stats?.statusDistribution?.error || 0
        ],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 1,
        borderColor: '#18181b',
      }
    ]
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#9ca3af', font: { family: 'Inter' } }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Page Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-white">Dashboard Overview</h2>
          <p className="text-sm text-gray-400">Track and monitor your test automation metrics in real-time</p>
        </div>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="p-3 rounded-xl border border-darkBorder hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-200"
          title="Refresh Dashboard"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={Folder}
          colorClass="text-indigo-400 bg-indigo-500/10"
        />
        <StatCard
          title="Active Test Cases"
          value={totalTestCases}
          icon={FileCode}
          colorClass="text-violet-400 bg-violet-500/10"
        />
        <StatCard
          title="Test Executions"
          value={totalExecutions}
          icon={Activity}
          colorClass="text-emerald-400 bg-emerald-500/10"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={Award}
          colorClass="text-amber-400 bg-amber-500/10"
          trend={successRate > 80 ? '+4.2%' : '-1.5%'}
          trendType={successRate > 80 ? 'positive' : 'negative'}
        />
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Execution History Graph */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder xl:col-span-2 space-y-4">
          <h4 className="text-md font-semibold text-white">Execution Timeline (Last 7 Days)</h4>
          <div className="h-80 relative">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder space-y-4">
          <h4 className="text-md font-semibold text-white">Status Distribution</h4>
          <div className="h-80 relative flex items-center justify-center">
            {totalExecutions > 0 ? (
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            ) : (
              <div className="text-center text-gray-500 text-sm space-y-1">
                <Cpu className="w-10 h-10 text-gray-700 mx-auto" />
                <p>No executions logs logged yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel p-6 rounded-2xl border border-darkBorder space-y-4">
        <h4 className="text-md font-semibold text-white">Recent Executions</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400 border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-xs text-gray-300 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Test Case</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentExecs.length > 0 ? (
                recentExecs.map((exec) => {
                  const status = exec.status;
                  return (
                    <tr key={exec._id} className="border-b border-darkBorder/40 hover:bg-white/5 transition-all">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {exec.testCase?.title || 'Deleted Test Case'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold uppercase text-brandIndigo">
                        {exec.testCase?.type || 'manual'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {(exec.runDuration / 1000).toFixed(2)}s
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          status === 'passed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : (status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400')
                        }`}>
                          {status === 'passed' ? <CheckCircle className="w-3.5 h-3.5" /> : (status === 'failed' ? <XCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />)}
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-gray-500">
                        {new Date(exec.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500 text-sm">
                    No execution history logged. Start by running a test case!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
