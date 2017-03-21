var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var db = require('./db');
var settings = require('./settings');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

//设置我们的app应用的路由架构，引入各个功能模块对应的导航模块
var index = require('./routes/index');
var users = require('./routes/users');
var articles = require('./routes/articles');
var flash = require('connect-flash');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
  secret:settings.cookieSecret,//对cookie加密，防止篡改cookie
  key:settings.db,//key为cookie中保存的键值
  cookie:{maxAge:1000*60*60*24*30},//设置cookie的有效时间
  resave:true,
  saveUninitialized:true,//是否保存未初始化状态
  store:new MongoStore({
    //设置session的信息保存到数据库中
    //   db:settings.db,
    //   host:settings.host,
    //   port:settings.port
      url:settings.url
  })
}))

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//用bodyParser解析post请求提交的数据
app.use(bodyParser.json());//解析json数据
//解析普通的数据  解析过后的数据放在req.body
app.use(bodyParser.urlencoded({ extended: false }));
//获取cookie
app.use(cookieParser());
//设置静态资源的路由
app.use(express.static(path.join(__dirname, 'public')));

//给request对象添加flash功能
app.use(flash());

//添加一个中间件，用来处理flash消息
app.use(function (req,res,next) {
  res.locals.user = req.session.user;
  //是将session中保存的文件flah信息复制到response对象的locals属性中，这样才能在模板上显示信息
   res.locals.error = req.flash('error').toString();
    res.locals.success = req.flash('success').toString();
    //调用next()放行请求
    next();
});

//路由映射  路由的设定应该遵循Restful设计原则
app.use('/', index);
app.use('/users', users);
app.use('/articles', articles);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
