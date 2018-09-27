"use strict";

var app = angular.module("app", []);

/*todayRelate*/
app.controller("todayRelate", function ($scope, $http) {
    "use strict";

    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/userLibOverview",
        modal: modal,
        callback: function callback(res) {
            var data = res.data.data;
            $scope.userToday = data.user_today;
            $scope.userAll = data.user_total;
            $scope.touchToday = data.touch_today;
            $scope.touchAll = data.touch_total;
        }
    });
});

/*userFrom*/
app.controller("userFrom", function ($scope, $http) {
    "use strict";

    $scope.option = {
        legend: {
            data: ["人数", "比例"],
            itemWidth: 14,
            left: "right"
        },
        tooltip: {
            trigger: "axis",
            formatter: function formatter(params) {
                return $.echartsTooltip(params);
            }
        },
        xAxis: {
            type: "category",
            data: []
        },
        yAxis: [{
            name: "(人数)",
            splitLine: {
                show: false
            }
        }, {
            name: "(比例)",
            max: 100,
            splitLine: {
                show: false
            }
        }],
        series: [{
            type: "bar",
            name: "人数",
            barWidth: 6,
            itemStyle: {
                normal: {
                    color: "#8C7EEC",
                    barBorderRadius: [5, 5, 0, 0]
                }
            },
            data: []
        }, {
            type: "bar",
            name: "比例",
            barWidth: 6,
            yAxisIndex: 1,
            itemStyle: {
                normal: {
                    color: "#FAAF66",
                    barBorderRadius: [5, 5, 0, 0]
                }
            },
            data: []
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#user-from")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/userLibUserFrom",
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.user_from || '未知';
                });
                $scope.option.series[0].data = data.map(function (item) {
                    return item.amount || 0;
                });
                $scope.option.series[1].data = data.map(function (item) {
                    return item.percent || 0;
                });
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*userSex*/
app.controller("userSex", function ($scope, $http) {
    "use strict";

    $scope.option = {
        legend: {
            data: ["人数", "比例"],
            itemWidth: 14,
            left: "right"
        },
        tooltip: {
            trigger: "axis",
            formatter: function formatter(params) {
                return $.echartsTooltip(params);
            }
        },
        xAxis: {
            type: "category",
            data: []
        },
        yAxis: [{
            name: "(人数)",
            splitLine: {
                show: false
            }
        }, {
            name: "(比例)",
            max: 100,
            splitLine: {
                show: false
            }
        }],
        series: [{
            type: "bar",
            name: "人数",
            barWidth: 6,
            itemStyle: {
                normal: {
                    color: "#8C7EEC",
                    barBorderRadius: [5, 5, 0, 0]
                }
            },
            data: []
        }, {
            type: "bar",
            name: "比例",
            barWidth: 6,
            yAxisIndex: 1,
            itemStyle: {
                normal: {
                    color: "#5DBDBC",
                    barBorderRadius: [5, 5, 0, 0]
                }
            },
            data: []
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#user-sex")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/userLibUserSex",
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                var sexList = $.getJsonStatic("sex");
                data.map(function (item_data) {
                    sexList.map(function (item_sex) {
                        if (item_data.sex === item_sex.value) {
                            item_data.name = item_sex.name;
                        }
                    });
                });
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.name || '未知';
                });
                $scope.option.series[0].data = data.map(function (item) {
                    return item.amount || 0;
                });
                $scope.option.series[1].data = data.map(function (item) {
                    return item.percent || 0;
                });
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*userAge*/
app.controller("userAge", function ($scope, $http) {
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
            name: "(人数)",
            splitLine: {
                show: false
            }
        }, {
            name: "(比例)",
            max: 100,
            splitLine: {
                show: false
            }
        }],
        legend: {
            x: 'right',
            itemWidth: 14,
            data: ["人数", "比例"]
        },
        series: [{
            type: "bar",
            name: "人数",
            data: [],
            barWidth: 6,
            itemStyle: {
                normal: {
                    barBorderRadius: [5, 5, 0, 0],
                    color: "#5DBDBC"
                }
            }
        }, {
            type: "line",
            name: "比例",
            yAxisIndex: 1,
            data: [],
            barWidth: 10,
            itemStyle: {
                normal: {
                    color: "#8C7EEC"
                }
            }
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#user-age")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/userLibUserAge",
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.name;
                }); //年龄段
                $scope.option.series[0].data = data.map(function (item) {
                    return item.amount;
                }); //人数
                $scope.option.series[1].data = data.map(function (item) {
                    return item.percent;
                }); //比例
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*userMarriage*/
app.controller("userMarriage", function ($scope, $http) {
    "use strict";

    $scope.option = {
        tooltip: {
            trigger: 'item',
            formatter: "{b}: {c} ({d}%)"
        },
        legend: {
            x: 'right',
            itemWidth: 14,
            data: ["未婚", "已婚", "未知"]
        },
        series: [{
            type: "pie",
            data: [{ name: "未婚", value: 0, itemStyle: { normal: { color: "#5DBDBC" } } }, { name: "已婚", value: 0, itemStyle: { normal: { color: "#8C7EEC" } } }, { name: "未知", value: 0, itemStyle: { normal: { color: "#FAAF66" } } }],
            radius: ["45%", "65%"],
            label: {
                normal: {
                    show: false
                }
            }
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#user-marriage")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/userLibUserMarriage",
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data,
                    data_new = [],
                    color_class = ["pomo", "cpos", "probe"];
                var marriage = $.getJsonStatic("marriage");
                /*格式化数据*/
                for (var i = 0; i < marriage.length; i++) {
                    var item_m = marriage[i],
                        is_exist = null;
                    for (var k = 0; k < data.length; k++) {
                        var item_d = data[k];
                        /*有该类数据*/
                        if (item_m.value === item_d.is_married) {
                            is_exist = {
                                name: item_m.name,
                                amount: item_d.amount
                            };
                        }
                    }
                    /*没有该类数据,添加默认值*/
                    if (!is_exist) data_new.push({ name: item_m.name, amount: 0 });else data_new.push(is_exist);
                    /*背景色class*/
                    data_new[i].color = color_class[i];
                    $scope.option.series[0].data[i].value = data_new[i].amount;
                }
                $scope.list = data_new;
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});