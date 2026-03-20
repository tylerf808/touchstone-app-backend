const mongoose = require('mongoose')

const Schema = mongoose.Schema

const FuelPriceSchema = new Schema({
    prices: {
        type: Map,
        of: new Schema({
            currency: String,
            regular: String,
            midGrade: String,
            premium: String,
            diesel: String
        }, { _id: false }),
        required: true
    }
});

module.exports = mongoose.model("FuelPrice", FuelPriceSchema);