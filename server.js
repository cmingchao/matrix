let express = require("express"),
    app = express(),
    morgan = require("morgan"), //记录日志
    bodyParser = require("body-parser"),
    session = require("express-session"),
    path = require("path"),
    ejs = require("ejs"),
    fs = require("fs"),
    pageControl = require("./controllers/page"),
    interfaceController = require("./controllers/interface"),
    component = require("./controllers/component");

//创建一个 Redis 客户端并连接到 Redis-Server
let redis = require("redis"),
    client = redis.createClient();
//注册 Redis 错误事件监听
client.on('error', function (err) {
    console.log('redis error event - ' + client.host + ':' + client.port + ' - ' + err);
});
/*缓存rfm*/
component.userGroupAnalysis().then(([data1, data2,data3]) => {
    let obj = {};
    data2.map(item => {
        obj[item.user_phone] = item;
    });
    data3.map(item => {
        obj[item.user_phone].times = item.times || '';
    });
    let data = data1.map(item => {
        item.money = obj[item.phone] ? obj[item.phone].money : '';
        item.times = obj[item.phone] ? obj[item.phone].times : '';
        item.date = obj[item.phone] ? obj[item.phone].date : '';
        item.time = obj[item.phone] ? obj[item.phone].time : '';
        item.store_name = obj[item.phone] ? obj[item.phone].store_name : '';
        item.retail_code = obj[item.phone] ? obj[item.phone].retail_code : '';
        item.retail_name = obj[item.phone] ? obj[item.phone].retail_name : '';
        return item;
    });
    client.select("3",()=>{
        client.set('rfmData', JSON.stringify(data));
        client.expire('rfmData', 24*60*60);
    });
}).catch(err=>{
    console.log("缓存rfm失败，原因："+err);
});
/*缓存品牌链分析*/
component.brandChainAnalysis();

let port = 8412;

app.listen(port, () => {
    "use strict";
    //服务器启动记录日志
    try {
        fs.appendFile("./logs/server-log.txt", "server running at clock: " +
            new Date().toLocaleString().toString() + "\n", function (err) {
            if (!err) console.log(`server is running on port ${port}`);
        });
    } catch (err) {
        //记录失败就失败了吧
    }
});
/*
 * 初始化session
 * */
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true, //需要初始化
    cookie: {
        //https请求设置为true
    }
}));
/*
 * 使用parser
 * */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
/*
 * 打印简要日志信息
 * */
app.use(morgan("dev"));
/*
 * 静态资源路径设置
 * */
app.use(express.static(__dirname + "/webApp"));
/*
 * ejs模板设置
 * */
app.set("views", path.join(__dirname, "views"));
app.engine(".html", ejs.__express);


/*
 * 路由控制
 * */
app.use(function (req, res, next) {
    /*访问权限控制*/
    //res.header("Access-Control-Allow-Origin","http://120.78.173.138");
    let html = /^\/html/,
        api = /^\/api/;
    /*配置文件访问权限*/
    if (req.url === "/" || req.url.match(html) || req.url.match(api)) {
        /*用户调用登陆接口: pass*/
        if (req.url === "/api/login") {
            next();
        }
        /*cookie未过期: pass*/
        else if (req.session.cookie.expires) {
            req.session.cookie.expires = new Date(Date.now() + 30 * 60 * 1000);//30分钟
            next();
        }
        /*请求html页面且cookie已过期: reject*/
        else if (req.method.toLowerCase() === "get") {
            res.render("login.html", {errmsg: "登录已过期!"});
        }
        /*请求接口且cookie已过期*/
        else {
            res.send({
                errcode: -1,
                errmsg: "登录已过期!",
                data: []
            });
        }
    }
    /*无权限的访问请求,返回404*/
    else {
        res.render("404.html");
    }
});

function loop(menus, url) {
    for (let key in menus) {
        menus[key].chosen = false;
        if (menus[key].children) {
            loop(menus[key].children, url);
        } else {
            menus[key].chosen = (menus[key].interface == url);
        }
    }
}

app.use((req, res, next) => {
    let menus = req.session.menus,
        url = req.url;
    if (menus) {
        loop(menus, url);
    }
    next();
});

//页面控制器
app.get('/', (req, res) => {
    "use strict";
    res.redirect("/html/index");
});
app.get('/html/login', pageControl.login);
app.get('/html/userCenter', pageControl.userCenter);

app.get('/html/index', pageControl.index);
app.get('/html/realTimeDynamics', pageControl.realTimeDynamics);

app.get('/html/brandLib', pageControl.brandLib);
app.get('/html/brandRelation', pageControl.brandRelation);
app.get('/html/brandRelationSecond', pageControl.brandRelationSecond);
app.get('/html/brandRelationThird', pageControl.brandRelationThird);
app.get('/html/brandList', pageControl.brandList);
app.get('/html/brandSale', pageControl.brandSale);
app.get('/html/addBrand', pageControl.addBrand);
app.get('/html/brandDetails', pageControl.brandDetails);

app.get('/html/userLib', pageControl.userLib);
app.get('/html/userAnalysis', pageControl.userAnalysis);
app.get('/html/userGroup', pageControl.userGroup);
app.get('/html/userList', pageControl.userList);
app.get('/html/userDetails', pageControl.userDetails);
app.get('/html/addUser', pageControl.addUser);

/*新增*/
app.get('/html/recommendSet', pageControl.recommendSet);
app.get('/html/operateLog', pageControl.operateLog);
app.get('/html/userManage', pageControl.userManage);
app.get('/html/resourceManage', pageControl.resourceManage);
app.get('/html/roleManage', pageControl.roleManage);
app.get('/html/userManageSecond', pageControl.userManageSecond);
app.get('/html/resourceManageSecond', pageControl.resourceManageSecond);
app.get('/html/roleManageSecond', pageControl.roleManageSecond);

/*接口*/
/*登录*/
app.post("/api/login", interfaceController.login);
/*退出登录*/
app.post("/api/logout", interfaceController.logout);
/*修改用户名*/
app.post("/api/updateUsername", interfaceController.updateUsername);
/*修改用户密码*/
app.post("/api/updatePassword", interfaceController.updatePassword);

/*index*/
/*客流及销售概览*/
app.post("/api/customerAndSales", interfaceController.customerAndSales);
/*实时推荐*/
app.post("/api/realTimeRecommend", interfaceController.realTimeRecommend);
/*实时核销*/
app.post("/api/realTimeVerificate", interfaceController.realTimeVerificate);
/*实时动态*/
app.post("/api/realTimeDynamics", interfaceController.realTimeDynamics);
/*触达率*/
app.post("/api/touchRate", interfaceController.touchRate);
/*核销数和总销售额*/
app.post("/api/verificateNumbersAndtotalSales", interfaceController.verificateNumbersAndtotalSales);

/*brand*/
/*添加品牌*/
app.post("/api/addBrand", interfaceController.addBrand);
/*筛选品牌*/
app.post("/api/screenBrandList", interfaceController.screenBrandList);
/*品牌销售统计*/
app.post("/api/brandSaleStatistics", interfaceController.brandSaleStatistics);
/*引流排行*/
app.post("/api/fifthDrainage", interfaceController.fifthDrainage);
/*获客排行*/
app.post("/api/fifthGuest", interfaceController.fifthGuest);
/*转化率排行*/
app.post("/api/fifthTransmutation", interfaceController.fifthTransmutation);
/*品牌链分析*/
app.post("/api/brandDataStatistics", interfaceController.brandDataStatistics);
/*品牌关联*/
app.post("/api/brandRelation", interfaceController.brandRelation);
/*品牌链潜客*/
app.post("/api/potentialCustomer", interfaceController.potentialCustomer);
/*品牌标签潜客*/
app.post("/api/labelPotentialCustomer", interfaceController.labelPotentialCustomer);
/*筛选品牌销量统计*/
app.post("/api/screenBrandSale", interfaceController.screenBrandSale);
/*品牌基本信息*/
app.post("/api/brandDetailsBasicInfo", interfaceController.brandDetailsBasicInfo);
/*品牌今日相关*/
app.post("/api/brandDetailsToday", interfaceController.brandDetailsToday);
/*品牌详情性别比例*/
app.post("/api/brandDetailsUserSex", interfaceController.brandDetailsUserSex);
/*品牌详情年龄分布*/
app.post("/api/brandDetailsUserAge", interfaceController.brandDetailsUserAge);
/*品牌推送及核销详情*/
app.post("/api/brandVerify", interfaceController.brandVerify);
/*品牌综合指数*/
app.post("/api/brandComposite", interfaceController.brandComposite);


/*user*/
/*用户库概览*/
app.post("/api/userLibOverview", interfaceController.userLibOverview);
/*用户库用户来源概览*/
app.post("/api/userLibUserFrom", interfaceController.userLibUserFrom);
/*用户库用户性别概览*/
app.post("/api/userLibUserSex", interfaceController.userLibUserSex);
/*用户库用户年龄概览*/
app.post("/api/userLibUserAge", interfaceController.userLibUserAge);
/*用户库用户婚姻状况概览*/
app.post("/api/userLibUserMarriage", interfaceController.userLibUserMarriage);
/*筛选用户*/
app.post("/api/screenUserList", interfaceController.screenUserList);
/*用户详情*/
app.post("/api/userDetailsBasicInfo", interfaceController.userDetailsBasicInfo);
/*用户消费列表*/
app.post("/api/userCostList", interfaceController.userCostList);
/*用户近三月行踪轨迹*/
app.post("/api/userCostRoute", interfaceController.userCostRoute);
/*用户推送及核销情况*/
app.post("/api/userPushApply", interfaceController.userPushApply);
/*用户RFM分析*/
app.post("/api/userGroupAnalysis", interfaceController.userGroupAnalysis);
/*添加用户*/
app.post("/api/addUser", interfaceController.addUser);
/*用户综合指数*/
app.post("/api/userComposite", interfaceController.userComposite);
/*用户偏好品牌*/
app.post("/api/userHobbyBrand", interfaceController.userHobbyBrand);
/*用户潜在偏好品牌*/
app.post("/api/userPotentialHobbyBrand", interfaceController.userPotentialHobbyBrand);

/****************************新增****************************/
/*推荐设置*/
//获取置顶推荐和主打推荐
app.post('/api/getRecommendBrand', interfaceController.getRecommendBrand);
//获取置顶推荐品牌基本信息
app.post('/api/topBrandBasicInfo', interfaceController.topBrandBasicInfo);
// 弹出模态框根据查询条件获取品牌
app.post('/api/getBrand', interfaceController.getBrand);
// 设置置顶推荐
app.post('/api/setTopRecommend', interfaceController.setTopRecommend);
// 设置主打推荐
app.post('/api/setMainRecommend', interfaceController.setMainRecommend);

/*操作日志*/
// 初始化获取操作人员列表
app.post('/api/operateUser', interfaceController.operateUser);
// 操作日志
app.post('/api/operateLog', interfaceController.operateLog);

/*用户管理*/
// 用户管理列表
app.post('/api/userManageList', interfaceController.userManageList);
// 新增管理员
app.post('/api/addManager', interfaceController.addManager);
// 修改管理员
app.post('/api/updateManager', interfaceController.updateManager);
// 获取管理员信息
app.post('/api/getManagerInfo', interfaceController.getManagerInfo);
// 删除管理员信息
app.post('/api/deleteManagerInfo', interfaceController.deleteManagerInfo);
// 获取用户角色列表
app.post('/api/getUserRoleList', interfaceController.getUserRoleList);
// 更新用户角色
app.post('/api/updateUserRole', interfaceController.updateUserRole);

/*资源管理*/
// 资源管理列表
app.post('/api/resourceManageList', interfaceController.resourceManageList);
// 删除某一资源
app.post('/api/deleteResource', interfaceController.deleteResource);
// 添加资源
app.post('/api/addResource', interfaceController.addResource);
// 获取资源信息
app.post('/api/getResourceInfo', interfaceController.getResourceInfo);
// 修改资源
app.post('/api/updateAuthResource', interfaceController.updateAuthResource);
// 获取父亲资源下拉列表
app.post('/api/getParentResourceList', interfaceController.getParentResourceList);

/*角色管理*/
// 获取角色列表
app.post('/api/roleManageList', interfaceController.roleManageList);
// 删除某一角色类型
app.post('/api/deleteRole', interfaceController.deleteRole);
// 新增某一角色类型
app.post('/api/addRole', interfaceController.addRole);
// 获取某一角色类型信息
app.post('/api/getRoleInfo', interfaceController.getRoleInfo);
// 修改某一角色类型
app.post('/api/updateRole', interfaceController.updateRole);
// 获取资源列表
app.post('/api/getResourceList', interfaceController.getResourceList);
// 更新资源
app.post('/api/updateResource', interfaceController.updateResource);


/*未找到*/
app.get("*", (req, res) => {
    "use strict";
    res.render("404.html");
});
app.post("*", (req, res) => {
    "use strict";
    res.send({
        errcode: 1,
        errmsg: "请求路径未找到!",
        data: []
    });
});