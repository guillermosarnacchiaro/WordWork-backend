import bcrypt from 'bcrypt'
import userRepository from '../repositories/user.repository.js'
import mailService from './mail.service.js'
import AppError from '../utils/appError.js'
import { createAccessToken, createVerificationToken, verifyToken } from '../utils/jwt.js'

const HASH_ROUNDS = 12
const RESEND_COOLDOWN_MS = 60_000

class AuthService {
  async register({ display_name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await userRepository.findByEmail(normalizedEmail)
    if (existingUser) throw new AppError('El correo ya está registrado.', 409)

    const passwordHash = await bcrypt.hash(password, HASH_ROUNDS)
    const user = await userRepository.create({
      displayName: display_name.trim(),
      email: normalizedEmail,
      passwordHash,
      verificationEmailSentAt: new Date(),
    })

    const token = createVerificationToken(user._id)
    const mailResult = await mailService.sendVerificationEmail({
      email: user.email,
      displayName: user.displayName,
      token,
    })

    return { user, ...mailResult }
  }

  async verifyEmail(token) {
    let payload
    try {
      payload = verifyToken(token, 'verify-email')
    } catch {
      throw new AppError('El enlace de verificación es inválido o venció.', 400)
    }

    const user = await userRepository.findById(payload.sub)
    if (!user) throw new AppError('Usuario no encontrado.', 404)
    if (user.emailVerified) return user

    return userRepository.updateById(user._id, { emailVerified: true })
  }

  async resendVerification(email) {
    const user = await userRepository.findByEmail(email.trim().toLowerCase())
    if (!user || user.emailVerified) return

    const lastSentAt = user.verificationEmailSentAt?.getTime() || 0
    if (Date.now() - lastSentAt < RESEND_COOLDOWN_MS) return

    const token = createVerificationToken(user._id)
    await mailService.sendVerificationEmail({
      email: user.email,
      displayName: user.displayName,
      token,
    })
    await userRepository.updateById(user._id, { verificationEmailSentAt: new Date() })
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email.trim().toLowerCase(), { includePassword: true })
    const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false

    if (!user || !validPassword) throw new AppError('Correo o contraseña incorrectos.', 401)
    if (!user.emailVerified) throw new AppError('Primero verificá tu correo electrónico.', 403)

    await userRepository.updateById(user._id, { lastSeenAt: new Date() })
    return { user, accessToken: createAccessToken(user._id) }
  }
}

export default new AuthService()
