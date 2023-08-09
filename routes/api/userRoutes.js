const router = require('express').Router()
const bcrypt = require('bcrypt')
const Manager = require('../../models/Manager')
const Driver = require('../../models/Driver')
const Costs = require('../../models/Costs')
const { Op, where } = require('sequelize')
const Dispatcher = require('../../models/Dispatcher')

//Check if driver with an email already exists during sign up.
router.get('/check', async (req, res) => {
  try {
    if (req.query.accountType === 'manager') {
      const checkEmail = await Manager.findOne({
        where: {
          [Op.or]: [
            { email: req.query.email },
            { username: req.query.username }
          ]
        }
      })
      res.status(200).json(checkEmail)
    } else if (req.query.accountType === 'owner') {
      const checkEmail = await Driver.findOne({
        where: {
          [Op.or]: [
            { email: req.query.email },
            { username: req.query.username }
          ]
        }
      })
      res.status(200).json(checkEmail)
    } else {
      const checkEmail = await Dispatcher.findOne({
        where: {
          [Op.or]: [
            { email: req.query.email },
            { username: req.query.username }
          ]
        }
      })
      res.status(200).json(checkEmail)
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

//Create a Driver
router.post('/driver', async (req, res) => {
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

//Create a Manager
router.post('/manager', async (req, res) => {
  try {
    const userData = await Manager.create({ email: req.body.email, username: req.body.username, password: req.body.password })
    const driversArray = req.body.drivers
    driversArray.forEach((el, i) => {
      const driver = { ...el, manager: userData.manager_id }
      driversArray[i] = driver
    })
    const driversData = await Driver.bulkCreate(driversArray)
    const costsData = await Costs.create({
      manager_id: userData.manager_id,
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
      depreciation: req.body.depreciation,
      parking: req.body.parking
    })
    res.status(200).json([userData, costsData, driversData])
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

//Get drivers belonging to a manager
router.post('/getDrivers', async (req, res) => {
  try {
    const drivers = await Driver.findAll({
      where: {manager: req.body.manager}
    })
    res.status(200).json(drivers)
  } catch (error) {
    res.status(400).json(error)
  }
})

//Get drivers based on dispatcher
router.post('getDispatchersDrivers', async (req, res) => {
  try {
    const dispatcher = await Dispatcher.findOne({
      where: {
        dispatcher_id: req.body.id
      }
    })
    const manager = await Manager.findOne({
      where: {
        manager_id: dispatcher.manager
      }
    })
    const drivers = await Drivers.findAll({
      where: {
        manager: manager.manager_id
      }
    })
    res.status(200).json(drivers)
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
