import { spawn, spawnSync } from 'child_process'
import net from 'net'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        resolve(err.code === 'EADDRINUSE')
      })
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close()
      })
      .listen(port, '127.0.0.1')
  })
}

async function ensureMongo() {
  const active = await isPortInUse(27017)
  if (active) {
    console.log('✅ [1/4] MongoDB is already running on port 27017')
    return
  }
  const possiblePaths = [
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
  ]
  const mongodExe = possiblePaths.find((p) => fs.existsSync(p))
  const dbPath = 'c:\\SIH_Project\\data\\db'
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true })

  if (mongodExe) {
    console.log(`🚀 [1/4] Starting MongoDB from ${mongodExe}...`)
    const child = spawn(mongodExe, ['--dbpath', dbPath, '--bind_ip', '127.0.0.1', '--port', '27017'], {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    await new Promise((r) => setTimeout(r, 2000))
    console.log('✅ [1/4] MongoDB active!')
  } else {
    console.warn('⚠️ [1/4] MongoDB executable not found at default paths.')
  }
}

function getPythonCommand() {
  try {
    const res = spawnSync('python', ['--version'], { stdio: 'ignore', shell: true })
    if (res.status === 0) return 'python'
  } catch {}
  try {
    const res = spawnSync('py', ['--version'], { stdio: 'ignore', shell: true })
    if (res.status === 0) return 'py'
  } catch {}
  return 'python'
}

function runService(name, command, args, cwd) {
  console.log(`🚀 Starting ${name}...`)
  const child = spawn(command, args, {
    cwd: path.resolve(rootDir, cwd),
    stdio: 'inherit',
    shell: true,
  })
  child.on('error', (err) => console.error(`❌ [${name}] Error:`, err.message))
  return child
}

async function start() {
  console.log('\n==================================================')
  console.log('   Starting AICP Full Stack Application...')
  console.log('==================================================\n')

  await ensureMongo()

  const pythonCmd = getPythonCommand()
  const aiService = runService('AI Microservice (8000)', pythonCmd, ['app.py'], 'ai-service')
  const server = runService('Express Backend (5000)', 'npm', ['start'], 'server')
  const client = runService('Vite Frontend (5173)', 'npm', ['run', 'dev'], 'client')

  const cleanup = () => {
    console.log('\nStopping services...')
    aiService.kill()
    server.kill()
    client.kill()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

start().catch(console.error)
