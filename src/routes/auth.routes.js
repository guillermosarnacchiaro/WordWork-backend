import { Router } from 'express'
import authController from '../controllers/auth.controller.js'
import {
  validateLogin,
  validateRegister,
  validateResendVerification,
  validateVerificationToken,
} from '../middleware/validate.middleware.js'

const router = Router()

router.post('/register', validateRegister, (req, res) => authController.register(req, res))
router.post('/resend-verification', validateResendVerification, (req, res) => authController.resendVerification(req, res))
router.get('/verify-email', validateVerificationToken, (req, res) => authController.verifyEmail(req, res))
router.post('/login', validateLogin, (req, res) => authController.login(req, res))

export default router
