const pool = require('../../db');
const moment = require('moment');

// GET: Dohvacanje korisnickog profila
const getProfile = async (req, res) => {
    try {
        const { id } = req.user;
        console.log(id);

        // Dohvati licne podatke
        const personalDataQuery = `
            SELECT phone_number, address, date_of_birth, about_me
            FROM personal_data
            WHERE user_id = $1
        `;
        const personalData = await pool.query(personalDataQuery, [id]);

        // Formatiraj datum rođenja
        if (personalData.rows[0]?.date_of_birth) {
            personalData.rows[0].date_of_birth = moment(personalData.rows[0].date_of_birth).format('DD.MM.YYYY');
        }

        // Dohvati radno iskustvo
        const workExperienceQuery = `
            SELECT id, company_name, position, start_date, end_date, description
            FROM work_experience
            WHERE user_id = $1
        `;
        const workExperience = await pool.query(workExperienceQuery, [id]);

        workExperience.rows.forEach(exp => {
            if (exp.start_date) {
                exp.start_date = moment(exp.start_date).format('DD.MM.YYYY');
            }
            if (exp.end_date) {
                exp.end_date = moment(exp.end_date).format('DD.MM.YYYY');
            }
        });

        // Dohvati obrazovanje
        const educationQuery = `
            SELECT id, institution_name, degree, field_of_study, start_date, end_date
            FROM education
            WHERE user_id = $1
        `;
        const education = await pool.query(educationQuery, [id]);

        education.rows.forEach(edu => {
            if (edu.start_date) {
                edu.start_date = moment(edu.start_date).format('DD.MM.YYYY');
            }
            if (edu.end_date) {
                edu.end_date = moment(edu.end_date).format('DD.MM.YYYY');
            }
        });

        res.render('user/profile', {
            personalData: personalData.rows[0] || null,
            workExperience: workExperience.rows,
            education: education.rows,
            user: req.user
        });
    } catch (error) {
        console.error('Greška prilikom dohvaćanja korisničkog profila:', error);
        res.status(500).json({ message: 'Greška prilikom dohvaćanja korisničkog profila.' });
    }
};

// POST: Unos novih ličnih podataka
const addPersonalData = async (req, res) => {
    const { phone_number, address, date_of_birth, about_me } = req.body;
    const userId = req.user.id;

    try {
        const query = `
            INSERT INTO personal_data (user_id, phone_number, address, date_of_birth, about_me)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await pool.query(query, [userId, phone_number, address, date_of_birth, about_me]);

        res.redirect('/user/profile');
    } catch (error) {
        console.error('Greška prilikom dodavanja ličnih podataka:', error);
        res.status(500).json({ message: 'Greška prilikom dodavanja podataka.' });
    }
};


// PUT: Azuriranje licnih podataka
const updatePersonalData = async (req, res) => {
    const { phone_number, address, date_of_birth, about_me } = req.body;
    const userId = req.user.id;

    try {
        // Provjeri postoji li u bazi
        const checkQuery = `SELECT * FROM personal_data WHERE user_id = $1`;
        const checkResult = await pool.query(checkQuery, [userId]);

        if (checkResult.rowCount === 0) {
            // Ako zapis ne postoji, kreiraj ga
            const createQuery = `
                INSERT INTO personal_data (user_id, phone_number, address, date_of_birth, about_me)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const createValues = [userId, phone_number, address, date_of_birth, about_me];
            const createResult = await pool.query(createQuery, createValues);

            return res.status(201).json(createResult.rows[0]);
        }

        // Azuriraj postojeci zapis
        const updateQuery = `
            UPDATE personal_data
            SET phone_number = $1, address = $2, date_of_birth = $3, about_me = $4
            WHERE user_id = $5
            RETURNING *
        `;
        const updateValues = [phone_number, address, date_of_birth, about_me, userId];
        const updateResult = await pool.query(updateQuery, updateValues);

        res.redirect('/user/profile');
    } catch (error) {
        console.error('Greška prilikom ažuriranja personal_data:', error);
        res.status(500).json({ message: 'Greška prilikom ažuriranja podataka.' });
    }
};


// POST: Dodavanje novog radnog iskustva
const addWorkExperience = async (req, res) => {
    try {
        const { id } = req.user;
        const { company_name, position, start_date, end_date, description } = req.body;

        const query = `
            INSERT INTO work_experience (user_id, company_name, position, start_date, end_date, description)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await pool.query(query, [id, company_name, position, start_date, end_date, description]);

        res.redirect('/user/profile');
    } catch (error) {
        console.error('Greška prilikom dodavanja radnog iskustva:', error);
        res.status(500).json({ message: 'Greška prilikom dodavanja radnog iskustva.' });
    }
};

// PUT: Azuriranje postojeceg radnog iskustva
const updateWorkExperience = async (req, res) => {
    try {
        const { id } = req.params;
        const { company_name, position, start_date, end_date, description } = req.body;
        const userId = req.user.id;

        const query = `
            UPDATE work_experience
            SET company_name = $1, position = $2, start_date = $3, end_date = $4, description = $5
            WHERE id = $6 AND user_id = $7
        `;
        const result = await pool.query(query, [company_name, position, start_date, end_date, description, id, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Radno iskustvo nije pronađeno.' });
        }

        res.redirect('/user/profile');
    } catch (error) {
        console.error('Greška prilikom ažuriranja radnog iskustva:', error);
        res.status(500).json({ message: 'Greška prilikom ažuriranja radnog iskustva.' });
    }
};

// POST: Dodavanje novog obrazovanja
const addEducation = async (req, res) => {
    try {
        const { id } = req.user;
        const { institution_name, degree, field_of_study, start_date, end_date } = req.body;

        const query = `
            INSERT INTO education (user_id, institution_name, degree, field_of_study, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await pool.query(query, [id, institution_name, degree, field_of_study, start_date, end_date]);

        res.redirect('/user/profile');
    } catch (error) {
        console.error('Greška prilikom dodavanja obrazovanja:', error);
        res.status(500).json({ message: 'Greška prilikom dodavanja obrazovanja.' });
    }
};

// PUT: Azuriranje postojeceg obrazovanja
const updateEducation = async (req, res) => {
    try {
        const { id } = req.params;
        const { institution_name, degree, field_of_study, start_date, end_date } = req.body;
        const userId = req.user.id;

        const query = `
            UPDATE education
            SET institution_name = $1, degree = $2, field_of_study = $3, start_date = $4, end_date = $5
            WHERE id = $6 AND user_id = $7
        `;
        const result = await pool.query(query, [institution_name, degree, field_of_study, start_date, end_date, id, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Obrazovanje nije pronađeno.' });
        }

        res.redirect('/user/profile');
    } catch (error) {
        console.error('Greška prilikom ažuriranja obrazovanja:', error);
        res.status(500).json({ message: 'Greška prilikom ažuriranja obrazovanja.' });
    }
};

module.exports = {
    getProfile,
    updatePersonalData,
    addWorkExperience,
    updateWorkExperience,
    addEducation,
    updateEducation,
    addPersonalData
};
