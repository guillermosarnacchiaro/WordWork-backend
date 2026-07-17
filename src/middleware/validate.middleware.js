import mongoose from 'mongoose'
import AppError from '../utils/appError.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const controlCharacters = /[\u0000-\u001F\u007F]/

function assertPlainBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('El cuerpo de la solicitud debe ser un objeto JSON.', 400)
  }
}

function rejectUnknownFields(body, allowedFields) {
  const unknown = Object.keys(body).filter((field) => !allowedFields.includes(field))
  if (unknown.length) throw new AppError(`Campos no permitidos: ${unknown.join(', ')}.`, 400)
}

function assertObjectId(value, message) {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw new AppError(message, 400)
  }
}

function isHttpUrl(value) {
  if (value === '') return true
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname)
  } catch {
    return false
  }
}

export function validateRegister(req, _res, next) {
  assertPlainBody(req.body)
  rejectUnknownFields(req.body, ['display_name', 'email', 'password'])
  const { display_name, email, password } = req.body
  const cleanName = typeof display_name === 'string' ? display_name.trim() : ''
  const cleanEmail = typeof email === 'string' ? email.trim() : ''

  if (cleanName.length < 2 || cleanName.length > 50 || controlCharacters.test(cleanName)) {
    throw new AppError('El nombre debe tener entre 2 y 50 caracteres válidos.', 400)
  }
  if (!emailPattern.test(cleanEmail) || cleanEmail.length > 120) {
    throw new AppError('Ingresá un correo electrónico válido.', 400)
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new AppError('La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.', 400)
  }
  next()
}

export function validateLogin(req, _res, next) {
  assertPlainBody(req.body)
  rejectUnknownFields(req.body, ['email', 'password'])
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : ''
  if (!emailPattern.test(email) || email.length > 120 || typeof req.body.password !== 'string' || !req.body.password) {
    throw new AppError('Ingresá un correo y una contraseña válidos.', 400)
  }
  next()
}

export function validateResendVerification(req, _res, next) {
  assertPlainBody(req.body)
  rejectUnknownFields(req.body, ['email'])
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : ''
  if (!emailPattern.test(email) || email.length > 120) {
    throw new AppError('Ingresá un correo electrónico válido.', 400)
  }
  next()
}

export function validateVerificationToken(req, _res, next) {
  if (typeof req.query.token !== 'string' || !req.query.token.trim() || req.query.token.length > 2048) {
    throw new AppError('Falta el token de verificación o no es válido.', 400)
  }
  next()
}

export function validatePrivateConversation(req, _res, next) {
  assertPlainBody(req.body)
  rejectUnknownFields(req.body, ['user_id'])
  assertObjectId(req.body.user_id, 'El usuario indicado no es válido.')
  next()
}

export function validateGroup(req, _res, next) {
  assertPlainBody(req.body)
  rejectUnknownFields(req.body, ['name', 'member_ids'])
  const { name, member_ids } = req.body
  const cleanName = typeof name === 'string' ? name.trim() : ''
  if (cleanName.length < 2 || cleanName.length > 60 || controlCharacters.test(cleanName)) {
    throw new AppError('El nombre del grupo debe tener entre 2 y 60 caracteres válidos.', 400)
  }
  if (!Array.isArray(member_ids) || member_ids.length < 2 || member_ids.length > 49) {
    throw new AppError('Elegí entre 2 y 49 integrantes.', 400)
  }
  if (member_ids.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
    throw new AppError('La lista contiene usuarios inválidos.', 400)
  }
  next()
}

export function validateGroupUpdate(req, _res, next) {
  assertPlainBody(req.body)
  rejectUnknownFields(req.body, ['name', 'description', 'avatar_url'])
  const { name, description, avatar_url } = req.body
  if (name === undefined && description === undefined && avatar_url === undefined) {
    throw new AppError('No hay datos para actualizar.', 400)
  }
  if (name !== undefined) {
    const cleanName = typeof name === 'string' ? name.trim() : ''
    if (cleanName.length < 2 || cleanName.length > 60 || controlCharacters.test(cleanName)) {
      throw new AppError('El nombre debe tener entre 2 y 60 caracteres válidos.', 400)
    }
  }
  if (description !== undefined && (typeof description !== 'string' || description.trim().length > 250 || controlCharacters.test(description))) {
    throw new AppError('La descripción admite hasta 250 caracteres válidos.', 400)
  }
  if (avatar_url !== undefined && (typeof avatar_url !== 'string' || avatar_url.length > 500 || !isHttpUrl(avatar_url.trim()))) {
    throw new AppError('La imagen debe usar una URL HTTP o HTTPS válida.', 400)
  }
  next()
}

export function validateRole(req, _res, next) {
  assertPlainBody(req.body)
  rejectUnknownFields(req.body, ['role'])
  if (!['admin', 'member'].includes(req.body.role)) throw new AppError('El rol no es válido.', 400)
  next()
}

export function validateMessage(req, _res, next) {
  assertPlainBody(req.body)
  rejectUnknownFields(req.body, ['content'])
  const content = req.body.content
  if (typeof content !== 'string' || !content.trim() || content.trim().length > 2000 || controlCharacters.test(content.replace(/[\n\r\t]/g, ''))) {
    throw new AppError('El mensaje debe tener entre 1 y 2000 caracteres válidos.', 400)
  }
  next()
}

export function validateProfile(req, _res, next) {
  assertPlainBody(req.body)
  rejectUnknownFields(req.body, ['display_name', 'bio', 'avatar_url', 'availability'])
  const { display_name, bio, avatar_url, availability } = req.body
  if (display_name === undefined && bio === undefined && avatar_url === undefined && availability === undefined) {
    throw new AppError('No hay datos para actualizar.', 400)
  }
  if (display_name !== undefined) {
    const cleanName = typeof display_name === 'string' ? display_name.trim() : ''
    if (cleanName.length < 2 || cleanName.length > 50 || controlCharacters.test(cleanName)) {
      throw new AppError('El nombre debe tener entre 2 y 50 caracteres válidos.', 400)
    }
  }
  if (bio !== undefined && (typeof bio !== 'string' || bio.trim().length > 140 || controlCharacters.test(bio.replace(/[\n\r\t]/g, '')))) {
    throw new AppError('La biografía admite hasta 140 caracteres válidos.', 400)
  }
  if (avatar_url !== undefined && (typeof avatar_url !== 'string' || avatar_url.length > 500 || !isHttpUrl(avatar_url.trim()))) {
    throw new AppError('La foto debe usar una URL HTTP o HTTPS válida.', 400)
  }
  if (availability !== undefined && !['available', 'busy', 'away'].includes(availability)) {
    throw new AppError('El estado seleccionado no es válido.', 400)
  }
  next()
}
