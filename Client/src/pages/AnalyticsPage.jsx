import { useEffect, useState } from 'react'

import { format } from 'date-fns'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function secondsToHours(seconds) {
  return Math.round((Number(seconds) / 3600) * 100) / 100
}

export function AnalyticsPage() {
  const [subjectRows, setSubjectRows] = useState([])
  const [dailyRows, setDailyRows] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      try {
        const toISO = new Date().toISOString()
        const fromISO = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString()

        const [subjectTime, daily] = await Promise.all([
          apiFetchAnalytics('/analytics/subject-time', fromISO, toISO),
          apiFetchAnalytics('/analytics/daily', fromISO, toISO),
        ])
        if (cancelled) return
        setSubjectRows(subjectTime)
        setDailyRows(
          daily.map((r) => ({
            day: format(new Date(r.day), 'MMM d'),
            total_hours: secondsToHours(r.total_seconds),
          })),
        )
      } catch (e) {
        if (cancelled) return
        setError(e?.message ?? 'Failed to load analytics')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Analytics</div>
        <div className="muted small">Last 14 days</div>
      </div>

      {error ? <div className="chip">{error}</div> : null}

      <div className="col">
        <div className="kpiCard">
          <div className="panelTitle">Time per subject (hours)</div>
          <div style={{ height: 260, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectRows.map((r) => ({
                  subject: r.subject_name,
                  hours: secondsToHours(r.total_seconds),
                }))}
                margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="rgba(139,92,246,0.55)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="kpiCard">
          <div className="panelTitle">Daily focus (hours)</div>
          <div style={{ height: 260, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRows} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total_hours" fill="rgba(34,197,94,0.45)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

async function apiFetchAnalytics(path, from, to) {
  const params = new URLSearchParams()
  params.set('from', from)
  params.set('to', to)
  return apiFetchRaw(`${path}?${params.toString()}`)
}

async function apiFetchRaw(pathWithQuery) {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${pathWithQuery}`)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || 'Analytics request failed')
  return data
}

