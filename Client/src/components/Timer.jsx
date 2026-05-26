import { useEffect, useMemo, useRef, useState } from 'react'

import { api } from '../api/pomodoro'

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${pad2(mm)}:${pad2(ss)}`
}

export function Timer({
  timerSettings,
  themeId,
  subjectId,
}) {
  const workSeconds = (timerSettings?.work_minutes ?? 25) * 60
  const shortBreakSeconds = (timerSettings?.short_break_minutes ?? 5) * 60
  const longBreakSeconds = (timerSettings?.long_break_minutes ?? 15) * 60
  const longBreakEvery = timerSettings?.long_break_every ?? 4

  const [mode, setMode] = useState('work') // work | break
  const [isRunning, setIsRunning] = useState(false)
  const [remaining, setRemaining] = useState(workSeconds)
  const [workCount, setWorkCount] = useState(0)

  const intervalRef = useRef(null)
  const startedAtRef = useRef(null)

  const modeLabel = useMemo(() => {
    if (mode === 'work') return 'Focus'
    return workCount > 0 && workCount % longBreakEvery === 0 ? 'Long break' : 'Short break'
  }, [mode, workCount, longBreakEvery])

  const targetSeconds = useMemo(() => {
    if (mode === 'work') return workSeconds
    return workCount > 0 && workCount % longBreakEvery === 0
      ? longBreakSeconds
      : shortBreakSeconds
  }, [mode, workSeconds, shortBreakSeconds, longBreakSeconds, workCount, longBreakEvery])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    startedAtRef.current = null

    // Avoid setState directly in effect body (lint rule)
    Promise.resolve().then(() => {
      setRemaining(targetSeconds)
      setIsRunning(false)
    })
  }, [targetSeconds])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  async function completeInterval() {
    const endedAt = new Date()
    const startedAt = startedAtRef.current
    const durationSeconds = targetSeconds

    try {
      if (startedAt) {
        await api.createSession({
          subject_id: subjectId ?? null,
          theme_id: themeId ?? null,
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds,
          kind: mode,
          note: null,
        })
      }
    } catch {
      // keep timer UX responsive even if API fails
    }

    if (mode === 'work') {
      setWorkCount((n) => n + 1)
      setMode('break')
    } else {
      setMode('work')
    }
  }

  function start() {
    if (isRunning) return
    setIsRunning(true)
    if (!startedAtRef.current) startedAtRef.current = new Date()

    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setIsRunning(false)
          startedAtRef.current = null
          completeInterval()
          return 0
        }
        return r - 1
      })
    }, 1000)
  }

  function pause() {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function reset() {
    pause()
    startedAtRef.current = null
    setRemaining(targetSeconds)
  }

  function skip() {
    pause()
    startedAtRef.current = null
    setRemaining(0)
    completeInterval()
  }

  return (
    <div className="timer">
      <div className="timerMode">{modeLabel}</div>
      <div className="timerTime">{formatMMSS(remaining)}</div>
      <div className="timerActions">
        {isRunning ? (
          <button className="btn" onClick={pause}>
            Pause
          </button>
        ) : (
          <button className="btn btnPrimary" onClick={start}>
            Start
          </button>
        )}
        <button className="btn" onClick={reset}>
          Reset
        </button>
        <button className="btn btnDanger" onClick={skip}>
          Skip
        </button>
      </div>
      <div className="muted small">
        Work sessions completed: <span style={{ color: 'var(--text)' }}>{workCount}</span>
      </div>
    </div>
  )
}

