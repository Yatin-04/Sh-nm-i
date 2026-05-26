import { apiFetch } from './client'

export const api = {
  health: () => apiFetch('/health'),

  getActiveTimer: () => apiFetch('/timer-settings/active'),
  updateActiveTimer: (patch) =>
    apiFetch('/timer-settings/active', {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  listThemes: () => apiFetch('/themes'),

  listTodos: ({ themeId } = {}) =>
    apiFetch(`/todos${themeId ? `?themeId=${encodeURIComponent(themeId)}` : ''}`),
  createTodo: (payload) =>
    apiFetch('/todos', { method: 'POST', body: JSON.stringify(payload) }),
  patchTodo: (id, patch) =>
    apiFetch(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTodo: (id) => apiFetch(`/todos/${id}`, { method: 'DELETE' }),

  listSubjects: () => apiFetch('/subjects'),
  createSubject: (payload) =>
    apiFetch('/subjects', { method: 'POST', body: JSON.stringify(payload) }),

  createSession: (payload) =>
    apiFetch('/sessions', { method: 'POST', body: JSON.stringify(payload) }),

  listRevisions: ({ from, to } = {}) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const qs = params.toString()
    return apiFetch(`/revisions${qs ? `?${qs}` : ''}`)
  },
  createRevision: (payload) =>
    apiFetch('/revisions', { method: 'POST', body: JSON.stringify(payload) }),
  patchRevision: (id, patch) =>
    apiFetch(`/revisions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteRevision: (id) => apiFetch(`/revisions/${id}`, { method: 'DELETE' }),
}

