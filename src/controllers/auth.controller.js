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
}

export default new AuthController()
