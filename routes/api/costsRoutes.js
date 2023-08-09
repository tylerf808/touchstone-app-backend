const router = require('express').Router()
const Costs = require('../../models/Costs')
const {getDirections, getGasPrice} = require('../../utils/helpers')

router.get('/check', async (req, res) => {
  const directionsRes = await getDirections(req.query.start, req.query.pick_up, req.query.drop_off)
  const gasPrice = await getGasPrice(req.query.state1, req.query.state2, req.query.state3)
  let tolls = (directionsRes.routes[0]?.travelAdvisory?.tollInfo?.estimatedPrice[0]?.units)
  const duration = (directionsRes.routes[0].duration)
  if(tolls === undefined){
    tolls = 0
  }
  const totalDistance = (directionsRes.routes[0].distanceMeters) / 1609.34
  const costs = await Costs.findOne({
    where: {
      manager_id: req.query.id
    }
  })
  
  if(costs === null){
    res.status(404).json({message: 'User has no costs'})
    return
  }
  const gasMpgCalc = (totalDistance / costs.dataValues.mpg) * gasPrice

  res.status(200).json({
    distance: parseFloat(totalDistance.toFixed(2)),
    gasCost: parseFloat(gasMpgCalc.toFixed(2)),
    laborRate: costs.dataValues.laborRate,
    payrollTax: costs.dataValues.payrollTax,
    dispatch: costs.dataValues.dispatch,
    insurance: costs.dataValues.insurance,
    tractorLease: costs.dataValues.tractorLease,
    trailerLease: costs.dataValues.trailerLease,
    factor: costs.dataValues.factor,
    odc: costs.dataValues.odc,
    gAndA: costs.dataValues.gAndA,
    loan: costs.dataValues.loan,
    rental: costs.dataValues.rental,
    repairs: costs.dataValues.repairs,
    depreciation: costs.dataValues.depreciation,
    costs_id: costs.dataValues.costs_id,
    tolls: tolls,
    duration: duration
  })
})

//////GET Routes
//Query costs associated with a user
//TODO: make it check the id of the costs obj and bring back the one associated to who signs in
router.get('/', async (req, res) => {
  try {
    const costsData = await Costs.findAll({
      where: {
        manager_id: req.query.id
      }
    })
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
    const costsData = await Costs.update(req.body, {
      where: {
        manager_id: req.query.id,
      },
    })
    res.status(200).json(costsData)
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router