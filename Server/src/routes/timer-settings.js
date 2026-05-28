import express from 'express'
import { z } from 'zod'

import { query } from '../config/db.js'

export const timerSettingsRouter = express.Router()

timerSettingsRouter.get('/active', async (req, res, next) => {
  try {
    const result = await query(
      `
      select id, name, work_minutes, short_break_minutes, long_break_minutes, long_break_every, updated_at
      from timer_settings
      where is_active = true
      limit 1
      `,
    )
    res.json(result.rows[0] ?? null)
  } catch (err) {
    next(err)
  }
})

const putActiveSchema = z.object({
  name: z.string().min(1).optional(),
  work_minutes: z.number().int().positive().optional(),
  short_break_minutes: z.number().int().positive().optional(),
  long_break_minutes: z.number().int().positive().optional(),
  long_break_every: z.number().int().positive().optional(),
})

timerSettingsRouter.put('/active', async (req, res, next) => {
  try {
    const payload = putActiveSchema.parse(req.body ?? {})

    const current = await query(
      `
      select id, name, work_minutes, short_break_minutes, long_break_minutes, long_break_every
      from timer_settings
      where is_active = true
      limit 1
      `,
    )
    if (!current.rows[0]) {
      const created = await query(
        `
        insert into timer_settings (name, work_minutes, short_break_minutes, long_break_minutes, long_break_every, is_active)
        values ($1, $2, $3, $4, $5, true)
        returning id, name, work_minutes, short_break_minutes, long_break_minutes, long_break_every, updated_at
        `,
        [
          payload.name ?? 'Default',
          payload.work_minutes ?? 25,
          payload.short_break_minutes ?? 5,
          payload.long_break_minutes ?? 15,
          payload.long_break_every ?? 4,
        ],
      )
      return res.json(created.rows[0])
    }

    const row = current.rows[0]
    const updated = await query(
      `
      update timer_settings
      set
        name = $2,
        work_minutes = $3,
        short_break_minutes = $4,
        long_break_minutes = $5,
        long_break_every = $6,
        updated_at = now()
      where id = $1
      returning id, name, work_minutes, short_break_minutes, long_break_minutes, long_break_every, updated_at
      `,
      [
        row.id,
        payload.name ?? row.name,
        payload.work_minutes ?? row.work_minutes,
        payload.short_break_minutes ?? row.short_break_minutes,
        payload.long_break_minutes ?? row.long_break_minutes,
        payload.long_break_every ?? row.long_break_every,
      ],
    )

    res.json(updated.rows[0])
  } catch (err) {
    next(err)
  }
})

