import { useState } from 'react'

export function TodoList({ todos, onAdd, onToggle, onDelete }) {
  const [text, setText] = useState('')

  return (
    <div className="col">
      <div className="row">
        <input
          className="input"
          value={text}
          placeholder="Add a todo…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const trimmed = text.trim()
              if (!trimmed) return
              onAdd(trimmed)
              setText('')
            }
          }}
        />
        <button
          className="btn btnPrimary"
          onClick={() => {
            const trimmed = text.trim()
            if (!trimmed) return
            onAdd(trimmed)
            setText('')
          }}
        >
          Add
        </button>
      </div>

      <div className="list">
        {todos.map((t) => (
          <div className="listItem" key={t.id}>
            <div className="listItemMain">
              <input
                className="checkbox"
                type="checkbox"
                checked={t.is_done}
                onChange={() => onToggle(t)}
              />
              <div>
                <div className="itemTitle" style={{ textDecoration: t.is_done ? 'line-through' : 'none' }}>
                  {t.text}
                </div>
                <div className="itemMeta">{t.is_done ? 'Done' : 'Pending'}</div>
              </div>
            </div>
            <button className="btn btnDanger" onClick={() => onDelete(t.id)}>
              Delete
            </button>
          </div>
        ))}

        {todos.length === 0 ? (
          <div className="muted small">No todos yet.</div>
        ) : null}
      </div>
    </div>
  )
}

