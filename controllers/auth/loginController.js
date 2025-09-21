const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('../../db');
const JWT_SECRET = 'jwt_secret';

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        req.flash('error', 'Email i lozinka su obavezni!');
        return res.redirect('/auth/login');
    }

    try {
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            req.flash('error', 'Korisnik ne postoji!');
            return res.redirect('/auth/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error', 'Neispravna lozinka!');
            return res.redirect('/auth/login');
        }

        // Generisi JWT i sacuvaj ga u cookie
        const token = jwt.sign({ id: user.id, user_type: user.user_type }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 });
        if (user.user_type === 'admin') {
            return res.redirect('/admin/dashboard');  // Preusmjerenje za admina
        } else {
            return res.redirect('/user/dashboard');  // Preusmjerenje za običnog korisnika
        }
    } catch (err) {
        console.error('Greška prilikom prijave:', err.message);
        req.flash('error', 'Server error! Pokušajte ponovo.');
        return res.redirect('/auth/login');
    }
};

module.exports = { login };


