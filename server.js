const express = require('express')
const routes = require('./routes')
const db = require('./config/connection')
const cors = require('cors')
const cron = require('node-cron')
const { fuelPricing } = require('./utils/helpers')
require('dotenv').config()

const PORT = process.env.PORT || 8080
const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(cors())

app.use('/', express.static(__dirname + 'public'))
app.use(routes)

db.once('open', () => {
    app.listen(PORT, () => {
        console.log(`API server running on port ${PORT}`)
    })

    // Fetch fuel prices on startup
    fuelPricing().catch(err => console.error('Initial fuel pricing fetch failed:', err.message))

    // Run twice daily at 6:00 AM and 6:00 PM
    cron.schedule('0 6,18 * * *', async () => {
        try {
            await fuelPricing()
            console.log('Fuel prices updated successfully')
        } catch (err) {
            console.error('Scheduled fuel pricing fetch failed:', err.message)
        }
    })
})