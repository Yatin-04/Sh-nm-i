import express from 'express'
import { z } from 'zod'

import { query } from '../config/db.js'

export const todosRouter = express.Router()

todosRouter.get('/', async (req, res, next) => {
  try {
    const themeIdRaw = req.query.themeId
    const themeId =
      typeof themeIdRaw === 'string' && themeIdRaw.length > 0
        ? z.string().uuid().parse(themeIdRaw)
        : null

    const result = await query(
      `
      select id, text, is_done, theme_id, created_at, done_at
      from todos
      where ($1::uuid is null or theme_id = $1::uuid)
      order by created_at desc
      `,
      [themeId],
    )
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
})

const createSchema = z.object({
  text: z.string().min(1),
  theme_id: z.string().uuid().nullable().optional(),
})

todosRouter.post('/', async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body ?? {})
    const created = await query(
      `
      insert into todos (text, theme_id)
      values ($1, $2)
      returning id, text, is_done, theme_id, created_at, done_at
      `,
      [payload.text, payload.theme_id ?? null],
    )
    res.status(201).json(created.rows[0])
  } catch (err) {
    next(err)
  }
})

const patchSchema = z.object({
  text: z.string().min(1).optional(),
  is_done: z.boolean().optional(),
  theme_id: z.string().uuid().nullable().optional(),
})

todosRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    const payload = patchSchema.parse(req.body ?? {})

    const current = await query(
      `
      select id, text, is_done, theme_id, created_at, done_at
      from todos
      where id = $1
      `,
      [id],
    )
    if (!current.rows[0]) return res.status(404).json({ error: 'Todo not found' })

    const row = current.rows[0]
    const nextIsDone = payload.is_done ?? row.is_done
    const nextDoneAt = nextIsDone ? row.done_at ?? new Date().toISOString() : null

    const updated = await query(
      `
      update todos
      set
        text = $2,
        is_done = $3,
        theme_id = $4,
        done_at = $5
      where id = $1
      returning id, text, is_done, theme_id, created_at, done_at
      `,
      [
        id,
        payload.text ?? row.text,
        nextIsDone,
        payload.theme_id ?? row.theme_id,
        nextDoneAt,
      ],
    )
    res.json(updated.rows[0])
  } catch (err) {
    next(err)
  }
})

todosRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    await pool.query(`delete from todos where id = $1`, [id])
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

