const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const pool = require('../../db');

router.get('/', authenticateToken, async (req, res) => {
    const adminId = req.user.id;

    try {
        // Dohvacanje broja prijava po konkursu
        const applicationsQuery = `
            SELECT 
                j.title AS job_title, 
                COUNT(a.id) AS application_count
            FROM jobs j
            LEFT JOIN applications a ON j.id = a.job_id
            WHERE j.created_by = $1
            GROUP BY j.title
            ORDER BY application_count DESC;
        `;
        const applicationsResult = await pool.query(applicationsQuery, [adminId]);

        // Pretvaranje application_count u broj
        const applicationsData = applicationsResult.rows.map(row => ({
            job_title: row.job_title,
            application_count: parseInt(row.application_count)
        }));

        // Dohvacanje statistike statusa prijava
        const statusQuery = `
            SELECT 
                s.name AS status_name,
                COUNT(a.id) AS status_count
            FROM application_statuses s
            LEFT JOIN applications a ON s.id = a.status_id
            LEFT JOIN jobs j ON a.job_id = j.id
            WHERE j.created_by = $1
            GROUP BY s.name
            ORDER BY status_count DESC;
        `;
        const statusResult = await pool.query(statusQuery, [adminId]);

        // Pretvaranje status_count u broj
        const statusData = statusResult.rows.map(row => ({
            status_name: row.status_name,
            status_count: parseInt(row.status_count)
        }));

        // Slanje podataka na EJS
        res.render('admin/dashboard', {
            user: req.user,
            applications: applicationsData,
            statusCounts: statusData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Greška prilikom dohvaćanja statistike.' });
    }
});

module.exports = router;




