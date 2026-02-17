const router = require('express').Router()
const Costs = require('../../models/Costs');
const Job = require('../../models/Job')
const auth = require('../../utils/auth')


//////GET Routes 
//Query all jobs related you user
router.post('/allJobs', auth, async (req, res) => {
    try {

        if (req.user.accountType === 'driver') {
            const jobData = await Job.find({ driver: req.user.name })
            res.status(200).json(jobData);

        } else if (req.user.accountType === 'dispatcher') {
            const jobData = await Job.find({ admin: req.user.admin })
            res.status(200).json(jobData);
        } else {
            const jobData = await Job.find({ admin: req.user.username })
            res.status(200).json(jobData);
        }
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
})

//////POST Routes
//Add 1 new job to the database
router.post('/newJob', auth, async (req, res) => {
    try {
        const newJob = await Job.create(req.body)
        res.status(200).json(newJob)
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
})

//Delete batch of jobs
router.post('/deleteJobs', auth, async (req, res) => {
    try {
        const selectedJobs = req.body.jobs
        selectedJobs.forEach(async (job) => {
            await Job.findOneAndDelete({ _id: job._id })
        })
        const newJobs = await Job.find({ admin: req.user.username })
        res.status(200).json(newJobs)
    } catch (error) {
        res.status(500).json(error)
    }
})

module.exports = router