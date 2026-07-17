import app from './app.js'
import { connectDatabase } from './config/database.js'
import environment from './config/environment.js'

async function start() {
  try {
    await connectDatabase()
    app.listen(environment.port, () => {
      console.log(`API disponible en http://localhost:${environment.port}`)
    })
  } catch (error) {
    console.error('No se pudo iniciar la API:', error.message)
    process.exit(1)
  }
}

start()
