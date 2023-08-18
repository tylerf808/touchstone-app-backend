const router = require('express').Router()
const bcrypt = require('bcrypt')
const Costs = require('../../models/Costs')
const User = require('../../models/User')

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
      parking: req.body.parking
    })
    res.status(200).json([userData, costsData])
  } catch (err) {
    res.status(400).json(err)
  }
})

//Create an admin
router.post('/newAdmin', async (req, res) => {
  try {
    // let drivers
    // if(req.body.drivers){
    //   drivers = await User.insertMany(req.body.drivers)
    // }
    const newAdmin = await User.create({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      accountType: req.body.accountType
    })
    // const costsData = await Costs.create({
    //   belongsTo: req.body.username,
    //   insurance: req.body.insurance,
    //   tractorLease: req.body.tractorLease,
    //   trailerLease: req.body.trailerLease,
    //   dispatch: req.body.dispatch,
    //   mpg: req.body.mpg,
    //   laborRate: req.body.laborRate,
    //   payrollTax: req.body.payrollTax,
    //   factor: req.body.factor,
    //   odc: req.body.odc,
    //   gAndA: req.body.gAndA,
    //   loan: req.body.loan,
    //   repairs: req.body.repairs,
    //   depreciation: req.body.depreciation,
    //   parking: req.body.parking
    // })
    res.status(200).json([newAdmin, costsData, drivers])
  } catch (error) {
    res.status(500).json(error)
  }
})

//Create a driver
router.post('/newDriver', async (req, res) => {
  try {
    const userData = await User.create({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      accountType: "driver",
      manager: req.body.admin
    })
    res.status(200).json(userData)
  } catch (err) {
    res.status(400).json(err)
  }
})

//Get drivers belonging to an admin
router.post('/getDrivers', async (req, res) => {
  try {
    const drivers = await User.find({ manager: req.body.admin, accountType: 'driver' })
    res.status(200).json(drivers)
  } catch (error) {
    res.status(400).json(error)
  }
})

//Get dispatcher belonging to an admin
router.post('/getDispatcher', async (req, res) => {
  try {
    const dispatchers = await User.find({ manager: req.body.admin, accountType: 'dispatcher' })
    res.status(200).json(dispatchers)
  } catch (error) {
    res.status(400).json(error)
  }
})

//Login
router.post('/login', async (req, res) => {
  try {
    const user = await User.find({$or: [{ username: req.body.username }, { email: req.body.email }]})
    if (user.length === 0) {
      res.status(404).json({ msg: 'User not found' })
    } else {
      res.status(200).json(user)
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router