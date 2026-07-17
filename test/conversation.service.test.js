import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import conversationRepository from '../src/repositories/conversation.repository.js'
import messageRepository from '../src/repositories/message.repository.js'
import conversationService from '../src/services/conversation.service.js'

const groupId = '507f191e810c19729de860ea'
const adminId = '507f1f77bcf86cd799439011'
const memberId = '507f1f77bcf86cd799439012'

function fakeGroup() {
  return {
    _id: groupId,
    type: 'group',
    participants: [adminId, memberId],
    admins: [adminId],
  }
}

describe('Eliminación de grupos', () => {
  test('un administrador elimina los mensajes y el grupo', async () => {
    const originalFindById = conversationRepository.findById
    const originalDeleteGroup = conversationRepository.deleteById
    const originalDeleteMessages = messageRepository.deleteByConversation
    const calls = []

    conversationRepository.findById = async () => fakeGroup()
    messageRepository.deleteByConversation = async (id) => { calls.push(['messages', id]) }
    conversationRepository.deleteById = async (id) => { calls.push(['group', id]) }

    try {
      await conversationService.deleteGroup(groupId, adminId)
      assert.deepEqual(calls, [['messages', groupId], ['group', groupId]])
    } finally {
      conversationRepository.findById = originalFindById
      conversationRepository.deleteById = originalDeleteGroup
      messageRepository.deleteByConversation = originalDeleteMessages
    }
  })

  test('un integrante sin rol de administrador no puede eliminar el grupo', async () => {
    const originalFindById = conversationRepository.findById
    const originalDeleteGroup = conversationRepository.deleteById
    const originalDeleteMessages = messageRepository.deleteByConversation
    let deleteCalled = false

    conversationRepository.findById = async () => fakeGroup()
    messageRepository.deleteByConversation = async () => { deleteCalled = true }
    conversationRepository.deleteById = async () => { deleteCalled = true }

    try {
      await assert.rejects(
        conversationService.deleteGroup(groupId, memberId),
        (error) => error.status === 403 && /administrador/i.test(error.message),
      )
      assert.equal(deleteCalled, false)
    } finally {
      conversationRepository.findById = originalFindById
      conversationRepository.deleteById = originalDeleteGroup
      messageRepository.deleteByConversation = originalDeleteMessages
    }
  })
})
