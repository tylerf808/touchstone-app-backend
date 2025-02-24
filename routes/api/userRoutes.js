const router = require('express').Router()
const Costs = require('../../models/Costs')
const User = require('../../models/User')
const Tractor = require('../../models/Tractor')
const auth = require('../../utils/auth')
const jwt = require('jsonwebtoken')
const { sendConfirmationEmail } = require('../../utils/sendConfirmationEmail')

//Get a user from a jwt
router.get('/getUser', auth, async (req, res) => {
  try {
    const user = await User.find({ username: req.user.username, email: req.user.email })
    res.status(200).json(user[0])
  } catch (err) {
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
    const tractors = req.body.tractors
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
    tractors.forEach((tractor) => {
      Tractor.create({
        belongsTo: req.body.username,
        mpg: tractor.mpg,
        insurance: tractor.insurance,
        vin: tractor.vin,
        internalNum: tractor.internalNum,
      })
    })
    const newAdmin = await User.create({
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      accountType: 'admin'
    })
    await User.create({
      email: req.body.dispatcher.email,
      username: req.body.dispatcher.username,
      password: req.body.dispatcher.password,
      company: req.body.dispatcher.company,
      name: req.body.dispatcher.name,
      admin: req.body.username,
      accountType: 'dispatcher'
    })
    await Costs.create({
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
    const token = jwt.sign({ user: newAdmin }, process.env.JWT_SECRET_KEY)
    const confEmail = await sendConfirmationEmail(req.body.email)
    res.status(200).json(token, confEmail)
  } catch (error) {
    res.status(500).json(error)
  }
})

//Create a dispatcher
router.post('/newDispatcher', async (req, res) => {
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
      admin: req.user.username,
      name: req.body.name
    })
    res.status(200).json(userData)
  } catch (err) {
    res.status(400).json(err)
  }
})

router.post('/editUser', auth, async (req, res) => {
  try {
    const user = req.body.user
    const editedUser = await User.findOneAndUpdate({ _id: user._id },
      {
        email: user.email,
        name: user.name,
        username: user.username
      },
    {
      new: true
    })
    res.status(200).json(editedUser)
  } catch (error) {
    res.status(500).json(error)
  }
})

//Get all users and tractors belonging to an admin
router.get('/tractorsAndUsers', auth, async (req, res) => {
  try {
    const drivers = await User.find({ accountType: 'driver', admin: req.user.username })
    const dispatchers = await User.find({ admin: req.user.username, accountType: 'dispatcher' })
    const tractors = await Tractor.find({ belongsTo: req.user.username })
    const tractorsAndUsers = [drivers, tractors, dispatchers]
    res.status(200).json(tractorsAndUsers)
  } catch (error) {
    res.status(500).json(error)
  }
})

router.post('/updateTractorsAndUsers', auth, async (req, res) => {
  try {
    if (req.body.accountType === 'tractor') {
      await Tractor.findOneAndReplace({ _id: req.body.updatedItem._id }, req.body.updatedItem)
      const drivers = await User.find({ accountType: 'driver', admin: req.user.username })
      const dispatchers = await User.find({ admin: req.user.username, accountType: 'dispatcher' })
      const tractors = await Tractor.find({ belongsTo: req.user.username })
      const categories = {
        drivers: drivers,
        tractors: tractors,
        dispatchers: dispatchers
      }
      res.status(200).json(categories)
    } else {
      await User.findOneAndReplace({ _id: req.body.updatedItem._id }, req.body.updatedItem)
      const drivers = await User.find({ accountType: 'driver', admin: req.user.username })
      const dispatchers = await User.find({ admin: req.user.username, accountType: 'dispatcher' })
      const tractors = await Tractor.find({ belongsTo: req.user.username })
      const categories = {
        drivers: drivers,
        tractors: tractors,
        dispatchers: dispatchers
      }
      res.status(200).json(categories)
    }
  } catch (error) {
    res.status(500).json(error)
  }
})

//New Tractor or User
router.post('/newTractorOrUser', auth, async (req, res) => {
  try {
    if (req.body.accountType === 'tractor') {
      await Tractor.create({ ...req.body.newItem, belongsTo: req.user.username })
      
    } else {
      await User.create({ ...req.body.newItem, admin: req.user.username })

    }
    res.status(200)
  } catch (error) {
    res.status(500).json(error)
  }
})

//Get all users belonging to an admin
router.get('/getUsers', auth, async (req, res) => {
  try {
    const users = await User.find({ admin: req.user.username })
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json(error)
  }
})

//Update users
router.post('/setUsers', auth, async (req, res) => {
  try {
    await User.deleteMany({ accountType: 'driver', admin: req.user.username })
    const reqUsers = req.body
    reqUsers.forEach((user) => {
      user = { ...user, admin: req.user.username }
    })
    const newUsers = await User.insertMany(reqUsers)
    res.status(200).json(newUsers)
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
})

//New User
router.post('/newUser', async (req, res) => {
  try {
    const user = req.body.user
    const newUser = await User.create({
      name: user.name,
      username: user.username,
      email: user.email,
      password: user.password,
      accountType: user.accountType
    })
    res.status(200).json(newUser)
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
})

//Get drivers belonging to an admin
router.get('/getDrivers', auth, async (req, res) => {
  try {
    const drivers = await User.find({ admin: req.user.username, accountType: 'driver' })
    res.status(200).json(drivers)
  } catch (error) {
    console.log
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

      const token = jwt.sign({ user: user }, 'secret')
      res.status(200).json({ token, user })
    } else {
      const user = await User.findOne({ username: req.body.emailOrUsername })

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

      const token = jwt.sign({ user: user }, 'secret')
      res.status(200).json({ token, user })
    }

  } catch (error) {
    res.status(500).json({ msg: 'Server error' })
  }
})

module.exports = router