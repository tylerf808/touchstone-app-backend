require('dotenv').config();
const mongoose = require('mongoose');
const { fuelPricing } = require('./utils/helpers');
const FuelPrice = require('./models/FuelPrice');

async function test() {
  try {
    // Connect to MongoDB using the right URI
    const mongoUri = process.env.ENVIRONMENT === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_DEVELOPMENT_URI;
    
    console.log('Connecting to:', mongoUri.split('@')[1].split('?')[0]);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    console.log('API Key:', process.env.COLLECT_API_KEY ? 'Present' : 'Missing');
    
    // Run the function
    await fuelPricing();
    console.log('Fuel prices updated successfully!');
    
    // Verify data was saved
    const savedData = await FuelPrice.findOne({});
    if (savedData) {
      console.log('Data found in DB. Number of price entries:', savedData.prices.length);
      console.log('First entry:', savedData.prices[0]);
    } else {
      console.log('NO DATA FOUND IN DATABASE');
    }
    
    // Disconnect
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

test();
