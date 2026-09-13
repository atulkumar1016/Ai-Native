import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass = 'text-brandIndigo bg-brandIndigo/10', trend, trendType = 'neutral' }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-darkBorder flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-white/10 transition-all duration-300">
      <div className="space-y-2 relative z-10">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{title}</span>
        <h3 className="text-3xl font-bold font-display text-white">{value}</h3>
        {trend && (
          <p className="text-xs flex items-center gap-1.5 mt-1">
            <span className={`font-semibold ${
              trendType === 'positive' ? 'text-emerald-500' : (trendType === 'negative' ? 'text-rose-500' : 'text-gray-400')
            }`}>
              {trend}
            </span>
            <span className="text-gray-500">vs last week</span>
          </p>
        )}
      </div>

      <div className={`p-4 rounded-2xl ${colorClass} group-hover:scale-110 transition-transform duration-300 relative z-10`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Decorative Background Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default StatCard;
