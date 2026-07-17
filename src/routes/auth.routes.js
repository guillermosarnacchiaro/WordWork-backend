import { Router } from 'express'
import authController from '../controllers/auth.controller.js'
import {
  validateLogin,
  validateForgotPassword,
  validateRegister,
  validateResetPassword,
  validateResendVerification,
  validateVerificationToken,
} from '../middleware/validate.middleware.js'

const router = Router()

router.post('/register', validateRegister, (req, res) => authController.register(req, res))
router.post('/resend-verification', validateResendVerification, (req, res) => authController.resendVerification(req, res))
router.get('/verify-email', validateVerificationToken, (req, res) => authController.verifyEmail(req, res))
router.post('/login', validateLogin, (req, res) => authController.login(req, res))
router.post('/forgot-password', validateForgotPassword, (req, res) => authController.forgotPassword(req, res))
router.post('/reset-password', validateResetPassword, (req, res) => authController.resetPassword(req, res))

export default router
