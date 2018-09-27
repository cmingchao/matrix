"use strict";

var app = angular.module("app", []);

/*customerSale*/
app.controller("customerSale", function ($scope, $http) {
    "use strict";

    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/customerAndSales",
        modal: modal,
        callback: function callback(res) {
            $scope.data = res.data.data;
        }
    });
});

/*realtime-recommend*/
app.controller("realTimeRecommend", function ($scope, $http) {
    "use strict";

    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/realTimeRecommend",
        modal: modal,
        callback: function callback(res) {
            $scope.data = res.data.data;
        }
    });
});
/*realtime-verificate*/
app.controller("realTimeVerificate", function ($scope, $http) {
    "use strict";

    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/realTimeVerificate",
        modal: modal,
        callback: function callback(res) {
            $scope.data = res.data.data;
        }
    });
});

/*realtimeDynamics*/
app.controller("realTimeDynamics", function ($scope, $http) {
    $scope.list = [];
    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/realTimeDynamics",
        modal: modal,
        callback: function callback(res) {
            "use strict";

            var data = res.data.data;
            $scope.list = data;
        }
    });
});

/*touch*/
app.controller("touch", function ($scope, $http) {
    "use strict";

    $scope.option = {
        tooltip: {
            trigger: "axis"
        },
        grid: {
            left: "15%"
        },
        xAxis: {
            type: "category",
            data: []
        },
        yAxis: {
            name: "(人数)",
            splitLine: {
                show: false
            }
        },
        series: [{
            type: "bar",
            name: "人数",
            barWidth: 5,
            itemStyle: {
                normal: {
                    color: "#9A5BEA",
                    barBorderRadius: [5, 5, 0, 0]
                }
            },
            data: []
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#touch-amount")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/touchAmount",
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                data.map(function (item) {
                    if (item.name === "CPOS") item.name = "水单";else if (item.name === "POMO") item.name = "广告";
                });
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.name;
                });
                $scope.option.series[0].data = data.map(function (item) {
                    return item.value || 0;
                });
                $scope.canvasDom.hideLoading();
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*touchTransmutation*/
app.controller("touchTransmutation", function ($scope, $http) {
    "use strict";

    $scope.option = {
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
        grid: {
            left: "15%"
        },
        yAxis: {
            name: "(比例)",
            splitLine: {
                show: false
            }
        },
        legend: {
            itemWidth: 9,
            itemHeight: 9,
            left: "right",
            data: ["总转化率", "甄别转化率"]
        },
        series: [{
            type: "bar",
            name: "总转化率",
            barWidth: 6,
            itemStyle: {
                normal: {
                    color: "#9A5BEA",
                    barBorderRadius: [5, 5, 0, 0]
                }
            },
            data: []
        }, {
            type: "bar",
            name: "甄别转化率",
            barWidth: 6,
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
        $scope.canvasDom = echarts.init($("#touch-transmutation")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/touchConversionRate",
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                data.map(function (item) {
                    if (item.name === "CPOS") item.name = "水单";else if (item.name === "POMO") item.name = "广告";
                });
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.name;
                });
                $scope.option.series[0].data = data.map(function (item) {
                    return item.percent_total || 0;
                });
                $scope.option.series[1].data = data.map(function (item) {
                    return item.percent_identify || 0;
                });
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});