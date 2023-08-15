const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const Schema = mongoose.Schema

const adminSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    users: {
        type: Array
    }
},
    {
        timestamps: true,
        versionKey: false
    }
)

adminSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('password')) {
        const saltRounds = 10
        this.password = await bcrypt.hash(this.password, saltRounds)
    }
    next()
})

adminSchema.methods.isCorrectPassword = async function (password) {
    return bcrypt.compare(password, this.password)
}

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;