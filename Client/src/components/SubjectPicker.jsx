import { useMemo, useState } from 'react'

export function SubjectPicker({ subjects, activeSubjectId, onChange, onCreate }) {
  const [newName, setNewName] = useState('')

  const active = useMemo(
    () => subjects.find((s) => s.id === activeSubjectId) ?? null,
    [subjects, activeSubjectId],
  )

  return (
    <div className="col">
      <div className="row">
        <select
          className="select"
          value={activeSubjectId ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          {subjects.map((s) => (
            <option value={s.id} key={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="row">
        <input
          className="input"
          value={newName}
          placeholder="Add new subject (e.g., DSA)"
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            const trimmed = newName.trim()
            if (!trimmed) return
            onCreate(trimmed)
            setNewName('')
          }}
        >
          Add
        </button>
      </div>

      <div className="muted small">
        Current subject: <span style={{ color: 'var(--text)' }}>{active?.name ?? '—'}</span>
      </div>
    </div>
  )
}

