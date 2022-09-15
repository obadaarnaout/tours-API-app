
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require("helmet");
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const appError = require('./utils/appErrors');
const errorHandler = require('./controllers/errorsController');

const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRoutes = require('./routes/reviewRoutes');


const app = express();
// set secure http requests
app.use(helmet());


if (process.env.NODE_ENV == 'development') {
    app.use(morgan('dev'));
}

// limit the requests
const limiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

app.all('*',limiter);

app.use(express.json());

// data sanitization 
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use(express.static(`${__dirname}/public`));

// Routes
app.use('/api/v1/users',userRouter);
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/reviews',reviewRoutes);

app.all('*',(req,res,next) => {
    next(new appError(404,'page not found'));
});

app.use(errorHandler);

module.exports = app;