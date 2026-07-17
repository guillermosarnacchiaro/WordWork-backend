import mongoose from 'mongoose'
import conversationRepository from '../repositories/conversation.repository.js'
import messageRepository from '../repositories/message.repository.js'
import userRepository from '../repositories/user.repository.js'
import AppError from '../utils/appError.js'

function privateKeyFor(firstUserId, secondUserId) {
  return [String(firstUserId), String(secondUserId)].sort().join(':')
}

function isParticipant(conversation, userId) {
  return conversation.participants.some((participant) => String(participant._id || participant) === String(userId))
}

function isAdmin(conversation, userId) {
  return conversation.admins.some((adminId) => String(adminId) === String(userId))
}

class ConversationService {
  async openPrivate(currentUserId, otherUserId) {
    if (!mongoose.isValidObjectId(otherUserId)) throw new AppError('Usuario inválido.', 400)
    if (String(currentUserId) === String(otherUserId)) {
      throw new AppError('No podés iniciar una conversación con vos mismo.', 400)
    }

    const otherUser = await userRepository.findById(otherUserId)
    if (!otherUser || !otherUser.emailVerified) throw new AppError('Usuario no encontrado.', 404)

    const privateKey = privateKeyFor(currentUserId, otherUserId)
    let conversation = await conversationRepository.findPrivateByKey(privateKey)

    if (!conversation) {
      try {
        conversation = await conversationRepository.createPrivate([currentUserId, otherUserId], privateKey)
      } catch (error) {
        if (error?.code !== 11000) throw error
        conversation = await conversationRepository.findPrivateByKey(privateKey)
      }
    }

    return conversation.populate('participants', 'displayName email avatarUrl bio emailVerified')
  }

  async createGroup(currentUserId, { name, member_ids }) {
    const uniqueMemberIds = [...new Set(member_ids.map(String))]
      .filter((id) => id !== String(currentUserId))

    if (uniqueMemberIds.some((id) => !mongoose.isValidObjectId(id))) {
      throw new AppError('La lista de integrantes contiene usuarios inválidos.', 400)
    }
    if (uniqueMemberIds.length < 2) {
      throw new AppError('Elegí al menos dos personas para crear un grupo.', 400)
    }
    if (uniqueMemberIds.length > 49) {
      throw new AppError('El grupo admite hasta 50 integrantes.', 400)
    }

    const members = await userRepository.findVerifiedByIds(uniqueMemberIds)
    if (members.length !== uniqueMemberIds.length) {
      throw new AppError('Uno o más integrantes no están disponibles.', 400)
    }

    const conversation = await conversationRepository.createGroup({
      name: name.trim(),
      participants: [currentUserId, ...uniqueMemberIds],
      creatorId: currentUserId,
    })
    return conversation.populate('participants', 'displayName email avatarUrl bio emailVerified')
  }

  async updateGroup(groupId, userId, updates) {
    const group = await this.assertParticipant(groupId, userId)
    if (group.type !== 'group') throw new AppError('La conversación no es un grupo.', 400)
    if (!isAdmin(group, userId)) throw new AppError('Solo un administrador puede editar el grupo.', 403)

    if (updates.name !== undefined) group.name = updates.name.trim()
    if (updates.description !== undefined) group.description = updates.description.trim()
    if (updates.avatar_url !== undefined) group.avatarUrl = updates.avatar_url.trim() || null
    await conversationRepository.save(group)
    return group.populate('participants', 'displayName email avatarUrl bio emailVerified')
  }

  async addGroupMember(groupId, userId, memberId) {
    const group = await this.assertParticipant(groupId, userId)
    if (group.type !== 'group') throw new AppError('La conversación no es un grupo.', 400)
    if (!isAdmin(group, userId)) throw new AppError('No tenés permisos para agregar integrantes.', 403)
    if (!mongoose.isValidObjectId(memberId)) throw new AppError('Usuario inválido.', 400)
    if (isParticipant(group, memberId)) throw new AppError('El usuario ya pertenece al grupo.', 409)
    if (group.participants.length >= 50) throw new AppError('El grupo admite hasta 50 integrantes.', 400)
    const member = await userRepository.findById(memberId)
    if (!member?.emailVerified) throw new AppError('Usuario no encontrado.', 404)
    group.participants.push(memberId)
    await conversationRepository.save(group)
    return group.populate('participants', 'displayName email avatarUrl bio emailVerified')
  }

  async removeGroupMember(groupId, userId, memberId) {
    const group = await this.assertParticipant(groupId, userId)
    if (group.type !== 'group') throw new AppError('La conversación no es un grupo.', 400)
    if (!isAdmin(group, userId)) throw new AppError('No tenés permisos para quitar integrantes.', 403)
    if (!mongoose.isValidObjectId(memberId)) throw new AppError('Usuario inválido.', 400)
    if (String(memberId) === String(userId)) throw new AppError('No podés expulsarte desde esta acción.', 400)
    if (!isParticipant(group, memberId)) throw new AppError('El usuario no pertenece al grupo.', 404)
    group.participants = group.participants.filter((id) => String(id) !== String(memberId))
    group.admins = group.admins.filter((id) => String(id) !== String(memberId))
    await conversationRepository.save(group)
  }

  async setGroupRole(groupId, userId, memberId, role) {
    const group = await this.assertParticipant(groupId, userId)
    if (group.type !== 'group') throw new AppError('La conversación no es un grupo.', 400)
    if (!isAdmin(group, userId)) throw new AppError('No tenés permisos para cambiar roles.', 403)
    if (!mongoose.isValidObjectId(memberId)) throw new AppError('Usuario inválido.', 400)
    if (!isParticipant(group, memberId)) throw new AppError('El usuario no pertenece al grupo.', 404)
    if (isAdmin(group, memberId) && group.admins.length === 1 && role !== 'admin') {
      throw new AppError('El grupo debe conservar al menos un administrador.', 400)
    }

    group.admins = group.admins.filter((id) => String(id) !== String(memberId))
    if (role === 'admin') group.admins.push(memberId)
    await conversationRepository.save(group)
    return group
  }

  async list(currentUserId) {
    const conversations = await conversationRepository.listForUser(currentUserId)
    const ids = conversations.map((conversation) => conversation._id)
    if (ids.length) await messageRepository.markDelivered(ids, currentUserId)
    const latest = ids.length ? await messageRepository.findLatestByConversations(ids) : []
    const latestByConversation = new Map(latest.map((entry) => [String(entry._id), entry.message]))

    return conversations.map((conversation) => ({
      conversation,
      lastMessage: latestByConversation.get(String(conversation._id)) || null,
    }))
  }

  async assertParticipant(conversationId, userId) {
    if (!mongoose.isValidObjectId(conversationId)) throw new AppError('Conversación inválida.', 400)
    const conversation = await conversationRepository.findById(conversationId)
    if (!conversation) throw new AppError('Conversación no encontrada.', 404)
    if (!isParticipant(conversation, userId)) throw new AppError('No participás de esta conversación.', 403)
    return conversation
  }

  async listMessages(conversationId, userId, requestedLimit) {
    await this.assertParticipant(conversationId, userId)
    await messageRepository.markRead(conversationId, userId)
    let limit = 50
    if (requestedLimit !== undefined) {
      if (typeof requestedLimit !== 'string' || !/^\d+$/.test(requestedLimit)) {
        throw new AppError('El límite debe ser un número entero.', 400)
      }
      limit = Number(requestedLimit)
      if (limit < 1 || limit > 100) throw new AppError('El límite debe estar entre 1 y 100.', 400)
    }
    const messages = await messageRepository.listByConversation(conversationId, limit)
    return messages.reverse()
  }

  async sendMessage(conversationId, userId, content) {
    await this.assertParticipant(conversationId, userId)
    const message = await messageRepository.create({
      conversation: conversationId,
      sender: userId,
      content: content.trim(),
    })
    await conversationRepository.touch(conversationId, message.createdAt)
    return messageRepository.findById(message._id)
  }

  async searchMessages(conversationId, userId, query) {
    await this.assertParticipant(conversationId, userId)
    if (typeof query !== 'string') throw new AppError('La búsqueda debe ser texto.', 400)
    const normalizedQuery = query.trim()
    if (normalizedQuery.length > 100) throw new AppError('La búsqueda admite hasta 100 caracteres.', 400)
    const safeQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (safeQuery.length < 2) throw new AppError('Escribí al menos dos caracteres.', 400)
    return messageRepository.search(conversationId, new RegExp(safeQuery, 'i'))
  }
}

export default new ConversationService()
