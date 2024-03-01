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
    require: true
  }
},
  {
    timestamps: true,
    versionKey: false
  }
)

const Job = mongoose.model('Job', jobSchema)

module.exports = Job


// Job.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     start: {
//       type: DataTypes.STRING,
//     },
//     pickUp: {
//       type: DataTypes.STRING,
//     },
//     dropOff: {
//       type: DataTypes.STRING,
//     },
//     revenue: {
//       type: DataTypes.DOUBLE,
//     },
//     grossProfitPercentage: {
//       type: DataTypes.STRING,
//     },
//     operatingProfitPercentage: {
//       type: DataTypes.STRING
//     },
//     netProfitPercentage: {
//       type: DataTypes.STRING
//     },
//     distance: {
//       type: DataTypes.DOUBLE,
//     },
//     date: {
//       type: DataTypes.STRING,
//     },
//     gasCost: {
//       type: DataTypes.DOUBLE,
//     },
//     ratePerMile: {
//       type: DataTypes.DOUBLE
//     },
//     depreciation: {
//       type: DataTypes.DOUBLE,
//     },
//     factor: {
//       type: DataTypes.DOUBLE,
//     },
//     gAndA: {
//       type: DataTypes.DOUBLE,
//     },
//     loan: {
//       type: DataTypes.DOUBLE,
//     },
//     odc: {
//       type: DataTypes.DOUBLE,
//     },
//     repairs: {
//       type: DataTypes.DOUBLE,
//     },
//     labor: {
//       type: DataTypes.DOUBLE
//     },
//     dispatch: {
//       type: DataTypes.DOUBLE
//     },
//     payrollTax: {
//       type: DataTypes.DOUBLE
//     },
//     netProfit: {
//       type: DataTypes.DOUBLE
//     },
//     laborRatePercent: {
//       type: DataTypes.STRING
//     },
//     insurance: {
//       type: DataTypes.DOUBLE
//     },
//     trailer: {
//       type: DataTypes.DOUBLE
//     },
//     tractor: {
//       type: DataTypes.DOUBLE
//     },
//     tolls: {
//       type: DataTypes.DOUBLE
//     },
//     grossProfit: {
//       type: DataTypes.DOUBLE
//     },
//     operatingProfit: {
//       type: DataTypes.DOUBLE
//     },
//     totalFixedCost: {
//       type: DataTypes.DOUBLE
//     },
//     driveTime: {
//       type: DataTypes.STRING
//     },
//     client: {
//       type: DataTypes.STRING
//     },
//     driver: {
//       type: DataTypes.STRING
//     },
//     manager: {
//       type: DataTypes.INTEGER,
//       references: {
//         model: "manager",
//         key: "manager_id"
//       }
//     },
//   },
//   {
//     sequelize,
//     timestamps: false,
//     freezeTableName: true,
//     underscored: true,
//     modelName: "job",
//   }
// );
