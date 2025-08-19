const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {
        type: String,
        unique: true,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    admin: {
        type: String,
    },
    accountType: {
        type: String,
        required: true
    },
    isAvailable: {
        type: Boolean
    },
    company: {
        type: String
    }
},
    {
        timestamps: true,
        versionKey: false
    }
)

userSchema.pre("save", async function (next) {
    if (this.isModified("password") && this.password) {
        try {
            const saltRounds = 10;
            this.password = await bcrypt.hash(this.password, saltRounds);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

userSchema.methods.isCorrectPassword = async function (password) {
    return bcrypt.compare(password, this.password)
}

const User = mongoose.model('User', userSchema)

module.exports = User