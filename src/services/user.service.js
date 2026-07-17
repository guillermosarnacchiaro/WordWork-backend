import userRepository from '../repositories/user.repository.js'
import AppError from '../utils/appError.js'
import conversationRepository from '../repositories/conversation.repository.js'
import messageRepository from '../repositories/message.repository.js'

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

  async deleteAccount(userId) {
    const user = await userRepository.findById(userId)
    if (!user) throw new AppError('Usuario no encontrado.', 404)

    const privateConversations = await conversationRepository.listPrivateForUser(userId)
    const privateIds = privateConversations.map((conversation) => conversation._id)
    if (privateIds.length) {
      await messageRepository.deleteByConversations(privateIds)
      await conversationRepository.deleteByIds(privateIds)
    }

    const groups = await conversationRepository.listGroupsForUser(userId)
    for (const group of groups) {
      group.participants = group.participants.filter((id) => String(id) !== String(userId))
      group.admins = group.admins.filter((id) => String(id) !== String(userId))
      if (String(group.createdBy) === String(userId)) group.createdBy = null

      if (!group.participants.length) {
        await messageRepository.deleteByConversation(group._id)
        await conversationRepository.deleteById(group._id)
        continue
      }
      if (!group.admins.length) group.admins = [group.participants[0]]
      await conversationRepository.save(group)
    }

    await messageRepository.deleteBySender(userId)
    await messageRepository.removeUserReferences(userId)
    await userRepository.deleteById(userId)
  }
}

export default new UserService()
