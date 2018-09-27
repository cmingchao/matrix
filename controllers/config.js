const crypto = require("crypto"),
    mysql = require("mysql"),
    fs = require("fs"),
    redis=require("redis"),
    comp = require("./component");

//数据库操作处理函数
/*
 * params sql:查询语句
 * params condition:查询条件
 * */
exports.userHandle = (sql, condition) => {
    "use strict";
    let connect = mysql.createConnection({
        host: "192.168.1.102",
        // host:"127.0.0.1",
        user: "root",
        password: "root",
        database: "matrix_local",
        port: "3306"
    });
    return new Promise((resolve, reject) => {
        connect.connect();
        connect.query(sql, condition, (err, data) => {
            //执行sql出错
            if (err) {
                reject(err);
            }
            //执行sql成功
            else {
                resolve(data);
            }
        });
        connect.end();
    });
};

//md5加密处理函数
/*
*params origin:原始密码
* */
exports.encrypt = (origin) => {
    "use strict";
    //5次MD5加密
    let pass_md5 = origin;
    for (let i = 0; i < 20; i++) {
        let md5 = crypto.createHash("md5");
        pass_md5 = md5.update(pass_md5).digest("hex");
    }
    return pass_md5;
};

/*获取用户年龄*/
/*
* params birth_y: 出生年份
* params birth_m: 出生月份
* params birth_d: 出生日期
* */
exports.getUserYears = (birth_y, birth_m, birth_d) => {
    "use strict";
    let now = new Date(),
        now_y = now.getFullYear(),
        now_m = now.getMonth() + 1,
        now_d = now.getDate(),
        yearsold = 0;
    /*当天大于等于生日当天*/
    if (now_d >= birth_d) {
        if (now_m >= birth_m) {
            yearsold = now_y - birth_y;
        } else {
            yearsold = now_y - birth_y - 1;
        }
    }
    /*当天小于生日当天*/
    else {
        if (now_m > birth_m) {
            yearsold = now_y - birth_y;
        } else {
            yearsold = now_y - birth_y - 1;
        }
    }
    return yearsold;
};

//错误处理
/*
* params name: 接口名
* params err: 错误信息
* params time: 发生错误时间
* */
exports.interfaceError = (name, err, time) => {
    "use strict";
    fs.appendFileSync("logs/interface-err.txt", `${name}  ${err}  ${time} \n`);
};

/*参数错误*/
exports.params_error = {
    errcode: 1,
    errmsg: "请传入正确的参数!",
    data: []
};

/*promise出现未捕获错误
* params inter:接口名
* params err:错误信息
* params res:返回体
* */
exports.pro_error = (inter, err, res) => {
    "use strict";
    exports.interfaceError(inter, err, new Date().toLocaleString());
    res.send({
        errcode: 1,
        errmsg: "发生错误!",
        data: []
    });
};

/*promise reject
* params inter:接口名
* params err:错误信息
* params res:返回体
* params msg:返回错误信息
* */
exports.pro_reject = (inter, err, res, msg) => {
    "use strict";
    exports.interfaceError(inter, err, new Date().toLocaleString());
    res.send({
        errcode: 1,
        errmsg: msg,
        data: []
    });
};
/*redis缓存*/
exports.createRedisClient = () => {
    //创建一个 Redis 客户端并连接到 Redis-Server
    let client = redis.createClient();
    //注册 Redis 错误事件监听
    client.on('error', function (err) {
        console.log('redis error event - ' + client.host + ':' + client.port + ' - ' + err);
    });
    return client;
};
/*RFM模型对F的动态配置*/
exports.setf=()=>{
    return 6;
};
