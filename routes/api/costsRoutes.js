const router = require('express').Router()
const Costs = require('../../models/Costs')
const Tractor = require('../../models/Tractor')
const { getDirections, getGasPrice, findRestStops, parseAddress } = require('../../utils/helpers')
const auth = require('../../utils/auth')
const axios = require("axios");

const jwt = require('jsonwebtoken')

router.post('/check', auth, async (req, res) => {

  try {

    const revenue = req.body.revenue

    const startObj = parseAddress(req.body.start)
    const pickUpObj = parseAddress(req.body.pickUp)
    const dropOffObj = parseAddress(req.body.dropOff)

    const routeResponse = await axios.post('https://pcmiler.alk.com/apis/rest/v1.0/Service.svc/route/routeReports?dataset=Current', {
      ReportRoutes: [{
        Stops: [{
          Address: startObj
        },
        {
          Address: pickUpObj
        },
        {
          Address: dropOffObj
        }],
        ReportTypes: [
          {
            __type: "MileageReportType:http://pcmiler.alk.com/APIs/v1.0",
            TimeInSeconds: true
          }
        ]
      }]
    }, {
      headers: {
        'Authorization': process.env.TRIMBLE_API_KEY
      }
    }).then((response) => { return response.data })

    


    // Get rest stops along the route using Places API

    // const restStops = await findRestStops(route.overview_path);

    // const gasPrice = await getGasPrice(req.body.states[0], req.body.states[1], req.body.states[2]).toFixed(2)

    const tolls = routeResponse[0].ReportLines[2].TTolls
    const duration = routeResponse[0].ReportLines[2].THours

    const costs = await Costs.findOne({ belongsTo: req.user.username })
    const tractor = await Tractor.findOne({ belongsTo: req.user.username, internalNum: req.body.tractor })

    if (tractor === null) {
      res.status(404).json({ message: 'No tractor' })
      return
    }
    const totalDistance = parseFloat(routeResponse[0].ReportLines[2].TMiles)

    const gasMpgCalc = ((parseFloat(routeResponse[0].ReportLines[2].TMiles)) / tractor.mpg) * 3.66

    const grossProfitCosts = ((costs.odc * revenue) + (costs.factor * revenue) + (costs.laborRate * revenue)
      + (costs.payrollTax * revenue) + (costs.dispatch * revenue) + gasMpgCalc + parseFloat(tolls))

    const operationProfitCosts = (tractor.insurance / 30) +
      (costs.tractorLease) + (costs.trailerLease) + (costs.gAndA * revenue) + costs.parking

    const netProfitCosts = (costs.repairs * routeResponse[0].ReportLines[2].TMiles) + costs.loan

    const totalCost = (grossProfitCosts + operationProfitCosts + netProfitCosts).toFixed(2)

    let profitable

    if (revenue - totalCost > 0) {
      profitable = true
    } else {
      profitable = false
    }

    const newJob = {
      profitable: profitable,
      start: req.body.start,
      pickUp: req.body.pickUp,
      dropOff: req.body.dropOff,
      date: req.body.startDate,
      revenue: revenue,
      grossProfitPercentage: (((revenue - grossProfitCosts) / revenue) * 100).toFixed(2),
      operatingProfitPercentage: (((revenue - (operationProfitCosts + grossProfitCosts)) / revenue) * 100).toFixed(2),
      netProfitPercentage: (((revenue - totalCost) / revenue) * 100).toFixed(2),
      distance: totalDistance,
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
      insurance: tractor.insurance / 30,
      dispatch: (revenue * costs.dispatch).toFixed(2),
      laborRatePercent: costs.laborRate * 100,
      trailerLease: costs.trailerLease,
      tractorLease: costs.tractorLease,
      totalFixedCosts: ((tractor.insurance / 30) + costs.tractorLease + costs.trailerLease
        + (costs.gAndA * revenue) + costs.parking).toFixed(2),
      tolls: tolls,
      client: req.body.client,
      driver: req.body.driver,
      admin: req.user.username,
      totalCost: totalCost,
      driveTime: duration,
      tractor: tractor.internalNum
    }

    res.status(200).json(newJob)

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error })
  }
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