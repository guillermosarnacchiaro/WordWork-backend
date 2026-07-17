import nodemailer from 'nodemailer'
import environment from '../config/environment.js'

class MailService {
  constructor() {
    const { host, port, secure, user, pass } = environment.smtp
    this.enabled = Boolean(host && user && pass)
    this.transporter = this.enabled
      ? nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
      : null
  }

  async sendVerificationEmail({ email, displayName, token }) {
    const verificationUrl = `${environment.backendUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`

    if (!this.enabled) {
      if (environment.nodeEnv === 'development') {
        console.log(`Verificación para ${email}: ${verificationUrl}`)
      }
      return { verificationUrl }
    }

    await this.transporter.sendMail({
      from: environment.smtp.from,
      to: email,
      subject: 'Verificá tu cuenta de WordWork',
      text: `Hola ${displayName}. Verificá tu cuenta: ${verificationUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111b21">
          <h1 style="color:#008069">WordWork</h1>
          <p>Hola ${displayName}, confirmá tu correo para activar la cuenta.</p>
          <p><a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;border-radius:24px;background:#00a884;color:#fff;text-decoration:none">Verificar correo</a></p>
          <p style="color:#667781;font-size:13px">El enlace vence en 24 horas.</p>
        </div>`,
    })

    return {}
  }
}

export default new MailService()
