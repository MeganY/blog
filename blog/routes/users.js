var express = require('express');
var router = express.Router();
var middleware = require("../middleware/index");

/* GET users listing. */

//访问登录页面
router.get('/login', function(req, res, next) {
  console.log('打开登录页面');
  res.render('users/login',{"title":"登录",keyword:req.session.keyword})
});

//使用post方式提交登录信息
router.post('/login', function(req, res, next) {
    console.log('提交登录信息');
    var user = req.body;
    user.password = md5(user.password[0]);
    //查询数据库，找到是否由匹配的记录
    Model('User').findOne(user,function(err,user){
        if(user)
        {
            //用户登录成功，将用户的登录信息保存到session中
            req.flash("success","登录成功");
            req.session.user = user;//用户信息存入 session
            res.redirect('/');//登录成功后返回主页
        }
        req.flash('error',"用户名或密码错误");
        return res.redirect('/users/login');
    });
});

//打开注册页面
router.get('/reg',middleware.checkNotLogin,function(req, res, next){
    console.log('打开注册信息');
    res.render("users/reg",{title:"注册",keyword:req.session.keyword});

});
//提交注册信息
router.post('/reg', function(req, res, next){
    //获得用户提交的表单数据
    var user = req.body;
    console.log(user);
    if(user.password[0] !==user.password[1])
    {
        //密码和确认密码不一致
        req.flash('error',"两次密码不一致");
        //重定向到注册页面
        return res.redirect("/users/reg")
    }
    //删除确认密码的属性
    delete  user.password[1];
    //把密码加密
    user.password = md5(user.password[0]);
    //根据邮箱生成头像地址
    user.avatar = "https://secure.gravatar.com/avatar/"+md5(user.email)+"?s=80";//保存到数据库中
    //将user对象保存到数据库中
    new Model('User')(user).save(function(err,user){
        if(err){
             req.flash('error',"注册失败");
            return res.redirect('/users/reg');
        }
        //在session中保存用户的登录信息
        req.flash("success","注册成功");
        req.session.user = user;//用户信息存入 session
        res.redirect('/');//注册成功后返回主页
    })
});
//注销用户登录
router.get('/lagout', function(req, res, next){
    req.session.user = null;
    req.flash("success","用户登录已注销");
    res.redirect("/");
    console.log('退出登录');
});


function md5(val){
    return require('crypto').createHash('md5').update(val).digest('hex');
}
module.exports = router;



