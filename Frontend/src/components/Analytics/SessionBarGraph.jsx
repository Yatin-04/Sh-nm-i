import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const monoFont = "'JetBrains Mono', monospace";

const SessionBarGraph = ({ data, onDayClick, theme }) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center h-[420px] text-sm transition-colors duration-500"
        style={{ color: theme.text_muted }}
      >
        No activity data available
      </div>
    );
  }

  const formatTooltipDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  const formatYAxisTick = (seconds) => {
    const hrs = Math.floor(seconds / 3600);

    if (hrs === 0) return "";
    return `${hrs}h`;
  };

  const formatXAxisTick = (dateStr) => {
    const date = new Date(dateStr);

    return date.toLocaleDateString("en-US", {
      weekday: "short",
    });
  };

  return (
    <div className="w-full h-[450px]">
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
              id="focusGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={theme.accent} stopOpacity={0.75} />
              <stop offset="100%" stopColor={theme.accent} stopOpacity={1} />
            </linearGradient>

            <linearGradient
              id="breakGradient"
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
            dataKey="date"
            tickFormatter={formatXAxisTick}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: theme.text_muted,
              fontSize: 12,
              fontFamily: monoFont,
            }}
            dy={10}
          />

          <YAxis
            tickFormatter={formatYAxisTick}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: theme.text_muted,
              fontSize: 12,
              fontFamily: monoFont,
            }}
            width={45}
          />

          <Tooltip
            cursor={{
              fill: theme.panel_pill_bg,
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
            itemStyle={{
              color: theme.text_primary,
            }}
            formatter={(value) => formatTooltipDuration(value)}
            labelFormatter={(label) =>
              new Date(label).toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                }
              )
            }
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
            stackId="a"
            fill="url(#focusGradient)"
            radius={[0, 0, 10, 10]}
            maxBarSize={46}
            cursor="pointer"
            onClick={(item) =>
              onDayClick?.(item.date)
            }
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                style={{
                  transition: "all .3s ease",
                }}
              />
            ))}
          </Bar>

          <Bar
            dataKey="break_duration"
            name="Break Time"
            stackId="a"
            fill="url(#breakGradient)"
            radius={[10, 10, 0, 0]}
            maxBarSize={46}
            cursor="pointer"
            onClick={(item) =>
              onDayClick?.(item.date)
            }
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                style={{
                  transition: "all .3s ease",
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SessionBarGraph;