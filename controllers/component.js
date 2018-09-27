let config = require("./config");
let redis = require("redis"),
    client = redis.createClient();
/*获取品牌总数*/
exports.getBrandsTotal = () => {
    "use strict";
    let sql = `select count(DISTINCT brand_code) from mtx_brand`;
    return config.userHandle(sql, []);
};

/*获取品牌业态及code*/
exports.getBrandsRetail = () => {
    "use strict";
    let sql = ` SELECT
mb.id nodeId,
mb.brand_code code, 
mb.brand_name_cn name,
t.cloud_brand_code brand_code, 
t.retail_name, 
t.retail category,
mbc.composite_rating composite
FROM mtx_brand mb
LEFT JOIN (select mbc.brand_code,mbc.cloud_brand_code,retail_name,mr.id retail from mtx_brand_cluster mbc LEFT JOIN mtx_retail mr on left(mbc.cloud_brand_code,2)=mr.retail_code) t ON mb.brand_code = t.brand_code
LEFT JOIN mtx_brand_composite mbc on mbc.brand_code= mb.brand_code`;
    return config.userHandle(sql, []);
};

/*业态分类下的品牌总数*/
exports.getBrandsOfRetail = () => {
    "use strict";
    let sql = ` SELECT mr.retail_name name, count(t.brand_code) value
                FROM	mtx_retail mr
                LEFT JOIN
                (
                    SELECT mbc.brand_code,left(mbc.cloud_brand_code,2) retail_code
                    FROM mtx_brand mb
                    LEFT JOIN mtx_brand_cluster mbc ON mb.brand_code = mbc.brand_code
                ) t ON mr.retail_code = t.retail_code
                GROUP BY mr.retail_code
                ORDER BY mr.retail_code ASC`;
    return config.userHandle(sql, []);
};


/*业态分类下的品牌销售总额*/
exports.getBrandsSaleOfRetail = () => {
    "use strict";
    let sql = ` select round(sum(t.amount),2) value, r.retail_name name from  mtx_retail r LEFT JOIN
                (
                    select sum(amount) amount,left(mbc.cloud_brand_code,2) retail from (
                        select brand_code,amount from mtx_record where brand_code is not null
                        union all
                        select brand_code,record_total amount from mtx_brand_month_record where brand_code is not null
                    ) t LEFT JOIN mtx_brand_cluster mbc on t.brand_code=mbc.brand_code
                    where mbc.cloud_brand_code is not null group by left(mbc.cloud_brand_code,2)
                )t
                on t.retail = r.retail_code
                GROUP BY r.retail_code
                ORDER BY r.retail_code ASC`;
    return config.userHandle(sql, []);
};

/*触达量*/
exports.touchAmount = () => {
    "use strict";
    let sql = ` SELECT sum(t.count) value,t.data_from from
                (
                    SELECT count(*) count,data_from from mtx_record where data_from is not null GROUP BY data_from
                    UNION ALL
                    select sum(num) count,data_from from mtx_user_record where data_from is not null GROUP BY data_from
                ) t GROUP BY t.data_from ORDER BY t.data_from`;
    return config.userHandle(sql, []);
};

/*品牌链分析*/
exports.brandChainAnalysis = () => {
    "use strict";
    let arr = [3, 4, 5];
    let brandChain = n => {
        /*查品牌链*/
        let sql = `select DISTINCT mbl.brand_link from mtx_brand_link  mbl where LENGTH(mbl.brand_link) - LENGTH(REPLACE(mbl.brand_link,",","")) = ${n - 1} LIMIT 0,10`;
        let p = config.userHandle(sql, []);
        p.then(data => {
            let rt = [];
            if (data.length) {
                let sql2 = '';
                data.map((item, idx) => {
                    let innerSql = '"' + item.brand_link.replace(/,/g, '","') + '"',
                        str = `select count(*) count from mtx_record where store_name IN(${innerSql})`;
                    if (idx == 0) {
                        sql2 += `${str}
                     union all
                     ${str} and left(time,7)=left(now(),7)
                     union all
                    ${str} and left(time,10)=left(now(),10)
                     `;
                    } else {
                        sql2 += `union all
                    ${str}
                 union all
                 ${str} and left(time,7)=left(now(),7)
                 union all
                ${str} and left(time,10)=left(now(),10)
                 `;
                    }
                });
                config.userHandle(sql2, []).then(data2 => {
                    rt = data.map((item, idx) => {
                        item.count = data2[3 * idx].count;
                        item.todayMonth = data2[(3 * idx) + 1].count;
                        item.today = data2[(3 * idx) + 2].count;
                        return item;
                    });
                    /*缓存*/
                    client.select("3", () => {
                        client.set('brandChain' + n, JSON.stringify(rt));
                        client.expire('brandChain' + n, 24 * 60 * 60);
                    })
                });
            }
        }).catch(err => {
            config.pro_error("brandSaleStatistics", err, res);
        });
    };
    arr.map(item => {
        brandChain(item);
    });
};
/*用户RFM分析*/
exports.userGroupAnalysis = () => {
    "use strict";
    let f=config.setf();
    /*查询所有用户*/
    let sql1 = `SELECT name,sex,age,is_married marriage,phone from mtx_user`,
        /*查询有消费记录的用户的信息*/
        sql2 = `SELECT t2.*, mb.retail retail_code,mr.retail_name from
(SELECT 
date_format(time,"%Y-%m-%d %H:%i:%s") time,
DATEDIFF(now(),time) date, 
user_phone,
SUM(amount) money,
t1.store_name
from (select time,user_phone,amount,store_name store_name from mtx_record where user_phone is NOT null and user_phone <>'' ORDER BY time desc) t1
GROUP BY user_phone) t2
LEFT JOIN mtx_brand mb on (mb.brand_name_cn = t2.store_name or mb.brand_name_en = t2.store_name)
LEFT JOIN mtx_retail mr on mr.retail_code=mb.retail`,
        /*查询有消费记录的用户的消费频率*/
        /*RFM模型对F的运算，F取值区间内，单个消费者的消费频率取决于其第一次消费，若在取值区间前就有消费，则按区间月数除消费次数，若在区间内产生第一次消费，则需按第一次消费月计消费月数作为分母，默认近6个月*/
        sql3 = `select CEIL(count(1)/((year(now())-year(time))*12 + (month(now()) - month(time)) + 1)) as times, user_phone 
        from (select * from mtx_record ORDER BY time) as t1 
        where time between date_sub(now(),interval ${f} month) and now()  and user_phone is NOT null and user_phone <>''
        GROUP BY user_phone`;
    let p1 = config.userHandle(sql1, []),
        p2 = config.userHandle(sql2, []),
        p3 = config.userHandle(sql3, []);
    return Promise.all([p1, p2, p3]);
};