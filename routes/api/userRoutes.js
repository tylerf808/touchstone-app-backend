const router = require('express').Router()
const bcrypt = require('bcrypt')
const Costs = require('../../models/Costs')
const Admin = require('../../models/Admin')
const User = require('../../models/User')

//Check if driver with an email or username already exists during sign up.
router.post('/check', async (req, res) => {
  try {
    if (req.body.admin === true) {
      const usernameExists = await Admin.exists({ username: req.body.username })
      const emailExists = await Admin.exists({ email: req.body.email })
      if (usernameExists === null && emailExists === null) {
        res.status(404).json({ msg: 'No user with that email or username' })
      } else if (emailExists && usernameExists) {
        res.status(200).json({ msg: 'Email and username already in use' })
      } else if(usernameExists === null){
        res.status(200).json({ msg: 'User already exists with that email' })
      } else {
        res.status(200).json({ msg: 'Username is already taken' })
      }
    } else {
      
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

//Create a User
router.post('/user', async (req, res) => {
  try {
    const userData = await Driver.create({ email: req.body.email, username: req.body.username, password: req.body.password })

    const costsData = await Costs.create({
      user_id: userData.user_id,
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
router.post('/admin', async (req, res) => {
  try {
    const newAdmin = await Admin.create({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password
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
    res.status(200).json(newAdmin)
  } catch (err) {
    res.status(400).json(err)
  }
})

//Create Dispatcher
router.post('/dispatcher', async (req, res) => {
  try {
    const userData = await Dispatcher.create({ email: req.body.email, username: req.body.username, password: req.body.password })
    res.status(200).json(userData)
  } catch (err) {
    res.status(400).json(err)
  }
})

//Get drivers belonging to an admin
router.post('/getDrivers', async (req, res) => {
  try {

  } catch (error) {
    res.status(400).json(error)
  }
})

//Get dispatcher belonging to an admin
router.post('/getDispatcher', async (req, res) => {
  try {

  } catch (error) {
    res.status(400).json(error)
  }
})

//Get all managers
router.get('/getManagers', async (req, res) => {
  try {
    const managers = await Manager.findAll()
    res.status(200).json(managers)
  } catch (err) {
    res.status(400).json(err)
  }
})

//Login
router.post('/login', async (req, res) => {
  try {

    let userData
    let validPassword

    if (req.body.logInType === 'email') {
      userData = await Driver.findOne({ where: { email: req.body.emailOrUsername } })
      if (!userData) {
        userData = await Manager.findOne({ where: { email: req.body.emailOrUsername } })
        if (!userData) {
          userData = await Dispatcher.findOne({ where: { email: req.body.emailOrUsername } })
          if (!userData) {
            res.status(404).json({ message: 'Login failed. Please try again!' })
            return
          }
        }
      }
      validPassword = await bcrypt.compare(
        req.body.password,
        userData.password
      )
      if (!validPassword) {
        res.status(400).json({ message: 'Login failed. Please try again!' })
        return
      }

    } else {
      userData = await Driver.findOne({ where: { username: req.body.emailOrUsername } })
      if (!userData) {
        userData = await Manager.findOne({ where: { username: req.body.emailOrUsername } })
        if (!userData) {
          userData = await Dispatcher.findOne({ where: { username: req.body.emailOrUsername } })
          if (!userData) {
            res.status(404).json({ message: 'Login failed. Please try again!' })
            return
          }
        }
      }
      validPassword = await bcrypt.compare(
        req.body.password,
        userData.password
      )
      if (!validPassword) {
        res.status(400).json({ message: 'Login failed. Please try again!' })
        return
      }

    }
    res.status(200).json(userData)
  } catch (err) {
    res.status(500).json(err)
  }
})

//Log out
router.delete('/', (req, res) => {

  req.session.destroy()
  res.send(200).json({ message: 'test' })
})

module.exports = router
