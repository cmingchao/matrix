let app = angular.module("app", []);

/*saleStatistics 品牌销售统计*/
app.controller("saleStatistics", function ($scope, $http) {
    "use strict";
    $scope.option = {
        grid: {
            top: 80
        },
        xAxis: {
            type: "category",
            axisLabel: {
                interval: 0,
                rotate: -15
            },
            data: []
        },
        yAxis: [
            {
                name: "销售额(万元)",
                splitLine: {
                    show: false
                }
            },
            {
                name: "品牌数(个)",
                splitLine: {
                    show: false
                }
            }
        ],
        tooltip: {
            trigger: "axis"
        },
        legend: {
            left: "right",
            data: ["品牌数量", "销售额"],
            itemWidth: 14
        },
        series: [
            {
                type: "bar",
                name: "销售额",
                barWidth: 6,
                itemStyle: {
                    normal: {
                        color: "#5DBDBC",
                        barBorderRadius: [5, 5, 0, 0]
                    }
                },
                data: []
            },
            {
                type: "line",
                name: "品牌数量",
                yAxisIndex: 1,
                itemStyle: {
                    normal: {
                        color: "#8C7EEC"
                    }
                },
                data: []
            }
        ]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#sale-statistics")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandSaleStatistics",
            canvasDom: $scope.canvasDom,
            callback(res) {
                let data = res.data.data;
                $scope.option.xAxis.data = data.brand.map(item => item.name);
                $scope.option.series[0].data = data.record.map(item => (item.value / 10000).toFixed(2) || 0);
                $scope.option.series[1].data = data.brand.map(item => item.value || 0);
                $scope.canvasDom.hideLoading();
                $scope.canvasDom.setOption($scope.option);
            }
        })
    });
});

/*todayRelate今日相关*/
app.controller("todayRelate", function ($scope, $http) {
    "use strict";
    let modal = $.showLoading();
    /*今日推荐最多*/
    $.$http_post({
        http: $http,
        url: "/fifthDrainage",
        data: {
            is_today: 1,//获取今日
            limit_num: 1 //获取最高,限制返回数量为1
        },
        modal: modal,
        callback: function (res) {
            let data = res.data.data[0] || {};
            $scope.drainage = {
                value: data.num || 0,
                href: (data.nodeId && data.brand_code && (data.name_cn || data.name_en)) ?
                    `/html/brandDetails?nodeId=${data.nodeId}&brandCode=${data.brand_code}&c_brand_code=${data.c_brand_code || 0}` : `#`,
                name: data.name_cn || data.name_en || "无"
            };
        }
    });
    /*今日核销最高*/
    $.$http_post({
        http: $http,
        url: "/fifthGuest",
        data: {
            is_today: 1,//获取今日
            limit_num: 1 //获取最高,限制返回数量为1
        },
        modal: modal,
        callback: function (res) {
            // console.log(res);
            let data = res.data.data[0] || {};
            $scope.guest = {
                value: data.num || 0,
                href: (data.nodeId && data.brand_code && (data.name_cn || data.name_en)) ?
                    `/html/brandDetails?nodeId=${data.nodeId}&brandCode=${data.brand_code}&c_brand_code=${data.c_brand_code}` : `#`,
                name: data.name_cn || data.name_en || "无"
            };
        }
    });
    /*今日转化率最高*/
    $.$http_post({
        http: $http,
        url: "/fifthTransmutation",
        data: {
            is_today: 1,//获取今日
            limit_num: 1 //获取最高,限制返回数量为1
        },
        modal: modal,
        callback: function (res) {
            let data = res.data.data[0] || {};
            $scope.transmutation = {
                value: data.percent || 0,
                href: (data.nodeId && data.brand_code && (data.name_cn || data.name_en)) ?
                    `/html/brandDetails?nodeId=${data.nodeId}&brandCode=${data.brand_code}&c_brand_code=${data.c_brand_code}` : `#`,
                name: data.name_cn || data.name_en || "无"
            };
        }
    });
});

/*fifthDrainage*/
app.controller("fifthDrainage", function ($scope, $http) {
    "use strict";
    $scope.option = {
        tooltip: {
            trigger: "axis"
        },
        grid: {
            top: 60,
            left: "15%"
        },
        xAxis: {
            type: "category",
            axisLabel: {
                interval: 0,
                rotate: -15
            },
            data: []
        },
        yAxis: {
            name: "(次)"
        },
        series: {
            type: "bar",
            name: "推荐次数",
            barWidth: 6,
            itemStyle: {
                normal: {
                    color: "#8C7EEC",
                    barBorderRadius: [5, 5, 0, 0]
                }
            },
            data: []
        }

    };
    $(function () {
        $scope.canvasDom = echarts.init($("#fifth-drainage")[0]);
        $scope.canvasDom.showLoading();
        /*推荐前五名*/
        $.$http_post({
            http: $http,
            url: "/fifthDrainage",
            data: {
                is_today: 1,//获取今日
            },
            canvasDom: $scope.canvasDom,
            callback: function (res) {
                let data = res.data.data;
                $scope.option.xAxis.data = data.map(item => item.name_cn || item.name_en);
                $scope.option.series.data = data.map(item => item.num || 0);
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*fifthGuest*/
app.controller("fifthGuest", function ($scope, $http) {
    "use strict";
    $scope.option = {
        tooltip: {
            trigger: "axis"
        },
        grid: {
            top: 60,
            left: "15%"
        },
        xAxis: {
            type: "category",
            axisLabel: {
                interval: 0,
                rotate: -15
            },
            data: []
        },
        yAxis: {
            name: "(次)"
        },
        series: {
            type: "bar",
            name: "核销次数",
            barWidth: 6,
            itemStyle: {
                normal: {
                    color: "#FCDC85",
                    barBorderRadius: [5, 5, 0, 0]
                }
            },
            data: []
        }
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#fifth-guest")[0]);
        $scope.canvasDom.showLoading();
        /*核销前五名*/
        $.$http_post({
            http: $http,
            url: "/fifthGuest",
            data: {
                is_today: 1,//获取今日
            },
            canvasDom: $scope.canvasDom,
            callback: function (res) {
                let data = res.data.data;
                $scope.option.xAxis.data = data.map(item => item.name_cn || item.name_en);
                $scope.option.series.data = data.map(item => item.num || 0);
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*fifthTransmutation*/
app.controller("fifthTransmutation", function ($scope, $http) {
    "use strict";
    $scope.option = {
        tooltip: {
            trigger: "axis"
        },
        grid: {
            top: 60,
            left: "15%"
        },
        xAxis: {
            type: "category",
            axisLabel: {
                interval: 0,
                rotate: -15
            },
            data: []
        },
        yAxis: {
            name: "(%)",
            max: 100
        },
        series: {
            type: "line",
            name: "转化率",
            itemStyle: {
                normal: {
                    color: "#5DBDBC"
                }
            },
            data: []
        }
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#fifth-transmutation")[0]);
        $scope.canvasDom.showLoading();
        /*转化率前五名*/
        $.$http_post({
            http: $http,
            url: "/fifthTransmutation",
            data: {
                is_today: 1,//获取今日
            },
            canvasDom: $scope.canvasDom,
            callback: function (res) {
                let data = res.data.data || [];
                data = data.sort((a, b) => {
                    return b.percent - a.percent;
                });
                $scope.option.xAxis.data = data.map(item => item.name_cn || item.name_en);
                $scope.option.series.data = data.map(item => item.percent || 0);
                $scope.canvasDom.setOption($scope.option);
            }
        });
        $scope.canvasDom.setOption($scope.option);
    });
});
