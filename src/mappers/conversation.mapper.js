import { toPublicUser } from './user.mapper.js'

export function toConversation(conversation, currentUserId, lastMessage = null) {
  const participants = conversation.participants.map((participant) => toPublicUser(participant))
  const otherUser = participants.find((participant) => participant.id !== String(currentUserId)) || null

  return {
    id: String(conversation._id),
    type: conversation.type,
    name: conversation.name,
    description: conversation.description || '',
    avatar_url: conversation.avatarUrl || null,
    participants,
    other_user: otherUser,
    last_message: lastMessage
      ? {
          id: String(lastMessage._id),
          content: lastMessage.content,
          sender_id: String(lastMessage.sender),
          created_at: lastMessage.createdAt,
        }
      : null,
    updated_at: conversation.lastMessageAt || conversation.updatedAt,
    created_by: conversation.createdBy ? String(conversation.createdBy) : null,
    admins: (conversation.admins || []).map(String),
  }
}

export function toMessage(message) {
  return {
    id: String(message._id),
    conversation_id: String(message.conversation),
    sender_id: String(message.sender?._id || message.sender),
    sender_name: message.sender?.displayName || null,
    content: message.content,
    delivered_to: (message.deliveredTo || []).map(String),
    read_by: (message.readBy || []).map(String),
    created_at: message.createdAt,
  }
}
