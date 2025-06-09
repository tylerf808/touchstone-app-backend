const router = require('express').Router()
const Costs = require('../../models/Costs')
const Tractor = require('../../models/Tractor')
const { getDirections, getGasPrice, findRestStops, parseAddress } = require('../../utils/helpers')
const auth = require('../../utils/auth')
const axios = require("axios");
require('dotenv').config();
const jwt = require('jsonwebtoken')

// Azure Maps API key
const AZURE_MAPS_KEY = process.env.AZURE_MAPS_KEY;
const TOLL_GURU_KEY = process.env.TOLL_GURU_KEY;

// Route calculation endpoint
router.post('/calculate', auth, async (req, res) => {
  try {
    const { startAddress, pickupAddress, dropoffAddress, startDate, tractor, logistics } = req.body;

    const userCosts = await Costs.findOne({ belongsTo: req.user.username })

    const routeResponse = await axios.post('https://apis.tollguru.com/toll/v2/origin-destination-waypoints', {
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
      getPathPolygon: true,
      getVehicleStops: true,
      vehicle: {
        height: { value: tractor.height.ft + (tractor.height.in / 12), unit: 'feet' },
        width: { value: tractor.width.ft + (tractor.width.in / 12), unit: 'feet' },
        weight: { value: tractor.weight, unit: 'pounds' },
      }
    }, {
      headers: {
        "x-api-key": TOLL_GURU_KEY,
        'Content-Type': 'application/json'
      }
    });

    const routeDurationSeconds = routeResponse.data.routes[0].summary.duration.value; // duration in seconds
    const secondsInMonth = 30.44 * 24 * 60 * 60;

    const operatingCosts = {
      tractorLease: (userCosts.tractorLease / secondsInMonth) * routeDurationSeconds,
      trailerLease: (userCosts.trailerLease / secondsInMonth) * routeDurationSeconds,
      repairs: (userCosts.repairs / 100) * (routeResponse.data.routes[0].summary.distance.value / 1609.34),
      loan: (userCosts.loan / secondsInMonth) * routeDurationSeconds,
      parking: (userCosts.parking / secondsInMonth) * routeDurationSeconds,
      gAndA: (userCosts.gAndA / secondsInMonth) * routeDurationSeconds,
    }

    const fixedCosts = {
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
      distance: routeResponse.data.routes[0].summary.distance.value / 1609.34,
      driveTime: routeResponse.data.routes[0].summary.duration.text,
      client: logistics.client,
      driver: logistics.driver.username,
      admin: req.user.username,
      tractor: tractor.internalNum,
      tractorLease: (userCosts.tractorLease / secondsInMonth) * routeDurationSeconds,
      trailerLease: (userCosts.trailerLease / secondsInMonth) * routeDurationSeconds,
      repairs: (userCosts.repairs / 100) * (routeResponse.data.routes[0].summary.distance.value / 1609.34),
      loan: (userCosts.loan / secondsInMonth) * routeDurationSeconds,
      parking: (userCosts.parking / secondsInMonth) * routeDurationSeconds,
      gAndA: (userCosts.gAndA / secondsInMonth) * routeDurationSeconds,
      labor: parseFloat(logistics.revenue) * (userCosts.laborRate / 100),
      payrollTax: parseFloat(logistics.revenue) * (userCosts.payrollTax / 100),
      dispatch: parseFloat(logistics.revenue) * (userCosts.dispatch / 100),
      factor: parseFloat(logistics.revenue) * (userCosts.factor / 100),
      odc: parseFloat(logistics.revenue) * (userCosts.odc / 100),
      overhead: parseFloat(logistics.revenue) * (userCosts.overhead / 100),
      tolls: routeResponse.data.routes[0].costs.maximumTollCost,
      gasCost: routeResponse.data.routes[0].costs.fuel
    }

    jobData.totalOperatingCost = Object.entries(operatingCosts)
      .reduce((sum, [_, value]) => sum + value, 0);

    jobData.totalFixedCost = Object.entries(fixedCosts)
      .reduce((sum, [_, value]) => sum + value, 0);

    jobData.operatingProfit = parseFloat(logistics.revenue) - jobData.totalOperatingCost
    jobData.grossProfit = parseFloat(logistics.revenue) - jobData.totalOperatingCost - jobData.totalFixedCost

    jobData.grossProfitPercentage = (((parseFloat(logistics.revenue) - jobData.totalFixedCost) / parseFloat(logistics.revenue)) * 100).toFixed(2).toString() + '%'
    jobData.operatingProfitPercentage = (((parseFloat(logistics.revenue) - jobData.totalOperatingCost - jobData.totalFixedCost) / parseFloat(logistics.revenue)) * 100).toFixed(2).toString() + '%'

    jobData.totalCost = jobData.totalOperatingCost + jobData.totalFixedCost + jobData.tolls + jobData.gasCost

    jobData.netProfit = parseFloat(logistics.revenue) - jobData.totalCost

    jobData.netProfitPercentage = ((jobData.netProfit / parseFloat(logistics.revenue)) * 100).toFixed(2).toString() + '%'

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

// Function to geocode an address
async function geocodeAddress(address) {
  try {
    // Add countrySet parameter to limit search to US
    const encodedAddress = encodeURIComponent(address);
    const url = `https://atlas.microsoft.com/search/address/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&query=${encodedAddress}&countrySet=US`;

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.data.results || response.data.results.length === 0) {
      throw new Error(`No results found for address: ${address}`);
    }

    // Log the response data for debugging
    console.log('Geocoding response:', response.data.results[0]);

    // Check if we have valid coordinates
    const coordinates = response.data.results[0].position;
    if (!coordinates || !coordinates.lat || !coordinates.lon) {
      throw new Error(`Invalid coordinates returned for address: ${address}`);
    }

    return [coordinates.lon, coordinates.lat]; // Return in [lon, lat] format
  } catch (error) {
    console.error('Geocoding error:', {
      address,
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Error geocoding address: ${address}. Error: ${error.message}`);
  }
}

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