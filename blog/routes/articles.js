/**
 * Created by ASUS on 2017/3/6.
 */
var express = require('express');
var router = express.Router();
var middleware = require("../middleware/index");
var markdown = require('markdown').markdown;

//打开添加文章的页面
router.get('/add',middleware.checkLogin,function(req, res, next){
    console.log('发表文章页面');
    res.render("articles/addArticles",{title:"发表文章",keyword:req.session.keyword});
});
router.post('/add',middleware.checkLogin,function(req, res, next){
    console.log('提交博客的信息');
    var article = req.body;

    article.user = req.session.user._id;
    new Model("Article")(article).save(function (err,art) {
        if(err){
            //发表文章失败,转到发表页面
            return res.redirect("/articles/add")
        }
        //发表成功返回首页
        console.log(article);
        return res.redirect("/")
    })
});

router.get('/edit/:_id', function (req, res) {
    var id = req.params._id;
    Model('Article').findOne({_id:id},function(err,article){
        //添加权限判断，判断当前的登录
        if(req.session.user && req.session.user._id!==article.user){
            req.flash("error","你没有权限修改文章");
            res.redirect("/articles/detail"+article._id)
        }
        res.render('articles/edit',{title:'查看文章',article:article,keyword:req.session.keyword});
    });
});

router.post('/edit/:id',middleware.checkLogin,function(req, res, next){
    console.log('提交博客的信息');
    var article = req.body;
    Model("Article").update({_id:req.params._id},article,function (err,art) {
        if(err){

           req.flash("error","修改文章失败");
        }

        console.log(article);
        return res.redirect("/articles/detail"/+req.params._id);
    })
});

router.get('/detail/:_id', function (req, res) {
    var id = req.params._id;
    Model('Article').findOne({_id:id},function(err,article){
        article.content = markdown.toHTML(article.content);
        res.render('articles/detail',{title:'查看文章',article:article,keyword:req.session.keyword});
    });
});

router.get('/delete/:_id', function (req, res,next) {
    var id = req.params._id;
    Model('Article').remove({_id:id},function(err,article){
        if(!req.session.user && req.session.user._id!==article.user){
            req.flash('error',"删除文章失败");
            res.redirect('back');
        }
        req.flash('success', '删除文章成功!');
        res.redirect('/');//注册成功后返回主页
    });
});

router.all('/list/:pageNum/:pageSize',function(req, res, next) {
    //pageNum表示当前是第几页，默认值是第一页
    var pageNum = req.params.pageNum && req.params.pageNum>0?parseInt(req.params.pageNum):1;
    //pageSize  表示每一页有多少记录，默认2条
    var pageSize =req.params.pageSize && req.params.pageSize>0?parseInt(req.params.pageSize):2;
    var searchBtn = req.body.searchBtn;
    //搜索条件
    var query = {};
    //这种情况是只有是点了搜索按钮时，才能拿到keyword
    var keyword = req.body.keyword;
    if(searchBtn){
        //是点击了searchBtn按钮的，把关键字存到session中防止丢失
        req.session.keyword = keyword;
    }
    if(req.session.keyword){
        query['title'] = new RegExp(req.session.keyword,"ig");
    }

    //首先要知道这个搜索结果一共有多少条记录，方便计算页数
    Model('Article').count(query,function(err,count){
        console.log('count='+count+"oageCount="+count/pageSize+1);
        Model('Article').find(query)
            .sort({'createAt':-1})//按时间排倒序
            .skip((pageNum-1)*pageSize)//要查询第n页的数据就要跳过n-1页的数据
            .limit(pageSize).populate('user')
            .exec(function(err,articles){
            articles.forEach(function (article) {
                article.content = markdown.toHTML(article.content);
            });
            res.render('index',{
                title:'主页',
                pageNum:pageNum,
                pageSize:pageSize,
                keyword:req.session.keyword?req.session.keyword:'',
                // totalPage:Math.ceil(count/pageSize),
                articles:articles,
                count:count
            });
        });
    });
});

module.exports = router;