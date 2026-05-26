// src/App.jsx
import { useEffect, useState } from 'react'
import './App.css'

import { SpotifyEmbed } from './components/SpotifyEmbed'
import { SubjectPicker } from './components/SubjectPicker'
import { ThemePicker } from './components/ThemePicker'
import { Timer } from './components/Timer'
import { TodoList } from './components/TodoList'
import { RevisionList } from './components/RevisionList'
import { TimerSettingsForm } from './components/TimerSettingsForm' // Import the inline form
import { usePomodoroStore } from './state/usePomodoroStore'
import { AnalyticsPage } from './pages/AnalyticsPage'
import {
  ensureNotificationPermission,
  scheduleRevisionNotifications,
} from './notifications/revisionNotifications'

function App() {
  const [tab, setTab] = useState('focus') 
  const [isEditingTimer, setIsEditingTimer] = useState(false) // New state for inline editing

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
    updateTimerSettings, // Ensure this is available in your store
  } = usePomodoroStore()

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  // ... (keep your existing useEffects for revisions and notifications here) ...

  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? null

  return (
    <div className="appShell">
      <div className="topBar">
        {/* ... (keep your existing topBar code) ... */}
      </div>

      {tab === 'analytics' ? (
        <AnalyticsPage />
      ) : (
        <div className="grid3">
          <div className="panel">
            {/* ... (keep existing Theme panel code) ... */}
          </div>

          <div className="panel">
            {/* Updated Focus Panel Header with Edit Button */}
            <div className="panelHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="panelTitle">Focus</div>
                <div className="muted small">
                  {timerSettings
                    ? `${timerSettings.work_minutes}/${timerSettings.short_break_minutes}/${timerSettings.long_break_minutes} (long every ${timerSettings.long_break_every})`
                    : '—'}
                </div>
              </div>
              
              {/* Edit Button Symbol */}
              <button 
                onClick={() => setIsEditingTimer(!isEditingTimer)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
                title="Edit Timer"
              >
                ✏️ 
              </button>
            </div>

            {/* Conditional Rendering: Show Form or Show Timer */}
            {isEditingTimer ? (
              <TimerSettingsForm 
                timerSettings={timerSettings}
                onSave={(payload) => {
                  updateTimerSettings(payload)
                  setIsEditingTimer(false) // Close inline editor on save
                }}
                onCancel={() => setIsEditingTimer(false)} // Close inline editor on cancel
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
            {/* ... (keep existing Todos & Revisions panel code) ... */}
          </div>
        </div>
      )}
    </div>
  )
}

export default App