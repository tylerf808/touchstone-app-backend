const { MongoClient } = require('mongodb')
const mongoose = require('mongoose')
require('dotenv').config()

if(process.env.ENVIRONMENT === 'development'){
    mongoose.connect(process.env.MONGODB_DEVELOPMENT_URI)
} else {
    mongoose.connect(process.env.MONGODB_TEST_URI)
}

module.exports = mongoose.connection