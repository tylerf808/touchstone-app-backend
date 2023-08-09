const router = require('express').Router()
const jobRoutes = require('./jobRoutes')
const costsRoutes = require('./costsRoutes')
const userRoutes = require('./userRoutes')

router.use('/jobs', jobRoutes)
router.use('/costs', costsRoutes)
router.use('/user', userRoutes)

module.exports = router