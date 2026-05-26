import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import { env } from './src/env.js'
import { apiRouter } from './src/routes/index.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api', apiRouter)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = Number(err?.status) || 500
  const message = err?.message || 'Internal Server Error'
  res.status(status).json({ error: message })
})

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`)
})

