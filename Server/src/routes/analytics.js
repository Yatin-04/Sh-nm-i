import express from 'express'
import { z } from 'zod'

import { pool } from '../db.js'

export const analyticsRouter = express.Router()

const rangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

analyticsRouter.get('/subject-time', async (req, res, next) => {
  try {
    const q = rangeSchema.parse(req.query ?? {})
    const result = await pool.query(
      `
      select
        s.id as subject_id,
        s.name as subject_name,
        coalesce(sum(ps.duration_seconds), 0)::bigint as total_seconds,
        count(ps.id)::bigint as sessions
      from subjects s
      left join pomodoro_sessions ps
        on ps.subject_id = s.id
        and ps.kind = 'work'
        and ($1::timestamptz is null or ps.started_at >= $1::timestamptz)
        and ($2::timestamptz is null or ps.ended_at <= $2::timestamptz)
      group by s.id, s.name
      order by total_seconds desc, subject_name asc
      `,
      [q.from ?? null, q.to ?? null],
    )
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
})

analyticsRouter.get('/daily', async (req, res, next) => {
  try {
    const q = rangeSchema.parse(req.query ?? {})
    const result = await pool.query(
      `
      select
        date_trunc('day', started_at) as day,
        sum(duration_seconds)::bigint as total_seconds,
        count(id)::bigint as sessions
      from pomodoro_sessions
      where kind = 'work'
        and ($1::timestamptz is null or started_at >= $1::timestamptz)
        and ($2::timestamptz is null or ended_at <= $2::timestamptz)
      group by day
      order by day asc
      `,
      [q.from ?? null, q.to ?? null],
    )
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
})

