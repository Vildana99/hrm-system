const express = require('express');
const { authenticateToken, isUser } = require('../../middleware/auth');
const router = express.Router();

const {
    getProfile,
    updatePersonalData,
    addWorkExperience,
    updateWorkExperience,
    addEducation,
    updateEducation,
    addPersonalData
} = require('../../controllers/user/profileController');
const pool = require('../../db');

// Middleware za autentifikaciju i autorizaciju
router.use(authenticateToken, isUser);

// GET: Dohvacanje korisnickog profila
router.get('/', getProfile);

// PUT: Azuriranje licnih podataka
router.put('/personal_data', updatePersonalData);

// POST: Dodavanje novog radnog iskustva
router.post('/work_experience', addWorkExperience);

// PUT: Azuriranje postojeceg radnog iskustva
router.put('/work_experience/:id', updateWorkExperience);

// POST: Dodavanje novog obrazovanja
router.post('/education', addEducation);

// PUT: Azuriranje postojeceg obrazovanja
router.put('/education/:id', updateEducation);

// GET: Za dohvacanje forme za uredjivanje obrazovanja
router.get('/education/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const query = `
            SELECT id, institution_name, degree, field_of_study, start_date, end_date
            FROM education
            WHERE id = $1 AND user_id = $2
        `;
        const result = await pool.query(query, [id, userId]);

        if (result.rowCount === 0) {
            return res.status(404).send('Obrazovanje nije pronađeno.');
        }

        res.render('user/editEducation', { education: result.rows[0] });
    } catch (error) {
        console.error('Greška prilikom dohvaćanja obrazovanja:', error);
        res.status(500).send('Greška na serveru.');
    }
});

// GET: Forma za uredjivanje radnog iskustva
router.get('/work_experience/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const query = `
            SELECT id, company_name, position, start_date, end_date, description
            FROM work_experience
            WHERE id = $1 AND user_id = $2
        `;
        const result = await pool.query(query, [id, userId]);

        if (result.rowCount === 0) {
            return res.status(404).send('Radno iskustvo nije pronađeno.');
        }

        res.render('user/editExperience', { experience: result.rows[0] });
    } catch (error) {
        console.error('Greška prilikom dohvaćanja radnog iskustva:', error);
        res.status(500).send('Greška na serveru.');
    }
});

// GET: Forma za uredjivanje licnih podataka
router.get('/personal_data', async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT phone_number, address, date_of_birth, about_me
            FROM personal_data
            WHERE user_id = $1
        `;
        const result = await pool.query(query, [userId]);

        if (result.rowCount === 0) {
            // Ako nema zapisa, vraca prazan objekt za renderovanje forme
            return res.render('user/editPersonalData', { personalData: {} });
        }

        res.render('user/editPersonalData', { personalData: result.rows[0] });
    } catch (error) {
        console.error('Greška prilikom dohvaćanja ličnih podataka:', error);
        res.status(500).send('Greška na serveru.');
    }
});

// GET za dohvacanje forme za dodavanje novog obrazovanja/radnog iskustva
router.get('/new_education', (req, res) => {
    res.render('user/addEducation');
});

router.get('/new_experience', (req, res) => {
    res.render('user/addExperience');
});

// Post: dodavanje licnih podataka
router.post('/personal_data', addPersonalData);

// GET: Prikaz forme za unos licnih podataka
router.get('/new_personal_data', (req, res) => {
    res.render('user/addPersonalData');
});



module.exports = router;

