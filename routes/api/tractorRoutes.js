const router = require('express').Router()
const auth = require('../../utils/auth')
const Tractor = require('../../models/Tractor')

//Get all tractors
router.get('/getTractors', auth, async (req, res) => {
    try {
        const tractors = await Tractor.find({ belongsTo: req.user.username })
        res.status(200).json(tractors)
    } catch (error) {
        res.status(500).json(error)
    }
})

//Add a tractor
router.post('/createTractor', auth, async (req, res) => {
    try {
        await Tractor.create(req.body)
        res.status(200).json({ msg: 'Tractor added' })
    } catch (error) {
        res.status(500).json(error)
    }
})

//Delete a tractor
router.post('/deleteTractor', auth, async (req, res) => {
    try {
        await Tractor.findOneAndDelete({ internalNum: req.body.internalNum, belongsTo: req.user.username })
        res.status(200).json({ msg: 'Tractor deleted' })
    } catch (error) {
        res.status(500).json(error)
    }
})

//Edit a tractor
router.post('/editTractor', auth, async (req, res) => {
    try {
        const tractor = req.body.tractor
        const updatedTractor = await Tractor.findOneAndUpdate({ internalNum: req.body.internalNum, belongsTo: req.user.username },
            {
                mpg: tractor.mpg,
                insurance: tractor.insurance,
                vin: tractor.vin,
                internalNum: tractor.internalNum,
                height: tractor.height,
                width: tractor.width,
                weight: tractor.weight
            },
            {
                new: true
            })
        res.status(200).json(updatedTractor)
    } catch (error) {
        res.status(500).json(error)
    }
})

module.exports = router