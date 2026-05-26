import express from 'express'
import { z } from 'zod'

import { pool } from '../db.js'

export const themesRouter = express.Router()

themesRouter.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      select id, name, background_type, background_value, accent, spotify_embed_url, created_at
      from themes
      order by created_at desc
      `,
    )
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
})

const createThemeSchema = z.object({
  name: z.string().min(1),
  background_type: z.string().min(1),
  background_value: z.string().min(1),
  accent: z.string().min(1),
  spotify_embed_url: z.string().url(),
})

themesRouter.post('/', async (req, res, next) => {
  try {
    const payload = createThemeSchema.parse(req.body ?? {})
    const created = await pool.query(
      `
      insert into themes (name, background_type, background_value, accent, spotify_embed_url)
      values ($1, $2, $3, $4, $5)
      returning id, name, background_type, background_value, accent, spotify_embed_url, created_at
      `,
      [
        payload.name,
        payload.background_type,
        payload.background_value,
        payload.accent,
        payload.spotify_embed_url,
      ],
    )
    res.status(201).json(created.rows[0])
  } catch (err) {
    next(err)
  }
})

const updateThemeSchema = createThemeSchema.partial()

themesRouter.put('/:id', async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    const payload = updateThemeSchema.parse(req.body ?? {})

    const current = await pool.query(
      `
      select id, name, background_type, background_value, accent, spotify_embed_url, created_at
      from themes
      where id = $1
      `,
      [id],
    )
    if (!current.rows[0]) return res.status(404).json({ error: 'Theme not found' })

    const row = current.rows[0]
    const updated = await pool.query(
      `
      update themes
      set
        name = $2,
        background_type = $3,
        background_value = $4,
        accent = $5,
        spotify_embed_url = $6
      where id = $1
      returning id, name, background_type, background_value, accent, spotify_embed_url, created_at
      `,
      [
        id,
        payload.name ?? row.name,
        payload.background_type ?? row.background_type,
        payload.background_value ?? row.background_value,
        payload.accent ?? row.accent,
        payload.spotify_embed_url ?? row.spotify_embed_url,
      ],
    )

    res.json(updated.rows[0])
  } catch (err) {
    next(err)
  }
})

