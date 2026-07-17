import Conversation from '../models/conversation.model.js'
import mongoose from 'mongoose'

class ConversationRepository {
  findPrivateByKey(privateKey) {
    return Conversation.findOne({ privateKey })
  }

  createPrivate(participants, privateKey) {
    return Conversation.create({ type: 'private', participants, privateKey })
  }

  createGroup({ name, participants, creatorId }) {
    const groupId = new mongoose.Types.ObjectId()
    return Conversation.create({
      _id: groupId,
      type: 'group',
      privateKey: `group:${groupId}`,
      name,
      participants,
      createdBy: creatorId,
      admins: [creatorId],
    })
  }

  findById(id) {
    return Conversation.findById(id)
  }

  listForUser(userId) {
    return Conversation.find({ participants: userId })
      .populate('participants', 'displayName email avatarUrl bio emailVerified')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
  }

  listPrivateForUser(userId) {
    return Conversation.find({ type: 'private', participants: userId }).select('_id')
  }

  listGroupsForUser(userId) {
    return Conversation.find({ type: 'group', participants: userId })
  }

  deleteByIds(ids) {
    return Conversation.deleteMany({ _id: { $in: ids } })
  }

  touch(id, date) {
    return Conversation.findByIdAndUpdate(id, { lastMessageAt: date }, { new: true })
  }

  deleteById(id) {
    return Conversation.findByIdAndDelete(id)
  }

  save(conversation) {
    return conversation.save()
  }
}

export default new ConversationRepository()
