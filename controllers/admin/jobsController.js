const pool = require('../../db');
const moment = require('moment');

// Pregled poslova (sa opcijom filtriranja)
const getJobs = async (req, res) => {
    const { status } = req.query;
    const adminId = req.user.id;


    try {
        let query = 'SELECT * FROM jobs WHERE created_by = $1';
        let params = [adminId];

        if (status && status !== 'all') {
            query += ' AND status = $2';
            params.push(status);
        }

        const jobsResult = await pool.query(query, params);

        // Formatiranje datume sa moment bibl.
        const jobs = jobsResult.rows.map(job => ({
            ...job,
            deadline: moment(job.deadline).format('DD.MM.YYYY')
        }));

        res.render('admin/jobs', { jobs, status: status || 'all', user: req.user });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Greška prilikom dohvaćanja poslova.' });
    }
};

// Kreiranje novog posla
const createJob = async (req, res) => {
    const { title, description, company, location, deadline } = req.body;

    if (!title || !description || !company || !location || !deadline) {
        return res.status(400).json({ message: 'Sva polja su obavezna.' });
    }

    try {
        const query = `
            INSERT INTO jobs (title, description, company, location, deadline, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [title, description, company, location, deadline, req.user.id];
        const result = await pool.query(query, values);

        res.redirect('/admin/jobs');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Greška prilikom kreiranja posla.' });
    }
};

// Arhiviranje posla
const archiveJob = async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            UPDATE jobs
            SET status = 'archived'
            WHERE id = $1
            RETURNING *;
        `;
        const archivedJob = await pool.query(query, [id]);

        if (archivedJob.rowCount === 0) {
            return res.status(404).json({ message: 'Posao nije pronađen.' });
        }

        res.status(200).json({ message: 'Posao je uspješno arhiviran.', job: archivedJob.rows[0] });


    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Greška prilikom arhiviranja posla.' });
    }
};

module.exports = { getJobs, createJob, archiveJob };

