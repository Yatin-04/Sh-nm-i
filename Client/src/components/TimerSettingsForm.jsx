// src/components/TimerSettingsForm.jsx
import { useState, useEffect } from 'react'

export function TimerSettingsForm({ timerSettings, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    work_minutes: 25,
    short_break_minutes: 5,
    long_break_minutes: 15,
    long_break_every: 4,
  })

  useEffect(() => {
    if (timerSettings) {
      setFormData({ ...timerSettings })
    }
  }, [timerSettings])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <label className="muted small">Work (min)</label>
          <input type="number" name="work_minutes" value={formData.work_minutes} onChange={handleChange} min="1" className="input" required />
        </div>
        <div style={{ flex: 1 }}>
          <label className="muted small">Short Break</label>
          <input type="number" name="short_break_minutes" value={formData.short_break_minutes} onChange={handleChange} min="1" className="input" required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <label className="muted small">Long Break</label>
          <input type="number" name="long_break_minutes" value={formData.long_break_minutes} onChange={handleChange} min="1" className="input" required />
        </div>
        <div style={{ flex: 1 }}>
          <label className="muted small">Interval</label>
          <input type="number" name="long_break_every" value={formData.long_break_every} onChange={handleChange} min="1" className="input" required />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button type="submit" className="btn btnPrimary" style={{ flex: 1 }}>Save</button>
        <button type="button" className="btn" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
      </div>
    </form>
  )
}