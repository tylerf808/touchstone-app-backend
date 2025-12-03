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
        type: String,
        required: true
    },
    internalNum: {
        type: Number,
        require: true
    },
    tractorLease: {
        type: Number,
        require: true
    },
    trailerLease: {
        type: Number,
        require: true
    },
    depreciation: {
        type: Number,
        require: true
    },
    height: {
        ft: {
            type: Number,
            require: true
        },
        in: {
            type: Number,
            require: true
        }
    },
    width: {
        ft: {
            type: Number,
            require: true
        },
        in: {
            type: Number,
            require: true
        }
    },
    weight: {
        type: Number,
        require: true
    },
    currentDriver: {
        type: String,
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