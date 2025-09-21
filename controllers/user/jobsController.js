const pool = require('../../db');
const { sendApplicationStatusEmail } = require('../../services/emailService');

// Dohvacanje aktivnih poslova s opcionalnim filterima
const getJobs = async (req, res) => {
    const { company, title, deadline } = req.query;

    try {
        let query = `
            SELECT id, title, description, company, location, deadline, created_at
            FROM jobs
            WHERE status = 'active' AND deadline >= NOW()  
        `;
        const values = [];

        // Dodavanje filtera
        if (company) {
            values.push(`%${company}%`);
            query += ` AND company ILIKE $${values.length}`;
        }
        if (title) {
            values.push(`%${title}%`);
            query += ` AND title ILIKE $${values.length}`;
        }

        // Filtriranje prema specificnom datumu, ako je zadat
        if (deadline) {
            values.push(deadline);
            query += ` AND deadline <= $${values.length}`;
        }

        query += ' ORDER BY deadline ASC'; // Sortiranje po roku

        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Greška prilikom dohvaćanja poslova.' });
    }
};


// Prijava na posao
const applyForJob = async (req, res) => {
    console.log("Req.user: ", req.user);
    const { jobId } = req.body;
    const userId = req.user.id;

    console.log("userId:", userId);

    try {
        // Provjeri da li vec postoji prijava za korisnika i posao
        const checkQuery = `
            SELECT id 
            FROM applications 
            WHERE user_id = $1 AND job_id = $2;
        `;
        const checkResult = await pool.query(checkQuery, [userId, jobId]);

        if (checkResult.rowCount > 0) {
            return res.status(400).json({
                message: 'Već ste se prijavili za ovaj posao.'
            });
        }

        // Kreiraj prijavu u bazi
        const query = `
            INSERT INTO applications (user_id, job_id, status_id)
            VALUES ($1, $2, (SELECT id FROM application_statuses WHERE name = 'applied'))
            RETURNING id;
        `;
        const result = await pool.query(query, [userId, jobId]);

        if (result.rowCount === 0) {
            return res.status(400).json({ message: 'Greška pri prijavi za posao.' });
        }

        // ID prijave
        const applicationId = result.rows[0].id;

        // Posalji email korisniku o statusu
        await sendApplicationStatusEmail(applicationId);

        res.status(201).json({
            message: `Prijava uspješno kreirana, i email poslan.`,
            applicationId,
        });
    } catch (error) {
        console.error('Greška prilikom prijave:', error);
        res.status(500).json({ message: 'Greška prilikom prijave.' });
    }
};


module.exports = { getJobs, applyForJob };




