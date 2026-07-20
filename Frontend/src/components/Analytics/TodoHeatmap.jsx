import React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

const TodoHeatmap = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-slate-500">
        No task activity available
      </div>
    );
  }

  const today = new Date();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date),
  }));

  const getClassForValue = (value) => {
    if (
      !value ||
      value.total_tasks === undefined ||
      value.completed_tasks === 0
    ) {
      return "color-empty";
    }

    const ratio =
      value.completed_tasks / value.total_tasks;

    if (ratio <= 0.25) return "color-scale-1";
    if (ratio <= 0.5) return "color-scale-2";
    if (ratio <= 0.75) return "color-scale-3";

    return "color-scale-4";
  };

  return (
    <div className="w-full overflow-hidden">

      {/* Heatmap */}
      <CalendarHeatmap
        startDate={thirtyDaysAgo}
        endDate={today}
        values={formattedData}
        classForValue={getClassForValue}
        showWeekdayLabels={true}
        gutterSize={2}
        titleForValue={(value) => {
          if (!value) return "No tasks";

          const date =
            value.date instanceof Date
              ? value.date.toLocaleDateString()
              : value.date;

          return `${date}
            Completed: ${value.completed_tasks}
            Total: ${value.total_tasks}`;
        }}
      />

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 mt-6 text-xs text-slate-500">

        <span>Less</span>

        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-800" />
          <div className="w-3 h-3 rounded-sm bg-indigo-950" />
          <div className="w-3 h-3 rounded-sm bg-indigo-700" />
          <div className="w-3 h-3 rounded-sm bg-indigo-500" />
          <div className="w-3 h-3 rounded-sm bg-indigo-300" />
        </div>

        <span>More</span>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          
          .react-calendar-heatmap {
            width: 100%;
            height: 350px;
          }

          .react-calendar-heatmap text {
            fill: #64748b;
            font-size: 11px;
          }

          .react-calendar-heatmap rect {
            rx: 4;
            ry: 4;
            transition: all .25s ease;
          }

          .react-calendar-heatmap rect:hover {
            stroke: #ffffff;
            stroke-width: 1.5px;
            transform: scale(1.12);
            transform-origin: center;
          }

          .react-calendar-heatmap .color-empty {
            fill: #1e293b;
          }

          .react-calendar-heatmap .color-scale-1 {
            fill: #312e81;
          }

          .react-calendar-heatmap .color-scale-2 {
            fill: #4338ca;
          }

          .react-calendar-heatmap .color-scale-3 {
            fill: #6366f1;
          }

          .react-calendar-heatmap .color-scale-4 {
            fill: #a5b4fc;
          }

          .react-calendar-heatmap-weekday-label {
            fill: #64748b;
          }

          .react-calendar-heatmap-month-label {
            fill: #94a3b8;
          }
        `,
        }}
      />
    </div>
  );
};

export default TodoHeatmap;