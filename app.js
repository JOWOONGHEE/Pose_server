//패키지 임포트
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors=require('cors')
require('dotenv').config()





const app = express();
const mongoose = require('mongoose')

//CORS 옵션
let corsOptions={
  origin:[
    'http://localhost:3000',
    'https://pose-client-test2.vercel.app'
  ],
  credentials:true
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(cors(corsOptions))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//몽고db셋업
mongoose.Promise = global.Promise
dbUrl = process.env.REACT_APP_MONGODB_URL
mongoose.connect(dbUrl, {useNewUrlParser: true})
mongoose.set('strictQuery', false)
const db = mongoose.connection
//d
db.on('connected', function () {
  console.log('server connected')
})
db.on('error', console.error)
db.on('open', function () {
  console.log('connected to mongo server ' + dbUrl)
})
db.on('disconnect', function () {
  console.log('disconnected from mongo server' + dbUrl)
})


//db 컬렉션 임포트
require('./models/user')
require('./models/index')

//라우터 임포트
const indexRouter = require('./routes/indexs');
const usersRouter = require('./routes/users');

//라우터 설정
app.use('/index', indexRouter);
app.use('/user', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
