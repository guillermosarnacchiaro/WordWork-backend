import authService from '../services/auth.service.js'
import environment from '../config/environment.js'
import { toPublicUser } from '../mappers/user.mapper.js'

class AuthController {
  async register(req, res) {
    const { user, verificationUrl } = await authService.register(req.body)
    const data = { user: toPublicUser(user) }

    if (environment.nodeEnv === 'development' && verificationUrl) {
      data.verification_url = verificationUrl
    }

    res.status(201).json({
      ok: true,
      message: 'Cuenta creada. Revisá tu correo para verificarla.',
      data,
    })
  }

  async verifyEmail(req, res) {
    await authService.verifyEmail(req.query.token)
    const redirectUrl = `${environment.frontendUrl}/?verified=true`
    res.redirect(redirectUrl)
  }

  async resendVerification(req, res) {
    await authService.resendVerification(req.body.email)
    res.json({
      ok: true,
      message: 'Si la cuenta existe y todavía no fue verificada, enviamos un nuevo enlace.',
    })
  }

  async login(req, res) {
    const { user, accessToken } = await authService.login(req.body)
    res.json({
      ok: true,
      message: 'Sesión iniciada correctamente.',
      data: { user: toPublicUser(user), access_token: accessToken },
    })
  }

  async forgotPassword(req, res) {
    const { resetUrl } = await authService.forgotPassword(req.body.email)
    const data = {}
    if (environment.nodeEnv === 'development' && resetUrl) data.reset_url = resetUrl
    res.json({
      ok: true,
      message: 'Si el correo corresponde a una cuenta verificada, enviamos un enlace de recuperación.',
      data,
    })
  }

  async resetPassword(req, res) {
    await authService.resetPassword(req.body.token, req.body.password)
    res.json({ ok: true, message: 'Contraseña actualizada correctamente.' })
  }
}

export default new AuthController()
