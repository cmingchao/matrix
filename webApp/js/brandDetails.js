let app = angular.module("app", []);
const nodeId = $.getUrlParams(location)["nodeId"],
    brandCode = $.getUrlParams(location)["brandCode"],
    c_brand_code = $.getUrlParams(location)["c_brand_code"] == '0' ? 0 : $.getUrlParams(location)["c_brand_code"];

/*进入页面路径非法*/
if (!nodeId || !brandCode) {
    $.tipsModal({
        title: "提示",
        content: "未获取到该品牌相关数据,请确认操作是否合法,页面将可能显示异常"
    });
}
/*mainBrand*/
app.controller("mainBrand", function ($scope, $http) {
    "use strict";
    /*初始化*/
    $scope.brandCode = brandCode;
    $scope.c_brand_code = c_brand_code;
    /*跳转到品牌关联页面*/
    $scope.relationBrand = () => {
        let modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandRelation",
            modal: modal,
            callback(res) {
                let data = res.data.data;
                $.chooseMainBrand(data, nodeId, [0, 5], function (webkitDep_new, chains_arr) {
                    /*设置cookie,打开二级品牌关系图页面*/
                    chains_arr.map(chain => {
                        let node_new = JSON.parse(JSON.stringify(webkitDep_new.nodes));
                        node_new.map(web_nodes => {
                            /*初始化为不显示*/
                            web_nodes.show = false;
                            web_nodes.itemStyle = {normal: {opacity: 0}};
                            chain.nodes.map(cha_nodes => {
                                /*该链中的品牌显示*/
                                if (cha_nodes.nodeId === web_nodes.nodeId) {
                                    web_nodes.itemStyle.normal.opacity = 1;
                                    web_nodes.show = true;
                                }
                            });
                        });
                        chain.nodes = node_new;
                    });
                    /*存cookie*/
                    $.setCookie("brandChain", JSON.stringify(webkitDep_new), 1000 * 60);
                    $.setCookie("brandChainList", JSON.stringify(chains_arr), 1000 * 60);
                    /*跳转到品牌链第三级页面*/
                    location.href = "/html/brandRelationSecond?nodeId=" + nodeId + "&brandName=" + $scope.brandName + "&c_brand_code=" + c_brand_code + "&brandCode=" + brandCode;
                });
            }
        });
    };
    $scope.retail = $.getNameOfList(c_brand_code, "retailList", [0, 2]);
    $scope.sex = $.getNameOfList(c_brand_code, "sexList", [2, 1]);
    $scope.age = $.getNameOfList(c_brand_code, "ageList", [3, 2]);
    $scope.area = $.getNameOfList(c_brand_code, "areaList", [8, 1]);
    /*联动属性*/
    $scope.avPrice = $.getNameOfSecondary(c_brand_code)[0];
    $scope.distinct = $.getNameOfSecondary(c_brand_code)[1];
    let modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/brandDetailsBasicInfo",
        data: {brandCode: brandCode},
        modal: modal,
        callback(res) {
            let data = res.data.data[0] || {};
            $scope.brandName = data.name_cn || data.name_en || "未知";
            $scope.addTime = data.add_time || "未知";
            $scope.composite = data.composite || 0;
        }
    });
});

/*composite*/
app.controller("composite", function ($scope, $http) {
    "use strict";
    /*综合指数*/
    $scope.option = {
        tooltip: {},
        radar: {
            radius: '60%',
            indicator: [
                {name: '销售额', max: 100},
                {name: '消费单数', max: 100},
                {name: '推荐数', max: 100},
                {name: '核销数', max: 100},
                {name: '转化率', max: 100}],
            name: {
                textStyle: {
                    color: '#000'
                }
            },
            axisLine: {
                lineStyle: {
                    color: '#CCCCCC'
                }
            },
            splitLine: {
                lineStyle: {
                    color: "#CCCCCC"
                }
            },
            splitArea: {
                areaStyle: {
                    color: "transparent"
                }
            }
        },
        series: [{
            type: 'radar',
            name: "综合指数",
            data: [{
                value: []
            }],
            symbolSize: 0,
            areaStyle: {
                normal: {
                    color: {
                        type: 'linear',
                        x: 1,
                        y: 1,
                        x2: 0,
                        y2: 0,
                        colorStops: [{
                            offset: 0, color: '#8C7EEC' // 0% 处的颜色
                        }, {
                            offset: 1, color: '#9A5BEA' // 100% 处的颜色
                        }]
                    }
                }
            },
            lineStyle: {
                normal: {
                    color: "transparent"
                }
            }
        }]
    };

    $(function () {
        $scope.canvasDom = echarts.init($("#composite")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandComposite",
            data: {brandCode: brandCode},
            canvasDom: $scope.canvasDom,
            callback(res) {
                let data = res.data.data;
                $scope.option.series[0].data[0].value[0] = data.sale ? (data.sale * 100).toFixed(2) : 0;
                $scope.option.series[0].data[0].value[1] = data.customer ? (data.customer * 100).toFixed(2) : 0;
                $scope.option.series[0].data[0].value[2] = data.drainage ? (data.drainage * 100).toFixed(2) : 0;
                $scope.option.series[0].data[0].value[3] = data.get_cus ? (data.get_cus * 100).toFixed(2) : 0;
                $scope.option.series[0].data[0].value[4] = data.switch ? ((data.switch * 100) > 100 ? 100 : (data.switch * 100).toFixed(2)) : 0;
                $scope.composite = data.composite ? (data.composite.toFixed(2)) : 0;
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*todayRelate*/
app.controller("todayRelate", function ($scope, $http) {
    "use strict";
    let modal = $.showLoading();
    /*品牌相关数据*/
    $.$http_post({
        http: $http,
        url: "/brandDetailsToday",
        data: {brand_code: brandCode},
        modal: modal,
        callback(res) {
            let data = res.data.data;
            /*引流*/
            $scope.drainage = {
                today: data.drainage.today || 0,
                total: data.drainage.total || 0
            };
            /*获客*/
            $scope.guest = {
                today: data.guest.today || 0,
                total: data.guest.total || 0
            };
            /*转化率*/
            $scope.transmutation = {
                today: data.transmutation.today || 0,
                total: data.transmutation.total || 0
            };
            /*总收益*/
            $scope.earningsTotal = data.sale;
        }
    });
});

/*sex*/
app.controller("sex", function ($scope, $http) {
    "use strict";
    $scope.option = {
        tooltip: {
            trigger: 'item',
            formatter: "{b}: {c} ({d}%)"
        },
        legend: {
            x: 'right',
            itemWidth: 14,
            data: ["男", "女"]
        },
        series: [{
            type: "pie",
            data: [
                {name: "男", value: 0, itemStyle: {normal: {color: "#61BFBE"}}},
                {name: "女", value: 0, itemStyle: {normal: {color: "#8C7EEC"}}}
            ],
            radius: ["55%", "75%"],
            label: {
                normal: {
                    show: false
                }
            }
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#sex")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandDetailsUserSex",
            data: {brandCode: brandCode},
            canvasDom: $scope.canvasDom,
            callback(res) {
                let data = res.data.data,
                    sex = $.getJsonStatic("sex");
                /*性别*/
                sex.map(sex => {
                    data.map((item, index) => {
                        /*设置数据*/
                        if (item.sex === sex.value) {
                            $scope.option.series[0].data[index].value = item.count || 0;
                        }
                    });
                });
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*age*/
app.controller("age", function ($scope, $http) {
    "use strict";
    $scope.option = {
        tooltip: {
            trigger: 'axis',
            formatter: params => {
                return $.echartsTooltip(params);
            }
        },
        xAxis: {
            type: "category",
            data: [],
            axisLabel: {
                rotate: -25,
                interval: 0
            }
        },
        yAxis: {
            name: "(人)",
            splitLine: {
                show: false
            }
        },
        legend: {
            x: 'right',
            itemWidth: 14
        },
        series: [{
            type: "bar",
            name: "人数",
            data: [],
            barWidth: 6,
            itemStyle: {
                normal: {
                    barBorderRadius: [5, 5, 0, 0],
                    color: "#8C7EEC"
                }
            }
        }]
    };
    /*品牌编码*/
    $(function () {
        $scope.canvasDom = echarts.init($("#age")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandDetailsUserAge",
            data: {brandCode: brandCode},
            canvasDom: $scope.canvasDom,
            callback(res) {
                let data = res.data.data;
                $scope.option.xAxis.data = data.map(item => item.name); //年龄段
                $scope.option.series[0].data = data.map(item => item.amount); //人数
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*verify*/
app.controller("verify", function ($scope, $http) {
    "use strict";
    $scope.option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                return $.echartsTooltip(params);
            }
        },
        xAxis: {
            type: "category",
            data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            axisLabel: {
                rotate: -15
            }
        },
        yAxis: [
            {
                name: "(次数)",
                splitLine: {
                    show: false
                }
            },
            {
                name: "(比例%)",
                splitLine: {
                    show: false
                },
                max: 100
            }
        ],
        legend: {
            x: 'right',
            itemWidth: 14,
            data: ["推送量", "核销量", "核销占比"]
        },
        series: [{
            type: "bar",
            name: "推送量",
            data: [],
            barWidth: 6,
            itemStyle: {
                normal: {
                    barBorderRadius: [5, 5, 0, 0],
                    color: "#8C7EEC"
                }
            }
        }, {
            type: "bar",
            name: "核销量",
            data: [],
            barWidth: 6,
            itemStyle: {
                normal: {
                    barBorderRadius: [5, 5, 0, 0],
                    color: "#FAAF66"
                }
            }
        }, {
            type: "line",
            name: "核销占比",
            data: [],
            barWidth: 6,
            yAxisIndex: 1,
            itemStyle: {
                normal: {
                    color: "#5DBDBC"
                }
            }
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#verify")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandVerify",
            data: {brandCode: brandCode},
            canvasDom: $scope.canvasDom,
            callback(res) {
                let data1 = res.data.data.data1;
                let data2 = res.data.data.data2;
                let data_new = [];
                for (let i = 0; i < 12; i++) {
                    let _pushNum = 0,
                        _verifyNum = 0;
                    if (data1.length > 0) {
                        data1.map(items => {
                            if (i === Number(items.months) - 1) {
                                _pushNum = items.pushNum;
                            }
                        })
                    }
                    if (data2.length > 0) {
                        data2.map(items => {
                            if (i === Number(items.months) - 1) {
                                _verifyNum = items.verifyNum;
                            }
                        })
                    }
                    data_new.push({pushNum: _pushNum || 0, verifyNum: _verifyNum || 0, percent: 0})
                }
                data_new.map(item => {
                    item.percent = item.pushNum ? (item.verifyNum / item.pushNum * 100).toFixed(2) : 0;
                    if (!item.pushNum && item.verifyNum) item.percent = 100;
                    item.percent = item.percent > 100 ? 100 : item.percent;
                });
                $scope.option.series[0].data = data_new.map(item => item.pushNum || 0);
                $scope.option.series[1].data = data_new.map(item => item.verifyNum || 0);
                $scope.option.series[2].data = data_new.map(item => item.percent || 0);
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});