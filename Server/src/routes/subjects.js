import express from 'express'
import { z } from 'zod'

import { pool } from '../db.js'

export const subjectsRouter = express.Router()

subjectsRouter.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      select id, name
      from subjects
      order by name asc
      `,
    )
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
})

const createSchema = z.object({
  name: z.string().min(1),
})

subjectsRouter.post('/', async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body ?? {})
    const created = await pool.query(
      `
      insert into subjects (name)
      values ($1)
      on conflict (name) do update set name = excluded.name
      returning id, name
      `,
      [payload.name],
    )
    res.status(201).json(created.rows[0])
  } catch (err) {
    next(err)
  }
})

