const nodemailer = require('nodemailer');
const pool = require('../db');

// Kreiranje transportera za slanje emailova preko Gmail-a
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hrmsistem@gmail.com',
        pass: 'umaupsphuxpbxoai',
    },
});

// Funkcija za slanje emaila
const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: 'hrmsistem@gmail.com', // Pošiljalac
            to: to,
            subject: subject,
            text: text,
        };

        // Slanje emaila
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email poslan na ${to}: ${info.response}`);
    } catch (error) {
        console.error('Greška prilikom slanja emaila:', error);
        throw error;
    }
};

// Automatizovano slanje emailova na osnovu statusa prijave
const sendApplicationStatusEmail = async (applicationId) => {
    try {
        // Provjera da li prijava postoji
        const result = await pool.query('SELECT * FROM applications WHERE id = $1', [applicationId]);

        if (result.rowCount === 0) {
            throw new Error('Prijava nije pronađena.');
        }

        const application = result.rows[0];
        const userQuery = `
            SELECT u.first_name, u.last_name, u.email, j.title, j.company, s.name AS status_name, s.email_content
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN jobs j ON a.job_id = j.id
            JOIN application_statuses s ON a.status_id = s.id
            WHERE a.id = $1;
        `;
        const userResult = await pool.query(userQuery, [applicationId]);

        if (userResult.rowCount === 0) {
            throw new Error('Nema podataka o korisniku ili poslu.');
        }

        const { first_name, last_name, email, title, company, status_name, email_content } = userResult.rows[0];

        // Sastavi email
        const subject = `Status vaše prijave za poziciju "${title}" u kompaniji "${company}"`;
        const text = `
            Poštovani/a ${first_name} ${last_name},

            Vaša prijava za poziciju "${title}" u kompaniji "${company}" je u statusu "${status_name}".

            ${email_content}

            Srdačan pozdrav,
            Tim za zapošljavanje
        `;

        // Posalji email
        await sendEmail(email, subject, text);

    } catch (error) {
        console.error('Greška prilikom slanja emaila za status prijave:', error);
    }
};



module.exports = { sendEmail, sendApplicationStatusEmail };






