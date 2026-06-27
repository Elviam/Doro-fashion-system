import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import { env } from './config/env.js'
import { notFound } from './middlewares/notFound.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = express()

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'ERP Académico Modular API'
  })
})

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app