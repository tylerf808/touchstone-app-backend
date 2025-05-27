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

// Function to calculate route between points
async function calculateRoute(startPoint, pickupPoint, dropoffPoint, truckDetails) {
  try {
    // Create query parameters for truck routing
    const params = {
      'api-version': '1.0',
      'subscription-key': AZURE_MAPS_KEY,
      'query': `${startPoint.latitude},${startPoint.longitude}:${pickupPoint.latitude},${pickupPoint.longitude}:${dropoffPoint.latitude},${dropoffPoint.longitude}`,
      'travelMode': 'truck',
      'routeType': 'fastest',
      'traffic': 'true',
      'computeTravelTimeFor': 'all'
    };

    // Add truck details if provided
    if (truckDetails) {
      if (truckDetails.vehicleWidth) params.vehicleWidth = truckDetails.vehicleWidth;
      if (truckDetails.vehicleHeight) params.vehicleHeight = truckDetails.vehicleHeight;
      if (truckDetails.vehicleLength) params.vehicleLength = truckDetails.vehicleLength;
      if (truckDetails.vehicleWeight) params.vehicleWeight = truckDetails.vehicleWeight;
      if (truckDetails.vehicleAxleWeight) params.vehicleAxleWeight = truckDetails.vehicleAxleWeight;
      if (truckDetails.vehicleMaxSpeed) params.vehicleMaxSpeed = truckDetails.vehicleMaxSpeed;
    }

    const response = await axios.get('https://atlas.microsoft.com/route/directions/json', { params });

    if (!response.data || !response.data.routes || response.data.routes.length === 0) {
      throw new Error('No route found for the provided addresses');
    }

    return response.data;
  } catch (error) {
    console.error('Route calculation error:', error);
    throw new Error('Error calculating truck route');
  }
}

// Function to process and format route data
function processRouteData(routeData) {
  const route = routeData.routes[0];

  // Calculate route information
  let totalDistanceInMeters = 0;
  let totalTimeInSeconds = 0;
  let totalTrafficDelayInSeconds = 0;

  route.legs.forEach(leg => {
    totalDistanceInMeters += leg.summary.lengthInMeters;
    totalTimeInSeconds += leg.summary.travelTimeInSeconds;
    // Add traffic delay if available
    if (leg.summary.trafficDelayInSeconds) {
      totalTrafficDelayInSeconds += leg.summary.trafficDelayInSeconds;
    }
  });

  const distanceInKm = (totalDistanceInMeters / 1000).toFixed(2);
  const distanceInMiles = (totalDistanceInMeters / 1609.344).toFixed(2);
  const timeInHours = Math.floor(totalTimeInSeconds / 3600);
  const timeInMinutes = Math.floor((totalTimeInSeconds % 3600) / 60);
  const trafficDelayInMinutes = Math.floor(totalTrafficDelayInSeconds / 60);

  // Calculate additional metrics
  const fuelConsumption = estimateFuelConsumption(totalDistanceInMeters);
  const co2Emissions = estimateCO2Emissions(totalDistanceInMeters);

  // Extract route point coordinates for frontend rendering if needed
  const routePoints = [];
  route.legs.forEach(leg => {
    leg.points.forEach(point => {
      routePoints.push([point.longitude, point.latitude]);
    });
  });

  return {
    distanceKm: distanceInKm,
    distanceMiles: distanceInMiles,
    hours: timeInHours,
    minutes: timeInMinutes,
    trafficDelay: trafficDelayInMinutes,
    fuelConsumption: fuelConsumption,
    co2Emissions: co2Emissions,
    route: routeData,
    points: routePoints
  };
}

// Helper function to estimate fuel consumption (gallons for US)
function estimateFuelConsumption(distanceInMeters) {
  // Average truck fuel consumption: ~6 mpg
  const gallonsPerMile = 1 / 6;
  const distanceInMiles = distanceInMeters / 1609.344;
  return (distanceInMiles * gallonsPerMile).toFixed(2);
}

// Helper function to estimate CO2 emissions
function estimateCO2Emissions(distanceInMeters) {
  // Average truck CO2 emissions: ~1.7 kg per mile
  const kgCO2PerMile = 1.7;
  const distanceInMiles = distanceInMeters / 1609.344;
  return (distanceInMiles * kgCO2PerMile).toFixed(2);
}

module.exports = router;

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
      totalFixedCost: ((tractor.insurance / 30) + costs.tractorLease + costs.trailerLease
        + (costs.gAndA * revenue) + costs.parking).toFixed(2),
      tolls: tolls,
      client: req.body.client,
      driver: req.body.driver,
      admin: req.user.username,
      totalCost: totalCost,
      driveTime: duration,
      tractor: tractor.internalNum
    }

    res.status(200).json([newJob, routeResponse])

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error })
  }
})


router.post('/checkRoute', async (req, res) => {
  try {

    const url = `https://atlas.microsoft.com/route/directions?api-version=2025-01-01&subscription-key=${process.env.AZURE_MAPS_KEY}`
    const response = await axios.post(url, {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            coordinates: [
              -122.201399,
              47.608678
            ],
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
            coordinates: [
              -122.20687,
              47.612002
            ],
            type: "Point"
          },
          properties: {
            pointIndex: 1,
            pointType: "viaWaypoint"
          }
        },
        {
          type: "Feature",
          geometry: {
            coordinates: [
              -122.201669,
              47.615076
            ],
            type: "Point"
          },
          properties: {
            pointIndex: 2,
            pointType: "waypoint"
          }
        }
      ],
      optimizedRoute: "fastestWithTraffic",
      routeOutputOptions: [
        "routePath"
      ],
      maxRouteCount: 3,
      travelMode: "driving"
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json(response.data);
  } catch (err) {
    console.error("Azure error:", err.response?.data || err.message);
    res.status(500).json({
      message: "Azure request failed",
      error: err.response?.data || err.message,
    });
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