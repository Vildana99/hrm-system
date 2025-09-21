const pool = require('../../db');

// Dohvati sve prijave korisnika
const getUserApplications = async (req, res) => {
    const userId = req.user.id;

    try {
        const query = `
            SELECT 
                a.id AS application_id,
                a.applied_at,
                s.name AS status_name,
                j.title AS job_title,
                j.company,
                i.interview_date,
                i.location,
                i.confirmed
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN application_statuses s ON a.status_id = s.id
            LEFT JOIN interviews i ON a.id = i.application_id
            WHERE a.user_id = $1;
        `;
        const result = await pool.query(query, [userId]);
        res.render('user/applications', { applications: result.rows, user: req.user });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška prilikom dohvaćanja prijava.' });
    }
};

// Potvrda intervjua
const confirmInterview = async (req, res) => {
    const { applicationId } = req.params;

    try {
        // Provjera statusa prijave
        const statusCheckQuery = `
            SELECT a.status_id, s.name AS status_name
            FROM applications a
            JOIN application_statuses s ON a.status_id = s.id
            WHERE a.id = $1;
        `;
        const statusCheckResult = await pool.query(statusCheckQuery, [applicationId]);

        if (statusCheckResult.rowCount === 0) {
            return res.status(404).json({ message: 'Prijava nije pronađena.' });
        }

        const { status_name } = statusCheckResult.rows[0];

        if (status_name !== 'interview_scheduled') {
            return res.status(400).json({ message: 'Intervju nije zakazan za ovu prijavu.' });
        }

        // Azuriranje tabele interviews
        const updateQuery = `
            UPDATE interviews
            SET confirmed = TRUE
            WHERE application_id = $1 AND confirmed = FALSE
            RETURNING id;
        `;
        const result = await pool.query(updateQuery, [applicationId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Intervju nije pronađen ili je već potvrđen.' });
        }

        res.status(200).json({ message: 'Prisustvo na intervjuu uspješno potvrđeno.' });
    } catch (err) {
        console.error('Greška prilikom potvrde intervjua:', err);
        res.status(500).json({ message: 'Greška prilikom potvrde intervjua.' });
    }
};

module.exports = { getUserApplications, confirmInterview };


