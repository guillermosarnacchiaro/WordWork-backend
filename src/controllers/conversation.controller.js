import conversationService from '../services/conversation.service.js'
import { toConversation, toMessage } from '../mappers/conversation.mapper.js'

class ConversationController {
  async openPrivate(req, res) {
    const conversation = await conversationService.openPrivate(req.user.id, req.body.user_id)
    res.status(201).json({
      ok: true,
      message: 'Conversación disponible.',
      data: { conversation: toConversation(conversation, req.user.id) },
    })
  }

  async createGroup(req, res) {
    const conversation = await conversationService.createGroup(req.user.id, req.body)
    res.status(201).json({
      ok: true,
      message: 'Grupo creado correctamente.',
      data: { conversation: toConversation(conversation, req.user.id) },
    })
  }

  async updateGroup(req, res) {
    const conversation = await conversationService.updateGroup(req.params.conversationId, req.user.id, req.body)
    res.json({ ok: true, message: 'Grupo actualizado.', data: { conversation: toConversation(conversation, req.user.id) } })
  }

  async addGroupMember(req, res) {
    const conversation = await conversationService.addGroupMember(req.params.conversationId, req.user.id, req.body.user_id)
    res.status(201).json({ ok: true, message: 'Integrante agregado.', data: { conversation: toConversation(conversation, req.user.id) } })
  }

  async removeGroupMember(req, res) {
    await conversationService.removeGroupMember(req.params.conversationId, req.user.id, req.params.userId)
    res.status(204).send()
  }

  async setGroupRole(req, res) {
    await conversationService.setGroupRole(
      req.params.conversationId, req.user.id, req.params.userId, req.body.role,
    )
    res.json({ ok: true, message: 'Rol actualizado.' })
  }

  async list(req, res) {
    const results = await conversationService.list(req.user.id)
    res.json({
      ok: true,
      data: {
        conversations: results.map(({ conversation, lastMessage }) =>
          toConversation(conversation, req.user.id, lastMessage),
        ),
      },
    })
  }

  async listMessages(req, res) {
    const messages = await conversationService.listMessages(req.params.conversationId, req.user.id, req.query.limit)
    res.json({ ok: true, data: { messages: messages.map(toMessage) } })
  }

  async sendMessage(req, res) {
    const message = await conversationService.sendMessage(
      req.params.conversationId,
      req.user.id,
      req.body.content,
    )
    res.status(201).json({
      ok: true,
      message: 'Mensaje enviado.',
      data: { message: toMessage(message) },
    })
  }

  async searchMessages(req, res) {
    const messages = await conversationService.searchMessages(
      req.params.conversationId, req.user.id, req.query.q || '',
    )
    res.json({ ok: true, data: { messages: messages.map(toMessage) } })
  }
}

export default new ConversationController()
