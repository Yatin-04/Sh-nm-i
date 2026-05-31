// src/controllers/analyticsController.js
import { query } from '../config/db.js';

export const getDashboardAnalytics = async (req, res) => {
    try {
        // Securely pull the logged-in user's ID from the JWT auth middleware
        const userId = req.user.id;

        // 1. Query for Pie Chart: All-time time distribution of completed sessions among subjects
        const pieChartQuery = `
            SELECT 
                sub.subject_name, 
                SUM(EXTRACT(EPOCH FROM (ses.end_time - ses.start_time)))::INT as total_duration
            FROM sessions ses
                JOIN subjects sub ON ses.subject_id = sub.subject_id
            WHERE ses.user_id = $1 
                AND ses.is_completed = TRUE
                AND ses.session_date >= CURRENT_DATE - INTERVAL '6 days'  -- Clean shorthand for DATE types
            GROUP BY sub.subject_name;
        `;

        // 2. Query for Bar Graph: Last 7 days session times grouped by date and type (focus vs break)
        const barGraphQuery = `
            SELECT 
                TO_CHAR(session_date, 'YYYY-MM-DD') as date, 
                session_type, 
                SUM(EXTRACT(EPOCH FROM (end_time - start_time)))::INT as daily_duration
            FROM sessions
            WHERE user_id = $1 
                AND is_completed = TRUE
                AND session_date >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY session_date, session_type
            ORDER BY session_date ASC;
        `;

        // 3. Query for Heatmap: Completion proportion of todos over the last 7 days
        const heatmapQuery = `
            SELECT 
                TO_CHAR(todo_date, 'YYYY-MM-DD') as date,
                COUNT(*)::INT as total_tasks,
                SUM(CASE WHEN status = TRUE THEN 1 ELSE 0 END)::INT as completed_tasks
            FROM todos
            WHERE user_id = $1 
                AND todo_date >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY todo_date
            ORDER BY todo_date ASC;
        `;

        // 4. Query for Tile Stats (KPIs): Summary data for the last 7 days
        const kpiQuery = `
            SELECT 
                COUNT(session_id)::INT as sessions_completed,
                COALESCE(SUM(CASE WHEN session_type = 'focus' THEN EXTRACT(EPOCH FROM (end_time - start_time)) ELSE 0 END), 0)::INT as total_focus_time,
                COALESCE(ROUND(AVG(CASE WHEN session_type = 'focus' THEN EXTRACT(EPOCH FROM (end_time - start_time)) END)), 0)::INT as average_session_time
            FROM sessions
            WHERE user_id = $1 
                AND is_completed = TRUE 
                AND session_date >= CURRENT_DATE - INTERVAL '6 days';
        `;

        // 5. Query for Top Subject: The subject with the most focus time in the last 7 days
        const topSubjectQuery = `
            SELECT sub.subject_name
            FROM sessions ses
            JOIN subjects sub ON ses.subject_id = sub.subject_id
            WHERE ses.user_id = $1 
                AND ses.is_completed = TRUE 
                AND ses.session_type = 'focus'
                AND ses.session_date >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY sub.subject_name
            ORDER BY SUM(EXTRACT(EPOCH FROM (ses.end_time - ses.start_time))) DESC
            LIMIT 1;
        `;

        // Run all database queries in parallel
        const [
            pieChartResult,
            barGraphResult,
            heatmapResult,
            kpiResult,
            topSubjectResult
        ] = await Promise.all([
            query(pieChartQuery, [userId]),
            query(barGraphQuery, [userId]),
            query(heatmapQuery, [userId]),
            query(kpiQuery, [userId]),
            query(topSubjectQuery, [userId])
        ]);

        // Format tile stats neatly for the frontend UI response
        const tileStats = {
            top_subject: topSubjectResult.rows[0]?.subject_name || "None",
            total_focus_time: kpiResult.rows[0]?.total_focus_time || 0,
            sessions_completed: kpiResult.rows[0]?.sessions_completed || 0,
            average_session_time: kpiResult.rows[0]?.average_session_time || 0
        };

        // Send the aggregated analytics payload back to client
        res.status(200).json({
            pieChart: pieChartResult.rows,
            barGraph: barGraphResult.rows,
            heatmap: heatmapResult.rows,
            tileStats
        });
    }catch (error) {
            console.error('Error compiling dashboard analytics:', error);
            res.status(500).json({ error: 'Internal server error' });
    }
};