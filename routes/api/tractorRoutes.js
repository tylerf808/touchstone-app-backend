const router = require('express').Router()
const auth = require('../../utils/auth')
const Tractor = require('../../models/Tractor')

//Get all tractors
router.get('/getTractors', auth, async (req, res) => {
    try {
        const tractors = await Tractor.find({belongsTo: req.user.username})
        res.status(200).json(tractors)
    } catch (error) {
        res.status(500).json(error)
    }
})

//Add a tractor
router.post('/createTractor', auth, async (req, res) => {
    try {   
        await Tractor.create(req.body)
        res.status(200).json({msg: 'Tractor added'})
    } catch (error) {
        res.status(500).json(error)
    }
})

//Delete a tractor
router.post('/deleteTractor', auth, async (req, res) => {
    try {
        await Tractor.findOneAndDelete({internalNum: req.body.internalNum, belongsTo: req.user.username})
        res.status(200).json({msg: 'Tractor deleted'})
    } catch (error) {
        res.status(500).json(error)
    }
})

//Edit a tractor
router.post('/editTractor', auth, async (req, res) => {
    try {
        await Tractor.findOneAndReplace({internalNum: req.body.internalNum, belongsTo: req.user.username})
        res.status(200).json({msg: 'Tractor updated'})
    } catch (error) {
        res.status(500).json(error)
    }
})

module.exports = router