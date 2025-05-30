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

// Route calculation endpoint
router.post('/calculate', auth, async (req, res) => {
  try {
    const { startAddress, pickupAddress, dropoffAddress, startDate, tractor, logistics } = req.body;

    // First, geocode the addresses to get coordinates
    const startPoint = await geocodeAddress(startAddress);
    const pickupPoint = await geocodeAddress(pickupAddress);
    const dropoffPoint = await geocodeAddress(dropoffAddress);

    console.log(logistics)

    const response = await axios.post(`https://atlas.microsoft.com/route/directions?api-version=2025-01-01&subscription-key=${AZURE_MAPS_KEY}`, {
      type: 'FeatureCollection',
      features: [
        {
          type: "Feature",
          geometry: {
            coordinates: startPoint,
            type: "Point"
          },
          properties: {
            pointIndex: 0,
            pointType: "waypoint"
          }
        },
        {
          type: "Feature",
          geometry: {
            coordinates: pickupPoint,
            type: "Point"
          },
          properties: {
            pointIndex: 1,
            pointType: "waypoint"
          }
        },
        {
          type: "Feature",
          geometry: {
            coordinates: dropoffPoint,
            type: "Point"
          },
          properties: {
            pointIndex: 2,
            pointType: "waypoint"
          }
        },
      ],
      optimizeRoute: "fastestWithTraffic",
      routeOutputOptions: [
        "routePath"
      ],
      maxRouteCount: 3,
      travelMode: "truck",
      vehicleSpecs: {
        height: (tractor.height.ft * 12 + tractor.height.in) / 39.37,
        width: (tractor.width.ft * 12 + tractor.width.in) / 39.37,
        weight: tractor.weight / 2.205,
        isVehicleCommercial: true,
        loadType: logistics.hazmat
      }, 
      departAt: startDate
    })

    res.status(200).json(response.data)
  } catch (error) {
    console.error('Route calculation error:', error.message);
    res.status(500).json({ error: 'Error calculating route', details: error.message });
  }
});

// Function to geocode an address
async function geocodeAddress(address) {
  try {
    const response = await axios.post(`https://atlas.microsoft.com/geocode:batch?api-version=2025-01-01&subscription-key=${AZURE_MAPS_KEY}`, {
      batchItems: [
        {
          addressLine: address
        }
      ]
    });
    return response.data.batchItems[0].features[0].geometry.coordinates;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error(`Error geocoding address: ${address}`);
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