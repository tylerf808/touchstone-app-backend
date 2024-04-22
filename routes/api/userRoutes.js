const router = require('express').Router()
const Costs = require('../../models/Costs')
const User = require('../../models/User')
const auth = require('../../utils/auth')
const jwt = require('jsonwebtoken')

//Get a user from a jwt
router.get('/getUser', auth, async (req, res) => {
  try {
    const user = await User.find({ username: req.user.username })
    res.status(200).json(user[0])
  } catch (err) {
    console.log
    res.status(500).json(err)
  }
})

//Check if driver with an email or username already exists during sign up.
router.post('/check', async (req, res) => {
  try {
    const usernameExists = await User.exists({ username: req.body.username })
    const emailExists = await User.exists({ email: req.body.email })
    if (usernameExists === null && emailExists === null) {
      res.status(404).json({ msg: 'No user with that email or username' })
    } else if (emailExists && usernameExists) {
      res.status(200).json({ msg: 'Email and username already in use' })
    } else if (usernameExists === null) {
      res.status(200).json({ msg: 'User already exists with that email' })
    } else {
      res.status(200).json({ msg: 'Username is already taken' })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

//Create an Owner/Operator
router.post('/newOwner', async (req, res) => {
  try {
    const userData = await User.create({
      email: req.body.email,
      username: req.body.username,
      accountType: 'owner',
      password: req.body.password
    })
    const costsData = await Costs.create({
      belongsTo: req.body.username,
      insurance: req.body.insurance,
      tractorLease: req.body.tractorLease,
      trailerLease: req.body.trailerLease,
      dispatch: req.body.dispatch,
      mpg: req.body.mpg,
      laborRate: req.body.laborRate,
      payrollTax: req.body.payrollTax,
      factor: req.body.factor,
      odc: req.body.odc,
      gAndA: req.body.gAndA,
      loan: req.body.loan,
      repairs: req.body.repairs,
      parking: req.body.parking,
      tractorNum: req.body.tractorNum,
      overhead: req.body.overhead
    })
    res.status(200).json([userData, costsData])
  } catch (err) {
    res.status(400).json(err)
  }
})

//Create an admin
router.post('/newAdmin', async (req, res) => {
  try {
    const drivers = req.body.drivers
    drivers.forEach((driver) => {
      User.create({
        email: driver.email,
        username: driver.username,
        password: driver.password,
        name: driver.name,
        accountType: 'driver',
        admin: req.body.username
      })
    })
    const newAdmin = await User.create({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      accountType: 'admin'
    })
    const newDispatcher = await User.create({
      email: req.body.dispatcher.email,
      username: req.body.dispatcher.username,
      password: req.body.dispatcher.password,
      company: req.body.dispatcher.company,
      name: req.body.dispatcher.name,
      accountType: 'dispatcher'
    })
    const costsData = await Costs.create({
      belongsTo: req.body.username,
      insurance: req.body.insurance,
      tractorLease: req.body.tractorLease,
      trailerLease: req.body.trailerLease,
      dispatch: req.body.dispatch,
      mpg: req.body.mpg,
      laborRate: req.body.laborRate,
      payrollTax: req.body.payrollTax,
      factor: req.body.factor,
      odc: req.body.odc,
      gAndA: req.body.gAndA,
      loan: req.body.loan,
      repairs: req.body.repairs,
      parking: req.body.parking,
      tractorNum: req.body.tractorNum,
      overhead: req.body.overhead
    })
    res.status(200).json([newAdmin, costsData, newDispatcher])
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
})

//Create a dispatcher
router.post('/newDispatcher', auth, async (req, res) => {
  try {
    const userData = await User.create({
      email: req.body.email,
      username: req.body.username,
      accountType: "dispatcher",
      admin: req.body.admin,
      name: req.body.name,
      company: req.body.company,
      password: req.body.password
    })
    res.status(200).json(userData)
  } catch (err) {
    console.log(err)
    res.status(400).json(err)
  }
})

//Create a driver
router.post('/newDriver', auth, async (req, res) => {
  try {
    const userData = await User.create({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      accountType: "driver",
      admin: req.body.admin
    })
    res.status(200).json(userData)
  } catch (err) {
    res.status(400).json(err)
  }
})

//Get all users belonging to an admin
router.post('/getUsers', auth, async (req, res) => {
  try {
    const users = await User.find({ admin: req.user.admin })
    res.status(200).json(users)
  } catch (error) {
    req.status(500).json(error)
  }
})

//Get drivers belonging to an admin
router.get('/getDrivers', auth, async (req, res) => {
  try {
    const drivers = await User.find({ admin: req.user.username, accountType: 'driver' })
    res.status(200).json(drivers)
  } catch (error) {
    res.status(500).json(error)
  }
})

//Get dispatcher belonging to an admin
router.post('/getDispatcher', auth, async (req, res) => {
  try {
    const dispatchers = await User.find({ admin: req.user.admin, accountType: 'dispatcher' })
    res.status(200).json(dispatchers)
  } catch (error) {
    res.status(500).json(error)
  }
})

router.post('/login', async (req, res) => {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (emailRegex.test(req.body.emailOrUsername)) {
      const user = await User.findOne({ email: req.body.emailOrUsername })

      console.log(user)

      if (!user) {
        res.status(401).json({ msg: 'No user found' })
        return
      }

      const password = req.body.password
      const correctPw = await user.isCorrectPassword(password)

      if (!correctPw) {
        res.status(401).json({ msg: 'Incorrect username or password' })
        return
      }

      const token = jwt.sign({user: user}, 'secret')
      res.status(200).json(token)
    } else {
      const user = await User.find({ username: req.body.emailOrUsername })

      if (!user) {
        res.status(401).json({ msg: 'No user found' })
        return
      }

      const password = req.body.password
      const correctPw = await user.isCorrectPassword(password)

      if (!correctPw) {
        res.status(401).json({ msg: 'Incorrect username or password' })
        return
      }

      const token = jwt.sign({user: user}, 'secret')
      res.status(200).json(token)
    }

  } catch (error) {
    res.status(500).json({ msg: 'Server error' })
  }
})

module.exports = router