import assert from 'node:assert/strict'
import { test } from 'node:test'
import conversationRepository from '../src/repositories/conversation.repository.js'
import messageRepository from '../src/repositories/message.repository.js'
import userRepository from '../src/repositories/user.repository.js'
import userService from '../src/services/user.service.js'

const userId = '507f1f77bcf86cd799439011'
const otherUserId = '507f1f77bcf86cd799439012'
const privateId = '507f191e810c19729de860ea'
const retainedGroupId = '507f191e810c19729de860eb'
const emptyGroupId = '507f191e810c19729de860ec'

test('eliminar una cuenta limpia relaciones y conserva administradores en grupos', async () => {
  const originals = {
    findUser: userRepository.findById,
    deleteUser: userRepository.deleteById,
    listPrivate: conversationRepository.listPrivateForUser,
    listGroups: conversationRepository.listGroupsForUser,
    deleteConversations: conversationRepository.deleteByIds,
    deleteConversation: conversationRepository.deleteById,
    saveConversation: conversationRepository.save,
    deleteMessages: messageRepository.deleteByConversations,
    deleteConversationMessages: messageRepository.deleteByConversation,
    deleteSender: messageRepository.deleteBySender,
    removeReferences: messageRepository.removeUserReferences,
  }
  const calls = []
  const retainedGroup = { _id: retainedGroupId, participants: [userId, otherUserId], admins: [userId], createdBy: userId }
  const emptyGroup = { _id: emptyGroupId, participants: [userId], admins: [userId], createdBy: userId }

  userRepository.findById = async () => ({ _id: userId })
  conversationRepository.listPrivateForUser = async () => [{ _id: privateId }]
  conversationRepository.listGroupsForUser = async () => [retainedGroup, emptyGroup]
  messageRepository.deleteByConversations = async (ids) => calls.push(['privateMessages', ids.map(String)])
  conversationRepository.deleteByIds = async (ids) => calls.push(['privateConversations', ids.map(String)])
  conversationRepository.save = async (group) => calls.push(['saveGroup', String(group._id)])
  messageRepository.deleteByConversation = async (id) => calls.push(['groupMessages', String(id)])
  conversationRepository.deleteById = async (id) => calls.push(['group', String(id)])
  messageRepository.deleteBySender = async (id) => calls.push(['senderMessages', String(id)])
  messageRepository.removeUserReferences = async (id) => calls.push(['messageReferences', String(id)])
  userRepository.deleteById = async (id) => calls.push(['user', String(id)])

  try {
    await userService.deleteAccount(userId)
    assert.deepEqual(retainedGroup.participants, [otherUserId])
    assert.deepEqual(retainedGroup.admins, [otherUserId])
    assert.equal(retainedGroup.createdBy, null)
    assert.ok(calls.some(([name, id]) => name === 'group' && id === emptyGroupId))
    assert.deepEqual(calls.at(-1), ['user', userId])
  } finally {
    userRepository.findById = originals.findUser
    userRepository.deleteById = originals.deleteUser
    conversationRepository.listPrivateForUser = originals.listPrivate
    conversationRepository.listGroupsForUser = originals.listGroups
    conversationRepository.deleteByIds = originals.deleteConversations
    conversationRepository.deleteById = originals.deleteConversation
    conversationRepository.save = originals.saveConversation
    messageRepository.deleteByConversations = originals.deleteMessages
    messageRepository.deleteByConversation = originals.deleteConversationMessages
    messageRepository.deleteBySender = originals.deleteSender
    messageRepository.removeUserReferences = originals.removeReferences
  }
})
