const mongoose = require('mongoose')
require('dotenv').config()

let uriString

if(process.env.ENVIROMENT === 'development'){
    uriString = process.env.MONGODB_DEVELOPMENT_URI
} else {
    uriString = process.env.MONGODB_TEST_URI
}

mongoose.connect(uriString)

module.exports = mongoose.connection