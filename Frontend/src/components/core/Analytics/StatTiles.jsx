import React from 'react';

const monoFont = { fontFamily: "'JetBrains Mono', monospace" };

const StatTiles = ({ data, theme }) => {
  // Fallback in case data hasn't loaded yet
  if (!data) return null;

  // Helper function to format seconds into a clean "Xh Ym" string
  const formatTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds === 0) return '0m';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);

    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  // Array of tile configurations mapped to your theme's accents
  const tiles = [
    {
      title: 'Total Focus Time',
      value: formatTime(data.total_focus_time),
      subtitle: 'Last 7 Days',
      accent: theme.accent, 
      icon: (
        <svg className="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
    },
    {
      title: 'Sessions Completed',
      value: data.sessions_completed || 0,
      subtitle: 'Focus blocks finished',
      accent: theme.accent_2, 
      icon: (
        <svg className="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
    },
    {
      title: 'Average Session',
      value: formatTime(data.average_session_time),
      subtitle: 'Time per focus block',
      accent: theme.accent_3, 
      icon: (
        <svg className="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
      ),
    },
    {
      title: 'Top Subject',
      value: data.top_subject || 'None',
      subtitle: 'Most time spent on',
      accent: theme.accent_4, 
      icon: (
        <svg className="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      ),
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
      {tiles.map((tile, index) => (
        <div
          key={index}
          className="group relative overflow-hidden border rounded-md p-6 transition-all duration-300 hover:-translate-y-1"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${tile.accent}66`;
            e.currentTarget.style.boxShadow = `0 0 30px ${tile.accent}1F`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Top accent bar if you ever want to re-enable it */}
          {/* <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: tile.accent }}
          /> */}

          {/* Glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `linear-gradient(to bottom right, ${tile.accent}14, transparent)` }}
          />

          <div className="relative flex items-start justify-between">
            {/* Left Content */}
            <div>
              <p 
                className="text-[11px] uppercase tracking-[0.12em] font-medium transition-colors duration-500"
                style={{ color: theme.text_secondary }}
              >
                {tile.title}
              </p>

              <h3
                className="mt-3 text-3xl font-semibold tabular-nums tracking-tight transition-colors duration-500"
                style={{ ...monoFont, color: theme.text_primary }}
              >
                {tile.value}
              </h3>

              <p 
                className="mt-2 text-xs transition-colors duration-500"
                style={{ color: theme.text_muted }}
              >
                {tile.subtitle}
              </p>
            </div>

            {/* Icon */}
            <div
              className="p-3 rounded-2xl border border-white/5 transition-colors duration-500"
              style={{ backgroundColor: `${tile.accent}1A`, color: tile.accent }}
            >
              {tile.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatTiles;