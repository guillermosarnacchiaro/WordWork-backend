import Message from '../models/message.model.js'

class MessageRepository {
  create(data) {
    return Message.create(data)
  }

  listByConversation(conversationId, limit = 50) {
    return Message.find({ conversation: conversationId, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'displayName avatarUrl')
  }

  findLatestByConversations(conversationIds) {
    return Message.aggregate([
      { $match: { conversation: { $in: conversationIds }, deletedAt: null } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$conversation', message: { $first: '$$ROOT' } } },
    ])
  }

  findById(id) {
    return Message.findById(id)
      .populate('sender', 'displayName avatarUrl')
  }

  markDelivered(conversationIds, userId) {
    return Message.updateMany(
      { conversation: { $in: conversationIds }, sender: { $ne: userId }, deletedAt: null },
      { $addToSet: { deliveredTo: userId } },
    )
  }

  markRead(conversationId, userId) {
    return Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, deletedAt: null },
      { $addToSet: { deliveredTo: userId, readBy: userId } },
    )
  }

  search(conversationId, expression, limit = 50) {
    return Message.find({ conversation: conversationId, content: expression, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'displayName avatarUrl')
  }

  save(message) {
    return message.save()
  }
}

export default new MessageRepository()
