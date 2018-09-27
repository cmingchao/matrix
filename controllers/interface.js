let config = require("./config"),
    component = require("./component");
//创建一个 Redis 客户端并连接到 Redis-Server
let redis = require("redis"),
    client = redis.createClient();
//登录
exports.login = (req, res) => {
    "use strict";
    let username = req.body.username,
        password = req.body.password;
    /*参数有误*/
    if (!username || !password) {
        return res.send(config.params_error);
    }
    let pass_md5 = config.encrypt(password),
        sql = `SELECT id,account,password from sys_user where account=?`;
    config.userHandle(sql, [username]).then(
        data => {
            let res_err = {
                errcode: 1,
                data: []
            };
            /*有数据*/
            if (data.length > 0) {
                /*防止数据库有重复数据,取第一条*/
                let user = data[0];
                /*密码正确*/
                if (user.password === pass_md5) {
                    req.session.cookie.expires = new Date(Date.now() + 30 * 60 * 1000);//30分钟
                    //缓存登录用户信息
                    req.session.user = {
                        id: data[0].id,
                        username: data[0].account
                    };

                    let sql_insert = `SELECT su.id user_id,su.account account,sur.sys_role_id role_id,sra.sys_auth_id auth_id,sa.auth_code auth_code,sa.auth_name auth_name 
                    from sys_user su
                    LEFT JOIN sys_user_role sur ON su.id=sur.sys_user_id
                    LEFT JOIN sys_role_auth sra ON sur.sys_role_id=sra.sys_role_id
                    LEFT JOIN sys_auth sa on  sra.sys_auth_id=sa.id
                    WHERE su.id=${data[0].id}`;
                    config.userHandle(sql_insert, []).then(data => {
                        let authIdList = data.map(item => item.auth_id);
                        let authCodeList = data.map(item => item.auth_code);
                        let menuJs = require("./menus");
                        let menus = menuJs.getMenu();

                        loop(menus);

                        function loop(menus) {
                            for (let key in menus) {
                                let hasMenu = authIdList.filter(item => {
                                    return item === menus[key].id;
                                });
                                if (!hasMenu.length) delete menus[key];
                                else if (menus[key].children) {
                                    loop(menus[key].children)
                                }
                            }
                        }

                        req.session.menus = menus;
                        res.send({
                            errcode: 0,
                            errmsg: "登录成功!",
                            data: data
                        });
                    });
                }
                /*密码错误*/
                else {
                    res_err.errmsg = "密码错误!";
                    res.send(res_err);
                }
            } else {
                res_err.errmsg = "无该用户!";
                res.send(res_err);
            }
        }
    ).catch(err => {
        config.pro_error("login", err, res);
    });
};

/*退出登录*/
exports.logout = (req, res) => {
    "use strict";
    req.session.cookie.expires = null;
    res.send({
        errcode: 0,
        errmsg: "退出登录成功!",
        data: []
    });
};

/*更改账号*/
exports.updateUsername = (req, res) => {
    "use strict";
    let id = req.session.user.id,
        username = req.body.username;
    /*参数有误*/
    if (!id || !username) {
        return res.send(config.params_error);
    }
    let sql = `update sys_user set account="${username}" where id=${id}`;
    config.userHandle(sql, []).then(
        data => {
            if (data.affectedRows === 1) {
                /*更新session中的用户名*/
                req.session.user.username = username;
                res.send({
                    errcode: 0,
                    errmsg: "更新用户名成功!",
                    data: []
                });
            } else {
                res.send({
                    errcode: 1,
                    errmsg: "更新用户名失败!",
                    data: []
                });
            }
        }
    ).catch(err => {
        config.pro_error("updateUsername", err, res);
    });
};

/*更改密码*/
exports.updatePassword = (req, res) => {
    "use strict";
    let id = req.session.user.id,
        password = req.body.password,
        pass_new = req.body.pass_new,
        pass_again = req.body.pass_again;
    /*参数有误*/
    if (!id || !password || !pass_new || !pass_again) {
        return res.send(config.params_error);
    }
    let password_md5 = config.encrypt(password), //加密后的原始密码
        pass_new_md5 = config.encrypt(pass_new), //加密后的新密码
        sql = `update sys_user set password="${pass_new_md5}" where id=${id} and password="${password_md5}"`;
    config.userHandle(sql, []).then(
        data => {
            /*更新成功*/
            if (data.affectedRows === 1) {
                res.send({
                    errcode: 0,
                    errmsg: "更新密码成功!",
                    data: []
                });
            } else {
                res.send({
                    errcode: 1,
                    errmsg: "更新密码失败!",
                    data: []
                });
            }
        }
    ).catch(err => {
        config.pro_error("updatePassword", err, res);
    });
};

/*实时动态列表*/
exports.realTimeDynamics = (req, res) => {
    "use strict";
    let pageItems = req.body.pageItems || 7,  //*每页多少条数据，默认7条*/
        pageIndex = (+req.body.pageIndex - 1) * pageItems || 0;//默认获取第一页**/
    let sql = `
SELECT t1.*,mu.name 
from (SELECT user_phone phone, DATE_FORMAT(mr.time,"%Y-%m-%d %H:%i:%s") time,
mr.goods_name, mr.number from mtx_record mr WHERE user_phone is not null ORDER BY time DESC) t1
LEFT JOIN mtx_user mu on t1.phone = mu.phone
where mu.name is not null
LIMIT ${pageIndex},${pageItems}
`;
    let p1 = config.userHandle(sql, []);
    p1.then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取动态消息列表成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("realTimeDynamics", err, res);
    });
};

/*销售及客流概览*/
exports.customerAndSales = (req, res) => {
    "use strict";
    let condition_today = `now())=0`,
        condition_yesterday = `now())=-1`,
        condition_month = `7)= LEFT(now(),7)`,
        /*今日销售额*/
        sql_s_today = ` SELECT round(sum(amount),2) amount
                        from mtx_record
                        where datediff(time,${condition_today}`, /*DATEDIFF() 函数返回两个日期之间的时间间隔，是一个数字。*/
        /*昨日销售额*/
        sql_s_yesterday = ` select round(sum(amount),2) amount
                            from mtx_record
                            where datediff(time,${condition_yesterday}`,
        /*本月销售额*/
        sql_s_month = `select round(sum(amount),2) amount 
from mtx_record  where left(time,${condition_month}`,
        /*今日客流*/
        /*客流计算规则:  有手机号的不计算重复客流,无手机号的一条记录算一个客流*/
        sql_c_today = `select sum(t.user) amount from
                    (
                        select count(user_phone) user from mtx_record
                        where user_phone is not null and user_phone<>'' and datediff(time,${condition_today}
                        UNION ALL
                        select count(id) user from mtx_record
                        where (user_phone is NULL or user_phone="") and datediff(time,${condition_today}
                        UNION ALL
                        select sum(probe_num) user from mtx_probe_record where datediff(probe_time,${condition_today}
                    ) t`,
        /*昨日客流*/
        sql_c_yesterday = `select sum(t.user) amount from
                    (
                        select count(user_phone) user from mtx_record
                        where user_phone is not null and user_phone<>'' and datediff(time,${condition_yesterday}
                        UNION ALL
                        select count(id) user from mtx_record
                        where (user_phone is NULL or user_phone="") and datediff(time,${condition_yesterday}
                        UNION ALL
                        select sum(probe_num) user from mtx_probe_record where datediff(probe_time,${condition_yesterday}
                    ) t`,
        /*本月客流*/
        sql_c_month = `select sum(t.user) amount from
                    (
                        select count(user_phone) user from mtx_record
                        where user_phone is not null and user_phone<>'' and left(time,${condition_month}
                        UNION ALL
                        select count(id) user from mtx_record
                        where (user_phone is NULL or user_phone="") and left(time,${condition_month}
                        UNION all
                        select sum(total_num) user from mtx_brand_month_record where left(record_time,${condition_month}
                        UNION all
                        select sum(probe_num) user from mtx_probe_record where left(probe_time,${condition_month}
                    ) t`,
        pro_s_today = config.userHandle(sql_s_today, []),
        pro_s_yesterday = config.userHandle(sql_s_yesterday, []),
        pro_s_month = config.userHandle(sql_s_month, []),
        pro_c_today = config.userHandle(sql_c_today, []),
        pro_c_yesterday = config.userHandle(sql_c_yesterday, []),
        pro_c_month = config.userHandle(sql_c_month, []);

    Promise.all([pro_s_today, pro_s_yesterday, pro_s_month, pro_c_today, pro_c_yesterday, pro_c_month])
        .then(
            ([s_today, s_yesterday, s_month, c_today, c_yesterday, c_month]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取客流及销售概览成功!",
                    data: {
                        s_today: s_today[0].amount || 0,
                        s_yesterday: s_yesterday[0].amount || 0,
                        s_month: s_month[0].amount || 0,
                        c_today: c_today[0].amount || 0,
                        c_yesterday: c_yesterday[0].amount || 0,
                        c_month: c_month[0].amount || 0
                    }
                });
            }
        ).catch(err => {
        config.pro_error("customerAndSales", err, res);
    });
};

/*实时推荐*/
exports.realTimeRecommend = (req, res) => {
    "use strict";
    /*今日推荐*/
    let sql_s_today = `SELECT SUM( md.num) amount 
                     FROM mtx_drainage md 
                     WHERE DATE_FORMAT(md.update_time,'%Y%m%d') =  DATE_FORMAT(now(),'%Y%m%d') and type=1`,
        /*昨日推荐*/
        sql_s_yesterday = ` SELECT SUM(md.num) amount 
                         FROM mtx_drainage md 
                         WHERE DATE_FORMAT(md.update_time,'%Y%m%d') = date_sub(str_to_date(DATE_FORMAT(NOW(),'%Y%m%d'), '%Y%m%d'),INTERVAL 1 DAY) and type=1`,
        /*当月推荐*/
        sql_s_month = `SELECT SUM(md.num) amount 
                     FROM mtx_drainage md 
                     WHERE DATE_FORMAT(md.update_time,'%Y%m') =  DATE_FORMAT(now(),'%Y%m') and type=1`,
        pro_s_today = config.userHandle(sql_s_today, []),
        pro_s_yesterday = config.userHandle(sql_s_yesterday, []),
        pro_s_month = config.userHandle(sql_s_month, []);
    Promise.all([pro_s_today, pro_s_yesterday, pro_s_month])
        .then(
            ([s_today, s_yesterday, s_month]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取实时推荐成功!",
                    data: {
                        s_today: s_today[0].amount || 0,
                        s_yesterday: s_yesterday[0].amount || 0,
                        s_month: s_month[0].amount || 0
                    }
                });
            }
        ).catch(err => {
        config.pro_error("realTimeRecommend", err, res);
    });
};

/*实时核销*/
/*DATEDIFF() 函数返回两个日期之间的天数。结果是一个数*/
/*now()返回当前时间,显示格式是‘YYYY-MM-DD HH:MM:SS’*/

exports.realTimeVerificate = (req, res) => {
    /*今日核销*/
    let sql_s_today = `SELECT count(1) count 
                     FROM mtx_record r 
                     WHERE DATE_FORMAT(r.time,'%Y%m%d') =  DATE_FORMAT(now(),'%Y%m%d') AND r.use_voucher=1`,
        /*昨日核销*/
        sql_s_yesterday = `SELECT count(1) count 
                    FROM mtx_record r 
                    WHERE DATE_FORMAT(r.time,'%Y%m%d') = date_sub(str_to_date(DATE_FORMAT(NOW(),'%Y%m%d'), '%Y%m%d'),INTERVAL 1 DAY) AND r.use_voucher=1`,
        /*当月核销*/
        sql_s_month = `SELECT count(1) count  
                     FROM mtx_record r 
                     WHERE DATE_FORMAT(r.time,'%Y%m') =  DATE_FORMAT(now(),'%Y%m') AND r.use_voucher=1`,
        pro_s_today = config.userHandle(sql_s_today, []),
        pro_s_yesterday = config.userHandle(sql_s_yesterday, []),
        pro_s_month = config.userHandle(sql_s_month, []);

    Promise.all([pro_s_today, pro_s_yesterday, pro_s_month])
        .then(
            ([s_today, s_yesterday, s_month]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取实时核销成功!",
                    data: {
                        s_today: s_today[0].count || 0,
                        s_yesterday: s_yesterday[0].count || 0,
                        s_month: s_month[0].count || 0
                    }
                });
            }
        ).catch(err => {
        config.pro_error("realTimeVerificate", err, res);
    });
};


/*品牌销售统计*/
exports.brandSaleStatistics = (req, res) => {
    "use strict";
    let pro_brand = component.getBrandsOfRetail(), /*业态分类下的品牌总数*/
        pro_record = component.getBrandsSaleOfRetail();
    /*业态分类下的品牌销售总额*/
    Promise.all([pro_brand, pro_record])
        .then(
            ([brand, record]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取品牌销售数据成功!",
                    data: {
                        brand,
                        record
                    }
                });
            }
        ).catch(err => {
        config.pro_error("brandSaleStatistics", err, res);
    });
};

/*品牌链分析*/
exports.brandDataStatistics = (req, res) => {
    "use strict";
    let n = req.body.n || 3;
    client.select("3",()=>{
        client.get('brandChain'+n,(err,data)=>{
            if(err){
                return config.pro_error("brandSaleStatistics", err, res);
            }
            let rt=JSON.parse(data) || [];
            res.send({
                errcode: 0,
                errmsg: "获取品牌链分析成功!",
                data: rt
            });
        });
    });
};

//品牌关联
exports.brandRelation = (req, res) => {
    "use strict";
    let sql = ` SELECT mb.id,
                (select id from mtx_brand b where b.brand_code=mbr.recommend_result) rc_id,
                round(IFNULL(mbr.confidence,0),4) recommend
                FROM
                mtx_brand mb
                LEFT JOIN mtx_brand_recommend mbr ON mb.brand_code = mbr.brand_code
                ORDER BY mb.id`,
        sql_ret = `select retail_name name from mtx_retail`,
        pro = config.userHandle(sql, []),
        pro_ret = config.userHandle(sql_ret, []),
        pro_brand = component.getBrandsRetail();
    /*合并promise*/
    Promise.all([pro_ret, pro_brand, pro])
        .then(
            /*
             * params data_ret: 业态 (所有的业态类型)
             * params data_brand: 品牌库
             * params data: 品牌关联  (包括消费品牌的id,推荐品牌的id,推荐指数)
             * */
            ([data_ret, data_brand, data]) => {
                /*初始化返回数据*/
                let rt = {
                    nodes: data_brand,
                    links: [],
                    categories: data_ret
                };

                data_brand.map(item => {
                    /*随机一个value*/
                    item.value = Math.ceil(Math.random() * 5);
                    /*品牌业态*/
                    item.category = (+item.category) - 1;
                });
                data.map(item => {
                    let source = -1,
                        target = -1;
                    for (let i = 0, l = data_brand.length; i < l; i++) {
                        let item_db = data_brand[i];
                        //找到source在nodes中的index
                        if (item_db.nodeId === item.id)
                            source = i;
                        //找到target在nodes中的index
                        if (item_db.nodeId === item.rc_id)
                            target = i;
                        if (source > -1 && target > -1) {
                            rt.links.push({
                                source: source,
                                target: target,
                                recommend: item.recommend
                            });
                            break;
                        }
                    }
                });
                res.send({
                    errcode: 0,
                    errmsg: "获取品牌关联成功!",
                    data: rt
                });
            }
        ).catch(err => {
        config.pro_error("brandRelation", err, res);
    });
};

//添加品牌
exports.addBrand = (req, res) => {
    "use strict";
    let opt_user = req.session.user.username,
        opt_user_id = req.session.user.id;
    let brandCode = req.body.brand_code,
        brand_retail = req.body.brand_retail,
        brand_name_cn = req.body.brand_name_cn,
        brand_name_en = req.body.brand_name_en;
    //参数有误
    if (!brandCode || !brand_retail || (!brand_name_cn && !brand_name_en)) {
        return res.send(config.params_error);
    }

    let sql_exist = `select count(id) count from mtx_brand where `,
        pro_exist;
    let sql_log = `INSERT into mtx_operate_log(opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'管理员${opt_user}添加了品牌${brand_name_cn || brand_name_en}')`;
    //用户传入了中英两个品牌名
    if (brand_name_cn && brand_name_en) {
        sql_exist += ` brand_name_cn="${brand_name_cn}" or brand_name_en="${brand_name_en}"`;
        pro_exist = config.userHandle(sql_exist, []);
    }
    //用户只传入了中文品牌名
    else if (brand_name_cn) {
        sql_exist += ` brand_name_cn="${brand_name_cn}"`;
        pro_exist = config.userHandle(sql_exist, []);
    }
    //用户只传入了英文品牌名
    else {
        sql_exist += ` brand_name_en="${brand_name_en}"`;
        pro_exist = config.userHandle(sql_exist, []);
    }
    pro_exist.then(
        data => {
            //该品牌名存在
            if (data[0].count >= 1) {
                res.send({
                    errcode: 1,
                    errmsg: "品牌名已存在!",
                    data: []
                });
            } else {
                /*找出最大的品牌编码*/
                let sql = ` select SUBSTR(brand_code FROM 10 FOR 4) personal
                            from mtx_brand
                            where left(brand_code,9)="${brandCode}"
                            ORDER BY brand_code desc
                            limit 0,1`;
                return config.userHandle(sql, []);
            }
        }
    ).then(
        data => {
            let brand_code_new;
            //该编码尚未有记录
            if (!data.length) {
                brand_code_new = brandCode + "0001";
            }
            //该编码已有记录
            else {
                let person = parseInt(data[0].personal);
                if (person <= 9999) {
                    person += 1;
                    person = person.toString();
                    person = new Array(4 - person.length).fill(0).concat(person).join("");
                    brand_code_new = brandCode + person;
                } else {
                    return res.send({
                        errcode: 1,
                        errmsg: "该编码已使用完!",
                        data: []
                    });
                }
            }

            let sql = ` insert into mtx_brand
                                    (brand_name_en,brand_code,status,brand_name_cn,add_time,retail)
                                    values
                                    (?,?,0,?,now(),(select id from mtx_retail where retail_code=?))`;
            return config.userHandle(sql, [brand_name_en, brand_code_new, brand_name_cn, brand_retail]);
        }
    ).then(
        data => {
            if (data.affectedRows === 1) {
                res.send({
                    errcode: 0,
                    errmsg: "添加品牌成功!",
                    data: []
                });
                let p_log = config.userHandle(sql_log, []);
            } else {
                res.send({
                    errcode: 1,
                    errmsg: "添加品牌失败!",
                    data: []
                });
            }
        }
    ).catch(err => {
        config.pro_error("addBrand", err, res);
    });
};

/*品牌列表*/
exports.screenBrandList = (req, res) => {
    "use strict";
    let name = req.body.name,
        retail = req.body.retail,
        sex = req.body.sex,
        age = req.body.age,
        price = req.body.price,
        distinct = req.body.distinct,
        area = req.body.area,
        pageIndex = (+req.body.pageIndex - 1) * 10 || 0;

    let sql = `SELECT
                DISTINCT b.id nodeId,mbc.cloud_brand_code c_brand_code,b.brand_name_cn name_cn,b.brand_name_en name_en,b.brand_code brand_code,
                mbco.composite_rating composite,r.retail_name retail
                from mtx_brand  b
                LEFT JOIN mtx_brand_cluster mbc on b.brand_code=mbc.brand_code
                LEFT JOIN mtx_retail r ON left(mbc.cloud_brand_code,2) = r.retail_code
                LEFT JOIN mtx_brand_composite mbco on mbco.brand_code=b.brand_code
                where 1=1`;
    let condition = [],
        arr = [
            {name: retail, value: [1, 2]},
            {name: sex, value: [3, 1]},
            {name: age, value: [4, 2]},
            {name: price, value: [6, 1]},
            {name: distinct, value: [7, 2]},
            {name: area, value: [9, 1]}
        ];
    if (name) sql += ` and (b.brand_name_cn like '%${name}%' or b.brand_name_en like '%${name}%')`;
    arr.map(item => {
        if (item.name) {
            sql += ` and SUBSTR(mbc.cloud_brand_code FROM ${item.value[0]} FOR ${item.value[1]})=?`;
            condition.push(item.name);
        }
    });
    /*获取当前状态下业态数*/
    let sql_retail = `SELECT left(t.c_brand_code,2) retail,count(*) total from ( ${sql} ) t GROUP BY LEFT(t.c_brand_code,2)`,
        sql_total = `SELECT count(t.nodeId) total from ( ${sql} ) t`;
    /*limit加在后面*/
    sql += ` order by c_brand_code desc`;
    sql += ` limit ${pageIndex},10`;

    let pro = config.userHandle(sql, condition),
        pro_retail = config.userHandle(sql_retail, condition),
        pro_total = config.userHandle(sql_total, condition);
    /*合并promise*/
    Promise.all([pro, pro_retail, pro_total])
        .then(
            ([data, retail, total]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取列表成功!",
                    data: {
                        list: data, /*当前页数据*/
                        retail: retail.length || 0, /*业态数量*/
                        total: total[0].total || 0  /*数据总量*/
                    }
                });
            }
        ).catch(err => {
        config.pro_error("screenBrandList", err, res);
    });
};

/*用户列表*/
exports.screenUserList = (req, res) => {
    "use strict";
    let name = req.body.name,
        sex = req.body.sex,
        pageItem = +req.body.pageItem || 20, //*一页数据条数,默认为10条*/
        pageIndex = (+req.body.pageIndex - 1) * pageItem || 0,
        condition = `where user_phone is not null GROUP BY user_phone`,
        condi_arr = [];

    let sql = ` SELECT u.id,name,u.phone, sex, age, tt.times costTime
                FROM mtx_user u LEFT JOIN
                 ( SELECT user_phone,count(user_phone) times from mtx_record ${condition}
                    
                 )tt  on u.phone=tt.user_phone
                 WHERE 1=1`;
    let sql_total = `select count(1) total from mtx_user WHERE 1=1`;
    if (name) {
        sql += ` and name like '%${name}%'`;
        sql_total += ` and name like '%${name}%'`;
    }
    if (sex) {
        sql += ` and sex=?`;
        sql_total += ` and sex=?`;
        condi_arr.push(sex);
    }
    let pro_total = config.userHandle(sql_total, condi_arr),
        pro = config.userHandle(sql + ` limit ${pageIndex},${pageItem}`, condi_arr);

    /*合并promise*/
    Promise.all([pro, pro_total])
        .then(
            ([data, total]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取列表成功!",
                    data: {
                        list: data,
                        total: total[0].total || 0
                    }
                });
            }
        ).catch(err => {
        config.pro_error("screenUserList", err, res);
    });
};

/*添加用户*/
exports.addUser = (req, res) => {
    "use strict";
    let opt_user = req.session.user.name, /*操作员*/
        opt_user_id = req.session.user.id;
    /*操作员id*/
    let name = req.body.name,
        phone = req.body.phone,
        sex = req.body.sex,
        birthDate = req.body.birthDate,
        marriage = req.body.marriage;
    /*参数有误*/
    if (!name || !phone || !sex || !birthDate || !marriage) {
        return res.send(config.params_error);
    }
    /*查询是否存在该用户*/
    let sql_isExist = `select * from mtx_user where phone = '${phone}'`;
    config.userHandle(sql_isExist, []).then(
        data => {
            let res_err = {
                errcode: 1,
                data: []
            };
            if (data.length > 0) {
                res_err.errmsg = "用户已存在!";
                return res.send(res_err);
            } else {
                /*获取用户年龄*/
                let birthYear = birthDate.split("-")[0], /*出生年份*/
                    currentYear = new Date().getFullYear(), /*当前年份*/
                    age = Number(currentYear) - Number(birthYear),
                    birthday = birthDate,
                    // user_from = Math.random() > 0.5 ? "POMO" : "CPOS";
                    user_from = "";

                /*操作用户ID未找到*/
                if (!opt_user_id) {
                    res_err.errmsg = "操作用户非法!";
                    return res.send(res_err);
                }
                let sql_insert = `INSERT into mtx_user
                            (account,name,sex,age,user_from,is_married,add_time,add_user,phone,wechat,email,mac,birthday)
                            values ("${phone}","${name}","${sex}","${age}","${user_from}","${marriage}",now(),
                            "${opt_user}","${phone}","","","","${birthday}")`;
                let sql_log = `INSERT into mtx_operate_log (opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'操作员${opt_user}添加了用户${name}')`;
                return config.userHandle(sql_insert, []);
            }
        }
    ).then(
        data => {
            if (data.affectedRows === 1) {
                res.send({
                    errcode: 0,
                    errmsg: "添加用户成功!",
                    data: []
                });
            } else {
                res.send({
                    errcode: 1,
                    errmsg: "添加用户出现未知错误!",
                    data: []
                });
            }
        }
    ).catch(err => {
        config.pro_error("addUser", err, res);
    });
};

/*品牌销量统计列表*/
exports.screenBrandSale = (req, res) => {
    "use strict";
    let name = req.body.name,
        retail = req.body.retail,
        distinct = req.body.distinct,
        price = req.body.price,
        area = req.body.area,
        pageIndex = (+req.body.pageIndex - 1) * 10 || 0,
        condition = [];
    let sql = `select 
mb.id,
t1.store_name brand_name, 
mbc.cloud_brand_code c_brand_code,
t1.amount total,
DATE_FORMAT(t1.recent_time,'%Y-%m-%d %H:%i:%s') recent_time,
t1.verify_amount
from (select time recent_time, store_name, verify_amount, sum(amount) amount from (select * from mtx_record  WHERE use_voucher=1 order by time desc) t0   GROUP BY t0.store_name) t1
LEFT JOIN mtx_brand mb on (mb.brand_name_cn = t1.store_name or t1.store_name = mb.brand_name_en) 
LEFT JOIN mtx_brand_cluster as mbc on mbc.brand_code = mb.brand_code
where 1=1
`;
    if (name) {
        sql += ` and t1.store_name like ?`;
        condition.push(`%${name}%`);
    }
    let arr = [
        {name: retail, value: [1, 2]},
        {name: price, value: [6, 1]},
        {name: distinct, value: [7, 2]},
        {name: area, value: [9, 1]}
    ];
    arr.map(item => {
        if (item.name) {
            sql += ` and SUBSTR(mbc.cloud_brand_code FROM ${item.value[0]} FOR ${item.value[1]})=?`;
            condition.push(item.name);
        }
    });
    /*总金额*/
    let sql_total = `select count(1) brandTotal,sum(t3.total) saleTotal from (${sql}) t3`;
    sql += ` order by recent_time desc, total desc limit ${pageIndex},10`;
    let pro = config.userHandle(sql, condition),
        pro_total = config.userHandle(sql_total, condition);
    /*合并promise*/
    Promise.all([pro, pro_total])
        .then(
            ([data, data_total]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取品牌销量统计列表成功!",
                    data: {
                        list: data,
                        brandTotal: data_total ? data_total[0].brandTotal : 0,
                        saleTotal: data_total ? data_total[0].saleTotal : 0
                    }
                });
            }
        )
        .catch(err => {
            config.pro_error("screenBrandSale", err, res);
        });
};

/*用户库相关概览*/
exports.userLibOverview = (req, res) => {
    "use strict";
    let sql = `SELECT (
                select count(phone) from
                    mtx_user
                where left(add_time,10)= DATE_FORMAT(now(),"%Y-%m-%d")) user_today,
                COUNT(phone) user_total
                from mtx_user`,
        sql_touch = `select sum(touch_up_num) num from mtx_touch_up where type=1
                UNION ALL
                select sum(touch_up_num) num from mtx_touch_up where left(update_time,10)=left(now(),10) and type=1`,
        pro = config.userHandle(sql, []),
        pro_touch = config.userHandle(sql_touch, []);
    /*合并promise*/
    Promise.all([pro, pro_touch])
        .then(
            ([data, data_touch]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取用户库相关概览成功!",
                    data: {
                        user_today: data[0].user_today || 0,
                        user_total: data[0].user_total || 0,
                        touch_today: data_touch[1].num || 0,
                        touch_total: data_touch[0].num || 0
                    }
                });
            }
        ).catch(err => {
        config.pro_error("userLibOverview", err, res);
    });
};

/*用户库用户来源*/
exports.userLibUserFrom = (req, res) => {
    "use strict";
    let sql = `select count(phone) amount,user_from from mtx_user GROUP BY user_from`;
    config.userHandle(sql, []).then(
        data => {
            let user_total = 0,
                data_res = [];
            data.map(item => {
                user_total += item.amount;
            });
            data.map(item => {
                data_res.push({
                    user_from: item.user_from,
                    amount: item.amount,
                    percent: (item.amount / user_total * 100).toFixed(2)
                });
            });
            res.send({
                errcode: 0,
                errmsg: "获取用户库用户来源成功!",
                data: data_res
            });
        }
    ).catch(err => {
        config.pro_error("userLibUserFrom", err, res);
    });
};

/*用户库用户性别*/
exports.userLibUserSex = (req, res) => {
    "use strict";
    let sql = `select count(phone) amount,sex from mtx_user GROUP BY sex`;
    config.userHandle(sql, []).then(
        data => {
            let user_total = 0,
                data_res = [];
            data.map(item => {
                user_total += item.amount;
            });
            data.map(item => {
                data_res.push({
                    sex: item.sex,
                    amount: item.amount,
                    percent: (item.amount / user_total * 100).toFixed(2)
                });
            });
            res.send({
                errcode: 0,
                errmsg: "获取用户性别概览成功!",
                data: data_res
            });
        }
    ).catch(err => {
        config.pro_error("userLibUserSex", err, res);
    });
};

/*用户库用户年龄段*/
exports.userLibUserAge = (req, res) => {
    "use strict";
    let sql = `select count(phone) amount,FLOOR(age/10) as age_range from mtx_user GROUP BY floor(age/10)`;
    config.userHandle(sql, []).then(
        data => {
            let user_total = 0,
                data_res = [{}, {}, {}, {}, {}, {}],  //*设6个年龄段*/
                index = 1;
            /*用户总数*/
            data.map(item => {
                user_total += item.amount;
            });
            let smaller_20 = 0,
                bigger_60 = 0;
            /*20岁以下*/
            data.map(item => {
                if (item.age_range < 2) {
                    smaller_20 += item.amount || 0;
                } else {
                    return false;
                }
            });
            data_res[0] = {
                amount: smaller_20,
                percent: (smaller_20 / user_total * 100).toFixed(2),
                name: "20岁以下"
            };
            /*60岁及以上*/
            data.map(item => {
                if (item.age_range >= 6) {
                    bigger_60 += item.amount || 0;
                } else {
                    return false;
                }
            });
            data_res[5] = {
                amount: bigger_60,
                percent: (bigger_60 / user_total * 100).toFixed(2),
                name: "60岁及以上"
            };
            for (let i = 2; i < 6; i++) {
                let amount = 0,
                    isExist = data.filter(item => {
                        return item.age_range === i;
                    });
                if (isExist.length) {
                    /*如果有记录*/
                    amount = isExist[0].amount;
                }
                data_res[index] = {
                    amount: amount,
                    percent: (amount / user_total * 100).toFixed(2),
                    name: (index + 1) + "0岁-" + (index + 2) + "0岁"
                };
                index += 1;
            }
            res.send({
                errcode: 0,
                errmsg: "获取用户年龄段概览成功!",
                data: data_res
            });
        }
    ).catch(err => {
        config.pro_error("userLibUserAge", err, res);
    });
};

/*用户库用户婚姻情况*/
exports.userLibUserMarriage = (req, res) => {
    "use strict";
    let sql = `select count(phone) amount,is_married from mtx_user GROUP BY is_married`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取用户婚姻情况概览成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("userLibUserMarriage", err, res);
    });
};

/*品牌基本信息*/
exports.brandDetailsBasicInfo = (req, res) => {
    "use strict";
    let brandCode = req.body.brandCode;
    /*参数有误*/
    if (!brandCode) {
        return res.send(config.params_error);
    }
    let sql = `select mb.brand_name_cn name_cn,mb.brand_name_en name_en,date_format(mb.add_time,"%Y-%m-%d") add_time,mbc.composite_rating composite
from mtx_brand mb
LEFT JOIN mtx_brand_composite mbc ON mbc.brand_code=mb.brand_code
WHERE mb.brand_code='${brandCode}'`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取品牌基本信息成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("brandDetailsBasicInfo", err, res);

    });
};

/*品牌详情性别比例*/
exports.brandDetailsUserSex = (req, res) => {
    "use strict";
    let brandCode = req.body.brandCode;
    /*参数有误*/
    if (!brandCode) {
        return res.send(config.params_error);
    }
    let sql = ` select sex,count(t2.user_phone) count from (
                select DISTINCT t1.user_phone from(
                    select brand_code,user_phone from mtx_user_record where user_phone is not null
                    union all
                    select brand_code,user_phone from mtx_record where user_phone is not null
                )t1 LEFT JOIN mtx_brand_cluster mbc on t1.brand_code=mbc.brand_code
                where mbc.brand_code="${brandCode}"
               ) t2 LEFT JOIN mtx_user mu on t2.user_phone=mu.phone
               where mu.sex is not null GROUP BY mu.sex`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取品牌用户性别比例成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("brandDetailsUserSex", err, res);
    });
};

/*品牌详情年龄段*/
exports.brandDetailsUserAge = (req, res) => {
    "use strict";
    let brandCode = req.body.brandCode;
    /*参数有误*/
    if (!brandCode) {
        return res.send(config.params_error);
    }
    let sql = ` select count(mu.phone) amount,FLOOR(mu.age/10) as age_range from
                (
                   select DISTINCT t1.user_phone from(
                    select brand_code,user_phone from mtx_user_record where user_phone is not null
                    union all
                    select brand_code,user_phone from mtx_record where user_phone is not null
                )t1 LEFT JOIN mtx_brand_cluster mbc on t1.brand_code=mbc.brand_code where mbc.brand_code="${brandCode}"
                ) t2 LEFT JOIN mtx_user mu on t2.user_phone=mu.phone
                 GROUP BY floor(mu.age/10)`;
    config.userHandle(sql, []).then(
        data => {
            let user_total = 0,
                data_res = [{}, {}, {}, {}, {}, {}],
                index = 1;
            /*用户总数*/
            data.map(item => {
                user_total += item.amount;
            });
            let smaller_20 = 0,
                bigger_60 = 0;
            /*20岁以下*/
            data.map(item => {
                if (item.age_range < 2) {
                    smaller_20 += item.amount || 0;
                } else {
                    return false;
                }
            });
            data_res[0] = {
                amount: smaller_20,
                name: "20岁以下"
            };
            /*60岁及以上*/
            data.map(item => {
                if (item.age_range >= 6) {
                    bigger_60 += item.amount || 0;
                } else {
                    return false;
                }
            });
            data_res[5] = {
                amount: bigger_60,
                name: "60岁及以上"
            };
            for (let i = 2; i < 6; i++) {
                let amount = 0,
                    isExist = data.filter(item => {
                        return item.age_range === i;
                    });
                if (isExist.length) {
                    /*如果有记录*/
                    amount = isExist[0].amount;
                }
                data_res[index] = {
                    amount: amount,
                    name: (index + 1) + "0岁-" + (index + 2) + "0岁"
                };
                index += 1;
            }
            res.send({
                errcode: 0,
                errmsg: "获取品牌详情用户年龄段成功!",
                data: data_res
            });
        }
    ).catch(err => {
        config.pro_error("brandDetailsUserAge", err, res);
    });
};

/*用户详情*/
exports.userDetailsBasicInfo = (req, res) => {
    "use strict";
    let userPhone = req.body.userPhone || 0;
    /*参数有误*/
    if (!userPhone) {
        return res.send(config.params_error);
    }
    let sql = `select name,DATE_FORMAT(add_time,"%Y-%m-%d %H:%i:%s") time,sex,
                DATE_FORMAT(birthday,"%Y-%m-%d") birthday,is_married
                marriage, phone from mtx_user where phone="${userPhone}"`,
        sql_cost = `select count(id) times,sum(amount) total from mtx_record where user_phone="${userPhone}"`,
        sql_last_time = `select date_format(max(time),"%Y-%m-%d %H:%i:%s") time from mtx_record where user_phone="${userPhone}"`,
        pro = config.userHandle(sql, []),
        pro_last_time = config.userHandle(sql_last_time, []),
        pro_cost = config.userHandle(sql_cost, []);
    /*合并promise*/
    Promise.all([pro, pro_cost, pro_last_time]).then(
        ([data, data_cost, data_last_time]) => {
            res.send({
                errcode: 0,
                errmsg: "获取用户详情用户基本信息成功!",
                data: {
                    basicInfo: data[0],
                    costInfo: data_cost[0],
                    lastTime: data_last_time[0].time || "未知"
                }
            });
        }
    ).catch(err => {
        config.pro_error("userDetailsBasicInfo", err, res);
    });
};

/*核销率*/
exports.touchRate = (req, res) => {
    "use strict";
    /*当周每天推荐数*/
    let sql_r = `
select sum(t1.num) amount, WEEKDAY(t1.update_time) as weekday 
    from (select * from mtx_drainage md where YEARWEEK(md.update_time) = YEARWEEK(now()) and type=1) as t1  
    GROUP BY weekday`,
        /*当周每天核销数*/
        sql_v = `select count(1) amount, WEEKDAY(t1.time) weekday 
                from (select * from mtx_record  t where YEARWEEK(t.time) = YEARWEEK(now()) and t.use_voucher=1 ) t1 
                GROUP BY weekday`,
        pro_r = config.userHandle(sql_r, []),
        pro_v = config.userHandle(sql_v, []);
    Promise.all([pro_r, pro_v]).then(
        ([data_r, data_v]) => {
            let data_new_r = new Array(7).fill(0);
            data_r.map((item) => {
                data_new_r[item.weekday] = item.amount;
            });
            let data_new_v = new Array(7).fill(0);
            data_v.map((item) => {
                data_new_v[item.weekday] = item.amount;
            });
            // 计算某一天核销率：当周每天核销率=核销数/推荐数
            let touchRate_data = data_new_r.map((item, index) => {
                let touchRate = item === 0 ? 0 : (data_new_v[index] / item * 100).toFixed(2);
                touchRate = touchRate > 100 ? 100 : touchRate;
                return touchRate;
            });
            res.send({
                errcode: 0,
                errmsg: "获取核销率成功!",
                data: touchRate_data
            });
        }
    )
        .catch(err => {
            config.pro_error("touchRate", err, res);
        });
};

/*核销数和总销售额*/
exports.verificateNumbersAndtotalSales = (req, res) => {
    "use strict";
    let /*当周每天核销数*/
        sql_v = `select count(1) count, WEEKDAY(t1.time) weekday 
                from (select * from mtx_record  t where YEARWEEK(t.time) = YEARWEEK(now()) and t.use_voucher=1 ) t1 
                GROUP BY weekday`,
        /*当周每天总销售额*/
        sql_s = `select sum(t1.amount) amount, WEEKDAY(t1.time) weekday
    from (select * from mtx_record  t where YEARWEEK(t.time) = YEARWEEK(now()) and t.use_voucher=1 ) t1
    GROUP BY weekday`,
        pro_v = config.userHandle(sql_v, []),
        pro_s = config.userHandle(sql_s, []);
    Promise.all([pro_v, pro_s]).then(
        ([data_v, data_s]) => {
            let data_new_v = new Array(7).fill(0);
            data_v.map((item, index) => {
                data_new_v[item.weekday] = item.count;
            });
            let data_new_s = new Array(7).fill(0);
            data_s.map((item, index) => {
                data_new_s[item.weekday] = (item.amount / 10000).toFixed(2);
            });
            res.send({
                errcode: 0,
                errmsg: "获取核销数和总销售额成功!",
                data: {
                    data_new_v,
                    data_new_s
                }
            });
        }
    ).catch(err => {
        config.pro_error("verificateNumbersAndtotalSales", err, res);
    });
};

/*推荐排行*/
exports.fifthDrainage = (req, res) => {
    "use strict";
    let limit_num = req.body.limit_num || 5, //*默认5条*/
        is_today = req.body.is_today || 0,
        sql = `select 
                sum(md.num) num,
                mb.id as nodeId, 
                mb.brand_name_cn as name_cn, 
                mb.brand_name_en as name_en,
                mb.brand_code as brand_code,
			     IFNull(mbc.cloud_brand_code,0) c_brand_code
            from mtx_drainage md 
            LEFT JOIN mtx_brand mb on md.brand_code = mb.brand_code 
            LEFT JOIN mtx_brand_cluster mbc ON mbc.brand_code=mb.brand_code
            where type=1
     ${is_today ? `and left(md.update_time,10)=left(now(),10)` : ``}
			and
 mb.id is not null
            GROUP BY md.brand_code
            ORDER BY sum(md.num) desc 
            limit 0,${limit_num}`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取推荐排行成功!",
                data: data
            });
        }
    )
        .catch(err => {
            config.pro_error("fifthDrainage", err, res);
        });
};

/*核销排行*/
exports.fifthGuest = (req, res) => {
    "use strict";
    let limit_num = req.body.limit_num || 5,
        is_today = req.body.is_today || 0,
        sql = `SELECT 
                count(1) as num,
                mb.id as nodeId,
                mb.brand_name_cn as name_cn,
                mb.brand_name_en as name_en, 
                mb.brand_code as brand_code,
			     IFNull(mbc.cloud_brand_code,0) c_brand_code
            from 
                mtx_record mr 
                LEFT JOIN mtx_brand mb on (mb.brand_code = mr.brand_code or mb.brand_name_cn = mr.store_name or mb.brand_name_en = mr.store_name) 
                LEFT JOIN mtx_brand_cluster mbc ON mbc.brand_code=mb.brand_code
            where mr.use_voucher=1 AND mb.id is not null ${is_today ? `and left(mr.time,10)=left(now(),10)` : ``}
            GROUP BY mb.brand_code 
            ORDER BY num desc
            limit 0,${limit_num}`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取核销排行成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("fifthGuest", err, res);
    });
};

/*转化率排行*/
exports.fifthTransmutation = (req, res) => {
    "use strict";
    let limit_num = req.body.limit_num || 5,
        is_today = req.body.is_today || 0,
        sql = `SELECT
	mmd.amount AS amount,
	mmr.num AS num,
	mb.id nodeId,
	mb.brand_name_cn name_cn,
	mb.brand_name_en name_en,
	mb.brand_code brand_code,
IFNull(mbc.cloud_brand_code, 0) c_brand_code
FROM
	(
		SELECT
			COUNT(1) AS num,
			brand_code,
			time
		FROM
			mtx_record AS mr
		WHERE
			use_voucher = 1
		AND brand_code IS NOT NULL
		${is_today ? 'and left(time,10)=left(now(),10)' : ''}
		GROUP BY
			brand_code
	) AS mmr
LEFT JOIN (
	SELECT
		num AS amount,
		brand_code,
		update_time
	FROM
		mtx_drainage AS md
	WHERE
		type = 1
		${is_today ? 'and left(update_time,10)=left(now(),10)' : ''}
	GROUP BY
		brand_code
) AS mmd ON mmr.brand_code = mmd.brand_code
LEFT JOIN mtx_brand mb ON mb.brand_code = mmd.brand_code
LEFT JOIN mtx_brand_cluster mbc ON mbc.brand_code = mmd.brand_code
 where mb.brand_code is not NULL`;
    config.userHandle(sql, []).then(
        data => {
            data.map(item => {
                item.percent = item.num && item.amount ? (item.num / item.amount * 100).toFixed(2) : 0;
                item.percent = item.percent > 100 ? 100 : item.percent
            });
            /*按照转化率从高到低排序*/
            data.sort((a, b) => {
                return b.percent - a.percent;
            });
            res.send({
                errcode: 0,
                errmsg: "获取转化率排行成功!",
                data: data.slice(0, 5)
            });
        }
    ).catch(err => {
        config.pro_error("fifthTransmutation", err, res);
    });
};

/*品牌链潜客*/
exports.potentialCustomer = (req, res) => {
    "use strict";
    let brands = req.body.brands || 0;
    /*参数有误*/
    if (!brands) {
        return res.send(config.params_error);
    }
    let condition = ``;
    brands.map((item, index) => {
        if (index > 0) condition += ` or`;
        condition += ` store_name="${item}"`;
    });
    let sql = ` select sum(t.value) value from (
                    select count(distinct user_phone) value from mtx_record where ${condition}
                    UNION ALL
                    select sum(num) value from mtx_user_record where ${condition}
                ) t`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取品牌链潜客成功!",
                data: data[0] ? data[0].value : 0
            });
        }
    )
        .catch(err => {
            config.pro_error("potentialCustomer", err, res);
        });
};

/*品牌今日相关*/
exports.brandDetailsToday = (req, res) => {
    "use strict";
    let brand_code = req.body.brand_code || 0;
    /*参数有误*/
    if (!brand_code) {
        return res.send(config.params_error);
    }
    /*总收益*/
    let sql_totalProfit = `SELECT sum(mr.amount) as num
from mtx_record mr 
LEFT JOIN mtx_brand mb on (mb.brand_code = mr.brand_code or mb.brand_name_cn = mr.store_name or mb.brand_name_en = mr.store_name)
where mb.brand_code='${brand_code}'`,
        /*今日收益*/
        sql_todayProfit = sql_totalProfit + ` and left(mr.time,10)=left(now(),10)`,
        /*总核销*/
        sql_totalVerificate = `SELECT count(1) as num
            from mtx_record mr 
LEFT JOIN mtx_brand mb on (mb.brand_code = mr.brand_code or mb.brand_name_cn = mr.store_name or mb.brand_name_en = mr.store_name)
where mr.use_voucher=1 AND mb.brand_code="${brand_code}"`,
        /*今日核销*/
        sql_todayVerificate = sql_totalVerificate + `  and left(mr.time,10)=left(now(),10)`,
        /*总推荐数和总核销数*/
        sql_totalRecAndVer = `SELECT
	mmd.amount AS amount,
	mmr.num AS num,
	mb.id nodeId,
	mb.brand_name_cn name_cn,
	mb.brand_name_en name_en,
	mb.brand_code brand_code,
	IFNull(mbc.cloud_brand_code, 0) c_brand_code
FROM
	(
		SELECT
			COUNT(1) AS num,
			brand_code,
			time
		FROM
			mtx_record AS mr
		WHERE
			use_voucher = 1
		AND brand_code IS NOT NULL
		GROUP BY
			brand_code
	) AS mmr
LEFT JOIN (
	SELECT
		num AS amount,
		brand_code,
		update_time
	FROM
		mtx_drainage AS md
	WHERE
		type = 1
	GROUP BY
		brand_code
) AS mmd ON mmr.brand_code = mmd.brand_code
LEFT JOIN mtx_brand mb ON mb.brand_code = mmd.brand_code
LEFT JOIN mtx_brand_cluster mbc ON mbc.brand_code = mmd.brand_code
WHERE
	mb.brand_code IS NOT NULL and mb.brand_code='${brand_code}'`,
        /*今日总推荐数和总核销数*/
        sql_todayRecAndVer = `SELECT
	mmd.amount AS amount,
	mmr.num AS num,
	mb.id nodeId,
	mb.brand_name_cn name_cn,
	mb.brand_name_en name_en,
	mb.brand_code brand_code,
	IFNull(mbc.cloud_brand_code, 0) c_brand_code
FROM
	(
		SELECT
			COUNT(1) AS num,
			brand_code,
			time
		FROM
			mtx_record AS mr
		WHERE
			use_voucher = 1
		AND brand_code IS NOT NULL
		AND LEFT (time, 10) = LEFT (now(), 10)
		GROUP BY
			brand_code
	) AS mmr
LEFT JOIN (
	SELECT
		num AS amount,
		brand_code,
		update_time
	FROM
		mtx_drainage AS md
	WHERE
		type = 1
	AND LEFT (update_time, 10) = LEFT (now(), 10)
	GROUP BY
		brand_code
) AS mmd ON mmr.brand_code = mmd.brand_code
LEFT JOIN mtx_brand mb ON mb.brand_code = mmd.brand_code
LEFT JOIN mtx_brand_cluster mbc ON mbc.brand_code = mmd.brand_code
WHERE
	mb.brand_code IS NOT NULL and mb.brand_code='${brand_code}'`;

    let pro_totalProfit = config.userHandle(sql_totalProfit, []),
        pro_todayProfit = config.userHandle(sql_todayProfit, []),
        pro_totalVerificate = config.userHandle(sql_totalVerificate, []),
        pro_todayVerificate = config.userHandle(sql_todayVerificate, []),
        pro_totalRecAndVer = config.userHandle(sql_totalRecAndVer, []),
        pro_todayRecAndVer = config.userHandle(sql_todayRecAndVer, []);
    /*合并promise*/
    Promise.all([pro_totalProfit, pro_todayProfit, pro_totalVerificate, pro_todayVerificate, pro_totalRecAndVer, pro_todayRecAndVer])
        .then(
            ([data_totalProfit, data_todayProfit, data_totalVerificate, data_todayVerificate, data_totalRecAndVer, data_todayRecAndVer]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取品牌今日相关成功!",
                    data: {
                        drainage: {
                            total: data_totalProfit.length ? data_totalProfit[0].num : 0,
                            today: data_todayProfit.length ? data_todayProfit[0].num : 0
                        },
                        guest: {
                            total: data_totalVerificate.length ? data_totalVerificate[0].num : 0,
                            today: data_todayVerificate.length ? data_todayVerificate[0].num : 0
                        },
                        transmutation: {
                            total: (data_totalRecAndVer.length && data_totalRecAndVer[0].amount && data_totalRecAndVer[0].num) ?
                                (data_totalRecAndVer[0].num / data_totalRecAndVer[0].amount * 100).toFixed(2) : 0,
                            today: (data_todayRecAndVer.length && data_totalRecAndVer[0].amount && data_todayRecAndVer[0].num) ?
                                (data_todayRecAndVer[0].num / data_todayRecAndVer[0].amount * 100).toFixed(2) : 0
                        },
                        sale: data_totalProfit.length && data_totalProfit[0].num ? data_totalProfit[0].num : 0
                    }
                });
            }
        )
        .catch(err => {
            config.pro_error("brandDetailsToday", err, res);
        });
};


/*获取标签潜客人数*/
exports.labelPotentialCustomer = (req, res) => {
    "use strict";
    let brand_code = req.body.brand_code;
    /*参数有误*/
    if (!brand_code) {
        return res.send(config.params_error);
    }
    let retail = brand_code.substr(0, 2), //*品牌业态*/
        sex = brand_code.substr(2, 1),   //*品牌性别比例*/
        age = brand_code.substr(3, 2),   //*品牌年龄段*/
        price = brand_code.substr(5, 1), //*品牌均价*/
        distinct = brand_code.substr(6, 2), //*品牌区分属性*/
        area = brand_code.substr(8, 1);  //*品牌产地*/
    let s1 = `select sum(t.value) total from
            (
                select count(distinct mr.user_phone) value from mtx_record mr LEFT JOIN mtx_brand_cluster mbc
                on mr.brand_code=mbc.brand_code where substr(mbc.cloud_brand_code from `,
        s2 = `UNION ALL
                select sum(num) value from mtx_user_record mur LEFT JOIN mtx_brand_cluster mbc
                on mur.brand_code=mbc.brand_code where substr(mbc.cloud_brand_code from `,
        s3 = `) t`;
    let sql_retail = s1 + `1 for 2)="${retail}"` + s2 + `1 for 2)="${retail}"` + s3,
        sql_sex = s1 + `3 for 1)="${sex}"` + s2 + `3 for 1)="${sex}"` + s3,
        sql_age = s1 + `4 for 2)="${age}"` + s2 + `4 for 2)="${age}"` + s3,
        sql_price = s1 + `6 for 1)="${price}"` + s2 + `6 for 1)="${price}"` + s3,
        sql_distinct = s1 + `7 for 2)="${distinct}"` + s2 + `7 for 2)="${distinct}"` + s3,
        sql_area = s1 + `9 for 1)="${area}"` + s2 + `9 for 1)="${area}"` + s3,
        pro_retail = config.userHandle(sql_retail, []),
        pro_sex = config.userHandle(sql_sex, []),
        pro_age = config.userHandle(sql_age, []),
        pro_price = config.userHandle(sql_price, []),
        pro_distinct = config.userHandle(sql_distinct, []),
        pro_area = config.userHandle(sql_area, []);
    /*合并promise*/
    Promise.all([pro_retail, pro_sex, pro_age, pro_price, pro_distinct, pro_area])
        .then(
            ([d_retail, d_sex, d_age, d_price, d_distinct, d_area]) => {
                let retail = d_retail[0].total || 0,
                    sex = d_sex[0].total || 0,
                    age = d_age[0].total || 0,
                    price = d_price[0].total || 0,
                    distinct = d_distinct[0].total || 0,
                    area = d_area[0].total || 0,
                    total = retail + sex + age + price + distinct + area;
                res.send({
                    errcode: 0,
                    errmsg: "获取品牌今日相关成功!",
                    data: {retail, sex, age, price, distinct, area, total}
                });
            }
        ).catch(err => {
        config.pro_error("labelPotentialCustomer", err, res);
    });
};

/*用户消费列表*/
exports.userCostList = (req, res) => {
    "use strict";
    let userPhone = req.body.userPhone,
        pageIndex = (+req.body.pageIndex - 1) * 10 || 0;
    /*参数有误*/
    if (!userPhone) {
        return res.send(config.params_error);
    }
    let sql = ` SELECT  
t1.name,
t1.num,
t1.retail,
t1.recent_amount,
t1.recent_time,
t1.total_amount,
t1.push_num,
t1.data_from,
t1.brand_code,
t2.verify_num
from (select murr.brand_name name,sum(murr.num) num,mr.retail_name retail,murr.recent_amount,
                    date_format(murr.recent_time,"%Y-%m-%d %H:%i:%s") recent_time,murr.total_amount,murr.push_num,
                    murr.data_from,murr.brand_code
                from mtx_user_recent_record murr
                    LEFT JOIN mtx_brand_cluster mbc on murr.brand_code=mbc.brand_code
                    LEFT JOIN mtx_retail mr on left(mbc.cloud_brand_code,2)=mr.retail_code
                where user_phone="${userPhone}"
                GROUP BY murr.brand_code,murr.data_from
                ORDER BY murr.brand_code ASC,murr.data_from ASC) as t1
	LEFT JOIN(select count(1) as verify_num, IFNULL(data_from,"CPOS")  as dataFrom, store_name from mtx_record where user_phone='${userPhone}' and use_voucher=1 GROUP BY store_name) as t2
	on (t2.store_name = t1.name and t1.data_from=t2.dataFrom)
	ORDER BY t1.recent_time desc`;
    config.userHandle(sql, []).then(
        data => {
            if (data.length <= 0) data = [{}];
            let rt = [],
                item = {
                    name: data[0].name,
                    retail: data[0].retail || "未知",
                    num: data[0].num || 0,
                    recent_time: data[0].recent_time || '未知',
                    recent_amount: data[0].recent_amount || 0,
                    total_amount: data[0].total_amount || 0,
                    data_from: {},
                    brand_code: data[0].brand_code
                };
            /*初始化分类*/
            if (data[0].data_from === 'CPOS') {
                item.data_from.CPOS = {
                    push: data[0].push_num || 0,
                    apply: data[0].verify_num || 0
                }
            } else if (data[0].data_from === 'POMO') {
                item.data_from.POMO = {
                    push: data[0].push_num || 0,
                    apply: data[0].verify_num || 0
                }
            }
            for (let i = 1; i < data.length; i++) {
                /*同一品牌*/
                if (data[i].brand_code === item.brand_code) {
                    item.num += data[i].num;
                    /*消费次数*/
                    if (item.recent_time < data[i].recent_time) {
                        item.recent_time = data[i].recent_time;
                        /*最近一次消费时间*/
                        item.recent_amount = data[i].recent_amount;
                        /*最近一次消费金额*/
                    }
                    item.total_amount += data[i].total_amount;
                    /*消费总金额*/
                    /*仅有两种分类,排序第一类为CPOS,则该类为POMO,如POMO排第一则无CPOS分类*/
                    if (item.data_from.CPOS) {
                        item.data_from.POMO = {
                            push: data[i].push_num || 0,
                            apply: data[i].verify_num || 0
                        };
                    }
                }
                /*非同一品牌*/
                else {
                    rt.push(item);
                    item = {
                        name: data[i].name,
                        retail: data[i].retail || "未知",
                        num: data[i].num || 0,
                        recent_time: data[i].recent_time || '未知',
                        recent_amount: data[i].recent_amount || 0,
                        total_amount: data[i].total_amount || 0,
                        data_from: {},
                        brand_code: data[i].brand_code
                    };
                    /*分类*/
                    if (data[i].data_from === 'CPOS') {
                        item.data_from.CPOS = {
                            push: data[i].push_num || 0,
                            apply: data[i].verify_num || 0
                        }
                    } else if (data[i].data_from === 'POMO') {
                        item.data_from.POMO = {
                            push: data[i].push_num || 0,
                            apply: data[i].verify_num || 0
                        }
                    }
                }
            }
            res.send({
                errcode: 0,
                errmsg: "获取用户消费列表成功!",
                data: {
                    total: rt.length,
                    data: rt.slice(pageIndex, pageIndex + 10)
                }
            });
        }
    ).catch(err => {
        config.pro_error("userCostList", err, res);
    });
};

/*用户推送及核销情况*/
exports.userPushApply = (req, res) => {
    "use strict";
    let userPhone = req.body.userPhone;
    /*参数有误*/
    if (!userPhone) {
        return res.send(config.params_error);
    }
    let sql = ` select t2.pushNum, t1.verifyNum, t2.data_from dataFrom ,t1.user_phone userPhone
FROM (select count(*) verifyNum, user_phone FROM mtx_record where use_voucher=1 and user_phone = '${userPhone}') t1
INNER JOIN
(select sum(push_num) pushNum, user_phone, data_from from mtx_user_recent_record where user_phone = '${userPhone}') t2 on t1.user_phone = t2.user_phone
GROUP BY dataFrom 
ORDER BY dataFrom ASC`;
    config.userHandle(sql).then(
        data => {
            let rt = [
                {name: "CPOS"}
                , {name: "POMO"}
            ];
            /*添加默认值*/
            rt.map(item => {
                let is_exist = data.filter(item_d => {
                    return item_d.dataFrom === item.name;
                });
                if (is_exist.length) {
                    item.apply = is_exist[0].verifyNum || 0;
                    item.push = is_exist[0].pushNum || 0;
                } else {
                    item.apply = 0;
                    item.push = 0;
                }
                item.percent = (item.apply && item.push) ? (item.apply / item.push * 100).toFixed(2) : 0;
            });
            res.send({
                errcode: 0,
                errmsg: "获取用户推送及核销情况成功!",
                data: rt
            });
        },
        err => {
            config.pro_error("userPushApply", err, res, "获取用户推送及核销情况失败!");
        }
    ).catch(err => {
        config.pro_error("userPushApply", err, res);
    });
};

/*用户RFM分析*/
exports.userGroupAnalysis = (req, res) => {
    "use strict";
    let type_r = req.body.type_r || 0,
        type_f = req.body.type_f || 0,
        type_m = req.body.type_m || 0;
    /*参数有误*/
    if (!type_r || !type_f || !type_m) {
        return res.send(config.params_error);
    }
    let data = [];
    client.select("3",()=>{
        client.get("rfmData", (err, data) => {
            data = JSON.parse(data);
            new Promise((resolve, reject) => {
                if (data.length) {
                    resolve()
                } else {
                    reject();
                }
            }).then(() => {
                /*此处与data-static下的userGroup.json对应*/
                let rt = [
                    {id: 1, name: "重要挽留客户", data: []},
                    {id: 2, name: "重要发展客户", data: []},
                    {id: 3, name: "重要价值客户", data: []},
                    {id: 4, name: "重要保持客户", data: []},
                    {id: 5, name: "一般挽留客户", data: []},
                    {id: 6, name: "一般发展客户", data: []},
                    {id: 7, name: "一般价值客户", data: []},
                    {id: 8, name: "一般保持客户", data: []}
                ];
                data.map(item => {
                    let r = item.date || 100,
                        f = item.times || 0,
                        m = item.money || 0;
                    let r_valid = r >= type_r,
                        f_valid = f >= type_f,
                        m_valid = m >= type_m;
                    switch (`${r_valid},${f_valid},${m_valid}`) {
                        case `true,false,true`  : { //*重要挽留客户*/
                            rt[0].data.push(item);
                        }
                            break;
                        case `false,false,true`  : { //*重要发展客户*/
                            rt[1].data.push(item);
                        }
                            break;

                        case `false,true,true`   : { //*重要价值客户*/
                            rt[2].data.push(item);
                        }
                            break;

                        case `true,true,true`   : { //*重要保持客户*/
                            rt[3].data.push(item);
                        }
                            break;

                        case `true,false,false` : { //*一般挽留客户*/
                            rt[4].data.push(item);
                        }
                            break;

                        case `false,false,false` : { //*一般发展客户*/
                            rt[5].data.push(item);
                        }
                            break;

                        case `false,true,false`  : { //*一般价值客户*/
                            rt[6].data.push(item);
                        }
                            break;

                        case `true,true,false`  : { //*一般保持客户*/
                            rt[7].data.push(item);
                        }
                            break;

                        default : {  //*一般挽留客户*/
                            rt[4].data.push(item);
                        }
                            break;
                    }
                });
                res.send({
                    errcode: 0,
                    errmsg: "获取用户RFM分析成功!",
                    data: rt
                });
            }).catch(err => {
                config.pro_error("userGroupAnalysis", err, res);
            });
        });
    });
};

/*品牌核销*/
exports.brandVerify = (req, res) => {
    "use strict";
    let brandCode = req.body.brandCode || 0;
    /*参数有误*/
    if (!brandCode) {
        return res.send(config.params_error);
    }
    let sql1 = `SELECT 
num as pushNum, 
LEFT(update_time,7)  as months 
from mtx_drainage where brand_code='${brandCode}' and type=1 and left(update_time,4)=left(now(),4) GROUP BY LEFT(update_time,7)`,
        sql2 = `SELECT 
count(1) as verifyNum,
LEFT(time,7) as months 
from mtx_record where use_voucher = 1 and brand_code='${brandCode}' and left(time,4)=left(now(),4) GROUP BY LEFT(time,7)`;
    let p1 = config.userHandle(sql1, []),
        p2 = config.userHandle(sql2, []);
    Promise.all([p1, p2]).then(([data1, data2]) => {
        if (data1.length) {
            data1.map(item => {
                item.months = Number(item.months.toString().substr(5));
            })
        }
        if (data2.length) {
            data2.map(item => {
                item.months = Number(item.months.toString().substr(5));
            })
        }
        res.send({
            errcode: 0,
            errmsg: "获取品牌核销成功!",
            data: {
                data1,
                data2
            }
        });
    }).catch(err => {
        config.pro_error("brandVerify", err, res);
    });
};

/*userCostRoute*/
exports.userCostRoute = (req, res) => {
    "use strict";
    let userPhone = req.body.userPhone,
        pageIndex = (+req.body.pageIndex - 1) * 10 || 0;
    /*参数有误*/
    if (!userPhone) {
        return res.send(config.params_error);
    }
    let sql1 = `SELECT time,store_name,data_from,user_phone, sum(verifyNum) verifyNum, sum(amount) amount from
(select t1.verifyNum,t2.* from 
(SELECT date_format(time,"%Y-%m-%d") time,store_name,data_from,user_phone, count(1) verifyNum from mtx_record where use_voucher=1 and user_phone ='${userPhone}'  GROUP BY date_format(time,"%Y-%m-%d"), store_name, data_from) t1
RIGHT JOIN
(SELECT date_format(time,"%Y-%m-%d") time,store_name,user_phone,data_from,  sum(amount) amount from mtx_record where user_phone ='${userPhone}' GROUP BY date_format(time,"%Y-%m-%d"),store_name, data_from ) t2 on t1.user_phone= t2.user_phone and t1.time=t2.time and t1.store_name=t2.store_name and t1.data_from = t2.data_from) t3
WHERE t3.time BETWEEN DATE_SUB(NOW(),INTERVAL 3 month) AND NOW()
GROUP BY time,store_name,data_from,user_phone
order by time desc`;
    let sql2 = `SELECT count(*) total from (${sql1}) t4`;
    sql1 += ` limit ${pageIndex},10`;
    let p1 = config.userHandle(sql1, []);
    let p2 = config.userHandle(sql2, []);
    Promise.all([p1, p2]).then(
        ([data1, data2]) => {
            // let res_data = {
            //     errcode: 0,
            //     errmsg: "获取用户近三月行踪轨迹成功!",
            //     data: {
            //         total: 0,
            //         list: []
            //     }
            // };
            // /*有数据*/
            // if (data.length > 0) {
            //     /*按天分类*/
            //     let list = [], //*存储完成分类的数据*/
            //         index = 0, //*当前分类索引*/
            //         time_arr = [[data[0]]],
            //         time = data[0].time;
            //     /*初始化分类时间*/
            //     for (let i = 1; i < data.length; i++) {
            //         /*同一天数据*/
            //         let item = data[i];
            //         if (item.time === time) {
            //             time_arr[index].push(item);
            //         }
            //         /*非同一天数据,另一个分类*/
            //         else {
            //             index += 1;
            //             time = item.time;
            //             time_arr[index] = [item];
            //         }
            //     }
            //     // console.log("time_arr:",time_arr);
            //     /*按data_from分类*/
            //     time_arr.map(item_date => {
            //         let data = {
            //             time: item_date[0].time,
            //             brands: [item_date[0].name_cn || item_date[0].name_en],
            //             amount: item_date[0].amount,
            //             CPOS: (item_date[0].data_from === "CPOS" &&
            //                 item_date[0].apply > 0) ? 1 : 0,
            //             POMO: (item_date[0].data_from === "POMO" &&
            //                 item_date[0].apply > 0) ? 1 : 0
            //         };
            //         for (let i = 1; i < item_date.length; i++) {
            //             let item = item_date[i];
            //             /*不是同一品牌,最多展示两个品牌*/
            //             if (item.name_cn !== data.brands[0] &&
            //                 item.name_en !== data.brands[0] &&
            //                 data.brands.length < 2
            //             ) {
            //                 data.brands.push(item.name_cn || item.name_en);
            //             }
            //             /*分类计算已核销*/
            //             if (item.data_from === "CPOS") data.CPOS += 1;
            //             else if (item.data_from === "POMO") data.POMO += 1;
            //             /*统计消费金额*/
            //             data.amount += item.amount;
            //         }
            //         /*格式化*/
            //         data.brands = data.brands.join("、");
            //         list.push(data);
            //     });
            //     /*总数*/
            //     res_data.data.total = list.length;
            //     /*分页*/
            //     res_data.data.list = list.slice(pageIndex, pageIndex + 10);
            // }
            // res.send(res_data);
            res.send({
                errcode: 0,
                errmsg: "获取用户近三月行踪轨迹成功!",
                data: {
                    total: data2[0].total,
                    list: data1
                }
            });

        }
    ).catch(err => {
        config.pro_error("userCostRoute", err, res);
    });
};

/*用户综合指数*/
exports.userComposite = (req, res) => {
    "use strict";
    let userPhone = req.body.userPhone;
    /*参数错误*/
    if (!userPhone) return res.send(config.params_error);
    let sql = ` select consumer_power consume,bag_frequency bag,unit_price unit,
                shopping_frequency frequency,shopping_time time,composite_rating composite
                from mtx_user_composite where user_phone="${userPhone}"`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "",
                data: data[0] || {}
            });
        }
    ).catch(err => {
        config.pro_error("userComposite", err, res);
    });
};

/*品牌综合指数*/
exports.brandComposite = (req, res) => {
    "use strict";
    let brandCode = req.body.brandCode;
    /*参数有误*/
    if (!brandCode) return res.send(config.params_error);
    let sql = ` select mbco.sale_money sale,mbco.switch_rating switch,mbco.get_customer get_cus,mbco.drainage,
                mbco.customer_num customer,mbco.composite_rating composite
                from mtx_brand_composite mbco
                LEFT JOIN mtx_brand mb on mb.brand_code=mbco.brand_code
                where mbco.brand_code='${brandCode}'`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取品牌综合指数成功!",
                data: data[0] || {}
            });
        }
    ).catch(err => {
        config.pro_error("brandComposite", err, res);
    })
};

/*用户偏好品牌*/
exports.userHobbyBrand = (req, res) => {
    "use strict";
    let userPhone = req.body.userPhone;
    /*参数有误*/
    if (!userPhone) return res.send(config.params_error);
    /*总消费次数*/
    let sql = `SELECT count(1) consumeTotal from mtx_record where user_phone='${userPhone}'`,
        /*每个品牌的消费次数*/
        sql2 = `SELECT count(1) consumeNum,store_name  from mtx_record 
where user_phone='${userPhone}'
GROUP BY store_name
ORDER BY consumeNum desc
limit 0,6`;
    let p1 = config.userHandle(sql, []),
        p2 = config.userHandle(sql2, []);
    Promise.all([p1, p2]).then(
        ([data1, data2]) => {
            let rt = [],
                consumeTotal = data1[0].consumeTotal;
            data2.map(item => {
                rt.push({
                    name: item.store_name,
                    percent: item.consumeNum && consumeTotal ? (item.consumeNum / consumeTotal * 100).toFixed(2) : 0
                })
            });
            res.send({
                errcode: 0,
                errmsg: "获取用户偏好品牌成功!",
                data: rt
            });
        }
    ).catch(err => {
        config.pro_error("userHobbyBrand", err, res);
    });
};

/*用户潜在偏好品牌*/
exports.userPotentialHobbyBrand = (req, res) => {
    "use strict";
    let userPhone = req.body.userPhone;
    /*参数有误*/
    if (!userPhone) return res.send(config.params_error);
    let sql = ` SELECT mb.brand_name_cn name_cn, mb.brand_name_en name_en
                FROM
                    (
                    select DISTINCT mur.recommend_brand,mur.rating from
                    mtx_user_recommend mur
                    where mur.user_phone="${userPhone}"
                    ORDER BY rating desc limit 0,6
                ) t
                LEFT JOIN mtx_brand mb ON t.recommend_brand = mb.brand_code`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取用户潜在偏好品牌成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("userPotentialHobbyBrand", err, res);
    });
};

/****************************新增****************************/
//页面初始化获取置顶推荐和主打推荐
exports.getRecommendBrand = (req, res) => {
    "use strict";
    let sql = `SELECT mcr.*,mbc.cloud_brand_code c_brand_code,mbc.id c_id 
    FROM mtx_custom_recommend mcr
LEFT JOIN mtx_brand_cluster mbc on mbc.brand_code=mcr.brand_code
WHERE mcr.brand_code is not null`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取推荐品牌成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("getRecommendBrand", err, res);
    });
};

/*获取置顶推荐品牌基本信息*/
exports.topBrandBasicInfo = (req, res) => {
    "use strict";
    let brandCode = req.body.brandCode;
    /*参数有误*/
    if (!brandCode) {
        // return res.send(config.params_error);
    }
    let sql = `select mb.brand_name_cn name_cn,mb.brand_name_en name_en,mbc.cloud_brand_code c_brand_code 
from mtx_brand_cluster mbc
LEFT JOIN mtx_brand mb ON mb.brand_code=mbc.brand_code
where mbc.brand_code="${brandCode}" 
LIMIT 0,1`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取置顶推荐品牌基本信息成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("topBrandBasicInfo", err, res);
    });
};

// 点击设置，弹出模态框，加载品牌数据
exports.getBrand = (req, res) => {
    "use strict";
    let name = req.body.name,
        retail = req.body.retail,
        pageIndex = req.body.pageIndex, /*传过来的当前页码*/
        dataStart = (pageIndex - 1) * 10, /*查询的数据的起始位置*/
        condition = [];
    let sql = `SELECT mb.brand_code brand_code,mb.brand_name_cn name_cn,mb.brand_name_en name_en,mbc.cloud_brand_code c_brand_code,mbc.id c_id
from  mtx_brand mb
LEFT JOIN mtx_brand_cluster mbc ON mb.brand_code=mbc.brand_code
where mb.brand_code is not null
`;
    if (name) {
        sql += ` and (mb.brand_name_cn like '%${name}%' or mb.brand_name_en like '%${name}%')`;
    }
    let arr = [
        {name: retail, value: [1, 2]}
    ];
    arr.map(item => {
        if (item.name) {
            sql += ` and SUBSTR(mbc.cloud_brand_code FROM ${item.value[0]} FOR ${item.value[1]})=?`;
            condition.push(item.name);
        }
    });
    sql += ` order by mbc.cloud_brand_code desc`;
    /*品牌总数*/
    let sql_total = `select count(t2.brand_code) brandTotal from (${sql}) t2`;
    /*分页要写在sql_total后面*/
    // sql += ` limit ${dataStart},10`;
    let pro = config.userHandle(sql, condition),
        pro_total = config.userHandle(sql_total, condition);
    /*合并promise*/
    Promise.all([pro, pro_total])
        .then(
            ([data, data_total]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取品牌统计列表成功!",
                    data: {
                        list: data,
                        brandTotal: data_total.length ? data_total[0].brandTotal : 0
                    }
                });
            }
        )
        .catch(err => {
            config.pro_error("getBrand", err, res);
        });
};

// 设置置顶推荐
exports.setTopRecommend = (req, res) => {
    "use strict";
    let brand_code = req.body.brand_code || '',
        retail = req.body.retail || 0,
        brand_name_cn = req.body.brand_name_cn || '',
        brand_name_en = req.body.brand_name_en || '';
    // brand_code为false,表示清空设置的置顶推荐品牌
    if (!brand_code && !retail && !brand_name_cn && !brand_name_en) {
        let sql = `DELETE from mtx_custom_recommend WHERE type=1`;
        config.userHandle(sql, []).then(data => {
            res.send({
                errcode: 0,
                errmsg: "清空置顶推荐成功!",
                data: data
            });
        });
        return false;
    }
    let sql1 = `DELETE from mtx_custom_recommend WHERE type=1`,
        sql2 = `INSERT INTO mtx_custom_recommend(brand_code,type,retail,add_time,brand_name_cn,brand_name_en) 
        VALUES('${brand_code}',1,${retail},now(),'${brand_name_cn}','${brand_name_en}')`;
    let p1 = config.userHandle(sql1, []),
        p2 = config.userHandle(sql2, []);
    Promise.all([p1, p2]).then(([data1, data2]) => {
        res.send({
            errcode: 0,
            errmsg: "置顶推荐设置成功!",
            data: {
                data1,
                data2
            }
        });
    }).catch(err => {
        config.pro_error("setTopRecommend", err, res);
    });
};

// 设置主打推荐
exports.setMainRecommend = (req, res) => {
    "use strict";
    let arr = req.body.arr || [];
    // arr.length为false,表示清空设置的主打推荐品牌
    if (!arr.length) {
        let sql = `delete FROM mtx_custom_recommend where type=2`;
        config.userHandle(sql, []).then(data => {
            res.send({
                errcode: 0,
                errmsg: "清空主打推荐成功!",
                data: data
            });
        });
        return false;
    }
    let sql_delete = `delete FROM mtx_custom_recommend where type=2`,
        sql_insert = `insert into mtx_custom_recommend (brand_code,type,retail,add_time,brand_name_cn,brand_name_en) VALUES`;
    arr.map((item, idx) => {
        item.retail = item.c_brand_code ? item.c_brand_code.substr(0, 2) : 0;
        sql_insert += `('${item.brand_code}',2,${item.retail},now(),${item.name_cn ? `"${item.name_cn}"` : ``},${item.name_en ? `"${item.name_en}"` : `''`})${idx === arr.length - 1 ? '' : ','}`
    });
    let pro_delete = config.userHandle(sql_delete, []),
        pro_insert = config.userHandle(sql_insert, []);
    /*合并promise*/
    Promise.all([pro_delete, pro_insert])
        .then(
            ([data_delete, data_insert]) => {
                res.send({
                    errcode: 0,
                    errmsg: "主打推荐设置成功!",
                    data: []
                });
            }
        )
        .catch(err => {
            config.pro_error("setMainRecommend", err, res);
        });
};

/*操作日志---初始化获取操作人员列表*/
exports.operateUser = (req, res) => {
    "use strict";
    let condition = [];
    let sql = `SELECT DISTINCT opt_user name,opt_user_id value from mtx_operate_log where opt_user is not null`;
    config.userHandle(sql, condition).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取操作人员列表成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("operateUser", err, res);
    });
};

/*操作日志*/
exports.operateLog = (req, res) => {
    "use strict";
    let operateUser = req.body.operateUser,
        date = req.body.date,
        pageIndex = req.body.pageIndex,
        condition = [];
    let sql = `SELECT opt_user,opt_user_id,DATE_FORMAT(opt_time,'%Y-%m-%d %H:%i:%s') opt_time,opt_msg from mtx_operate_log
where opt_user is not null`;
    if (operateUser) {
        sql += ` and opt_user_id =${operateUser}`;
    }
    if (date) {
        sql += ` and left(opt_time,10) = '${date}'`;
    }
    /*数据总条数*/
    let sql_total = `select count(t.opt_user) dataTotal from (${sql}) t`;
    sql += ` order by opt_time desc`;
    if (pageIndex) {
        sql += ` limit ${(pageIndex - 1) * 10},10`;
    }

    let pro = config.userHandle(sql, condition),
        pro_total = config.userHandle(sql_total, condition);
    /*合并promise*/
    Promise.all([pro, pro_total])
        .then(
            ([data, data_total]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取操作日志列表成功!",
                    data: {
                        list: data,
                        dataTotal: data_total.length ? data_total[0].dataTotal : 0
                    }
                });
            }
        )
        .catch(err => {
            config.pro_error("operateLog", err, res);
        });
};
/*用户管理列表*/
exports.userManageList = (req, res) => {
    "use strict";
    let pageIndex = req.body.pageIndex, /*传过来的当前页码*/
        condition = [];
    let sql = `SELECT su.account account,su.phone phone,su.id user_id,sr.role_name role_name,sur.sys_role_id role_id FROM sys_user su
LEFT JOIN sys_user_role sur ON sur.sys_user_id=su.id
LEFT JOIN sys_role sr ON sr.id=sur.sys_role_id`,
        sql_total = `SELECT count(*) dataTotal FROM (${sql}) t`;
    if (pageIndex) {
        sql += ` limit ${(pageIndex - 1) * 10},10`;
    }
    let pro = config.userHandle(sql, condition),
        pro_total = config.userHandle(sql_total, condition);
    /*合并promise*/
    Promise.all([pro, pro_total])
        .then(
            ([data, data_total]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取用户管理列表成功!",
                    data: {
                        list: data,
                        dataTotal: data_total.length ? data_total[0].dataTotal : 0
                    }
                });
            }
        )
        .catch(err => {
            config.pro_error("operateLog", err, res);
        });
};

// 新增管理员
exports.addManager = (req, res) => {
    "use strict";
    /*操作员*/
    let opt_user = req.session.user.username,
        opt_user_id = req.session.user.id;
    let userName = req.body.userName,
        password = req.body.password,
        phone = req.body.phone,
        /*对密码加密*/
        pass_md5 = config.encrypt(password);
    let sql_insert = `INSERT into sys_user(account,password,phone) VALUES('${userName}','${pass_md5}','${phone}')`,
        sql_log = `INSERT into mtx_operate_log(opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'管理员${opt_user}新增了用户${userName}')`;
    let pro = config.userHandle(sql_insert, []),
        pro_log = config.userHandle(sql_log, []);
    /*合并promise*/
    Promise.all([pro, pro_log])
        .then(
            ([data, data_log]) => {
                res.send({
                    errcode: 0,
                    errmsg: "新增管理员成功!",
                    data: data
                });
            }
        )
        .catch(err => {
            config.pro_error("addManager", err, res);
        });
};

// 修改管理员
exports.updateManager = (req, res) => {
    "use strict";
    let opt_user = req.session.user.username,
        opt_user_id = req.session.user.id;
    let userName = req.body.userName,
        password = req.body.password || '',
        phone = req.body.phone,
        user_id = req.body.user_id,
        pass_md5 = config.encrypt(password);
    /*对密码加密*/
    let sql_insert = `update sys_user SET sys_user.account='${userName}',sys_user.password='${pass_md5}',sys_user.phone='${phone}' where sys_user.id=${user_id}`,
        sql_log = `INSERT into mtx_operate_log(opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'管理员${opt_user}修改了用户${userName}')`;
    let pro = config.userHandle(sql_insert, []),
        pro_log = config.userHandle(sql_log, []);
    /*合并promise*/
    Promise.all([pro, pro_log])
        .then(
            ([data, data_log]) => {
                res.send({
                    errcode: 0,
                    errmsg: "修改管理员信息成功!",
                    data: data
                });
            }
        )
        .catch(err => {
            config.pro_error("updateManager", err, res);
        });
};

// 获取管理员信息
exports.getManagerInfo = (req, res) => {
    "use strict";
    let user_id = req.body.user_id,
        condition = [];
    let sql = `SELECT su.id user_id,su.account account,su.password password,su.phone phone FROM sys_user su WHERE su.id=?`;
    condition.push(user_id);
    config.userHandle(sql, condition).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取管理员信息成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("getManagerInfo", err, res);
    });
};

// 删除管理员信息
exports.deleteManagerInfo = (req, res) => {
    "use strict";
    let opt_user = req.session.user.username,
        opt_user_id = req.session.user.id;
    let user_id = req.body.user_id,
        user_name = req.body.user_name,
        condition = [];
    let sql = `DELETE FROM sys_user WHERE sys_user.id=?`,
        sql_log = `INSERT into mtx_operate_log(opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'管理员${opt_user}删除了用户${user_name}')`;
    condition.push(user_id);
    let pro = config.userHandle(sql, condition),
        pro_log = config.userHandle(sql_log, []);
    /*合并promise*/
    Promise.all([pro, pro_log])
        .then(
            ([data, data_log]) => {
                res.send({
                    errcode: 0,
                    errmsg: "删除管理员信息成功!",
                    data: data
                });
            }
        )
        .catch(err => {
            config.pro_error("deleteManagerInfo", err, res);
        });
};

// 获取用户角色列表
exports.getUserRoleList = (req, res) => {
    "use strict";
    let user_id = req.body.user_id,
        condition = [];
    let sql = `SELECT * FROM sys_role`;
    config.userHandle(sql, condition).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取用户角色列表成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("getUserRoleList", err, res);
    });
};

// 更新用户角色
exports.updateUserRole = (req, res) => {
    "use strict";
    let user_id = req.body.user_id,
        role_id = req.body.role_id,
        condition = [];
    let sql = `delete from sys_user_role WHERE sys_user_id =${user_id}`;
    let sql2 = `insert into sys_user_role (sys_role_id,sys_user_id) values (${role_id},${user_id})`;
    let p1 = config.userHandle(sql, condition),
        p2 = config.userHandle(sql2, condition);
    Promise.all([p1, p2]).then(
        ([data1, data2]) => {
            res.send({
                errcode: 0,
                errmsg: "更新用户角色成功!",
                data: []
            });
        }
    ).catch(err => {
        config.pro_error("updateUserRole", err, res);
    });
};

/*资源管理*/
exports.resourceManageList = (req, res) => {
    "use strict";
    let pageIndex = req.body.pageIndex, /*传过来的当前页码*/
        condition = [];
    let sql = `SELECT * FROM sys_auth`,
        sql_total = `SELECT count(*) dataTotal FROM (${sql}) t`;
    if (pageIndex) {
        sql += ` limit ${(pageIndex - 1) * 10},10`;
    }
    let pro = config.userHandle(sql, condition),
        pro_total = config.userHandle(sql_total, condition);
    /*合并promise*/
    Promise.all([pro, pro_total])
        .then(
            ([data, data_total]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取资源管理列表成功!",
                    data: {
                        list: data,
                        dataTotal: data_total.length ? data_total[0].dataTotal : 0
                    }
                });
            }
        )
        .catch(err => {
            config.pro_error("operateLog", err, res);
        });
};

// 删除资源
exports.deleteResource = (req, res) => {
    "use strict";
    let opt_user = req.session.user.username,
        opt_user_id = req.session.user.id;
    let resource_id = req.body.resource_id,
        resource_name = req.body.resource_name,
        condition = [];
    let sql = `DELETE FROM sys_auth WHERE id=?`,
        sql_log = `INSERT into mtx_operate_log(opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'管理员${opt_user}删除了资源${resource_name}')`;
    condition.push(resource_id);
    let pro = config.userHandle(sql, condition),
        pro_log = config.userHandle(sql_log, []);
    /*合并promise*/
    Promise.all([pro, pro_log])
        .then(
            ([data, data_log]) => {
                res.send({
                    errcode: 0,
                    errmsg: "删除资源信息成功!",
                    data: data
                });
            }
        )
        .catch(err => {
            config.pro_error("deleteResource", err, res);
        });
};

// 新增资源
exports.addResource = (req, res) => {
    "use strict";
    let opt_user = req.session.user.username,
        opt_user_id = req.session.user.id;
    let resourceName = req.body.resourceName,
        resourceCode = req.body.resourceCode,
        resourceUrl = req.body.resourceUrl,
        logoImg = req.body.logoImg,
        selectedName = req.body.selectedName;
    let sql_insert = `INSERT into sys_auth(auth_name,auth_code,auth_url,logo_id,id) 
     VALUES('${resourceName}','${resourceCode}','${resourceUrl}','${logoImg}','${selectedName}')`,
        sql_log = `INSERT into mtx_operate_log(opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'管理员${opt_user}新增了资源${resourceName}')`;
    let pro = config.userHandle(sql_insert, []),
        pro_log = config.userHandle(sql_log, []);
    /*合并promise*/
    Promise.all([pro, pro_log])
        .then(
            ([data, data_log]) => {
                res.send({
                    errcode: 0,
                    errmsg: "新增资源成功!",
                    data: data
                });
            }
        )
        .catch(err => {
            config.pro_error("addResource", err, res);
        });
};

// 获取父亲资源下拉列表
exports.getParentResourceList = (req, res) => {
    "use strict";
    let sql_insert = `SELECT * from sys_auth where parent_id=0`;
    config.userHandle(sql_insert, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取父亲资源下拉列表成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("getParentResourceList", err, res);
    });
};

// 获取资源信息
exports.getResourceInfo = (req, res) => {
    "use strict";
    let resource_id = req.body.resource_id,
        condition = [];
    let sql = `SELECT sa1.*,sa2.auth_name parent_name FROM sys_auth sa1
LEFT JOIN sys_auth sa2 on sa1.parent_id=sa2.id
WHERE sa1.id=?`;
    condition.push(resource_id);
    config.userHandle(sql, condition).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取资源信息成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("getResourceInfo", err, res);
    });
};

// 修改资源
exports.updateAuthResource = (req, res) => {
    "use strict";
    let opt_user = req.session.user.username,
        opt_user_id = req.session.user.id;
    let resourceName = req.body.resourceName,
        resourceCode = req.body.resourceCode,
        resourceUrl = req.body.resourceUrl,
        logoImg = req.body.logoImg,
        selectedName = req.body.selectedName,
        resource_id = req.body.resource_id;
    let sql_insert = `update sys_auth SET sys_auth.auth_name='${resourceName}',sys_auth.auth_code='${resourceCode}',
    sys_auth.auth_url='${resourceUrl}',sys_auth.logo_id='${logoImg}',sys_auth.parent_id=${selectedName} where sys_auth.id=${resource_id}`,
        sql_log = `INSERT into mtx_operate_log(opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'管理员${opt_user}修改了资源${resourceName}')`;
    let pro = config.userHandle(sql_insert, []),
        pro_log = config.userHandle(sql_log, []);
    /*合并promise*/
    Promise.all([pro, pro_log])
        .then(
            ([data, data_log]) => {
                res.send({
                    errcode: 0,
                    errmsg: "修改资源信息成功!",
                    data: data
                });
            }
        )
        .catch(err => {
            config.pro_error("updateAuthResource", err, res);
        });
};

// 获取角色列表
exports.roleManageList = (req, res) => {
    "use strict";
    let pageIndex = req.body.pageIndex, /*传过来的当前页码*/
        condition = [];
    let sql = `SELECT * FROM sys_role`,
        sql_total = `SELECT count(*) dataTotal FROM (${sql}) t`;
    if (pageIndex) {
        sql += ` limit ${(pageIndex - 1) * 10},10`;
    }
    let pro = config.userHandle(sql, condition),
        pro_total = config.userHandle(sql_total, condition);
    /*合并promise*/
    Promise.all([pro, pro_total])
        .then(
            ([data, data_total]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取角色列表成功!",
                    data: {
                        list: data,
                        dataTotal: data_total.length ? data_total[0].dataTotal : 0
                    }
                });
            }
        )
        .catch(err => {
            config.pro_error("roleManageList", err, res);
        });
};

// 删除某一角色类型
exports.deleteRole = (req, res) => {
    "use strict";
    let opt_user = req.session.user.username,
        opt_user_id = req.session.user.id;
    let role_id = req.body.role_id,
        role_name = req.body.role_name,
        condition = [];
    let sql = `DELETE FROM sys_role WHERE id=?`,
        sql_log = `INSERT into mtx_operate_log(opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'管理员${opt_user}删除了角色类型${role_name}')`;
    condition.push(role_id);
    let pro = config.userHandle(sql, condition),
        pro_log = config.userHandle(sql_log, []);
    /*合并promise*/
    Promise.all([pro, pro_log])
        .then(
            ([data, data_log]) => {
                res.send({
                    errcode: 0,
                    errmsg: "删除该角色类型成功!",
                    data: data
                });
            }
        )
        .catch(err => {
            config.pro_error("deleteRole", err, res);
        });
};

// 添加某一角色类型
exports.addRole = (req, res) => {
    "use strict";
    let opt_user = req.session.user.username,
        opt_user_id = req.session.user.id;
    let roleName = req.body.roleName,
        roleCode = req.body.roleCode;
    let sql_insert = `INSERT into sys_role(role_name,role_code) VALUES('${roleName}','${roleCode}')`,
        sql_log = `INSERT into mtx_operate_log(opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'管理员${opt_user}添加了角色类型${roleName}')`;
    let pro = config.userHandle(sql_insert, []),
        pro_log = config.userHandle(sql_log, []);
    /*合并promise*/
    Promise.all([pro, pro_log])
        .then(
            ([data, data_log]) => {
                res.send({
                    errcode: 0,
                    errmsg: "添加角色类型成功!",
                    data: data
                });
            }
        )
        .catch(err => {
            config.pro_error("addRole", err, res);
        });
};

// 获取某一角色类型信息
exports.getRoleInfo = (req, res) => {
    "use strict";
    let role_id = req.body.role_id;
    let sql = `SELECT * FROM sys_role WHERE id=${role_id}`;
    config.userHandle(sql, []).then(
        data => {
            res.send({
                errcode: 0,
                errmsg: "获取信息成功!",
                data: data
            });
        }
    ).catch(err => {
        config.pro_error("getRoleInfo", err, res);
    });
};

// 修改某一角色类型
exports.updateRole = (req, res) => {
    "use strict";
    let opt_user = req.session.user.username,
        opt_user_id = req.session.user.id;
    let roleCode = req.body.roleCode,
        roleName = req.body.roleName,
        role_id = req.body.role_id;
    let sql_insert = `UPDATE sys_role SET role_name='${roleName}',role_code='${roleCode}' WHERE id=${role_id}`,
        sql_log = `INSERT into mtx_operate_log(opt_user,opt_user_id,opt_time,opt_msg) VALUES('${opt_user}',${opt_user_id},now(),'管理员${opt_user}修改了角色类型${roleName}')`;
    let pro = config.userHandle(sql_insert, []),
        pro_log = config.userHandle(sql_log, []);
    /*合并promise*/
    Promise.all([pro, pro_log])
        .then(
            ([data, data_log]) => {
                res.send({
                    errcode: 0,
                    errmsg: "修改角色类型成功!",
                    data: data
                });
            }
        )
        .catch(err => {
            config.pro_error("updateRole", err, res);
        });
};

// 获取资源列表
exports.getResourceList = (req, res) => {
    "use strict";
    let role_id = req.body.role_id,
        condition = [];
    let sql = `SELECT * from sys_auth WHERE id !=1`,
        sql_total = `SELECT DISTINCT sr.id role_id,sr.role_name,sr.role_code,sa.* from sys_role sr 
LEFT JOIN sys_role_auth sra ON sra.sys_role_id=sr.id
LEFT JOIN sys_auth sa ON sa.id=sra.sys_auth_id
where sr.id=${role_id} AND sa.id !=1`;
    let pro = config.userHandle(sql, condition),
        pro_total = config.userHandle(sql_total, condition);
    /*合并promise*/
    Promise.all([pro, pro_total])
        .then(
            ([data, data_total]) => {
                res.send({
                    errcode: 0,
                    errmsg: "获取资源列表成功!",
                    data: {
                        list: data,
                        hasAuthList: data_total
                    }
                });
            }
        )
        .catch(err => {
            config.pro_error("getResourceList", err, res);
        });
};

// 更新资源
exports.updateResource = (req, res) => {
    "use strict";
    let arr = req.body.arr || [],
        role_id = req.body.role_id;
    let sql_delete = `delete FROM sys_role_auth where sys_role_id=${role_id}`,
        sql_insert = `insert into sys_role_auth (sys_role_id,sys_auth_id) VALUES`;
    arr.map((item, idx) => {
        sql_insert += `(${role_id},${item.id})${idx === arr.length - 1 ? '' : ','}`
    });
    let pro_delete = config.userHandle(sql_delete, []),
        pro_insert = config.userHandle(sql_insert, []);
    /*合并promise*/
    Promise.all([pro_delete, pro_insert])
        .then(
            ([data_delete, data_insert]) => {

                res.send({
                    errcode: 0,
                    errmsg: "分配资源成功!",
                    data: data_insert
                });
            }
        )
        .catch(err => {
            config.pro_error("updateResource", err, res);
        });
};