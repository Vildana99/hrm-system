const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
// Ruta za "O nama"
router.get('/about', (req, res) => {
    res.render('static/about', { user: req.user });
});

// Ruta za "Kontakt"
router.get('/contact', (req, res) => {
    res.render('static/contact', { user: req.user });
});

// Ruta za "Uslovi korištenja"
router.get('/terms', (req, res) => {
    res.render('static/terms', { user: req.user });
});

module.exports = router;

