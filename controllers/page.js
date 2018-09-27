let path = "../webApp/lib/";

//登录页面
exports.login = (req, res) => {
    "use strict";
    res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
};

//个人中心页面
exports.userCenter = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = "个人中心";
    menus.index.chosen = true;
    res.render("./userCenter.html", {path: path, menu: menus, username: req.session.user.username, map: name});
};

/*首页板块*/
//首页
exports.index = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
        if(menus.index){
            let name = menus.index.name;
            menus.index.chosen = true;
            res.render("./index/index.html", {path: path, menu: menus, username: req.session.user.username, map: name});
        }else {
            res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
        }

};

/*实时动态*/
exports.realTimeDynamics = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = "实时动态";
    menus.index.chosen = true;
    res.render("./index/realTimeDynamics.html", {
        menu: menus,
        username: req.session.user.username,
        map: {name: name, back: true}
    });
};

/*品牌板块*/
//品牌库
exports.brandLib = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
    if (menus.brandLib.children.brandLib) {
        let name = menus.brandLib.children.brandLib.name;
        menus.brandLib.chosen = true;
        menus.brandLib.children.brandLib.chosen = true;
        res.render("./brand/brandLib.html", {menu: menus, username: req.session.user.username, map: name});
    } else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }

};

/*品牌关联图*/
exports.brandRelation = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
    if (menus.brandLib.children.brandRelation) {
        let name = menus.brandLib.children.brandRelation.name;
        menus.brandLib.chosen = true;
        menus.brandLib.children.brandRelation.chosen = true;
        res.render("./brand/brandRelation.html", {menu: menus, username: req.session.user.username, map: name});
    } else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }

};

/*品牌关联图-第二级*/
exports.brandRelationSecond = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = req.query.brandName + "品牌关联信息";
    if (!req.query.brandName) res.render("404.html");
    else {
        menus.brandLib.chosen = true;
        menus.brandLib.children.brandRelation.chosen = true;
        res.render("./brand/brandRelation-second.html", {
            menu: menus,
            username: req.session.user.username,
            map: {name: name, back: true}
        });
    }
};

/*品牌关联图-第三级*/
exports.brandRelationThird = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = req.query.brandName + "品牌关联信息";
    menus.brandLib.chosen = true;
    menus.brandLib.children.brandRelation.chosen = true;
    res.render("./brand/brandRelation-third.html", {
        menu: menus,
        username: req.session.user.username,
        map: {name: name, back: true}
    });
};

/*品牌列表*/
exports.brandList = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
    if(menus.brandLib.children.brandList){
        let name = menus.brandLib.children.brandList.name;
        menus.brandLib.chosen = true;
        menus.brandLib.children.brandList.chosen = true;
        res.render("./brand/brandList.html", {menu: menus, username: req.session.user.username, map: name});
    }else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }

};

/*品牌销量统计*/
exports.brandSale = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
    if(menus.brandLib.children.brandSale){
        let name = menus.brandLib.children.brandSale.name;
        menus.brandLib.chosen = true;
        menus.brandLib.children.brandSale.chosen = true;
        res.render("./brand/brandSale.html", {menu: menus, username: req.session.user.username, map: name});
    }else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }

};

/*添加品牌*/
exports.addBrand = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = "品牌添加";
    menus.brandLib.chosen = true;
    menus.brandLib.children.brandList.chosen = true;
    res.render("./brand/addBrand.html", {menu: menus, username: req.session.user.username, map: name, back: true});
};

/*品牌详情*/
exports.brandDetails = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = "品牌详情";
    menus.brandLib.chosen = true;
    menus.brandLib.children.brandList.chosen = true;
    res.render("./brand/brandDetails.html", {
        menu: menus,
        username: req.session.user.username,
        map: {name: name, back: true}
    });
};

/*用户板块*/
/*用户库*/
exports.userLib = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = menus.userLib.name;
    menus.userLib.chosen = true;
    if(menus.userLib.children.userLib){
        menus.userLib.children.userLib.chosen = true;
        res.render("./user/userLib.html", {menu: menus, username: req.session.user.username, map: name});
    }else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }

};

/*userAnalysis*/
exports.userAnalysis = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
    if(menus.userLib.children.userAnalysis){
        let name = menus.userLib.children.userAnalysis.name;
        menus.userLib.chosen = true;
        menus.userLib.children.userAnalysis.chosen = true;
        res.render("./user/userAnalysis.html", {menu: menus, username: req.session.user.username, map: name});
    }else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }

};

/*userGroup*/
exports.userGroup = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = "聚类用户分析";
    menus.userLib.chosen = true;
    menus.userLib.children.userAnalysis.chosen = true;
    res.render("./user/userGroup.html", {
        menu: menus,
        username: req.session.user.username,
        map: {name: name, back: true}
    });
};

/*用户列表*/
exports.userList = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
    if(menus.userLib.children.userList){
        let name = menus.userLib.children.userList.name;
        menus.userLib.chosen = true;
        menus.userLib.children.userList.chosen = true;
        res.render("./user/userList.html", {menu: menus, username: req.session.user.username, map: name});
    }else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }

};

/*用户详情*/
exports.userDetails = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = "用户详情";
    menus.userLib.chosen = true;
    menus.userLib.children.userList.chosen = true;
    res.render("./user/userDetails.html", {
        menu: menus,
        username: req.session.user.username,
        map: {name: name, back: true}
    });
};

/*添加用户*/
exports.addUser = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = "用户添加";
    menus.userLib.chosen = true;
    menus.userLib.children.userList.chosen = true;
    res.render("./user/addUser.html", {menu: menus, username: req.session.user.username, map: name});
};

/*效果评估板块*/
/*效果评估*/
exports.effect = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = menus.effect.name;
    menus.effect.chosen = true;
    res.render("./effect/effect.html", {menu: menus, username: req.session.user.username, map: name});
};

/****************************推荐设置****************************/
exports.recommendSet = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
    if(menus.brandLib.children.recommendSet){
        let name = menus.brandLib.children.recommendSet.name;
        menus.brandLib.chosen = true;
        menus.brandLib.children.recommendSet.chosen = true;
        res.render("./brand/recommendSet.html", {menu: menus, username: req.session.user.username, map: name});
    }else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }

};

/*操作日志*/
exports.operateLog = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = menus.operateLog.name;
    menus.operateLog.chosen = true;
    res.render("./operateLog/operateLog.html", {
        path: path,
        menu: menus,
        username: req.session.user.username,
        map: name
    });
};

/*用户管理*/
exports.userManage = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
    if(menus.systemManage.children.userManage){
        let name = menus.systemManage.children.userManage.name;
        menus.systemManage.chosen = true;
        menus.systemManage.children.userManage.chosen = true;
        res.render("./systemManage/userManage.html", {menu: menus, username: req.session.user.username, map: name});
    }else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }


};

/*资源管理*/
exports.resourceManage = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
    if(menus.systemManage.children.resourceManage){
        let name = menus.systemManage.children.resourceManage.name;
        menus.systemManage.chosen = true;
        menus.systemManage.children.resourceManage.chosen = true;
        res.render("./systemManage/resourceManage.html", {menu: menus, username: req.session.user.username, map: name});
    }else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }


};

/*角色管理*/
exports.roleManage = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus;
    if(menus.systemManage.children.roleManage){
        let name = menus.systemManage.children.roleManage.name;
        menus.systemManage.chosen = true;
        menus.systemManage.children.roleManage.chosen = true;
        res.render("./systemManage/roleManage.html", {menu: menus, username: req.session.user.username, map: name});
    }else {
        res.render("login.html", {errmsg: "请登录!", upath: "/matrix"});
    }

};

/*用户管理二级页面*/
exports.userManageSecond = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = "新增管理员";
    menus.systemManage.chosen = true;
    menus.systemManage.children.userManage.chosen = true;
    res.render("./systemManage/userManage-second.html", {menu: menus, username: req.session.user.username, map: name});
};

/*资源管理二级页面*/
exports.resourceManageSecond = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = "新增资源";
    menus.systemManage.chosen = true;
    menus.systemManage.children.resourceManage.chosen = true;
    res.render("./systemManage/resourceManage-second.html", {
        menu: menus,
        username: req.session.user.username,
        map: name
    });
};

/*角色管理二级页面*/
exports.roleManageSecond = (req, res) => {
    "use strict";
    /*菜单*/
    let menus = req.session.menus,
        name = "新增角色";
    menus.systemManage.chosen = true;
    menus.systemManage.children.roleManage.chosen = true;
    res.render("./systemManage/roleManage-second.html", {menu: menus, username: req.session.user.username, map: name});
};
