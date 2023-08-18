const router = require('express').Router()
const Costs = require('../../models/Costs')
const {getDirections, getGasPrice} = require('../../utils/helpers')

router.post('/check', async (req, res) => {
  const directionsRes = await getDirections(req.body.start, req.body.pick_up, req.body.drop_off)
  const gasPrice = await getGasPrice(req.body.state1, req.body.state2, req.body.state3)
  let tolls = (directionsRes.routes[0]?.travelAdvisory?.tollInfo?.estimatedPrice[0]?.units)
  const duration = (directionsRes.routes[0].duration)
  if(tolls === undefined){
    tolls = 0
  }
  const totalDistance = (directionsRes.routes[0].distanceMeters) / 1609.34

  const costs = await Costs.findOne({ belongsTo: req.body.username})
  
  if(costs === null){
    res.status(404).json({message: 'User has no costs'})
    return
  }
  const gasMpgCalc = (totalDistance / costs.dataValues.mpg) * gasPrice

  res.status(200).json({
    distance: parseFloat(totalDistance.toFixed(2)),
    gasCost: parseFloat(gasMpgCalc.toFixed(2)),
    laborRate: costs.laborRate,
    payrollTax: costs.payrollTax,
    dispatch: costs.dispatch,
    insurance: costs.insurance,
    tractorLease: costs.tractorLease,
    trailerLease: costs.trailerLease,
    factor: costs.factor,
    odc: costs.odc,
    gAndA: costs.gAndA,
    loan: costs.loan,
    rental: costs.rental,
    repairs: costs.repairs,
    depreciation: costs.depreciation,
    costs_id: costs.costs_id,
    tolls: tolls,
    duration: duration
  })
})

//////GET Routes
//Query costs associated with a user
//TODO: make it check the id of the costs obj and bring back the one associated to who signs in
router.post('/', async (req, res) => {
  try {
    const costsData = await Costs.find({ belongsTo: req.body.username})
    res.status(200).json(costsData)
  } catch (error) {
    res.status(404).json(error)
  }
})

//////POST Routes
//Add new costs obj
router.post('/', async (req, res) => {
  await Costs.create(req.body)
    .then((newCosts) => {
      res.json(newCosts)
    })
    .catch((err) => {
      res.json(err)
    })
})

//Update costs
router.put('/', async (req, res) => {
  try {
    await Costs.findOneAndDelete({belongsTo: req.body.username})
    const costsData = Costs.create(req.body)
    res.status(200).json(costsData)
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router