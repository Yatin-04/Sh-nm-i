export function ensureNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('unsupported')
  if (Notification.permission === 'granted') return Promise.resolve('granted')
  if (Notification.permission === 'denied') return Promise.resolve('denied')
  return Notification.requestPermission()
}

export function scheduleRevisionNotifications(revisions, { onFire } = {}) {
  const handles = []
  const now = Date.now()

  for (const r of revisions) {
    if (!r?.scheduled_at) continue
    if (r.is_done) continue
    const when = new Date(r.scheduled_at).getTime()
    if (Number.isNaN(when)) continue
    if (when <= now) continue

    const delay = Math.min(when - now, 2 ** 31 - 1)
    const h = setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        const n = new Notification('Revision reminder', {
          body: r.topic,
        })
        n.onclick = () => {
          window.focus?.()
          n.close?.()
        }
      }
      onFire?.(r)
    }, delay)
    handles.push(h)
  }

  return () => {
    for (const h of handles) clearTimeout(h)
  }
}

