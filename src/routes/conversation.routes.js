import { Router } from 'express'
import authenticate from '../middleware/auth.middleware.js'
import conversationController from '../controllers/conversation.controller.js'
import { validateGroup, validateGroupUpdate, validateMessage, validatePrivateConversation, validateRole } from '../middleware/validate.middleware.js'

const router = Router()

router.use(authenticate)
router.get('/', (req, res) => conversationController.list(req, res))
router.post('/private', validatePrivateConversation, (req, res) => conversationController.openPrivate(req, res))
router.post('/groups', validateGroup, (req, res) => conversationController.createGroup(req, res))
router.patch('/:conversationId/group', validateGroupUpdate, (req, res) => conversationController.updateGroup(req, res))
router.post('/:conversationId/group/members', validatePrivateConversation, (req, res) => conversationController.addGroupMember(req, res))
router.delete('/:conversationId/group/members/:userId', (req, res) => conversationController.removeGroupMember(req, res))
router.patch('/:conversationId/group/members/:userId/role', validateRole, (req, res) => conversationController.setGroupRole(req, res))
router.get('/:conversationId/messages', (req, res) => conversationController.listMessages(req, res))
router.get('/:conversationId/messages/search', (req, res) => conversationController.searchMessages(req, res))
router.post('/:conversationId/messages', validateMessage, (req, res) => conversationController.sendMessage(req, res))

export default router
