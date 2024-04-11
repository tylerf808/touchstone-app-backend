const router = require('express').Router()
const Costs = require('../../models/Costs')
const { getDirections, getGasPrice } = require('../../utils/helpers')
const auth = require('../../utils/auth')

const jwt = require('jsonwebtoken')

router.post('/check', auth, async (req, res) => {
  const directionsRes = await getDirections(req.body.start, req.body.pick_up, req.body.drop_off)
  const gasPrice = await getGasPrice(req.body.state1, req.body.state2, req.body.state3)
  let tolls = (directionsRes.routes[0]?.travelAdvisory?.tollInfo?.estimatedPrice[0]?.units)
  const duration = (directionsRes.routes[0].duration)
  if (tolls === undefined) {
    tolls = 0
  }
  const totalDistance = (directionsRes.routes[0].distanceMeters) / 1609.34

  const costs = await Costs.findOne({ belongsTo: req.body.username })

  if (costs === null) {
    res.status(404).json({ message: 'User has no costs' })
    return
  }
  const gasMpgCalc = (totalDistance / costs.mpg) * gasPrice

  res.status(200).json({
    distance: parseFloat(totalDistance.toFixed(2)),
    gasCost: parseFloat(gasMpgCalc.toFixed(2)),
    duration: duration,
    tolls: tolls,
    costs: costs
  })
})

//////GET Routes
//Query costs associated with a user
//TODO: make it check the id of the costs obj and bring back the one associated to who signs in
router.post('/', auth, async (req, res) => {
    const costsData = await Costs.find({ belongsTo: req.user.username})
    res.status(200).json(costsData)
})

//////POST Routes
//Add new costs obj
router.post('/newCosts', async (req, res) => {
  await Costs.create(req.body)
    .then((newCosts) => {
      res.json(newCosts)
    })
    .catch((err) => {
      res.json(err)
    })
})

//Update costs
router.put('/updateCosts', async (req, res) => {
  try {
    const newCosts = await Costs.findOneAndUpdate({belongsTo: req.body.username}, req.body, {
      returnOriginal: false
    })
    res.status(200).json(newCosts)
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router