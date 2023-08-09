const mongoose = require('mongoose')

const Schema = mongoose.Schema

const jobSchema = new Schema({

  start: {
    type: String,
  },
  pickUp: {
    type: String,
  },
  dropOff: {
    type: String,
  },
  revenue: {
    type: Number,
  },
  grossProfitPercentage: {
    type: String,
  },
  operatingProfitPercentage: {
    type: String
  },
  netProfitPercentage: {
    type: String
  },
  distance: {
    type: Number,
  },
  date: {
    type: String,
  },
  gasCost: {
    type: Number,
  },
  ratePerMile: {
    type: Number
  },
  depreciation: {
    type: Number,
  },
  factor: {
    type: Number,
  },
  gAndA: {
    type: Number,
  },
  loan: {
    type: Number,
  },
  odc: {
    type: Number,
  },
  repairs: {
    type: Number,
  },
  labor: {
    type: Number
  },
  dispatch: {
    type: Number
  },
  payrollTax: {
    type: Number
  },
  netProfit: {
    type: Number
  },
  laborRatePercent: {
    type: String
  },
  insurance: {
    type: Number
  },
  trailer: {
    type: Number
  },
  tractor: {
    type: Number
  },
  tolls: {
    type: Number
  },
  grossProfit: {
    type: Number
  },
  operatingProfit: {
    type: Number
  },
  totalFixedCost: {
    type: Number
  },
  driveTime: {
    type: String
  },
  client: {
    type: String
  },
  driver: {
    type: String
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
