const mongoose = require('mongoose')

const Schema = mongoose.Schema

const costsSchema = new Schema({

    belongsTo: {
        type: String,
    },
    laborRate: {
        type: Number
    },
    payrollTax: {
        type: Number
    },
    dispatch: {
        type: Number
    },
    factor: {
        type: Number
    },
    odc: {
        type: Number
    },
    tractorLease: {
        type: Number
    },
    trailerLease: {
        type: Number
    },
    loan: {
        type: Number
    },
    repairs: {
        type: Number
    },
    mpg: {
        type: Number
    },
    overhead: {
        type: Number
    },
    parking: {
        type: Number
    }
},
    {
        timestamps: true,
        versionKey: false
    }
)

const Costs = mongoose.model('Costs', costsSchema)

module.exports = Costs