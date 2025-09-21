const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'hrm_system',
    password: 'stolica',
    port: 5433,
});

pool.connect()
    .then(() => console.log('Konekcija na bazu uspješna!'))
    .catch(err => console.error('Greška pri povezivanju sa bazom:', err.stack));

module.exports = pool;
