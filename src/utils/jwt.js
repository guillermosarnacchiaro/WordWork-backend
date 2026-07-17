import jwt from 'jsonwebtoken'
import environment from '../config/environment.js'

export function createAccessToken(userId) {
  return jwt.sign({ sub: String(userId), purpose: 'access' }, environment.jwtSecret, {
    expiresIn: environment.jwtExpiresIn,
  })
}

export function createVerificationToken(userId) {
  return jwt.sign({ sub: String(userId), purpose: 'verify-email' }, environment.jwtSecret, {
    expiresIn: '24h',
  })
}

export function createPasswordResetToken(userId, version) {
  return jwt.sign({ sub: String(userId), purpose: 'reset-password', version }, environment.jwtSecret, {
    expiresIn: '30m',
  })
}

export function verifyToken(token, expectedPurpose) {
  const payload = jwt.verify(token, environment.jwtSecret)
  if (payload.purpose !== expectedPurpose) throw new jwt.JsonWebTokenError('Propósito inválido')
  return payload
}
