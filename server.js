const express = require('express')
const routes = require('./routes')
const db = require('./config/connection')
const cors = require('cors')
require('dotenv').config()

const PORT = process.env.PORT || 8080
const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(cors())

app.use('/', express.static(__dirname + 'public'))

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
  
app.use(routes)

db.once('open', () => {
    app.listen(PORT, () => {
        console.log(`API server running on port ${PORT}`)
    })
})