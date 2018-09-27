"use strict";

var app = angular.module("app", []);
var userPhone = $.getUrlParams(location)["userPhone"] || 0;
if (!userPhone) {
    $.tipsModal({
        title: "提示",
        content: "未获取到用户相关数据,请确认操作是否合法!"
    });
}
/*userDetails*/
app.controller("userDetails", function ($scope, $http) {
    "use strict";

    $scope.userPhone = userPhone;
    /*rfm分类*/
    $scope.type_r = $.getJsonStatic("r")[3].value; //单位:天
    $scope.type_f = $.getJsonStatic("f")[3].value; //单位:次
    $scope.type_m = $.getJsonStatic("m")[3].value; //单位:万元
    if (!$scope.userPhone) {
        $.tipsModal({
            title: "提示",
            content: "未获取到用户相关数据,请确认操作是否合法!"
        });
        return false;
    }
    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/userDetailsBasicInfo",
        data: {
            userPhone: $scope.userPhone
        },
        modal: modal,
        callback: function callback(res) {
            var data = res.data.data;
            $scope.name = data.basicInfo.name; //用户姓名
            $scope.registerTime = data.basicInfo.time; //入库时间
            $scope.sex = function () {
                //性别
                var list = $.getJsonStatic("sex"),
                    name = "未知";
                list.map(function (item) {
                    if (item.value === +data.basicInfo.sex) {
                        name = item.name;
                    }
                });
                return name;
            }();
            $scope.birthday = data.basicInfo.birthday; //生日
            $scope.marriage = function () {
                //婚姻状况
                var list = $.getJsonStatic("marriage"),
                    name = "未知";
                list.map(function (item) {
                    if (item.value === +data.basicInfo.marriage) {
                        name = item.name;
                    }
                });
                return name;
            }();
            $scope.phone = data.basicInfo.phone; //电话
            $scope.costTotal = data.costInfo.total; //消费总金额
            $scope.costTimes = data.costInfo.times; //消费总次数
            $scope.lastCost = data.lastTime; //最近一次消费时间
        }
    });
    /*获取用的RFM分类*/
    $.$http_post({
        http: $http,
        url: "/userGroupAnalysis",
        data: {
            userPhone: $scope.userPhone,
            type_r: $scope.type_r,
            type_f: $scope.type_f,
            type_m: $scope.type_m
        },
        modal: modal,
        callback: function callback(res) {
            var data = res.data.data;
            data.map(function (item) {
                if (item.data.length > 0) $scope.RFM = item.name;
            });
        }
    });
});

/*composite*/
app.controller("composite", function ($scope, $http) {
    "use strict";

    $scope.option = {
        tooltip: {},
        radar: {
            indicator: [{ name: '消费力', max: 100 }, { name: '购物频率', max: 100 }, { name: '购物时长', max: 100 }, { name: '客单价', max: 100 }, { name: '提袋率', max: 100 }],
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
            name: "数量",
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
            url: "/userComposite",
            data: { userPhone: userPhone },
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.option.series[0].data[0].value[0] = data.consume || 0;
                $scope.option.series[0].data[0].value[1] = data.frequency || 0;
                $scope.option.series[0].data[0].value[2] = data.time || 0;
                $scope.option.series[0].data[0].value[3] = data.unit || 0;
                $scope.option.series[0].data[0].value[4] = data.bag || 0;
                $scope.composite = data.composite || "暂无";
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*verify-total*/
app.controller("verifyTotal", function ($scope, $http) {
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
    $(function () {
        $scope.canvasDom = echarts.init($("#verify-total")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/userPushApply",
            data: { userPhone: userPhone },
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.name;
                });
                $scope.option.series[0].data = data.map(function (item) {
                    return item.push;
                });
                $scope.option.series[1].data = data.map(function (item) {
                    return item.apply;
                });
                $scope.option.series[2].data = data.map(function (item) {
                    return item.percent;
                });
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*userRouteToday*/
app.controller("userRouteToday", function ($scope, $http) {
    "use strict";

    var floors = [],
        img_index = Math.ceil(Math.random() * 10);
    for (var i = 0; i < 5; i++) {
        floors.push({
            name: i + 1 + "F",
            active: !i,
            url: "../image/floors/" + img_index + ".png"
        });
        img_index += 1;
    }
    $scope.floors = floors;
    $scope.chooseFloor = function (index) {
        $scope.floors.map(function (item, index_item) {
            if (index === index_item) {
                item.active = true;
                $scope.img_url = item.url;
            } else item.active = false;
        });
    };
    $scope.chooseFloor(0);
});

/*userRouteThreeMonth*/
app.controller("userRouteThreeMonth", function ($scope, $http) {
    "use strict";

    $scope.pageIndex = 1;
    $scope.page = function (total) {
        $('#box-user-route').paging({
            initPageNo: 1, // 初始页码
            totalPages: Math.ceil(total / 10), //总页数
            slideSpeed: 600, // 缓动速度。单位毫秒
            jump: true, //是否支持跳转
            callback: function callback(page) {
                // 回调函数
                // 回调函数
                if ($scope.pageIndex != page) {
                    $scope.pageIndex = page;
                    $scope.search(1);
                }
            }
        });
    };
    $scope.search = function (isBtnSearch) {
        var modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/userCostRoute",
            data: { userPhone: userPhone, pageIndex: $scope.pageIndex },
            modal: modal,
            callback: function callback(res) {
                var data = res.data.data;
                if (!isBtnSearch) $scope.page(data.total);
                $scope.list = data.list;
            }
        });
    };
    $scope.search();
});

/*userHobby*/
app.controller("userHobby", function ($scope, $http) {
    "use strict";

    $scope.option = {
        xAxis: {
            type: "category",
            data: []
        },
        yAxis: {
            name: "(偏好指数)",
            max: 100
        },
        tooltip: {
            trigger: "axis",
            formatter: function formatter(params) {
                return $.echartsTooltip(params);
            }
        },
        series: [{
            type: "bar",
            name: "购买次数",
            data: [],
            barWidth: 6,
            itemStyle: {
                normal: {
                    barBorderRadius: [5, 5, 0, 0],
                    color: "#FAAF66"
                }
            }
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#hobby")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/userHobbyBrand",
            data: { userPhone: userPhone },
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.name_cn || item.name_en || "未知";
                });
                $scope.option.series[0].data = data.map(function (item) {
                    return item.times || 0;
                });
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*potentialHobby*/
app.controller("potentialHobby", function ($scope, $http) {
    "use strict";

    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/userPotentialHobbyBrand",
        data: { userPhone: userPhone },
        modal: modal,
        callback: function callback(res) {
            var data = res.data.data;
            $scope.potentialHobby = data.map(function (item) {
                return item.name_cn || item.name_en || "未知";
            });
        }
    });
});

/*costList*/
app.controller("costList", function ($scope, $http) {
    "use strict";

    $scope.pageIndex = 1;
    $scope.userPhone = userPhone;
    var modal = $.showLoading();
    $scope.search = function (isBtnSearch) {
        $.$http_post({
            http: $http,
            url: "/userCostList",
            modal: modal,
            data: {
                userPhone: $scope.userPhone,
                pageIndex: $scope.pageIndex || 0
            },
            callback: function callback(res) {
                var data = res.data.data;
                $scope.list = data.data;
                if (!isBtnSearch) $scope.page(data.total);
            }
        });
    };
    $scope.page = function (total) {
        $('#box-user-cost-list').paging({
            initPageNo: 1, // 初始页码
            totalPages: Math.ceil(total / 10), //总页数
            slideSpeed: 600, // 缓动速度。单位毫秒
            jump: true, //是否支持跳转
            callback: function callback(page) {
                // 回调函数
                // 回调函数
                if ($scope.pageIndex != page) {
                    $scope.pageIndex = page;
                    $scope.search(1);
                }
            }
        });
    };
    $scope.search();
});