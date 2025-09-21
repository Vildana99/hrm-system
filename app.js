var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

var logger = require('morgan');

const session = require('express-session');

const flash = require('connect-flash');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var db = require('./db');

const registerRouter = require('./routes/auth/register');
const loginRouter = require('./routes/auth/login');
const logoutRouter = require('./routes/auth/logout');

const adminJobRouter = require('./routes/admin/jobs');
const adminCandidatesRouter = require('./routes/admin/candidates');
const adminCommunicationRouter = require('./routes/admin/communication');
const adminDashboardRouter = require('./routes/admin/dashboard');

const userJobRouter = require('./routes/user/jobs');
const userProfileRouter = require('./routes/user/profile');
const userApplicationsRouter = require('./routes/user/applications');
const userDashboardRouter = require('./routes/user/dashboard');

const staticRouter = require('./routes/static');

var app = express();

// Sesije omogucavaju da se npr podaci o prijavi korisnika ili stanje aplikacije sacuvaju izmedju razlicitih HTTP zahtjeva
app.use(session({
    secret: 'secret',
    resave: false, // sesija nece biti ponovo sacuvana ako nije modifikovana
    saveUninitialized: true // sesija će biti sacuvana čak i ako nisu postavljeni nikakvi podaci u sesiji
}));

// Za slanje poruka
app.use(flash());

// Middleware za method-override (Prema standardima HTML forme, samo GET i POST metode su podržane)
app.use(methodOverride('_method'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/auth/register', registerRouter);
app.use('/auth/login', loginRouter);
app.use('/auth/logout', logoutRouter);

app.use('/admin/jobs', adminJobRouter);
app.use('/admin/candidates', adminCandidatesRouter);
app.use('/admin/communication', adminCommunicationRouter);
app.use('/admin/dashboard', adminDashboardRouter);

app.use('/user/profile', userProfileRouter);
app.use('/user/jobs', userJobRouter);
app.use('/user/applications', userApplicationsRouter);
app.use('/user/dashboard', userDashboardRouter);

app.use('/static',staticRouter);

// test konekcije
db.query('SELECT NOW()')
    .then((result) => {
        console.log('Konekcija na bazu uspjesna. Trenutno vrijeme:', result.rows[0].now);
    })
    .catch((err) => {
        console.error('Greska prilikom konekcije:', err.stack);
    });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server pokrenut na http://localhost:${PORT}`));

module.exports = app;
