import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { apiConnector } from '../services/apiConnector';
import { analyticsEndpoints } from '../services/api';
import { fetchAnalyticsDashboard } from '../services/Operations/analyticsAPI';
import { logout } from '../services/Operations/authAPI';
import { clearAuth } from '../slices/authSlice';
import { FiX } from 'react-icons/fi';

// Make sure to import your themes from wherever they are stored
import { colorThemes } from '../utils/colorTheme';

import SideNav from '../components/layout/SideNav';
import StatTiles from '../components/Analytics/StatTiles';
import SubjectPieChart from '../components/Analytics/SubjectPieChart';
import SessionBarGraph from '../components/Analytics/SessionBarGraph';
// import TodoHeatmap from '../components/Analytics/TodoHeatmap';
import DailyTimelineGraph from '../components/Analytics/DailyTimelineGraph';

const displayFont = { fontFamily: "'Fraunces', Georgia, serif" };
const monoFont = { fontFamily: "'JetBrains Mono', monospace" };

const Analytics = () => {
  const [dashboardData, setDashboardData] = useState({
    tileStats: null,
    pieChart: [],
    barGraph: [],
    heatmap: []
  });
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const themeId = useSelector((state) => state.theme.theme_id);
  
  // Resolve current theme
  const theme = colorThemes.find(t => t.color_grp === themeId) || colorThemes[0];

  const isIdle = false;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  const fillLast7Days = (barGraphData) => {
    const map = new Map();
    barGraphData.forEach((item) => {
      const date = new Date(item.date).toISOString().split("T")[0];
      map.set(date, item);
    });

    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push(
        map.get(dateStr) || {
          date: dateStr,
          focus_duration: 0,
          break_duration: 0,
        }
      );
    }
    return result;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsDashboardLoading(true);
        const { tileStats, pieChart, barGraph, heatmap } = await fetchAnalyticsDashboard();
        setDashboardData({
          tileStats,
          pieChart,
          barGraph: fillLast7Days(barGraph),
          heatmap,
        });
      } catch (error) {
        console.error("Could not fetch analytics dashboard data:", error);
      } finally {
        setIsDashboardLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch { /* ignore */ }
    dispatch(clearAuth());
    navigate("/");
  };

  const handleDayClick = async (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
    setIsTimelineLoading(true);
    try {
      const response = await apiConnector(
        "GET",
        `${analyticsEndpoints.USER_TIMELINE_API}?date=${date}`,
        null,
      );
      setTimelineData(response.dailyTimeline || []);
    } catch (error) {
      console.error("Could not fetch daily timeline data:", error);
      setTimelineData([]);
    } finally {
      setIsTimelineLoading(false);
    }
  };

  // Inject a small block for hover states 
  const dynamicStyles = `
    .theme-modal-btn:hover {
      background-color: ${theme.border_subtle} !important;
      color: ${theme.text_primary} !important;
    }
  `;

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: theme.page_bg }}>
        <div className="flex flex-col items-center gap-3">
          <div 
            className="w-8 h-8 border-2 rounded-full animate-spin" 
            style={{ borderColor: theme.border, borderTopColor: theme.accent }} 
          />
          <p className="text-sm" style={{ ...monoFont, color: theme.text_muted }}>Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex transition-colors duration-500" style={{ backgroundColor: theme.page_bg }}>
      <style>{dynamicStyles}</style>
      
      {/* <SideNav userName={user?.name} onLogout={handleLogout} darkMode={!isIdle} /> */}

      <main className="flex-1 relative ml-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ ...monoFont, color: theme.accent }}>
              Study Analytics
            </p>
            <h1 className="text-4xl transition-colors duration-500" style={{ ...displayFont, color: theme.text_primary }}>
              Your focus, mapped
            </h1>
            <p className="mt-2 transition-colors duration-500" style={{ color: theme.text_secondary }}>
              Understand your study habits and productivity trends.
            </p>
          </div>

          {/* Stat Tiles - Pass theme down so they use theme.accent mapping */}
          <div className="mb-8">
            <StatTiles data={dashboardData.tileStats} theme={theme} />
          </div>

          {/* Activity Graph + Subject Distribution */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
            <div 
              className="xl:col-span-8 border rounded-md p-6 transition-colors duration-500" 
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl" style={{ ...displayFont, color: theme.text_primary }}>
                    Daily Activity
                  </h2>
                  <p className="text-sm mt-1" style={{ color: theme.text_secondary }}>
                    Focus vs. break time over the last 7 days
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] shrink-0 mt-1" style={{ color: theme.text_muted }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                  Click a bar to inspect
                </div>
              </div>
              <SessionBarGraph data={dashboardData.barGraph} onDayClick={handleDayClick} theme={theme} />
            </div>

            <div 
              className="xl:col-span-4 border rounded-md p-6 transition-colors duration-500"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <div className="mb-8 lg:mb-14">
                <h2 className="text-xl" style={{ ...displayFont, color: theme.text_primary }}>
                  Subject Distribution
                </h2>
                <p className="text-sm mt-1" style={{ color: theme.text_secondary }}>
                  Time allocation across subjects
                </p>
              </div>
              <SubjectPieChart data={dashboardData.pieChart} theme={theme} />
            </div>
          </div>
        </div>

        {/* Timeline Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div 
              className="border p-6 rounded-3xl shadow-2xl w-11/12 max-w-4xl relative"
              style={{ backgroundColor: theme.surface_raised, borderColor: theme.border }}
            >
              {/* <div className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full" style={{ backgroundColor: theme.accent }} /> */}

              <div className="flex justify-between items-center mb-6 pt-2">
                <div>
                  <h2 className="text-2xl" style={{ ...displayFont, color: theme.text_primary }}>
                    Daily Timeline
                  </h2>
                  <p className="text-sm mt-1" style={{ color: theme.text_secondary }}>
                    Hourly breakdown for{" "}
                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="theme-modal-btn border rounded-full p-2 transition-all flex items-center justify-center"
                  style={{ color: theme.text_muted, backgroundColor: theme.page_bg, borderColor: theme.border }}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full h-80">
                {isTimelineLoading ? (
                  <div className="flex items-center justify-center h-full text-sm" style={{ ...monoFont, color: theme.accent }}>
                    Loading timeline data…
                  </div>
                ) : timelineData.length > 0 ? (
                  <DailyTimelineGraph data={timelineData} theme={theme} />
                ) : (
                  <div 
                    className="flex items-center justify-center h-full border rounded-xl"
                    style={{ color: theme.text_muted, backgroundColor: theme.page_bg, borderColor: theme.border }}
                  >
                    No activity recorded for this date.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;