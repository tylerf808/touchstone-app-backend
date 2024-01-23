const express = require('express')
const routes = require('./routes')
const db = require('./config/connection')
const cors = require('cors')
require('dotenv').config()

const Job = require('./models/Job')
const User = require('./models/User')

const PORT = process.env.PORT || 8080
const app = express()

const jwt = require('jsonwebtoken')

app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(cors())

app.use('/', express.static(__dirname + 'public'))
app.use(routes)

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

app.get('/profile', authenticateToken, async (req, res) => {
    const job = await Job.find({admin: req.user.username})
    res.json(job)
})

app.post('/login', async (req, res) => {

    const user = await User.find({username: req.body.username}) 
    if(!user) {
        res.sendStatus(404)
    } else {
        const accessToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30s'})
        const refreshToken = jwt.sign({user}, process.env.REFRESH_TOKEN_SECRET)
    
        res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken})
    }
})



db.once('open', () => {
    app.listen(PORT, () => {
        console.log(`API server running on port ${PORT}`)
    })
})