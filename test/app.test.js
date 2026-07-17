import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import app from '../src/app.js'
import { createAccessToken } from '../src/utils/jwt.js'

let server
let baseUrl
const userId = '507f1f77bcf86cd799439011'
const accessToken = createAccessToken(userId)

before(async () => {
  server = app.listen(0)
  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
})

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options)
  const body = await response.json()
  return { response, body }
}

function jsonRequest(method, body, authenticated = false) {
  return {
    method,
    headers: {
      'content-type': 'application/json',
      ...(authenticated ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  }
}

describe('API y manejo global de errores', () => {
  test('GET /api/health informa que la API está activa', async () => {
    const { response, body } = await request('/api/health')
    assert.equal(response.status, 200)
    assert.equal(body.ok, true)
  })

  test('una ruta inexistente devuelve 404', async () => {
    const { response, body } = await request('/api/no-existe')
    assert.equal(response.status, 404)
    assert.equal(body.ok, false)
  })

  test('un JSON mal formado devuelve 400', async () => {
    const { response, body } = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email":',
    })
    assert.equal(response.status, 400)
    assert.match(body.message, /JSON/i)
  })

  test('un cuerpo mayor a 20 KB devuelve 413', async () => {
    const { response } = await request('/api/auth/login', jsonRequest('POST', {
      email: 'user@example.com',
      password: 'a'.repeat(21_000),
    }))
    assert.equal(response.status, 413)
  })
})

describe('Autenticación y registro', () => {
  test('rechaza un registro sin nombre', async () => {
    const { response } = await request('/api/auth/register', jsonRequest('POST', {
      email: 'user@example.com',
      password: 'segura123',
    }))
    assert.equal(response.status, 400)
  })

  test('rechaza correos inválidos', async () => {
    const { response } = await request('/api/auth/register', jsonRequest('POST', {
      display_name: 'Ana',
      email: 'correo-invalido',
      password: 'segura123',
    }))
    assert.equal(response.status, 400)
  })

  test('rechaza contraseñas que superan el límite seguro de bcrypt', async () => {
    const { response } = await request('/api/auth/register', jsonRequest('POST', {
      display_name: 'Ana',
      email: 'ana@example.com',
      password: 'a'.repeat(73),
    }))
    assert.equal(response.status, 400)
  })

  test('rechaza campos no permitidos', async () => {
    const { response, body } = await request('/api/auth/register', jsonRequest('POST', {
      display_name: 'Ana',
      email: 'ana@example.com',
      password: 'segura123',
      is_admin: true,
    }))
    assert.equal(response.status, 400)
    assert.match(body.message, /is_admin/)
  })

  test('valida el correo antes de solicitar un reenvío', async () => {
    const { response } = await request('/api/auth/resend-verification', jsonRequest('POST', {
      email: 'correo-invalido',
    }))
    assert.equal(response.status, 400)
  })

  test('rechaza campos extra en la solicitud de reenvío', async () => {
    const { response } = await request('/api/auth/resend-verification', jsonRequest('POST', {
      email: 'ana@example.com',
      verified: true,
    }))
    assert.equal(response.status, 400)
  })

  test('una ruta protegida exige Bearer JWT', async () => {
    const { response } = await request('/api/users/me')
    assert.equal(response.status, 401)
  })

  test('rechaza un JWT alterado', async () => {
    const { response } = await request('/api/users/me', {
      headers: { authorization: `Bearer ${accessToken}alterado` },
    })
    assert.equal(response.status, 401)
  })
})

describe('Perfil, grupos y mensajes', () => {
  test('rechaza una URL de avatar insegura', async () => {
    const { response } = await request('/api/users/me', jsonRequest('PATCH', {
      avatar_url: 'javascript:alert(1)',
    }, true))
    assert.equal(response.status, 400)
  })

  test('rechaza una actualización de perfil vacía', async () => {
    const { response } = await request('/api/users/me', jsonRequest('PATCH', {}, true))
    assert.equal(response.status, 400)
  })

  test('rechaza grupos con menos de dos invitados', async () => {
    const { response } = await request('/api/conversations/groups', jsonRequest('POST', {
      name: 'Equipo',
      member_ids: ['507f191e810c19729de860ea'],
    }, true))
    assert.equal(response.status, 400)
  })

  test('rechaza IDs de usuario inválidos al abrir un chat', async () => {
    const { response } = await request('/api/conversations/private', jsonRequest('POST', {
      user_id: 'no-es-un-object-id',
    }, true))
    assert.equal(response.status, 400)
  })

  test('rechaza mensajes vacíos', async () => {
    const { response } = await request('/api/conversations/507f191e810c19729de860ea/messages', jsonRequest('POST', {
      content: '   ',
    }, true))
    assert.equal(response.status, 400)
  })

  test('rechaza un ID de conversación inválido antes de consultar MongoDB', async () => {
    const { response } = await request('/api/conversations/id-invalido/messages', {
      headers: { authorization: `Bearer ${accessToken}` },
    })
    assert.equal(response.status, 400)
  })
})
