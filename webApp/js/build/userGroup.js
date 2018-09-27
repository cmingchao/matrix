"use strict";

var app = angular.module("app", []);
var RFM_type = +$.getUrlParams(location)["userType"] - 1,
    r = $.getUrlParams(location)["r"] || -1,
    f = $.getUrlParams(location)["f"] || -1,
    m = $.getUrlParams(location)["m"] || -1;
if (RFM_type < 0 || r < 0 || f < 0 || m < 0) {
    $.tipsModal({
        title: "提示",
        content: "未获取到相关参数,请确认操作是否合法,页面将可能显示异常!"
    });
}
/*userRFMGroup*/
app.controller("userRFMGroup", function ($scope, $http) {
    "use strict";

    var user = JSON.parse($.getCookie("userGroup"))[RFM_type].data;
    $scope.RFM_type = RFM_type;
    $scope.r = r;
    $scope.f = f;
    $scope.m = m;
    $(function () {
        $scope.canvasDom = echarts.init($("#userRFM")[0]);
        $scope.option = {
            color: color_formats,
            series: {
                type: 'graph',
                layout: 'force',
                animation: false,
                opacity: 1,
                label: {
                    normal: {
                        position: 'right',
                        formatter: '{b}'
                    }
                },
                data: user.map(function (node, idx) {
                    node.id = idx;
                    return node;
                }),
                categories: [{ name: "餐食" }],
                force: {
                    edgeLength: 20,
                    gravity: 0.5,
                    repulsion: 50
                }
            }
        };
        $scope.canvasDom.setOption($scope.option);
    });

    $http.get("../../data-static/userGroup.json").then(function (res) {
        var data = res.data;
        var userType = data.filter(function (item) {
            return item.id === +$scope.RFM_type + 1;
        })[0];
        $scope.RFM_type_name = userType ? userType.name : "无";
        $scope.RFM = userType ? userType.RFM : "无";
        $scope.personTotal = user.length;
        $scope.r_value = $.getJsonStatic("r")[r].name; //单位:天
        $scope.f_value = $.getJsonStatic("f")[f].name; //单位:次
        $scope.m_value = $.getJsonStatic("m")[m].name; //单位:万元
    });
});

/*consume*/
app.controller("consume", function ($scope, $http) {
    "use strict";

    $scope.option = {
        tooltip: {
            trigger: "axis"
        },
        xAxis: {
            type: "category",
            data: ["轻餐", "餐食", "服装", "定义类"]
        },
        yAxis: {},
        series: [{
            type: "bar",
            name: "趋势指数",
            barWidth: 5,
            data: [92, 75, 72, 68],
            itemStyle: {
                normal: {
                    color: "#8C7EEC",
                    barBorderRadius: [5, 5, 0, 0]
                }
            }
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#consume")[0]);
        $scope.canvasDom.showLoading();
        $scope.canvasDom.setOption($scope.option);
        $scope.canvasDom.hideLoading();
    });
});

/*sex*/
app.controller("sex", function ($scope, $http) {
    "use strict";

    var user = JSON.parse($.getCookie("userGroup"))[RFM_type].data,
        male = 0,
        female = 0,
        unknow = 0;
    /*性别分类*/
    user.map(function (item) {
        switch (item.sex) {
            case 0:
                female += 1;break;
            case 1:
                male += 1;break;
            default:
                unknow += 1;break;
        }
    });
    $scope.option = {
        tooltip: {
            trigger: "item"
        },
        legend: {
            data: ["男", "女", "未知"],
            itemWidth: 14,
            left: "right"
        },
        series: [{
            type: "pie",
            data: [{ name: "男", value: male, itemStyle: { normal: { color: "#61BFBE" } } }, { name: "女", value: female, itemStyle: { normal: { color: "#8C7EEC" } } }, { name: "未知", value: unknow, itemStyle: { normal: { color: "#FAAF66" } } }],
            labelLine: {
                normal: {
                    show: false
                }
            },
            label: {
                normal: {
                    show: false
                }
            },
            radius: ["55%", "75%"]
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#sex")[0]);
        $scope.canvasDom.showLoading();
        $scope.canvasDom.setOption($scope.option);
        $scope.canvasDom.hideLoading();
    });
});

/*age*/
app.controller("age", function ($scope, $http) {
    "use strict";

    var user = JSON.parse($.getCookie("userGroup"))[RFM_type].data;
    /*性别分类*/
    var user_total = 0,
        user_type = [{}, {}, {}, {}, {}, {}],
        index = 1;
    /*用户总数*/
    user.map(function (item) {
        user_total += 1;
        /*除10分类*/
        item.age_range = Math.floor(item.age / 10);
    });
    var smaller_20 = 0,
        bigger_60 = 0;
    /*20岁以下*/
    user.map(function (item) {
        if (item.age_range < 2) {
            smaller_20 += 1;
        } else {
            return false;
        }
    });
    user_type[0] = {
        amount: smaller_20,
        percent: (smaller_20 / user_total * 100).toFixed(2),
        name: "20岁以下"
    };
    /*60岁及以上*/
    user.map(function (item) {
        if (item.age_range >= 6) {
            bigger_60 += 1;
        } else {
            return false;
        }
    });
    user_type[5] = {
        amount: bigger_60,
        percent: (bigger_60 / user_total * 100).toFixed(2),
        name: "60岁及以上"
    };

    var _loop = function _loop(i) {
        var amount = 0,
            isExist = user.filter(function (item) {
            return item.age_range === i;
        });
        if (isExist.length) {
            /*如果有记录*/
            amount = 1;
        }
        user_type[index] = {
            amount: amount,
            percent: (amount / user_total * 100).toFixed(2),
            name: index + 1 + "0岁-" + (index + 2) + "0岁"
        };
        index += 1;
    };

    for (var i = 2; i < 6; i++) {
        _loop(i);
    }
    $scope.option = {
        tooltip: {
            trigger: "axis",
            formatter: function formatter(params) {
                return $.echartsTooltip(params);
            }
        },
        xAxis: {
            type: "category",
            axisLabel: {
                rotate: -15
            },
            splitLine: {
                show: false
            },
            data: user_type.map(function (item) {
                return item.name;
            })
        },
        yAxis: [{
            name: "(人数)",
            splitLine: {
                show: false
            }
        }, {
            name: '(比例)',
            splitLine: {
                show: false
            }
        }],
        series: [{
            type: "bar",
            name: "人数",
            barWidth: 6,
            data: user_type.map(function (item) {
                return item.amount;
            }),
            itemStyle: {
                normal: {
                    color: "#5DBDBC",
                    barBorderRadius: [5, 5, 0, 0]
                }
            }
        }, {
            type: "line",
            name: "比例",
            yAxisIndex: 1,
            max: 100,
            data: user_type.map(function (item) {
                return item.percent;
            }),
            itemStyle: {
                normal: {
                    color: "#8C7EEC"
                }
            }
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#age")[0]);
        $scope.canvasDom.showLoading();
        $scope.canvasDom.setOption($scope.option);
        $scope.canvasDom.hideLoading();
    });
});

/*marriage*/
app.controller("marriage", function ($scope, $http) {
    "use strict";

    var user = JSON.parse($.getCookie("userGroup"))[RFM_type].data,
        unMarriage = 0,
        marriaged = 0,
        unknow = 0;
    user.map(function (item) {
        switch (item.marriage) {
            case 0:
                unMarriage += 1;break;
            case 1:
                marriaged += 1;break;
            default:
                unknow += 1;break;
        }
    });
    $scope.unMarriage = unMarriage;
    $scope.marriaged = marriaged;
    $scope.unknow = unknow;
    $scope.option = {
        tooltip: {
            trigger: "item"
        },
        legend: {
            data: ["未婚", "已婚", "未知"],
            itemWidth: 14,
            left: "right"
        },
        series: [{
            type: "pie",
            data: [{ name: "未婚", value: $scope.unMarriage, itemStyle: { normal: { color: "#5DBDBC" } } }, { name: "已婚", value: $scope.marriaged, itemStyle: { normal: { color: "#8C7EEC" } } }, { name: "未知", value: $scope.unknow, itemStyle: { normal: { color: "#FAAF66" } } }],
            labelLine: {
                normal: {
                    show: false
                }
            },
            label: {
                normal: {
                    show: false
                }
            },
            radius: ["55%", "75%"]
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#marriage")[0]);
        $scope.canvasDom.showLoading();
        $scope.canvasDom.setOption($scope.option);
        $scope.canvasDom.hideLoading();
    });
});