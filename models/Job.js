const mongoose = require('mongoose')

const Schema = mongoose.Schema

const jobSchema = new Schema({

  start: {
    type: String,
    required: true
  },
  pickUp: {
    type: String,
    required: true
  },
  dropOff: {
    type: String,
    required: true
  },
  revenue: {
    type: Number,
    required: true
  },
  grossProfitPercentage: {
    type: String,
    required: true
  },
  operatingProfitPercentage: {
    type: String,
    required: true
  },
  netProfitPercentage: {
    type: String,
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  gasCost: {
    type: Number,
    required: true
  },
  ratePerMile: {
    type: Number,
    required: true
  },
  factor: {
    type: Number,
    required: true
  },
  gAndA: {
    type: Number,
    required: true
  },
  loan: {
    type: Number,
    required: true
  },
  odc: {
    type: Number,
    required: true
  },
  repairs: {
    type: Number,
    required: true
  },
  labor: {
    type: Number,
    required: true
  },
  dispatch: {
    type: Number,
    required: true
  },
  payrollTax: {
    type: Number,
    required: true
  },
  netProfit: {
    type: Number,
    required: true
  },
  laborRatePercent: {
    type: String,
    required: true
  },
  insurance: {
    type: Number,
    required: true
  },
  trailer: {
    type: Number,
    required: true
  },
  tractor: {
    type: Number,
    required: true
  },
  tolls: {
    type: Number,
    required: true
  },
  grossProfit: {
    type: Number,
    required: true
  },
  operatingProfit: {
    type: Number,
    required: true
  },
  totalFixedCost: {
    type: Number,
    required: true
  },
  driveTime: {
    type: String,
    required: true
  },
  client: {
    type: String,
    required: true
  },
  driver: {
    type: String,
    required: true
  },
  admin: {
    type: String,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  }
},
  {
    timestamps: true,
    versionKey: false
  }
)

const Job = mongoose.model('Job', jobSchema)

module.exports = Job