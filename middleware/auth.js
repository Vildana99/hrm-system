const jwt = require('jsonwebtoken');

const JWT_SECRET = 'jwt_secret';

const authenticateToken = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        // Ako nema tokena, postavi flash poruku i preusmjeri na login stranicu
        req.flash('error', 'Pristup zabranjen. Token nije dostavljen.');
        return res.redirect('/auth/login');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Dodaj podatke o korisniku u zahtjev
        next();
    } catch (err) {
        // Ako je token neispravan, postavi flash poruku i preusmjeri na login
        req.flash('error', 'Token nije validan.');
        return res.redirect('/auth/login');
    }
};

// Middleware za provjeru da li je korisnik admin
const isAdmin = (req, res, next) => {
    if (req.user.user_type !== 'admin') {
        // Ako nije admin, postavi flash poruku i preusmjeri na login
        req.flash('error', 'Pristup odbijen! Potreban je admin pristup.');
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware za provjeru da li je korisnik obicni korisnik (kandidat)
const isUser = (req, res, next) => {
    if (req.user.user_type !== 'user') {
        // Ako nije obicni korisnik, postavi flash poruku i preusmjeri na login
        req.flash('error', 'Pristup odbijen! Potreban je korisnički pristup.');
        return res.redirect('/auth/login');
    }
    next();
};

module.exports = { authenticateToken, isAdmin, isUser };




