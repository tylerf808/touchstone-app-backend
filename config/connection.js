const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://tylerf:Rjmmpxg8!@cluster0.rgqhr88.mongodb.net/?retryWrites=true&w=majority")

module.exports = mongoose.connection