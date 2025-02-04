const axios = require("axios");

const routeCallConfig = {
  headers: {
    "X-Goog-FieldMask": "routes.distanceMeters,routes.travelAdvisory,routes.duration",
  },
};

const url =
  " https://routes.googleapis.com/directions/v2:computeRoutes?key=AIzaSyDcXIOrxmAOOPEvqjLEXVeZb9mdTyUqS6k";

const getGasPrice = async (state1, state2, state3) => {
  const state1Res = await axios
    .get("https://api.collectapi.com/gasPrice/stateUsaPrice?state=" + state1, {
      headers: {
        authorization: "apikey 4JZ6EJzzWJ3XEE2535zUXd:0YB2BIARDg8MctdIkdOhqd",
      },
    })
    .then((response) => {
      return response.data;
    });
  const state2Res = await axios
    .get("https://api.collectapi.com/gasPrice/stateUsaPrice?state=" + state2, {
      headers: {
        authorization: "apikey 4JZ6EJzzWJ3XEE2535zUXd:0YB2BIARDg8MctdIkdOhqd",
      },
    })
    .then((response) => {
      return response.data;
    });
  const state3Res = await axios
    .get("https://api.collectapi.com/gasPrice/stateUsaPrice?state=" + state3, {
      headers: {
        authorization: "apikey 4JZ6EJzzWJ3XEE2535zUXd:0YB2BIARDg8MctdIkdOhqd",
      },
    })
    .then((response) => {
      return response.data;
    });
  const aveGasPrice =
    (parseFloat(state1Res.result.state.diesel) +
    parseFloat(state2Res.result.state.diesel) +
    parseFloat(state3Res.result.state.diesel))/3;
  return aveGasPrice;
};

const getDirections = async (start, pickUp, dropOff) => {
  const directionsResObj = await axios.post(url, {
    origin: {address: start},
    destination: {address: dropOff},
    intermediates: [
      {
        address: pickUp
      }
    ],
    extraComputations: ["TOLLS"]
  }, routeCallConfig).then((response) => {
    return response.data;
  });
  return directionsResObj;
};

async function findRestStops(routePath) {
  try {
      // Sample points along the route to search for rest stops
      const searchPoints = sampleRoutePoints(routePath, 50); // Every 50km

      const restStops = [];
      for (const point of searchPoints) {
          const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
              params: {
                  location: `${point.lat},${point.lng}`,
                  radius: 5000, // 5km radius
                  type: 'parking',
                  keyword: 'truck rest stop',
                  key: process.env.GOOGLE_MAPS_API_KEY
              }
          });

          restStops.push(...response.data.results);
      }
      
      return restStops;
  } catch (error) {
      console.error('Error finding rest stops:', error);
      return [];
  }
}

// Helper function to sample points along the route
function sampleRoutePoints(routePath, intervalKm) {
  const points = [];
  let distanceCovered = 0;
  
  // Calculate distance between two lat/lng points in kilometers
  function calculateDistance(point1, point2) {
      const R = 6371; // Earth's radius in kilometers
      const lat1 = point1.lat * Math.PI / 180;
      const lat2 = point2.lat * Math.PI / 180;
      const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
      const deltaLng = (point2.lng - point1.lng) * Math.PI / 180;

      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
  }

  // Add first point
  points.push(routePath[0]);

  // Sample points based on actual distance along route
  for (let i = 1; i < routePath.length; i++) {
      const distance = calculateDistance(routePath[i-1], routePath[i]);
      distanceCovered += distance;

      if (distanceCovered >= intervalKm) {
          points.push(routePath[i]);
          distanceCovered = 0; // Reset distance counter
      }
  }

  // Always include last point if it's not already included
  if (points[points.length - 1] !== routePath[routePath.length - 1]) {
      points.push(routePath[routePath.length - 1]);
  }

  return points;
}

function parseAddress(addressString) {
  // Remove extra spaces and split by commas
  const parts = addressString.trim().split(',').map(part => part.trim());
  
  let streetAddress, city, state;
  
  if (parts.length >= 3) {
    // Format: "123 Main St, New York, NY"
    streetAddress = parts[0];
    city = parts[1];
    state = parts[2];
  } else if (parts.length === 2) {
    // Format: "123 Main St, New York NY"
    streetAddress = parts[0];
    // Split last part by space to separate city and state
    const cityState = parts[1].trim().split(' ');
    state = cityState.pop(); // Get last word as state
    city = cityState.join(' '); // Remaining words are city
  } else {
    // Try to parse single string format: "123 Main St New York NY"
    const words = parts[0].split(' ');
    state = words.pop(); // Last word is state
    city = words.pop(); // Second to last word is city
    streetAddress = words.join(' '); // Remaining is street address
  }
  
  return {
    StreetAddress: streetAddress || '',
    City: city || '',
    State: state || ''
  };
}

module.exports = { getGasPrice, getDirections, findRestStops, parseAddress };