import assert from 'node:assert/strict'
import { test } from 'node:test'
import authService from '../src/services/auth.service.js'
import userRepository from '../src/repositories/user.repository.js'
import { createPasswordResetToken } from '../src/utils/jwt.js'

const userId = '507f1f77bcf86cd799439011'

test('el token de recuperación solo funciona con la versión vigente', async () => {
  const originalFindById = userRepository.findById
  const originalUpdatePassword = userRepository.updatePassword
  let updated = false

  userRepository.findById = async () => ({ _id: userId, passwordResetVersion: updated ? 1 : 0 })
  userRepository.updatePassword = async () => {
    updated = true
    return { _id: userId }
  }

  const token = createPasswordResetToken(userId, 0)

  try {
    await authService.resetPassword(token, 'NuevaClave2026!')
    assert.equal(updated, true)
    await assert.rejects(
      authService.resetPassword(token, 'OtraClave2026!'),
      (error) => error.status === 400 && /utilizado/i.test(error.message),
    )
  } finally {
    userRepository.findById = originalFindById
    userRepository.updatePassword = originalUpdatePassword
  }
})
