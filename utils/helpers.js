const axios = require("axios");


const routeCallConfig = {
  headers: {
    "X-Goog-FieldMask": "routes.distanceMeters,routes.travelAdvisory,routes.duration",
  },
};

const url =
  " https://routes.googleapis.com/directions/v2:computeRoutes?key=AIzaSyDcXIOrxmAOOPEvqjLEXVeZb9mdTyUqS6k";


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
    const { data } = await axios.get('https://gasprices.aaa.com/');
    const $ = cheerio.load(data);

    // Select the first row of the table with class 'table-mob'
    const firstRow = $('table.table-mob tbody tr').first();
    
    // The fifth td (index 4) is the national average diesel price
    const dieselPrice = firstRow.find('td').eq(4).text().trim();

    if (!dieselPrice) throw new Error('Diesel price not found');
    return parseFloat(dieselPrice.replace(/[^0-9.]/g, ''));
  } catch (err) {
    console.error('Error scraping diesel price:', err.message);
    return null;
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

module.exports = { getDirections, findRestStops, parseAddress };