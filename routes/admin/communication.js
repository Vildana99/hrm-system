const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../../middleware/auth');
const { getAllApplications, updateApplicationStatus, addComment, scheduleInterview } = require('../../controllers/admin/communicationController');
const pool = require('../../db');

// Ruta za dohvaćanje svih prijava
router.get('/', authenticateToken, isAdmin, getAllApplications);

// Ruta za promjenu statusa prijave
router.patch('/applications/:id/status', (req, res) => {
    const applicationId = req.params.id;
    return updateApplicationStatus(req, res, applicationId);
});


// Ruta za dodavanje komentara na prijavu nakon intervjua
router.post('/applications/:applicationId/comment', authenticateToken, isAdmin, addComment);

// Ruta za zakazivanje intervjua
router.post('/applications/:applicationId/interview', authenticateToken, isAdmin, scheduleInterview);

module.exports = router;



