const bcrypt = require('bcrypt');
const client = require('../../db');

const register = async (req, res) => {
    const { first_name, last_name, email, password, user_type } = req.body;

    let errors = [];

    if (!first_name || !last_name || !email || !password || !user_type) {
        errors.push('Sva polja su obavezna!');
    }

    if (password.length < 6) {
        errors.push('Lozinka mora sadržavati najmanje 6 karaktera.');
    }

    try {
        const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            errors.push('Email već postoji.');
        }

        if (errors.length > 0) {
            req.flash('errors', errors);
            return res.redirect('/auth/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.query(
            `INSERT INTO users (first_name, last_name, email, password, user_type) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [first_name, last_name, email, hashedPassword, user_type]
        );

        req.flash('successMessage', 'Registracija uspješna! Možete se prijaviti.');
        res.redirect('/auth/login');
    } catch (err) {
        console.error('Greška prilikom registracije:', err.message);
        req.flash('errors', ['Server error!']);
        res.redirect('/auth/register');
    }
};

module.exports = { register };



