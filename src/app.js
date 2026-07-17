import express from 'express'
import cors from 'cors'
import environment from './config/environment.js'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import conversationRoutes from './routes/conversation.routes.js'
import { errorHandler, notFound } from './middleware/error.middleware.js'

const app = express()

app.disable('x-powered-by')
app.use(cors({ origin: environment.frontendUrl, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }))
app.use(express.json({ limit: '20kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API de WordWork funcionando.' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/conversations', conversationRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
