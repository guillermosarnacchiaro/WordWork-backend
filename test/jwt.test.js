import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import jwt from 'jsonwebtoken'
import environment from '../src/config/environment.js'
import { createAccessToken, createVerificationToken, verifyToken } from '../src/utils/jwt.js'

const userId = '507f1f77bcf86cd799439011'

describe('Seguridad JWT', () => {
  test('el token de acceso contiene usuario, propósito y vencimiento', () => {
    const payload = verifyToken(createAccessToken(userId), 'access')
    assert.equal(payload.sub, userId)
    assert.equal(payload.purpose, 'access')
    assert.ok(payload.exp > payload.iat)
  })

  test('un token de verificación no sirve como token de acceso', () => {
    const token = createVerificationToken(userId)
    assert.throws(() => verifyToken(token, 'access'))
  })

  test('rechaza tokens firmados con otro secreto', () => {
    const token = jwt.sign({ sub: userId, purpose: 'access' }, 'otro-secreto')
    assert.throws(() => verifyToken(token, 'access'))
  })

  test('rechaza tokens vencidos', () => {
    const token = jwt.sign(
      { sub: userId, purpose: 'access' },
      environment.jwtSecret,
      { expiresIn: -1 },
    )
    assert.throws(() => verifyToken(token, 'access'))
  })
})
