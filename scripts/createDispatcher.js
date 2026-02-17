// Usage: node scripts/createDispatcher.js --username bob --email bob@example.com --password secret --name "Bob Smith" --admin adminUser

const connection = require('../config/connection')
const User = require('../models/User')

function parseArgs() {
  const args = {}
  const raw = process.argv.slice(2)
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].startsWith('--')) {
      const key = raw[i].slice(2)
      const val = raw[i + 1] && !raw[i + 1].startsWith('--') ? raw[i + 1] : true
      args[key] = val
      if (val !== true) i++
    }
  }
  return args
}

async function main() {
  const { username, email, password, name, admin } = parseArgs()

  if (!username || !email || !password || !name) {
    console.error('Missing required args. Example: --username bob --email bob@example.com --password secret --name "Bob" [--admin adminUser]')
    process.exit(1)
  }

  try {
    // ensure mongoose connection is ready
    connection.once('open', async () => {
      console.log('DB connected — creating dispatcher...')

      const existsByUsername = await User.exists({ username })
      const existsByEmail = await User.exists({ email })

      if (existsByUsername) {
        console.error('A user with that username already exists.')
        process.exit(1)
      }
      if (existsByEmail) {
        console.error('A user with that email already exists.')
        process.exit(1)
      }

      const userData = {
        username,
        email,
        password,
        name,
        accountType: 'dispatcher'
      }
      if (admin) userData.admin = admin

      const created = await User.create(userData)
      console.log('Created dispatcher:', {
        _id: created._id,
        username: created.username,
        email: created.email,
        name: created.name,
        accountType: created.accountType,
        admin: created.admin
      })

      process.exit(0)
    })

    connection.on('error', (err) => {
      console.error('DB connection error:', err)
      process.exit(1)
    })
  } catch (err) {
    console.error('Error creating dispatcher:', err)
    process.exit(1)
  }
}

main()
