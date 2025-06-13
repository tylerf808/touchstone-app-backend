const router = require('express').Router()
const Costs = require('../../models/Costs')
const User = require('../../models/User')
const PendingUser = require('../../models/PendingUsers')
const Tractor = require('../../models/Tractor')
const auth = require('../../utils/auth')
const jwt = require('jsonwebtoken')
const sendConfirmationEmail = require('../../utils/sendConfirmationEmail')
const sendSignUpEmail = require('../../utils/sendSignUpEmail')

//Get a user from a jwt
router.get('/getUser', auth, async (req, res) => {
  try {
    const user = await User.find({ username: req.user.username, email: req.user.email })
    res.status(200).json(user[0])
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/getPendingAccount', async (req, res) => {
  try {
    const pendingUser = await PendingUser.find({ confirmationCode: req.body.code })
    res.status(200).json(pendingUser)
  } catch (error) {
    res.status(500).json(err)
  }
})

router.post('/confirmPendingAccount', async (req, res) => {
  try {
    const confirmationCode = req.body.confirmationCode
    const account = await PendingUser.findOne({ confirmationCode });

    if (!account || !account.username) {
      return res.status(400).json({ msg: 'Invalid or incomplete pending user account' });
    }

    const { operationalCosts, fixedCosts, tractors, users } = req.body;

    console.log('Setting up for:', account.username);

    await User.create({
      name: account.name,
      username: account.username,
      email: account.email,
      accountType: account.accountType,
      password: req.body.password
    });

    await Costs.create({
      tractorLease: operationalCosts.tractorLease,
      trailerLease: operationalCosts.trailerLease,
      repairs: operationalCosts.repairs,
      loan: operationalCosts.loan,
      parking: operationalCosts.parking,
      gAndA: operationalCosts.gAndA,
      laborRate: fixedCosts.labor,
      payrollTax: fixedCosts.payroll,
      dispatch: fixedCosts.dispatch,
      factor: fixedCosts.factor,
      odc: fixedCosts.odc,
      overhead: fixedCosts.overhead,
      belongsTo: account.username
    });

    await Promise.all(tractors.map(async (tractor) => {
      await Tractor.create({
        belongsTo: account.username,
        internalNum: tractor.internalNum,
        vin: tractor.vin,
        insurance: tractor.insurance,
        mpg: tractor.mpg,
        height: {
          ft: tractor.height.ft,
          in: tractor.height.in
        },
        width: {
          ft: tractor.width.ft,
          in: tractor.width.in
        },
        weight: tractor.weight
      });
    }));

    await Promise.all(users.map(async (user) => {
      const subConfirmationCode = Math.random().toString(36).substring(2, 15);
      const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await PendingUser.create({
        name: user.name,
        email: user.email,
        admin: account.username,
        accountType: user.accountType,
        confirmationCode: subConfirmationCode,
        expirationTime
      });

      // await sendConfirmationEmail(user.email, subConfirmationCode, user.name);
    }));

    const deleted = await PendingUser.findOneAndDelete({ confirmationCode });
    console.log('Deleted pending user:', deleted);

    res.status(200).json({ msg: 'Account created successfully' });
  } catch (error) {
    console.error('Error in confirmPendingAccount:', error);
    res.status(500).json({ msg: 'Internal server error', error });
  }
});



//Check if driver with an email or username already exists during sign up.
router.post('/check', async (req, res) => {
  try {
    const usernameExists = await User.exists({ username: req.body.username })
    const emailExists = await User.exists({ email: req.body.email })
    if (usernameExists === null && emailExists === null) {
      const confirmationCode = Math.random().toString(36).substring(2, 15);
      const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await PendingUser.create({
        name: req.body.name,
        email: req.body.email,
        accountType: req.body.accountType,
        password: req.body.password,
        username: req.body.username,
        confirmationCode: confirmationCode,
        expirationTime: expirationTime
      })
      await sendSignUpEmail(req.body.email, confirmationCode, req.body.name)
      res.status(404).json({ msg: 'No user with that email or username' })
    } else if (emailExists && usernameExists) {
      res.status(200).json({ msg: 'Email and username already in use' })
    } else if (usernameExists === null) {
      res.status(200).json({ msg: 'User already exists with that email' })
    } else {
      res.status(200).json({ msg: 'Username is already taken' })
    }
  } catch (err) {
    console.log(err)
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

//Edit user
router.post('/editUser', auth, async (req, res) => {
  try {
    const editedUser = await User.findOneAndUpdate({ _id: req.body._id },
      {
        email: req.body.email,
        name: req.body.name,
        username: req.body.username
      },
      {
        new: true
      })
    res.status(200).json(editedUser)
  } catch (error) {
    res.status(500).json(error)
  }
})

//Delete user
router.post('/deleteUser', auth, async (req, res) => {
  try {
    const user = req.body.user
    if(user.confirmationCode){
      await PendingUser.findByIdAndDelete({_id: user._id})
    } else {
      await User.findByIdAndDelete({ _id: user._id })
    }
    res.status(200).json({ msg: 'User deleted' })
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
    const pendingUsers = await PendingUser.find({admin: req.user.username})
    pendingUsers.forEach((user) => {
      if(user.accountType === 'driver' || user.accountType === 'Driver'){
        drivers.push(user)
      } else {
        dispatchers.push(user)
      }
    })
    const tractorsAndUsers = [drivers, tractors, dispatchers]
    res.status(200).json(tractorsAndUsers)
  } catch (error) {
    res.status(500).json(error)
  }
})

//New User
router.post('/newUser', async (req, res) => {
  try {

    const user = await PendingUser.findOne({ confirmationCode: req.body.confirmationCode });

    if (!user) {
      return res.status(400).json({ message: "Invalid confirmation link." });
    }

    if (user.confirmationExpires < new Date()) {
      return res.status(400).json({ message: "Confirmation link has expired." });
    }

    await User.create({
      email: user.email,
      name: req.body.name,
      username: req.body.username,
      accountType: user.accountType,
      password: req.body.password,
      admin: user.admin,
      company: req.body.company
    })
    await PendingUser.deleteOne({ confirmationCode: req.body.confirmationCode })
    res.status(200)
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
})

//Create PendingUser 
router.post('/newPendingUser', auth, async (req, res) => {
  try {
    const confirmationCode = Math.random().toString(36).substring(2, 15);
    const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await PendingUser.create({
      name: req.body.name,
      email: req.body.email,
      admin: req.user.username,
      username: req.body.username,
      accountType: req.body.accountType,
      confirmationCode: confirmationCode,
      expirationTime: expirationTime
    })
    await sendConfirmationEmail(req.body.email, confirmationCode, req.body.name)
    res.status(200)
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
})

//User confirmation
router.post('/confirm/:code', async (req, res) => {
  const { code } = req.params

  try {
    const user = await User.findOne({ confirmationCode: code });

    if (!user) {
      return res.status(400).json({ message: "Invalid confirmation link." });
    }

    // Check if the confirmation code has expired
    if (user.confirmationExpires < new Date()) {
      return res.status(400).json({ message: "Confirmation link has expired." });
    }

    // Mark user as verified
    user.isVerified = true;
    user.username = req.body.username
    user.password = req.body.password
    user.markModified("password");
    user.confirmationCode = null; // Clear the code after use
    user.confirmationExpires = null;
    await user.save();

    res.json({ message: "Email confirmed successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error confirming email", error });
  }
})

//Get all users belonging to an admin
router.get('/getUsers', auth, async (req, res) => {
  try {
    const users = await User.find({ admin: req.user.username })
    const pendingUsers = await PendingUser.find({admin: req.user.username})
    res.status(200).json({users: users, pendingUsers: pendingUsers})
  } catch (error) {
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