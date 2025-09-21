const express = require('express');
const router = express.Router();
const { register } = require('../../controllers/auth/registerController');

// GET ruta za prikazivanje forme
router.get('/', (req, res) => {
    res.render('auth/register', {
        errors: req.flash('errors'), // Prosljedjuje poruke o greskama
        successMessage: req.flash('successMessage') // Prosljedjuje poruku o uspjehu
    });
});

// POST ruta za obradu podataka sa forme
router.post('/', register);

module.exports = router;


