import 'dotenv/config'

const requiredInProduction = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL', 'BACKEND_URL']

if (process.env.NODE_ENV === 'production') {
  const missing = requiredInProduction.filter((name) => !process.env[name])
  if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`)
  }
}

const environment = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wordwork',
  jwtSecret: process.env.JWT_SECRET || 'solo-desarrollo-cambiar-antes-de-desplegar',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'WordWork <no-reply@wordwork.local>',
  },
})

export default environment
