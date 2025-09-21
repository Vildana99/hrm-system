const express = require('express');
const { getJobApplications, getApplicationDetails, addReview, getRankedCandidates, getJobs, getApplicationPdf } = require('../../controllers/admin/candidatesController');
const { authenticateToken, isAdmin } = require('../../middleware/auth');
const router = express.Router();

// Dohvati listu poslova
router.get('/jobs', authenticateToken, isAdmin, getJobs);

//Dohvati kandidate rangirane po ocjeni iz reviews tabele
router.get('/jobs/:jobId/applications/ranking', authenticateToken, isAdmin, getRankedCandidates);

// Dohvati prijave za određeni posao
router.get('/jobs/:jobId/applications', authenticateToken, isAdmin, getJobApplications);

// Dohvati detalje o prijavi (kandidatu)
router.get('/jobs/:jobId/applications/:applicationId', authenticateToken, isAdmin, getApplicationDetails);

// Dodavanje ocjene i komentara za prijavu kandidata
router.post('/jobs/:jobId/applications/:applicationId/review', authenticateToken, isAdmin, addReview);

//Dohvati formu za dodavanje komentara i ocjene
router.get('/:jobId/applications/:applicationId/add_comment', (req, res) => {
    const { jobId, applicationId } = req.params;
    res.render('admin/candidatesComment', { jobId, applicationId });
});

//Preuzimanje pdf-a sa detaljima o prijavi
router.get('/jobs/:jobId/applications/:applicationId/pdf', authenticateToken, isAdmin, getApplicationPdf);

module.exports = router;



