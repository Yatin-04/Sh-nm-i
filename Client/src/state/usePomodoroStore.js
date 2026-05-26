import { create } from 'zustand'

import { api } from '../api/pomodoro'

export const usePomodoroStore = create((set, get) => ({
  loading: true,
  error: null,

  timerSettings: null,
  themes: [],
  activeThemeId: null,

  subjects: [],
  activeSubjectId: null,

  todos: [],
  revisions: [],

  async bootstrap() {
    set({ loading: true, error: null })
    try {
      const [timerSettings, themes, subjects] = await Promise.all([
        api.getActiveTimer(),
        api.listThemes(),
        api.listSubjects(),
      ])

      const activeThemeId = themes[0]?.id ?? null
      const todos = await api.listTodos({ themeId: activeThemeId ?? undefined })

      set({
        loading: false,
        timerSettings,
        themes,
        activeThemeId,
        subjects,
        activeSubjectId: subjects[0]?.id ?? null,
        todos,
      })

      get().applyThemeToDocument()
    } catch (e) {
      set({ loading: false, error: e?.message ?? 'Failed to load' })
    }
  },

  applyThemeToDocument() {
    const { themes, activeThemeId } = get()
    const theme = themes.find((t) => t.id === activeThemeId)
    if (!theme) return

    document.documentElement.style.setProperty('--accent', theme.accent)
    document.body.style.setProperty('--appBackground', theme.background_value)
  },

  async setActiveTheme(themeId) {
    set({ activeThemeId: themeId })
    get().applyThemeToDocument()
    const todos = await api.listTodos({ themeId })
    set({ todos })
  },

  setActiveSubject(subjectId) {
    set({ activeSubjectId: subjectId })
  },

  async createSubject(name) {
    const created = await api.createSubject({ name })
    set((s) => ({
      subjects: [...s.subjects.filter((x) => x.id !== created.id), created].sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
      activeSubjectId: created.id,
    }))
  },

  async addTodo(text) {
    const { activeThemeId } = get()
    const created = await api.createTodo({
      text,
      theme_id: activeThemeId,
    })
    set((s) => ({ todos: [created, ...s.todos] }))
  },

  async toggleTodo(todo) {
    const updated = await api.patchTodo(todo.id, { is_done: !todo.is_done })
    set((s) => ({
      todos: s.todos.map((t) => (t.id === todo.id ? updated : t)),
    }))
  },

  async deleteTodo(todoId) {
    await api.deleteTodo(todoId)
    set((s) => ({ todos: s.todos.filter((t) => t.id !== todoId) }))
  },

  async refreshRevisions({ from, to } = {}) {
    const revisions = await api.listRevisions({ from, to })
    set({ revisions })
  },

  async addRevision({ topic, scheduled_at, subject_id }) {
    const created = await api.createRevision({ topic, scheduled_at, subject_id })
    set((s) => ({ revisions: [...s.revisions, created].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)) }))
  },
  
  updateTimerSettings: async (payload) => {
    set({ loading: true, error: null })
    try {
      // Adjust URL to match your API
      const res = await fetch('/api/timer-settings/active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update settings')
      const updatedSettings = await res.json()
      set({ timerSettings: updatedSettings, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },
}))

