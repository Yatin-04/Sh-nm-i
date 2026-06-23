import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

const monoFont = "'JetBrains Mono', monospace";

const DailyTimelineGraph = ({ data, theme }) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center h-[350px] text-sm transition-colors duration-500"
        style={{ color: theme.text_muted }}
      >
        No activity recorded for this day
      </div>
    );
  }

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  const formatHour = (hour) => {
    if (hour === 0) return "12AM";
    if (hour === 12) return "12PM";
    return hour > 12 ? `${hour - 12}PM` : `${hour}AM`;
  };

  const formatTooltipHour = (hour) => {
    const nextHour = (hour + 1) % 24;

    const format = (h) => {
      if (h === 0) return "12:00 AM";
      if (h === 12) return "12:00 PM";
      return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
    };

    return `${format(hour)} - ${format(nextHour)}`;
  };

  return (
    <div className="w-full h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient
              id="timelineFocusGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={theme.accent} stopOpacity={0.75} />
              <stop offset="100%" stopColor={theme.accent} stopOpacity={1} />
            </linearGradient>

            <linearGradient
              id="timelineBreakGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={theme.accent_2} stopOpacity={0.75} />
              <stop offset="100%" stopColor={theme.accent_2} stopOpacity={1} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke={theme.border}
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            interval={1}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: theme.text_muted,
              fontSize: 11,
              fontFamily: monoFont,
            }}
            dy={10}
          />

          <YAxis
            tickFormatter={(value) =>
              value === 0
                ? ""
                : `${Math.round(value / 60)}m`
            }
            axisLine={false}
            tickLine={false}
            tick={{
              fill: theme.text_muted,
              fontSize: 12,
              fontFamily: monoFont,
            }}
            width={50}
          />

          <Tooltip
            cursor={{
              fill: theme.panel_pill_bg, // Uses the transparent rgba from your theme
            }}
            contentStyle={{
              background: theme.surface_raised,
              border: `1px solid ${theme.border}`,
              borderRadius: "16px",
              color: theme.text_primary,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              fontFamily: monoFont,
              fontSize: "12px",
              padding: "10px 14px",
            }}
            labelStyle={{
              color: theme.text_muted,
              marginBottom: "4px",
            }}
            formatter={(value) =>
              formatDuration(value)
            }
            labelFormatter={formatTooltipHour}
          />

          <Legend
            wrapperStyle={{
              color: theme.text_muted,
              paddingTop: "20px",
              fontSize: "12px",
              fontFamily: monoFont,
            }}
            iconType="square"
          />

          <Bar
            dataKey="focus_duration"
            name="Focus Time"
            fill="url(#timelineFocusGradient)"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          >
            {data.map((_, index) => (
              <Cell key={index} />
            ))}
          </Bar>

          <Bar
            dataKey="break_duration"
            name="Break Time"
            fill="url(#timelineBreakGradient)"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          >
            {data.map((_, index) => (
              <Cell key={index} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyTimelineGraph;