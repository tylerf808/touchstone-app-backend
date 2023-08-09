const router = require('express').Router()
const Costs = require('../../models/Costs');
const Job = require('../../models/Job')

//////GET Routes
//Query all jobs
router.get('/', async (req, res) => {
    try {
        const jobData = await Job.findAll({ where: { user_id: req.query.id } })
        res.status(200).json(jobData);
    } catch (error) {
        res.status(500).json(null)
    }
})

//Query a specific job
router.get('/:id', async (req, res) => {
    try {
        const jobData = await Job.findByPk(req.params.id)
        if (!jobData) {
            res.status(404).json({ message: 'No job matching that id' })
            return
        }
        const costs = await Costs.findOne({ where: { costs_id: jobData.costs_id } })
        res.status(200).json([ jobData, costs ])
    } catch (err) {
        res.status(500).json(err)
    }
})

//////POST Routes
//Add 1 new job to the database
router.post('/', async (req, res) => {
    try {
        const newJob = await Job.create(req.body)
        res.status(200).json(newJob)
    } catch (error) {
        res.status(500).json(error)
    }
})

module.exports = router