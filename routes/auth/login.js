const express = require('express');
const router = express.Router();
const { login } = require('../../controllers/auth/loginController');

// GET ruta za prikazivanje stranice za prijavu
router.get('/', (req, res) => {
    res.render('auth/login', {
        successMessage: req.flash('successMessage'), // Prosljedjuje poruku o uspjehu ako postoji
        error: req.flash('error'), // Prosljedjuje poruku o gresci ako postoji
    });
});

// POST ruta za obradu podataka prijave
router.post('/', login);

module.exports = router;




