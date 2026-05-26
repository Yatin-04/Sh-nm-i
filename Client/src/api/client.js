const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function apiFetch(path, options) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`
    throw new Error(message)
  }

  return data
}

