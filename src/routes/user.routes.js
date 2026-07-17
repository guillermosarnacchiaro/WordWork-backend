import { Router } from 'express'
import authenticate from '../middleware/auth.middleware.js'
import userController from '../controllers/user.controller.js'
import { validateProfile } from '../middleware/validate.middleware.js'

const router = Router()

router.get('/', authenticate, (req, res) => userController.list(req, res))
router.get('/me', authenticate, (req, res) => userController.getProfile(req, res))
router.patch('/me', authenticate, validateProfile, (req, res) => userController.updateProfile(req, res))
router.delete('/me', authenticate, (req, res) => userController.deleteAccount(req, res))
router.post('/me/presence', authenticate, (req, res) => userController.touchPresence(req, res))

export default router
