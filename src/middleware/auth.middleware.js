import mongoose from 'mongoose'
import AppError from '../utils/appError.js'
import { verifyToken } from '../utils/jwt.js'

export default function authenticate(req, _res, next) {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith('Bearer ')) throw new AppError('No autorizado.', 401)

  try {
    const payload = verifyToken(authorization.slice(7), 'access')
    if (!mongoose.isValidObjectId(payload.sub)) throw new Error('Invalid subject')
    req.user = { id: payload.sub }
    next()
  } catch {
    throw new AppError('El token es inválido o venció.', 401)
  }
}
