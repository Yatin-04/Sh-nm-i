import express from 'express'
import { z } from 'zod'

import { pool } from '../db.js'

export const sessionsRouter = express.Router()

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  subjectId: z.string().uuid().optional(),
})

sessionsRouter.get('/', async (req, res, next) => {
  try {
    const q = querySchema.parse(req.query ?? {})
    const result = await pool.query(
      `
      select id, subject_id, theme_id, started_at, ended_at, duration_seconds, kind, note
      from pomodoro_sessions
      where ($1::timestamptz is null or started_at >= $1::timestamptz)
        and ($2::timestamptz is null or ended_at <= $2::timestamptz)
        and ($3::uuid is null or subject_id = $3::uuid)
      order by started_at desc
      `,
      [q.from ?? null, q.to ?? null, q.subjectId ?? null],
    )
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
})

const createSchema = z.object({
  subject_id: z.string().uuid().nullable().optional(),
  theme_id: z.string().uuid().nullable().optional(),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime(),
  duration_seconds: z.number().int().positive(),
  kind: z.enum(['work', 'break']),
  note: z.string().max(500).nullable().optional(),
})

sessionsRouter.post('/', async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body ?? {})
    const created = await pool.query(
      `
      insert into pomodoro_sessions (subject_id, theme_id, started_at, ended_at, duration_seconds, kind, note)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning id, subject_id, theme_id, started_at, ended_at, duration_seconds, kind, note
      `,
      [
        payload.subject_id ?? null,
        payload.theme_id ?? null,
        payload.started_at,
        payload.ended_at,
        payload.duration_seconds,
        payload.kind,
        payload.note ?? null,
      ],
    )
    res.status(201).json(created.rows[0])
  } catch (err) {
    next(err)
  }
})

