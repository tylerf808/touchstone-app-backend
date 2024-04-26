const mongoose = require('mongoose')

const Schema = mongoose.Schema

const tractorSchema = new Schema({

    belongsTo: {
        type: String,
        require: true
    },
    mpg: {
        type: Number,
        require: true
    },
    insurance: {
        type: Number,
        require: true
    },
    vin: {
        type: Number,
        required: true
    },
    internalNum: {
        type: Number,
        require: true
    },
    currentDriver: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
},
    {
        timestamps: true,
        versionKey: false
    }
)

const Tractor = mongoose.model('Tractor', tractorSchema)

module.exports = Tractor