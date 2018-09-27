"use strict";

var app = angular.module("app", []);
var brandCode = $.getUrlParams(location)["brandCode"],
    nodeId = $.getUrlParams(location)["nodeId"];
/*进入页面路径非法*/
if (!brandCode || !nodeId) {
    $.tipsModal({
        title: "提示",
        content: "未获取到品牌链相关数据,请确认操作是否合法,页面将可能显示异常"
    });
}
/*mainBrand*/
app.controller("mainBrand", function ($scope, $http) {
    "use strict";
    /*初始化*/

    $scope.brandCode = brandCode;
    $scope.nodeId = nodeId;
    $scope.brandName = "";
    /*跳转到品牌关联页面*/
    $scope.relationBrand = function () {
        var modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandRelation",
            modal: modal,
            callback: function callback(res) {
                var data = res.data.data;
                $.chooseMainBrand(data, $scope.nodeId, [0, 5], function (webkitDep_new, chains_arr) {
                    /*设置cookie,打开二级品牌关系图页面*/
                    chains_arr.map(function (chain) {
                        var node_new = JSON.parse(JSON.stringify(webkitDep_new.nodes));
                        node_new.map(function (web_nodes) {
                            /*初始化为不显示*/
                            web_nodes.show = false;
                            web_nodes.itemStyle = { normal: { opacity: 0 } };
                            chain.nodes.map(function (cha_nodes) {
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
                    location.href = "/html/brandRelationSecond?nodeId=" + $scope.nodeId + "&brandName=" + $scope.brandName + "&brandCode=" + $scope.brandCode;
                });
            }
        });
    };
    $scope.retail = $.getNameOfList(brandCode, "retailList", [0, 2]);
    $scope.sex = $.getNameOfList(brandCode, "sexList", [2, 1]);
    $scope.age = $.getNameOfList(brandCode, "ageList", [3, 2]);
    $scope.area = $.getNameOfList(brandCode, "areaList", [8, 1]);
    /*联动属性*/
    $scope.avPrice = $.getNameOfSecondary(brandCode)[0];
    $scope.distinct = $.getNameOfSecondary(brandCode)[1];
    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/brandDetailsBasicInfo",
        data: { brandCode: $scope.brandCode },
        modal: modal,
        callback: function callback(res) {
            var data = res.data.data[0] || {};
            $scope.brandName = data.name || "未知";
            $scope.addTime = data.add_time || "未知";
            $scope.composite = data.composite || "暂无";
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
            indicator: [{ name: '销售额', max: 100 }, { name: '客流', max: 100 }, { name: '引流量', max: 100 }, { name: '获客量', max: 100 }, { name: '转化率', max: 100 }],
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
    $scope.brandCode = brandCode;
    $(function () {
        $scope.canvasDom = echarts.init($("#composite")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandComposite",
            data: { brandCode: $scope.brandCode },
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.option.series[0].data[0].value[0] = data.sale || 0;
                $scope.option.series[0].data[0].value[1] = data.customer || 0;
                $scope.option.series[0].data[0].value[2] = data.drainage || 0;
                $scope.option.series[0].data[0].value[3] = data.get_cus || 0;
                $scope.option.series[0].data[0].value[4] = data.switch || 0;
                $scope.composite = data.composite || "暂无";
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*todayRelate*/
app.controller("todayRelate", function ($scope, $http) {
    "use strict";

    $scope.brandCode = brandCode;
    var modal = $.showLoading();
    /*品牌相关数据*/
    $.$http_post({
        http: $http,
        url: "/brandDetailsToday",
        data: { brand_code: $scope.brandCode },
        modal: modal,
        callback: function callback(res) {
            var data = res.data.data;
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

    $scope.brandCode = brandCode;
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
            data: [{ name: "男", value: 0, itemStyle: { normal: { color: "#61BFBE" } } }, { name: "女", value: 0, itemStyle: { normal: { color: "#8C7EEC" } } }],
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
            data: { brandCode: $scope.brandCode },
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data,
                    sex = $.getJsonStatic("sex");
                /*性别*/
                sex.map(function (sex) {
                    data.map(function (item, index) {
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
            formatter: function formatter(params) {
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
    $scope.brandCode = brandCode;
    $(function () {
        $scope.canvasDom = echarts.init($("#age")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandDetailsUserAge",
            data: { brandCode: $scope.brandCode },
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.name;
                }); //年龄段
                $scope.option.series[0].data = data.map(function (item) {
                    return item.amount;
                }); //人数
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
            formatter: function formatter(params) {
                return $.echartsTooltip(params);
            }
        },
        xAxis: {
            type: "category",
            data: [],
            axisLabel: {
                rotate: -15
            }
        },
        yAxis: [{
            name: "(次数)",
            splitLine: {
                show: false
            }
        }, {
            name: "(比例)",
            splitLine: {
                show: false
            },
            max: 100
        }],
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
    $scope.brandCode = brandCode;
    $(function () {
        $scope.canvasDom = echarts.init($("#verify")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandVerify",
            data: { brandCode: $scope.brandCode },
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.name || "未知";
                });
                $scope.option.series[0].data = data.map(function (item) {
                    return item.push || 0;
                });
                $scope.option.series[1].data = data.map(function (item) {
                    return item.apply || 0;
                });
                $scope.option.series[2].data = data.map(function (item) {
                    return item.percent || 0;
                });
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});