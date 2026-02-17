const router = require('express').Router()
const auth = require('../../utils/auth')
const Tractor = require('../../models/Tractor')
const User = require('../../models/User')

//Get all tractors
router.get('/getTractors', auth, async (req, res) => {
    try {

        let tractors
        if (req.user.accountType === 'admin') {
            tractors = await Tractor.find({ belongsTo: req.user.username })
        } else {
            tractors = await Tractor.find({ belongsTo: req.user.admin })
        }
        res.status(200).json(tractors)
    } catch (error) {
        res.status(500).json(error)
    }
})

//Add a tractor
router.post('/newTractor', auth, async (req, res) => {
    try {
        await Tractor.create({
            internalNum: req.body.internalNum,
            vin: req.body.vin,
            insurance: req.body.insurance,
            mpg: req.body.mpg,
            height: req.body.height,
            width: req.body.width,
            weight: req.body.weight,
            depreciation: req.body.depreciation,
            belongsTo: req.user.username,
            tractorLease: req.body.tractorLease,
            trailerLease: req.body.trailerLease
        })
        res.status(200).json({ msg: 'Tractor added' })
    } catch (error) {
        res.status(500).json(error)
    }
})

//Delete a tractor
router.post('/deleteTractor', auth, async (req, res) => {
    try {
        await Tractor.findOneAndDelete({ _id: req.body._id })
        res.status(200).json({ msg: 'Tractor deleted' })
    } catch (error) {
        res.status(500).json(error)
    }
})

//Edit a tractor
router.post('/editTractor', auth, async (req, res) => {
    try {
        const updatedTractor = await Tractor.findOneAndUpdate({ _id: req.body._id, belongsTo: req.user.username },
            {
                mpg: req.body.mpg,
                insurance: req.body.insurance,
                vin: req.body.vin,
                internalNum: req.body.internalNum,
                height: req.body.height,
                width: req.body.width,
                depreciation: req.body.depreciation,
                weight: req.body.weight,
                tractorLease: req.body.tractorLease,
                trailerLease: req.body.trailerLease
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