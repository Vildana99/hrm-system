const pool = require('../../db');
const { sendApplicationStatusEmail, sendEmail } = require('../../services/emailService');

// Sve prijave za poslove koje je kreirao prijavljeni admin
const getAllApplications = async (req, res) => {
    const adminId = req.user.id;

    try {
        const query = `
            SELECT 
                a.id AS application_id,
                a.status_id,
                a.applied_at,
                s.name AS status_name,
                u.id AS user_id,
                u.first_name,
                u.last_name,
                u.email,
                j.title AS job_title,
                c.comment
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN jobs j ON a.job_id = j.id
            JOIN application_statuses s ON a.status_id = s.id
            LEFT JOIN comments c ON a.id = c.application_id
            WHERE j.created_by = $1;
        `;
        const result = await pool.query(query, [adminId]);

        res.render('admin/communication', {
            applications: result.rows,
            user: req.user,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška prilikom dohvaćanja prijava.' });
    }
};

// Promjena statusa prijave
const updateApplicationStatus = async (req, res, applicationId) => {
    const statusId = req.body.statusId;

    try {
        // Provjera da li status postoji u bazi
        const statusCheck = await pool.query('SELECT * FROM application_statuses WHERE id = $1', [statusId]);
        if (statusCheck.rowCount === 0) {
            return res.status(404).json({ message: 'Status nije pronađen.' });
        }

        // Azuriranje statusa prijave u bazi
        const query = `
            UPDATE applications
            SET status_id = $1
            WHERE id = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [statusId, applicationId]);

        // Provjera da li prijava postoji
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Prijava nije pronađena.' });
        }

        // Slanje emaila nakon promjene statusa
        await sendApplicationStatusEmail(applicationId);

        // Redirekcija nakon uspješne promjene statusa
        res.redirect('/admin/communication');
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška prilikom promjene statusa prijave.' });
    }
};

// Dodaj komentar nakon intervjua
const addComment = async (req, res) => {
    const { applicationId } = req.params;
    const { comment } = req.body;
    const adminId = req.user.id;

    try {
        const query = `
            INSERT INTO comments (application_id, admin_id, comment)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await pool.query(query, [applicationId, adminId, comment]);

        res.redirect('/admin/communication');

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška prilikom dodavanja komentara.' });
    }
};

// Zakazivanje intervjua
const scheduleInterview = async (req, res) => {
    const { applicationId } = req.params;
    const { interviewDate, location } = req.body;

    try {
        // Dodavanje intervjua u tabelu
        const insertQuery = `
            INSERT INTO interviews (application_id, interview_date, location)
            VALUES ($1, $2, $3)
            RETURNING id;
        `;
        const result = await pool.query(insertQuery, [applicationId, interviewDate, location]);

        // Azuriranje statusa prijave
        const updateApplicationStatusQuery = `
            UPDATE applications
            SET status_id = (
                SELECT id FROM application_statuses WHERE name = 'interview_scheduled'
            )
            WHERE id = $1;
        `;
        await pool.query(updateApplicationStatusQuery, [applicationId]);

        // Dohvacanje podataka o korisniku i poslu
        const userQuery = `
            SELECT u.first_name, u.last_name, u.email, j.title, j.company
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = $1;
        `;
        const userResult = await pool.query(userQuery, [applicationId]);
        const { first_name, last_name, email, title, company } = userResult.rows[0];

        // Slanje emaila korisniku
        const subject = 'Termin intervjua';
        const text = `
            Poštovani/a ${first_name} ${last_name},

            Vaš intervju za poziciju "${title}" u kompaniji "${company}" zakazan je za:
            Datum i vrijeme: ${new Date(interviewDate).toLocaleString()}
            Lokacija: ${location}

            Molimo Vas da potvrdite prisustvo putem Vašeg računa na našem sistemu.

            Srdačan pozdrav,
            Tim za zapošljavanje
        `;

        await sendEmail(email, subject, text);

        res.redirect('/admin/communication');

    } catch (error) {
        console.error('Greška prilikom zakazivanja intervjua:', error);
        res.status(500).send('Greška prilikom zakazivanja intervjua.');
    }
};


module.exports = { getAllApplications, updateApplicationStatus, addComment, scheduleInterview };

