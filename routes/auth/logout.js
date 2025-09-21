const express = require('express');
const router = express.Router();
const logout = (req, res) => {
    res.clearCookie('jwt');
    req.flash('success', 'Uspješno ste se odjavili.');
    return res.redirect('/auth/login');
};

router.get('/', logout);

module.exports = router;
