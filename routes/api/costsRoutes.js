const router = require('express').Router()
const Costs = require('../../models/Costs')
const Tractor = require('../../models/Tractor')
const { getDirections, getGasPrice } = require('../../utils/helpers')
const auth = require('../../utils/auth')

const jwt = require('jsonwebtoken')

router.post('/check', auth, async (req, res) => {

  const details = req.body.logistics
  const revenue = req.body.logistics.revenue

  const directionsRes = await getDirections(req.body.addresses.start, req.body.addresses.pickUp, req.body.addresses.dropOff)
  const gasPrice = await getGasPrice(req.body.state1, req.body.state2, req.body.state3)
  let tolls = (directionsRes.routes[0]?.travelAdvisory?.tollInfo?.estimatedPrice[0]?.units)
  const duration = (directionsRes.routes[0].duration)
  if (tolls === undefined) {
    tolls = 0
  }
  const totalDistance = (directionsRes.routes[0].distanceMeters) / 1609.34

  const costs = await Costs.findOne({ belongsTo: req.user.username })

  if (costs === null) {
    res.status(404).json({ message: 'User has no costs' })
    return
  }
  const gasMpgCalc = (totalDistance / req.body.mpg) * gasPrice

  const grossProfitCosts = ((costs.odc * revenue) + (costs.factor * revenue) + (costs.laborRate * revenue)
    + (costs.payrollTax * revenue) + (costs.dispatch * revenue) + gasMpgCalc + tolls)

  const operationProfitCosts = (details.tractor.insurance / 30) +
    (costs.tractorLease) + (costs.trailerLease) + (costs.gAndA * revenue) + costs.parking

  const netProfitCosts = (costs.repairs * totalDistance) + costs.loan

  const totalCost = grossProfitCosts + operationProfitCosts + netProfitCosts 

  const newJob = {
    start: details.start,
    pickUp: details.pickUp,
    dropOff: details.dropOff,
    date: details.startDate,
    revenue: revenue,
    grossProfitPercentage: (((revenue - grossProfitCosts) / revenue) * 100).toFixed(2),
    operatingProfitPercentage: (((revenue - (operationProfitCosts + grossProfitCosts)) / revenue) * 100).toFixed(2),
    netProfitPercentage: (((revenue - totalCost) / revenue) * 100).toFixed(2),
    distance: totalDistance.toFixed(2),
    user_id: req.user._id,
    gasCost: gasMpgCalc.toFixed(2),
    factor: (costs.factor * revenue).toFixed(2),
    gAndA: (costs.gAndA * revenue).toFixed(2),
    loan: (costs.loan).toFixed(2),
    odc: (costs.odc * revenue).toFixed(2),
    parking: costs.parking,
    repairs: (costs.repairs * totalDistance).toFixed(2),
    ratePerMile: (revenue / totalDistance).toFixed(2),
    labor: (costs.laborRate * revenue).toFixed(2),
    payrollTax: (costs.payrollTax * revenue).toFixed(2),
    netProfit: (revenue - totalCost).toFixed(2),
    grossProfit: (revenue - grossProfitCosts).toFixed(2),
    operatingProfit: (revenue - (operationProfitCosts + grossProfitCosts)).toFixed(2),
    insurance: costs.insurance,
    dispatch: (revenue * costs.dispatch).toFixed(2),
    laborRatePercent: costs.laborRate * 100,
    trailerLease: costs.trailerLease,
    tractorLease: costs.tractorLease,
    totalFixedCosts: (details.tractor.insurance / 30) + costs.tractorLease + costs.trailerLease
     + (costs.gAndA * revenue) + costs.parking,
    tolls: (tolls * 8).toFixed(2),
    client: details.client,
    driver: details.driver.name,
    admin: req.user.username,
    totalCost: totalCost,
    driveTime: duration,
    tractor: details.tractor.internalNum
  }

  res.status(200).json(newJob)
})

//////GET Routes
//Query costs associated with a user
//TODO: make it check the id of the costs obj and bring back the one associated to who signs in
router.post('/', auth, async (req, res) => {
  const costsData = await Costs.find({ belongsTo: req.user.username })
  res.status(200).json(costsData)
})

//Query costs and tractors associated with a user
router.post('/coststractors', auth, async (req, res) => {
  const costsData = await Costs.find({ belongsTo: req.user.username })
  const tractorData = await Tractor.find({ belongsTo: req.user.username })
  res.status(200).json({ costs: costsData, tractors: tractorData })
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
    const newCosts = await Costs.findOneAndUpdate({ belongsTo: req.body.username }, req.body, {
      returnOriginal: false
    })
    res.status(200).json(newCosts)
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router