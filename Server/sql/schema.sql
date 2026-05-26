create extension if not exists pgcrypto;

create table if not exists timer_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  work_minutes int not null check (work_minutes > 0),
  short_break_minutes int not null check (short_break_minutes > 0),
  long_break_minutes int not null check (long_break_minutes > 0),
  long_break_every int not null check (long_break_every > 0),
  is_active boolean not null default false,
  updated_at timestamptz not null default now()
);

create unique index if not exists timer_settings_one_active
  on timer_settings (is_active)
  where is_active = true;

create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  background_type text not null,
  background_value text not null,
  accent text not null,
  spotify_embed_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  is_done boolean not null default false,
  theme_id uuid null references themes(id) on delete set null,
  created_at timestamptz not null default now(),
  done_at timestamptz null
);

create table if not exists pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid null references subjects(id) on delete set null,
  theme_id uuid null references themes(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds int not null check (duration_seconds > 0),
  kind text not null check (kind in ('work','break')),
  note text null
);

create index if not exists pomodoro_sessions_started_at on pomodoro_sessions (started_at);
create index if not exists pomodoro_sessions_subject_id on pomodoro_sessions (subject_id);

create table if not exists revision_items (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid null references subjects(id) on delete set null,
  topic text not null,
  scheduled_at timestamptz not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  done_at timestamptz null
);

create index if not exists revision_items_scheduled_at on revision_items (scheduled_at);

