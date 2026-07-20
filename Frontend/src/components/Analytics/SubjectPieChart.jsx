import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const monoFont = "'JetBrains Mono', monospace";

const SubjectPieChart = ({ data, theme }) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center h-[350px] text-sm transition-colors duration-500"
        style={{ color: theme.text_muted }}
      >
        No session data available
      </div>
    );
  }

  const totalDuration = data.reduce(
    (sum, item) => sum + item.total_duration,
    0
  );

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total_duration"
            nameKey="subject_name"
            cx="50%"
            cy="45%"
            innerRadius={75}
            outerRadius={115}
            paddingAngle={3}
            stroke={theme.surface}
            strokeWidth={2}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={theme.chart_colors[index % theme.chart_colors.length]}
                style={{ transition: "fill 0.5s ease" }}
              />
            ))}
          </Pie>

          {/* Center Content */}
          <text
            x="50%"
            y="41%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.text_muted}
            fontSize="11"
            fontFamily={monoFont}
            style={{ 
              letterSpacing: '0.1em', 
              textTransform: 'uppercase',
              transition: "fill 0.5s ease" 
            }}
          >
            Total Focus
          </text>

          <text
            x="50%"
            y="51%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.accent}
            fontSize="24"
            fontWeight="600"
            fontFamily={monoFont}
            style={{ transition: "fill 0.5s ease" }}
          >
            {Math.floor(totalDuration / 3600)}h
          </text>

          <Tooltip
            contentStyle={{
              backgroundColor: theme.surface_raised,
              border: `1px solid ${theme.border}`,
              borderRadius: "16px",
              color: theme.text_primary,
              fontFamily: monoFont,
              fontSize: "12px",
              padding: "10px 14px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
            itemStyle={{ color: theme.text_primary }}
            labelStyle={{ color: theme.text_muted }}
            formatter={(value, name, props) => {
              const percentage = (
                (value / totalDuration) *
                100
              ).toFixed(1);

              return [
                `${formatDuration(value)} (${percentage}%)`,
                props.payload.subject_name,
              ];
            }}
          />

          {/* <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              color: theme.text_muted,
              paddingTop: "20px",
              fontSize: "12px",
              fontFamily: monoFont,
            }}
          /> */}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubjectPieChart;