const router = require('express').Router()
const Costs = require('../../models/Costs')
const Tractor = require('../../models/Tractor')
const auth = require('../../utils/auth')
const axios = require("axios");
require('dotenv').config();

const TOLL_GURU_KEY = process.env.TOLL_GURU_KEY;

// Route calculation endpoint
router.post('/calculate', auth, async (req, res) => {
  try {
    const { startAddress, pickupAddress, dropoffAddress, startDate, tractor, logistics } = req.body;

    const userCosts = await Costs.findOne({ belongsTo: req.user.username })
    const userTractor = await Tractor.findOne({ belongsTo: req.user.username, internalNum: tractor.internalNum })

    const payload = {
      from: {
        address: startAddress
      },
      to: {
        address: dropoffAddress
      },
      waypoints: [
        {
          address: pickupAddress
        }
      ],
      vehicleType: "5AxlesTruck",
      serviceProvider: "tollguru",
      getVehicleStops: true,
      optimizedWaypoints: true,
      vehicle: {
        height: { value: tractor.height.ft + (tractor.height.in / 12), unit: 'feet' },
        width: { value: tractor.width.ft + (tractor.width.in / 12), unit: 'feet' },
        weight: { value: tractor.weight, unit: 'pounds' }
      },
      truck: {
        shippedHazardousGoods: null
      }
    }

    if (logistics.hazmat) {
      payload.truck.shippedHazardousGoods = logistics.hazmat
    }

    const routeResponse = await axios.post('https://apis.tollguru.com/toll/v2/origin-destination-waypoints', payload, {
      headers: {
        "x-api-key": TOLL_GURU_KEY,
        'Content-Type': 'application/json'
      }
    });

    const routes = routeResponse.data.routes

    const cheapestRoute = routes.find(route => route.summary.diffs.cheapest === 0)
    const fastestRoute = routes.find(route => route.summary.diffs.fastest === 0)

    let selectedRoute

    if(logistics.fastest === true){
      selectedRoute = fastestRoute
    } else {
      selectedRoute = cheapestRoute
    }

    //Fixed
    const fixedCosts = {
      //Divide by average number of loads a month
      tractorLease: (tractor.tractorLease / userCosts.loadsPerMonth),
      trailerLease: (tractor.trailerLease / userCosts.loadsPerMonth),
      repairs: (userCosts.repairs / 100) * (selectedRoute.summary.distance.value / 1609.34),
      loan: (userCosts.loan / userCosts.loadsPerMonth),
      parking: (userCosts.parking / userCosts.loadsPerMonth),
      insurance: (userTractor.insurance / userCosts.loadsPerMonth)
    }

    //Operating
    const operatingCosts = {
      labor: parseFloat(logistics.revenue) * (userCosts.laborRate / 100),
      payrollTax: parseFloat(logistics.revenue) * (userCosts.payrollTax / 100),
      dispatch: parseFloat(logistics.revenue) * (userCosts.dispatch / 100),
      factor: parseFloat(logistics.revenue) * (userCosts.factor / 100),
      odc: parseFloat(logistics.revenue) * (userCosts.odc / 100),
      overhead: parseFloat(logistics.revenue) * (userCosts.overhead / 100),
    }

    const jobData = {
      start: startAddress,
      pickUp: pickupAddress,
      dropOff: dropoffAddress,
      date: startDate,
      revenue: parseFloat(logistics.revenue),
      distance: selectedRoute.summary.distance.value / 1609.34,
      driveTime: selectedRoute.summary.duration.text,
      client: logistics.client,
      driver: logistics.driver.name,
      admin: req.user.username,
      tractor: tractor.internalNum,
      tractorLease: fixedCosts.tractorLease,
      trailerLease: fixedCosts.trailerLease,
      repairs: (userCosts.repairs / 100) * (selectedRoute.summary.distance.value / 1609.34),
      loan: fixedCosts.loan,
      parking: fixedCosts.parking,
      labor: operatingCosts.labor,
      payrollTax: operatingCosts.payrollTax,
      dispatch: operatingCosts.dispatch,
      factor: operatingCosts.factor,
      odc: operatingCosts.odc,
      overhead: operatingCosts.overhead,
      gasCost: selectedRoute.costs.fuel,
      tolls: selectedRoute.costs.minimumTollCost,
      ratePerMile: logistics.revenue / (selectedRoute.summary.distance.value / 1609.34),
      laborRatePercent: userCosts.laborRate,
      insurance: fixedCosts.insurance
    }

    jobData.totalOperatingCost = Object.entries(operatingCosts)
      .reduce((sum, [_, value]) => sum + value, 0);

    jobData.totalFixedCost = Object.entries(fixedCosts)
      .reduce((sum, [_, value]) => sum + value, 0);

    jobData.grossProfit = parseFloat(logistics.revenue) - jobData.totalOperatingCost - jobData.tolls
    jobData.operatingProfit = jobData.grossProfit - jobData.totalOperatingCost

    jobData.grossProfitPercentage = ((jobData.grossProfit / parseFloat(logistics.revenue)) * 100).toFixed(2).toString() + '%'
    jobData.operatingProfitPercentage = ((jobData.operatingProfit / parseFloat(logistics.revenue)) * 100).toFixed(2).toString() + '%'

    jobData.totalCost = jobData.totalOperatingCost + jobData.totalFixedCost + jobData.tolls + jobData.gasCost

    jobData.netProfit = parseFloat(logistics.revenue) - jobData.totalCost

    jobData.netProfitPercentage = ((jobData.netProfit / parseFloat(logistics.revenue)) * 100).toFixed(2).toString() + '%'

    jobData.tollGuruResponse = routeResponse.data

    if (jobData.totalCost >= parseFloat(logistics.revenue)) {
      jobData.profitable = false
    } else {
      jobData.profitable = true
    }

    res.status(200).json(jobData);
  } catch (error) {
    console.error('Route calculation error:', error.message);
    res.status(500).json({ error: 'Error calculating route', details: error.message });
  }
});


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
router.post('/updateCosts', auth, async (req, res) => {
  try {
    const newCosts = await Costs.findOneAndUpdate({ belongsTo: req.user.username }, req.body, {
      returnOriginal: false
    })
    res.status(200).json(newCosts)
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router