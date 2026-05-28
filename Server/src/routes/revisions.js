import express from 'express'
import { z } from 'zod'

import { query } from '../config/db.js'

export const revisionsRouter = express.Router()

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

revisionsRouter.get('/', async (req, res, next) => {
  try {
    const q = querySchema.parse(req.query ?? {})
    const result = await query(
      `
      select id, subject_id, topic, scheduled_at, is_done, created_at, done_at
      from revision_items
      where ($1::timestamptz is null or scheduled_at >= $1::timestamptz)
        and ($2::timestamptz is null or scheduled_at <= $2::timestamptz)
      order by scheduled_at asc
      `,
      [q.from ?? null, q.to ?? null],
    )
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
})

const createSchema = z.object({
  subject_id: z.string().uuid().nullable().optional(),
  topic: z.string().min(1),
  scheduled_at: z.string().datetime(),
})

revisionsRouter.post('/', async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body ?? {})
    const created = await query(
      `
      insert into revision_items (subject_id, topic, scheduled_at)
      values ($1, $2, $3)
      returning id, subject_id, topic, scheduled_at, is_done, created_at, done_at
      `,
      [payload.subject_id ?? null, payload.topic, payload.scheduled_at],
    )
    res.status(201).json(created.rows[0])
  } catch (err) {
    next(err)
  }
})

const patchSchema = z.object({
  subject_id: z.string().uuid().nullable().optional(),
  topic: z.string().min(1).optional(),
  scheduled_at: z.string().datetime().optional(),
  is_done: z.boolean().optional(),
})

revisionsRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    const payload = patchSchema.parse(req.body ?? {})

    const current = await query(
      `
      select id, subject_id, topic, scheduled_at, is_done, created_at, done_at
      from revision_items
      where id = $1
      `,
      [id],
    )
    if (!current.rows[0]) return res.status(404).json({ error: 'Revision item not found' })

    const row = current.rows[0]
    const nextIsDone = payload.is_done ?? row.is_done
    const nextDoneAt = nextIsDone ? row.done_at ?? new Date().toISOString() : null

    const updated = await query(
      `
      update revision_items
      set
        subject_id = $2,
        topic = $3,
        scheduled_at = $4,
        is_done = $5,
        done_at = $6
      where id = $1
      returning id, subject_id, topic, scheduled_at, is_done, created_at, done_at
      `,
      [
        id,
        payload.subject_id ?? row.subject_id,
        payload.topic ?? row.topic,
        payload.scheduled_at ?? row.scheduled_at,
        nextIsDone,
        nextDoneAt,
      ],
    )
    res.json(updated.rows[0])
  } catch (err) {
    next(err)
  }
})

revisionsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    await pool.query(`delete from revision_items where id = $1`, [id])
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

