import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { connectDB } from './src/config/db.js'
import cookies from 'cookie-parser'

import { authRouter } from './src/routes/User.js';
import { subjectRouter } from './src/routes/Subject.js';
import { todoRouter } from './src/routes/Todo.js';
import { sessionRouter } from './src/routes/Session.js';
import { analyticsRouter } from './src/routes/Analytics.js';

dotenv.config()

const app = express()

// Connect to the database and verify the connection
connectDB()

//middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(cookies())

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/subjects', subjectRouter)
app.use('/api/v1/todos', todoRouter)
app.use('/api/v1/sessions', sessionRouter)
app.use('/api/v1/analytics', analyticsRouter)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = Number(err?.status) || 500
  const message = err?.message || 'Internal Server Error'
  res.status(status).json({ error: message })
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`)
})

