const router = require('express').Router()
const jobRoutes = require('./jobRoutes')
const costsRoutes = require('./costsRoutes')
const userRoutes = require('./userRoutes')
const tractorRoutes = require('./tractorRoutes')

router.use('/jobs', jobRoutes)
router.use('/costs', costsRoutes)
router.use('/user', userRoutes)
router.use('/tractor', tractorRoutes)

module.exports = router