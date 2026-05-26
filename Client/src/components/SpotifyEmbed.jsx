// src/components/SpotifyEmbed.jsx
import '../App.css'

export function SpotifyEmbed({ url }) {
  if (!url) return <div className="muted small">Select a theme to load Spotify.</div>

  // Auto-convert standard Spotify links to valid Embed links
  let finalUrl = url
  try {
    if (url.includes('spotify.com') && !url.includes('/embed/')) {
      const urlObj = new URL(url)
      // Converts: https://open.spotify.com/playlist/123 -> https://open.spotify.com/embed/playlist/123
      finalUrl = `${urlObj.origin}/embed${urlObj.pathname}`
    }
  } catch (e) {
    console.error("Invalid Spotify URL provided", e)
  }

  return (
    <iframe
      className="spotifyEmbed"
      src={finalUrl}
      width="100%"
      height="352"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      title="Spotify Player"
      style={{ border: 'none', borderRadius: '12px' }} // Added rounding to match standard Spotify embeds
    />
  )
}