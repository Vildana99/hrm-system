const { authenticateToken, isUser } = require('../../middleware/auth');
const express = require('express');
const router = express.Router();
const { getJobs, applyForJob } = require('../../controllers/user/jobsController');

// Ruta za dohvacanje poslova
router.get('/', authenticateToken, isUser, getJobs);

// Ruta za prijavu na posao
router.post('/apply', authenticateToken, isUser, applyForJob);

module.exports = router;
