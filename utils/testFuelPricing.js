require('dotenv').config();
const mongoose = require('mongoose');
const { fuelPricing } = require('./utils/helpers');

async function test() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/touchstone');
    console.log('Connected to MongoDB');
    
    // Run the function
    await fuelPricing();
    console.log('Fuel prices updated successfully!');
    
    // Disconnect
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

test();