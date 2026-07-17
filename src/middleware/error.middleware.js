import mongoose from 'mongoose'
import AppError from '../utils/appError.js'

export function notFound(req, _res, next) {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404))
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ ok: false, message: 'El JSON enviado no es válido.' })
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, message: 'El cuerpo de la solicitud es demasiado grande.' })
  }
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0]
    const message = field === 'email'
      ? 'El correo ya está registrado.'
      : 'Ya existe un registro con esos datos.'
    return res.status(409).json({ ok: false, message })
  }
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ ok: false, message: 'El identificador enviado no es válido.' })
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ ok: false, message: 'Los datos enviados no son válidos.' })
  }

  const status = error instanceof AppError ? error.status : 500
  if (status === 500) console.error(error)
  return res.status(status).json({
    ok: false,
    message: status === 500 ? 'Error interno del servidor.' : error.message,
  })
}
