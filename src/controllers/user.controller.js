import userService from '../services/user.service.js'
import { toPublicUser } from '../mappers/user.mapper.js'

class UserController {
  async getProfile(req, res) {
    const user = await userService.getProfile(req.user.id)
    res.json({ ok: true, data: { user: toPublicUser(user) } })
  }

  async list(req, res) {
    const users = await userService.listUsers(req.user.id, req.query.q)
    res.json({
      ok: true,
      message: 'Usuarios obtenidos correctamente.',
      data: { users: users.map(toPublicUser) },
    })
  }

  async updateProfile(req, res) {
    const user = await userService.updateProfile(req.user.id, req.body)
    res.json({
      ok: true,
      message: 'Perfil actualizado.',
      data: { user: toPublicUser(user) },
    })
  }

  async touchPresence(req, res) {
    const user = await userService.touchPresence(req.user.id)
    res.json({ ok: true, data: { user: toPublicUser(user) } })
  }

  async deleteAccount(req, res) {
    await userService.deleteAccount(req.user.id)
    res.status(204).send()
  }
}

export default new UserController()
