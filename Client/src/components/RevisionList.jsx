import { useState } from 'react'

import { format } from 'date-fns'

export function RevisionList({ revisions, subjects, activeSubjectId, onAdd }) {
  const [topic, setTopic] = useState('')
  const [scheduledLocal, setScheduledLocal] = useState('')
  const [subjectId, setSubjectId] = useState(activeSubjectId ?? '')

  return (
    <div className="col">
      <div className="row">
        <input
          className="input"
          value={topic}
          placeholder="Revision topic…"
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>
      <div className="row">
        <select className="select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">No subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="datetime-local"
          value={scheduledLocal}
          onChange={(e) => setScheduledLocal(e.target.value)}
        />
      </div>
      <div className="row">
        <button
          className="btn btnPrimary"
          onClick={() => {
            const t = topic.trim()
            if (!t || !scheduledLocal) return
            const scheduledAt = new Date(scheduledLocal).toISOString()
            onAdd({
              topic: t,
              scheduled_at: scheduledAt,
              subject_id: subjectId || null,
            })
            setTopic('')
            setScheduledLocal('')
          }}
        >
          Add revision
        </button>
        <div className="muted small">Notifications are added next.</div>
      </div>

      <div className="list">
        {revisions.map((r) => (
          <div className="listItem" key={r.id}>
            <div className="listItemMain">
              <div>
                <div className="itemTitle">{r.topic}</div>
                <div className="itemMeta">
                  {r.scheduled_at ? format(new Date(r.scheduled_at), 'PPpp') : '—'}
                </div>
              </div>
            </div>
          </div>
        ))}

        {revisions.length === 0 ? <div className="muted small">No revisions scheduled.</div> : null}
      </div>
    </div>
  )
}

