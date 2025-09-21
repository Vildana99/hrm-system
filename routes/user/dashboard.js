const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

router.get('/', authenticateToken, (req, res) => {

    res.render('user/dashboard', { user: req.user });
});

module.exports = router;



