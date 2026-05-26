import { useEffect, useState } from 'react'
import './App.css'

import { SpotifyEmbed } from './components/SpotifyEmbed'
import { SubjectPicker } from './components/SubjectPicker'
import { ThemePicker } from './components/ThemePicker'
import { Timer } from './components/Timer'
import { TodoList } from './components/TodoList'
import { RevisionList } from './components/RevisionList'
import { usePomodoroStore } from './state/usePomodoroStore'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { TimerSettingsForm } from './components/TimerSettingsForm'
import {
  ensureNotificationPermission,
  scheduleRevisionNotifications,
} from './notifications/revisionNotifications'

function App() {
  const [tab, setTab] = useState('focus') // focus | analytics | settings
  const [isEditingTimer, setIsEditingTimer] = useState(false) // Toggle inline timer editing

  const {
    loading,
    error,
    timerSettings,
    themes,
    activeThemeId,
    subjects,
    activeSubjectId,
    todos,
    revisions,
    bootstrap,
    setActiveTheme,
    setActiveSubject,
    createSubject,
    addTodo,
    toggleTodo,
    deleteTodo,
    refreshRevisions,
    addRevision,
    updateTimerSettings, // Ensure this is implemented in usePomodoroStore
  } = usePomodoroStore()

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    const from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
    const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
    refreshRevisions({ from, to }).catch(() => {})
  }, [refreshRevisions])

  useEffect(() => {
    let cancel = null
    ensureNotificationPermission()
      .then(() => {
        cancel = scheduleRevisionNotifications(revisions)
      })
      .catch(() => {})
    return () => {
      cancel?.()
    }
  }, [revisions])

  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? null

  // App.jsx - Insert this below: const activeTheme = themes.find((t) => t.id === activeThemeId) ?? null

  useEffect(() => {
    if (activeTheme) {
      // Apply background based on type
      if (activeTheme.background_type === 'image' || activeTheme.background_type === 'url') {
        document.body.style.backgroundImage = `url(${activeTheme.background_value})`
        document.body.style.backgroundSize = 'cover'
        document.body.style.backgroundPosition = 'center'
      } else {
        document.body.style.background = activeTheme.background_value
      }
      
      // Inject accent color as a CSS variable for the rest of your app
      document.documentElement.style.setProperty('--btnPrimary-bg', activeTheme.accent) // Adjust variable name to match your CSS
    } else {
      // Reset to default if no theme is active
      document.body.style.background = ''
      document.body.style.backgroundImage = ''
      document.documentElement.style.removeProperty('--btnPrimary-bg')
    }
  }, [activeTheme])
  return (
    <div className="appShell">
      <div className="topBar">
        <div className="brand">
          <div className="brandTitle">Pomodoro Studio</div>
          <div className="chip">central timer • themes • analytics</div>
        </div>
        <div className="row">
          <button className={`btn ${tab === 'focus' ? 'btnPrimary' : ''}`} onClick={() => setTab('focus')}>
            Focus
          </button>
          <button className={`btn ${tab === 'analytics' ? 'btnPrimary' : ''}`} onClick={() => setTab('analytics')}>
            Analytics
          </button>
          <button
            className="btn"
            onClick={() => {
              ensureNotificationPermission().catch(() => {})
            }}
          >
            Enable reminders
          </button>
          {loading ? <div className="chip">Loading…</div> : null}
          {error ? <div className="chip" style={{ borderColor: 'rgba(251,113,133,0.55)' }}>{error}</div> : null}
        </div>
      </div>

      {tab === 'analytics' ? (
        <AnalyticsPage />
      ) : (
        <div className="grid3">
          <div className="panel">
            <div className="panelHeader">
              <div className="panelTitle">Theme</div>
              <div className="muted small">Background + Spotify</div>
            </div>
            <ThemePicker themes={themes} activeThemeId={activeThemeId} onChange={setActiveTheme} />
            <div style={{ height: 12 }} />
            <SpotifyEmbed url={activeTheme?.spotify_embed_url} />
          </div>

          <div className="panel">
            <div className="panelHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="panelTitle">Focus</div>
                <div className="muted small">
                  {timerSettings
                    ? `${timerSettings.work_minutes}/${timerSettings.short_break_minutes}/${timerSettings.long_break_minutes} (long every ${timerSettings.long_break_every})`
                    : '—'}
                </div>
              </div>
              <button
                onClick={() => setIsEditingTimer(!isEditingTimer)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
                title="Edit Timer"
              >
                ✏️
              </button>
            </div>

            {/* Conditionally render form or timer */}
            {isEditingTimer ? (
              <TimerSettingsForm
                timerSettings={timerSettings}
                onSave={(payload) => {
                  updateTimerSettings(payload)
                  setIsEditingTimer(false)
                }}
                onCancel={() => setIsEditingTimer(false)}
              />
            ) : (
              <Timer timerSettings={timerSettings} themeId={activeThemeId} subjectId={activeSubjectId} />
            )}

            <div style={{ height: 10 }} />

            <div className="panelHeader">
              <div className="panelTitle">Subject</div>
              <div className="muted small">Tag sessions</div>
            </div>
            <SubjectPicker
              subjects={subjects}
              activeSubjectId={activeSubjectId}
              onChange={setActiveSubject}
              onCreate={createSubject}
            />
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div className="panelTitle">Todos</div>
              <div className="muted small">Theme-linked</div>
            </div>
            <TodoList todos={todos} onAdd={addTodo} onToggle={toggleTodo} onDelete={deleteTodo} />

            <div style={{ height: 16 }} />

            <div className="panelHeader">
              <div className="panelTitle">Revisions</div>
              <div className="muted small">Schedule topics</div>
            </div>
            <RevisionList
              revisions={revisions}
              subjects={subjects}
              activeSubjectId={activeSubjectId}
              onAdd={(payload) => addRevision(payload).catch(() => {})}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App