-- Active timer profile
insert into timer_settings (name, work_minutes, short_break_minutes, long_break_minutes, long_break_every, is_active)
values ('Default', 25, 5, 15, 4, true)
on conflict do nothing;

-- A few starter themes with Spotify embed playlist URLs
-- Note: these are public playlists; you can replace with your own later.
insert into themes (name, background_type, background_value, accent, spotify_embed_url)
values
  (
    'LoFi_Night',
    'gradient',
    'radial-gradient(1200px circle at 10% 10%, rgba(99,102,241,0.35), transparent 40%), radial-gradient(1200px circle at 90% 20%, rgba(236,72,153,0.25), transparent 35%), linear-gradient(180deg, #0b1020, #050612)',
    '#8b5cf6',
    'https://open.spotify.com/playlist/2iBfFwyZaxfRaapjeHm645'
  ),
  (
    'Deep_Focus',
    'gradient',
    'radial-gradient(1200px circle at 20% 0%, rgba(34,197,94,0.25), transparent 40%), radial-gradient(1200px circle at 80% 30%, rgba(14,165,233,0.22), transparent 35%), linear-gradient(180deg, #06141a, #030708)',
    '#22c55e',
    'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ'
  ),
  (
    'Classical',
    'gradient',
    'radial-gradient(1200px circle at 20% 10%, rgba(245,158,11,0.18), transparent 40%), radial-gradient(1200px circle at 85% 20%, rgba(59,130,246,0.18), transparent 35%), linear-gradient(180deg, #0f0f12, #070708)',
    '#f59e0b',
    'https://open.spotify.com/embed/playlist/37i9dQZF1DWWEJlAGA9gs0'
  )
on conflict (name) do nothing;

