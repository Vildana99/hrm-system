const express = require('express');
const router = express.Router();
const {authenticateToken, isUser} = require("../../middleware/auth");
const { getUserApplications, confirmInterview } = require('../../controllers/user/applicationsController');

// Middleware za autentifikaciju i autorizaciju
router.use(authenticateToken, isUser);

// Ruta za dohvaćanje svih korisnikovih prijava
router.get('/', getUserApplications);

//Ruta za potvrdu intervjua
router.put('/:applicationId/confirm', confirmInterview);

module.exports = router;