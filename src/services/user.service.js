import userRepository from '../repositories/user.repository.js'
import AppError from '../utils/appError.js'

class UserService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId)
    if (!user) throw new AppError('Usuario no encontrado.', 404)
    return user
  }

  async listUsers(userId, search) {
    if (search !== undefined && typeof search !== 'string') {
      throw new AppError('La búsqueda debe ser texto.', 400)
    }
    const normalizedSearch = search?.trim() || ''
    if (normalizedSearch.length > 50) throw new AppError('La búsqueda admite hasta 50 caracteres.', 400)
    return userRepository.listVerified({ excludeUserId: userId, search: normalizedSearch })
  }

  async updateProfile(userId, { display_name, bio, avatar_url, availability }) {
    const updates = {}
    if (display_name !== undefined) updates.displayName = display_name.trim()
    if (bio !== undefined) updates.bio = bio.trim()
    if (avatar_url !== undefined) updates.avatarUrl = avatar_url.trim() || null
    if (availability !== undefined) updates.availability = availability

    const user = await userRepository.updateById(userId, updates)
    if (!user) throw new AppError('Usuario no encontrado.', 404)
    return user
  }

  async touchPresence(userId) {
    const user = await userRepository.updateById(userId, { lastSeenAt: new Date() })
    if (!user) throw new AppError('Usuario no encontrado.', 404)
    return user
  }
}

export default new UserService()
