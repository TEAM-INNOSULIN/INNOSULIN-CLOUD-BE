var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
var mongoose = require('mongoose');
const createCronJob = require('./s3Cron');
dotenv.config();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Connect MongoDB with mongoose
const uri = 'mongodb+srv://' +
  process.env.MONGO_USERNAME + ':' +
  process.env.MONGO_PASSWORD + '@' +
  process.env.MONGO_HOST + '/' +
  'test?retryWrites=true&w=majority';

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000
}).catch(err => console.log(err.reason))
  .then( () => {
    console.log("[Express Server] MongoDB Connected");
    createCronJob();
  });

// Set Router
var indexRouter = require('./routes/index');
var fitbitRouter = require('./routes/fitbit');
var userRouter = require('./routes/user');

app.use('/', indexRouter);
app.use('/fitbit', fitbitRouter);
app.use('/user', userRouter);

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

app.listen(3000, function () {
  console.log('[Express Server] Server is listening : 3000');
});

module.exports = app;
