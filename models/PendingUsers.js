const mongoose = require('mongoose')

const Schema = mongoose.Schema

const pendingUserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    admin: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        required: true
    },
    confirmationCode: {
        type: String,
        required: true
    },
    expirationTime: {
        type: Date,
        required: true
    }
},
    {
        timestamps: true,
        versionKey: false
    }
)

const PendingUser = mongoose.model('PendingUser', pendingUserSchema)

module.exports = PendingUser