const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../../middleware/auth');
const {getJobs, createJob, archiveJob} = require('../../controllers/admin/jobsController');

// Pregled poslova (filtriranje)
router.get('/', authenticateToken, isAdmin, getJobs);

// Kreiranje novog posla
router.post('/', authenticateToken, isAdmin, createJob);

// Arhiviranje posla
router.patch('/:id/archive', authenticateToken, isAdmin, archiveJob);

// Prikaz forme za kreiranje novog posla
router.get('/new_job', authenticateToken, isAdmin, (req, res) => {
    res.render('admin/addJob');
});
module.exports = router;
