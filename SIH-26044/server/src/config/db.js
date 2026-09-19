// server/src/config/db.js
import fs from 'fs'
import { spawn } from 'child_process'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aicp'

const tryAutoStartMongo = async () => {
  const possiblePaths = [
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
  ]
  const mongodExe = possiblePaths.find((p) => fs.existsSync(p))
  const dbPath = 'c:\\SIH_Project\\data\\db'

  if (mongodExe) {
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true })
    }
    console.log(`🚀 Attempting to auto-start local MongoDB via ${mongodExe}...`)
    try {
      const child = spawn(mongodExe, ['--dbpath', dbPath, '--bind_ip', '127.0.0.1', '--port', '27017'], {
        detached: true,
        stdio: 'ignore',
      })
      child.unref()
      await new Promise((resolve) => setTimeout(resolve, 2500))
      return true
    } catch (e) {
      console.warn('Could not auto-start mongod:', e.message)
    }
  }
  return false
}

const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...')
    console.log(`📍 URI: ${MONGO_URI}`)

    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    console.log(`📦 Database: ${conn.connection.name}`)

    return conn
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`)

    if (error.message.includes('ECONNREFUSED') && (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost'))) {
      const started = await tryAutoStartMongo()
      if (started) {
        try {
          console.log('🔄 Retrying MongoDB connection...')
          const conn = await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          })
          console.log(`✅ MongoDB Connected after auto-start: ${conn.connection.host}`)
          return conn
        } catch (retryError) {
          console.error(`❌ MongoDB Retry Failed: ${retryError.message}`)
        }
      }

      console.error('\n💡 MongoDB is not running. Start it with:')
      console.error('   "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe" --dbpath "c:\\SIH_Project\\data\\db"')
      console.error('   Or run: npm run dev\n')
    }

    process.exit(1)
  }
}

const disconnectDB = async () => {
  try {
    await mongoose.disconnect()
    console.log('✅ MongoDB Disconnected')
  } catch (error) {
    console.error(`❌ Error disconnecting: ${error.message}`)
    process.exit(1)
  }
}

export { connectDB, disconnectDB }
