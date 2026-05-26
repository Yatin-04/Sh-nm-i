import express from 'express'

import { timerSettingsRouter } from './timer-settings.js'
import { themesRouter } from './themes.js'
import { todosRouter } from './todos.js'
import { subjectsRouter } from './subjects.js'
import { sessionsRouter } from './sessions.js'
import { revisionsRouter } from './revisions.js'
import { analyticsRouter } from './analytics.js'

export const apiRouter = express.Router()

apiRouter.use('/timer-settings', timerSettingsRouter)
apiRouter.use('/themes', themesRouter)
apiRouter.use('/todos', todosRouter)
apiRouter.use('/subjects', subjectsRouter)
apiRouter.use('/sessions', sessionsRouter)
apiRouter.use('/revisions', revisionsRouter)
apiRouter.use('/analytics', analyticsRouter)

