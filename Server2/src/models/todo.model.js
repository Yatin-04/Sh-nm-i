import { pool } from '../db.js'

export const todoModel = {
  findAll(themeId) {
    return pool.query(
      `
      select id, text, is_done, theme_id, created_at, done_at
      from todos
      where ($1::uuid is null or theme_id = $1::uuid)
      order by created_at desc
      `,
      [themeId],
    )
  },

  findById(id) {
    return pool.query(
      `select id, text, is_done, theme_id, created_at, done_at from todos where id = $1`,
      [id],
    )
  },

  create({ text, theme_id }) {
    return pool.query(
      `
      insert into todos (text, theme_id)
      values ($1, $2)
      returning id, text, is_done, theme_id, created_at, done_at
      `,
      [text, theme_id ?? null],
    )
  },

  updateById(id, { text, is_done, theme_id, done_at }) {
    return pool.query(
      `
      update todos
      set text = $2, is_done = $3, theme_id = $4, done_at = $5
      where id = $1
      returning id, text, is_done, theme_id, created_at, done_at
      `,
      [id, text, is_done, theme_id, done_at],
    )
  },

  deleteById(id) {
    return pool.query(`delete from todos where id = $1`, [id])
  },
}



