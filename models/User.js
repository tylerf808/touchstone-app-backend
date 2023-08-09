const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
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
    accountType: {
        type: String,
        required: true
    }
},
    {
        timestamps: true,
        versionKey: false
    }
)

userSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('password')) {
        const saltRounds = 10
        this.password = await bcrypt.hash(this.password, saltRounds)
    }
    next()
})

userSchema.methods.isCorrectPassword = async function (password) {
    return bcrypt.compare(password, this.password)
}

const User = model('User', userSchema);

module.exports = User;