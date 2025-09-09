const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const jobSchema = new Schema({
    // Basic job details
    start: { type: String, required: true },
    pickUp: { type: String, required: true },
    dropOff: { type: String, required: true },
    date: { type: String, required: true },

    // Financial details
    ratePerMile: {type: Number, required: true},
    revenue: { type: Number, required: true },
    grossProfitPercentage: { type: String, required: true },
    operatingProfitPercentage: { type: String, required: true },
    netProfitPercentage: { type: String, required: true },
    totalCost: { type: Number, required: true },
    gasCost: { type: Number, required: true },
    ratePerMile: { type: Number, required: true },
    factor: { type: Number, required: true },
    overhead: { type: Number, required: true },
    loan: { type: Number, required: true },
    odc: { type: Number, required: true },
    repairs: { type: Number, required: true },
    depreciation: { type: Number, required: true },
    labor: { type: Number, required: true },
    dispatch: { type: Number, required: true },
    payrollTax: { type: Number, required: true },
    netProfit: { type: Number, required: true },
    laborRatePercent: { type: String, required: true },
    insurance: { type: Number, required: true },
    trailerLease: { type: Number, required: true },
    tractorLease: { type: Number, required: true },
    tolls: { type: Number, required: true },
    grossProfit: { type: Number, required: true },
    operatingProfit: { type: Number, required: true },
    totalFixedCost: { type: Number, required: true },
    totalDirectCosts: { type: Number, required: true},

    // Other details
    distance: { type: Number, required: true },
    driveTime: { type: String, required: true },
    client: { type: String, required: true },

    // References to other entities
    driver: { type: String, required: true },
    admin: { type: String, required: true },
    tractor: { type: Number, required: true }
}, {
    timestamps: true,
    versionKey: false
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;