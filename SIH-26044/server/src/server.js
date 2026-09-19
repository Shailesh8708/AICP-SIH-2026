// server/src/server.js

import app from './app.js'
import config from './config/env.js'
import { connectDB } from './config/db.js'
import { initializeMailer } from './config/mail.js'
import { initializeStorage } from './config/storage.js'
import { seedDefaultSkills } from './controllers/skillController.js'
import { autoDeleteExpiredOpportunities } from './controllers/opportunityController.js'
import { initializeOpportunityRadar, startOpportunitySyncScheduler } from './jobs/opportunitySyncJob.js'

const startServer = async () => {
  try {
    console.log('\n' + '='.repeat(50))
    console.log('🚀 AICP - Backend Server Startup')
    console.log('='.repeat(50) + '\n')

    // --------------------------------------------------
    // 1. Initialize Database
    // --------------------------------------------------

    console.log('1️⃣  Initializing Database...')

    await connectDB()
    await seedDefaultSkills()
    await initializeOpportunityRadar().catch((err) => console.warn('[OpportunityRadar] Init error:', err.message))
    startOpportunitySyncScheduler()
    autoDeleteExpiredOpportunities().catch(() => {})
    setInterval(() => { autoDeleteExpiredOpportunities().catch(() => {}) }, 30 * 60 * 1000)

    console.log('✅ Database initialized successfully\n')


    // --------------------------------------------------
    // 2. Initialize File Storage
    // --------------------------------------------------

    console.log('2️⃣  Initializing File Storage...')

    initializeStorage()

    console.log('✅ File storage initialized\n')


    // --------------------------------------------------
    // 3. Render / Production Port
    // --------------------------------------------------

    const PORT = parseInt(
      process.env.PORT ||
      config.serverPort ||
      '5000',
      10
    )

    const HOST = '0.0.0.0'


    // --------------------------------------------------
    // 4. START HTTP SERVER
    //
    // IMPORTANT:
    // Start the server BEFORE email initialization.
    // This allows Render to detect the open port.
    // --------------------------------------------------

    const server = app.listen(
      PORT,
      HOST,
      () => {
        console.log('3️⃣  Server Started')
        console.log(`   🌍 Browser Gateway: http://localhost:${PORT}`)
        console.log(`   📍 Localhost:       http://127.0.0.1:${PORT}`)
        console.log(`   🔗 Network Bind:    http://${HOST}:${PORT}`)

        console.log('\n📍 Quick Links:')
        console.log(`   Gateway & Explorer: http://localhost:${PORT}`)
        console.log(`   Health Check:       http://localhost:${PORT}/health`)
        console.log(`   API Endpoint Root:  http://localhost:${PORT}/api`)
        console.log(`   Frontend Portal:    http://localhost:5173`)
        console.log(`   Environment:        ${config.nodeEnv}`)

        console.log('\n✅ Backend is ready and accessible!')
        console.log('='.repeat(50) + '\n')
      }
    )


    // --------------------------------------------------
    // Server Error Handler
    // --------------------------------------------------

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use by another process.`)
        console.error(`💡 Quick fix to free port ${PORT} in PowerShell:`)
        console.error(`   Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`)
        console.error(`   Or run: npm run clean-port (from the server directory)\n`)
        process.exit(1)
      }

      console.error(
        `❌ Server listener error: ${error.message}`
      )

      process.exit(1)
    })


    // --------------------------------------------------
    // 5. Initialize Email AFTER Server Starts
    // --------------------------------------------------

    console.log(
      '4️⃣  Initializing Email Service...'
    )

    try {

      await initializeMailer()

      console.log(
        '✅ Email service initialized successfully\n'
      )

    } catch (error) {

      console.warn(
        `⚠️ Email service initialization failed: ${error.message}`
      )

      console.warn(
        '⚠️ Backend will continue running.'
      )

      console.warn(
        '⚠️ OTP email functionality may be unavailable.\n'
      )
    }


    // --------------------------------------------------
    // Graceful Shutdown
    // --------------------------------------------------

    const shutdown = () => {

      console.log(
        '\n📍 Shutdown signal received...'
      )

      server.close(() => {

        console.log(
          '✅ Server closed'
        )

        process.exit(0)
      })
    }


    process.on(
      'SIGTERM',
      shutdown
    )

    process.on(
      'SIGINT',
      shutdown
    )

  } catch (error) {

    console.error(
      `\n❌ Server startup failed: ${error.message}`
    )

    console.error(
      error.stack
    )

    process.exit(1)
  }
}


startServer()
