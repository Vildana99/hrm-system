const pool = require('../../db'); // Baza
const moment = require('moment'); // Biblioteka za formatiranje datuma

const fs = require('fs'); // Biblioteka za rad s datotekama
const PDFDocument = require('pdfkit'); // Biblioteka za generisanje PDF datoteka
const path = require('path'); // Biblioteka za rad s putanjama datoteka i direktorija


//Preuzimanje pdf-a sa detaljima prijave
const getApplicationPdf = async (req, res) => {
    const { jobId, applicationId } = req.params;

    try {
        if (isNaN(jobId) || isNaN(applicationId)) {
            return res.status(400).json({ message: 'Neispravan ID posla ili prijave.' });
        }

        // Osnovne informacije o prijavi
        const applicationQuery = `
            SELECT 
                a.id AS application_id,
                s.name AS application_status, 
                a.applied_at,
                u.first_name,
                u.last_name,
                u.email
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN application_statuses s ON a.status_id = s.id 
            WHERE a.id = $1 AND a.job_id = $2;
        `;
        const applicationResult = await pool.query(applicationQuery, [applicationId, jobId]);

        if (applicationResult.rows.length === 0) {
            return res.status(404).json({ message: 'Prijava nije pronađena za odabrani posao.' });
        }

        const application = applicationResult.rows[0];
        application.applied_at = application.applied_at
            ? moment(application.applied_at).format('DD.MM.YYYY')
            : 'N/A';

        // Licni podaci
        const personalDataQuery = `
            SELECT phone_number, address, date_of_birth, about_me
            FROM personal_data
            WHERE user_id = (SELECT user_id FROM applications WHERE id = $1);
        `;
        const personalDataResult = await pool.query(personalDataQuery, [applicationId]);
        const personalData = personalDataResult.rows[0] || {};
        personalData.date_of_birth = personalData.date_of_birth
            ? moment(personalData.date_of_birth).format('DD.MM.YYYY')
            : 'N/A';

        // Radno iskustvo
        const workExperienceQuery = `
            SELECT company_name, position, start_date, end_date, description
            FROM work_experience
            WHERE user_id = (SELECT user_id FROM applications WHERE id = $1);
        `;
        const workExperienceResult = await pool.query(workExperienceQuery, [applicationId]);
        workExperienceResult.rows.forEach((exp) => {
            exp.start_date = exp.start_date ? moment(exp.start_date).format('DD.MM.YYYY') : 'N/A';
            exp.end_date = exp.end_date ? moment(exp.end_date).format('DD.MM.YYYY') : 'N/A';
        });

        // Obrazovanje
        const educationQuery = `
            SELECT institution_name, degree, field_of_study, start_date, end_date
            FROM education
            WHERE user_id = (SELECT user_id FROM applications WHERE id = $1);
        `;
        const educationResult = await pool.query(educationQuery, [applicationId]);
        educationResult.rows.forEach((edu) => {
            edu.start_date = edu.start_date ? moment(edu.start_date).format('DD.MM.YYYY') : 'N/A';
            edu.end_date = edu.end_date ? moment(edu.end_date).format('DD.MM.YYYY') : 'N/A';
        });

        // Ocjena i komentar
        const reviewQuery = `
            SELECT score, comments
            FROM reviews
            WHERE application_id = $1;
        `;
        const reviewResult = await pool.query(reviewQuery, [applicationId]);
        const review = reviewResult.rows[0] || { score: 'N/A', comments: 'Nema komentara' };

        // Kreiranje PDF-a
        const doc = new PDFDocument();
        const fileName = `prijava_${application.first_name}_${application.last_name}.pdf`;

        // Font koji podrzava slova naseg alfabeta
        const fontPath = path.join(__dirname, '../../public/fonts/dejavu-sans.book.ttf');
        doc.registerFont('DejaVu', fontPath);

        // Postavljanje fonta
        doc.font('DejaVu');

        // Zaglavlje dokumenta
        doc.fontSize(20).text(`Detalji prijave - ${application.first_name} ${application.last_name}`, { align: 'center' });
        doc.moveDown();

        // Info iz prijave
        doc.fontSize(12).text(`Email: ${application.email}`);
        doc.text(`Status prijave: ${application.application_status}`);
        doc.text(`Datum prijave: ${application.applied_at}`);
        doc.moveDown();

        // Licni podaci
        doc.fontSize(14).text('Lični podaci:', { underline: true });
        doc.fontSize(12).text(`Telefon: ${personalData.phone_number || 'N/A'}`);
        doc.text(`Adresa: ${personalData.address || 'N/A'}`);
        doc.text(`Datum rođenja: ${personalData.date_of_birth}`);
        doc.text(`O meni: ${personalData.about_me || 'N/A'}`);
        doc.moveDown();

        // Radno iskustvo
        doc.fontSize(14).text('Radno iskustvo:', { underline: true });
        workExperienceResult.rows.forEach((exp, index) => {
            doc.fontSize(12).text(`${index + 1}. ${exp.company_name} - ${exp.position}`);
            doc.text(`  Period: ${exp.start_date} - ${exp.end_date}`);
            doc.text(`  Opis: ${exp.description || 'N/A'}`);
            doc.moveDown();
        });

        // Obrazovanje
        doc.fontSize(14).text('Obrazovanje:', { underline: true });
        educationResult.rows.forEach((edu, index) => {
            doc.fontSize(12).text(`${index + 1}. ${edu.institution_name} - ${edu.degree} (${edu.field_of_study})`);
            doc.text(`  Period: ${edu.start_date} - ${edu.end_date}`);
            doc.moveDown();
        });

        // Ocjena i komentar
        doc.fontSize(14).text('Ocjena i komentar:', { underline: true });
        doc.fontSize(12).text(`Ocjena: ${review.score}`);
        doc.text(`Komentar: ${review.comments}`);
        doc.moveDown();

        // Završiti PDF dokument
        doc.end();

        // Slanje PDF-a kao odgovor
        res.setHeader('Content-Type', 'application/pdf'); // Da klijent/preglednik zna da je sadrzaj odg pdf tip
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`); //att-da ne prikazuje direktno, vec da ga preuzme
        doc.pipe(res); //Povezuje izlaz generisanog PDF dokumenta (doc) direktno sa HTTP odgovorom (res).
                        //pipe omogućava da se generisani sadržaj PDF-a šalje u realnom vremenu, bez potrebe za privremenim spremanjem na disk.
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Greška prilikom generisanja PDF-a.' });
    }
};



// Pregled poslova
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

        const jobs = jobsResult.rows.map(job => ({
            ...job,
            deadline: moment(job.deadline).format('DD.MM.YYYY')
        }));

        res.render('admin/candidates', { jobs, status: status || 'all', user: req.user });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Greška prilikom dohvaćanja poslova.' });
    }
};

// Sve prijave za odredjeni posao
const getJobApplications = async (req, res) => {
    const { jobId } = req.params;
    const { status, appliedDate } = req.query;

    try {
        if (isNaN(jobId)) {
            return res.status(400).json({ message: 'Neispravan ID posla.' });
        }

        let query = `
            SELECT 
                a.id AS application_id,
                a.applied_at,
                s.name AS application_status,
                u.id AS user_id,
                u.first_name,
                u.last_name,
                u.email
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN application_statuses s ON a.status_id = s.id
            WHERE a.job_id = $1
        `;
        let params = [jobId];

        if (status && status !== 'all') {
            query += ' AND s.name = $2';
            params.push(status);
        }

        if (appliedDate) {
            query += ' AND a.applied_at::date = $' + (params.length + 1);
            params.push(appliedDate);
        }

        const result = await pool.query(query, params);

        result.rows.forEach(application => {
            application.applied_at = moment(application.applied_at).format('DD.MM.YYYY');
        });

        if (result.rows.length === 0) {
            return res.render('admin/candidatesApplications', {
                message: 'Nema prijava za ovaj filter.',
                status,
                appliedDate,
                jobId,
                applications: result.rows,
                user: req.user
            });
        }

        res.render('admin/candidatesApplications', {
            applications: result.rows,
            user: req.user,
            jobId,
            status,
            appliedDate,
            message: ''
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška prilikom dohvaćanja prijava.' });
    }
};





// Detalji o kandidatu za odredjenu prijavu
const getApplicationDetails = async (req, res) => {
    const { jobId, applicationId } = req.params;

    try {
        if (isNaN(jobId) || isNaN(applicationId)) {
            return res.status(400).json({ message: 'Neispravan ID posla ili prijave.' });
        }

        const applicationQuery = `
            SELECT 
                a.id AS application_id,
                s.name AS application_status, 
                a.applied_at,
                u.id AS user_id,
                u.first_name,
                u.last_name,
                u.email
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN application_statuses s ON a.status_id = s.id 
            WHERE a.id = $1 AND a.job_id = $2;
        `;
        const applicationResult = await pool.query(applicationQuery, [applicationId, jobId]);

        if (applicationResult.rows.length === 0) {
            return res.status(404).json({ message: 'Prijava nije pronađena za odabrani posao.' });
        }

        const application = applicationResult.rows[0];
        application.applied_at = application.applied_at
            ? moment(application.applied_at).format('DD.MM.YYYY')
            : null;

        const personalDataQuery = `
            SELECT phone_number, address, date_of_birth, about_me
            FROM personal_data
            WHERE user_id = $1;
        `;
        const personalDataResult = await pool.query(personalDataQuery, [application.user_id]);
        const personalData = personalDataResult.rows[0] || null;

        if (personalData && personalData.date_of_birth) {
            personalData.date_of_birth = moment(personalData.date_of_birth).format('DD.MM.YYYY');
        }

        const workExperienceQuery = `
            SELECT company_name, position, start_date, end_date, description
            FROM work_experience
            WHERE user_id = $1;
        `;
        const workExperienceResult = await pool.query(workExperienceQuery, [application.user_id]);
        const workExperience = workExperienceResult.rows.map((experience) => ({
            ...experience,
            start_date: experience.start_date
                ? moment(experience.start_date).format('DD.MM.YYYY')
                : null,
            end_date: experience.end_date
                ? moment(experience.end_date).format('DD.MM.YYYY')
                : null,
        }));

        const educationQuery = `
            SELECT institution_name, degree, field_of_study, start_date, end_date
            FROM education
            WHERE user_id = $1;
        `;
        const educationResult = await pool.query(educationQuery, [application.user_id]);
        const education = educationResult.rows.map((edu) => ({
            ...edu,
            start_date: edu.start_date
                ? moment(edu.start_date).format('DD.MM.YYYY')
                : null,
            end_date: edu.end_date
                ? moment(edu.end_date).format('DD.MM.YYYY')
                : null,
        }));

        const applicationDetails = {
            ...application,
            personal_data: personalData,
            work_experience: workExperience,
            education: education,
        };

        res.render('admin/candidatesApplDetails', {
            application: applicationDetails,
            jobId: jobId,
            user: req.user,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Greška prilikom dohvaćanja detalja prijave.' });
    }
};


// Dodavanje ocjene i komentara za prijavu kandidata
const addReview = async (req, res) => {
    const { jobId, applicationId } = req.params;
    const { score, comments } = req.body;

    if (!score || score < 1 || score > 5 || !comments) {
        return res.status(400).json({ message: 'Ocjena mora biti između 1 i 5, a komentar je obavezan.' });
    }

    try {
        const applicationCheck = await pool.query(
            `SELECT * FROM applications WHERE id = $1 AND job_id = $2`,
            [applicationId, jobId]
        );

        if (applicationCheck.rowCount === 0) {
            return res.status(404).json({ message: 'Prijava nije pronađena.' });
        }

        const insertReview = `
            INSERT INTO reviews (application_id, score, comments)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await pool.query(insertReview, [applicationId, score, comments]);


        res.redirect(`/admin/candidates/jobs/${jobId}/applications/${applicationId}`);
    } catch (err) {
        console.error(err);

        res.redirect(`/admin/candidates/jobs/${jobId}/applications/${applicationId}`);
    }
};

// Rangiranje kandidata na osnovu ocjena
const getRankedCandidates = async (req, res) => {
    const { jobId } = req.params;

    try {
        const query = `
            SELECT 
                a.id AS application_id,
                u.first_name,
                u.last_name,
                r.score,
                r.comments
            FROM applications a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN reviews r ON a.id = r.application_id
            WHERE a.job_id = $1
            ORDER BY r.score DESC NULLS LAST;
        `;

        const result = await pool.query(query, [jobId]);

        res.render('admin/candidatesRanked', {
            jobId,
            candidates: result.rows,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Greška prilikom dohvaćanja rangiranih kandidata.');
    }
};

module.exports = { getJobApplications, getApplicationDetails, addReview, getRankedCandidates, getJobs, getApplicationPdf };



