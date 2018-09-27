"use strict";

var app = angular.module("app", []);

/*关联图*/
app.controller("brandRelation", function ($scope, $http) {
    "use strict";
    //根据品牌名称搜索

    $scope.searchName = "";
    $scope.searchBrand = function () {
        //数据已获取
        if ($scope.origin_data && $scope.searchName) {
            var nodes_new = [];
            $scope.origin_data.nodes.forEach(function (item) {
                var item_new = JSON.parse(JSON.stringify(item)),
                    upper_name = item_new.name.toUpperCase(),
                    upper_name_s = $scope.searchName.toUpperCase();
                //只要有匹配字符,则选中
                if (upper_name.match(upper_name_s) === null) {
                    item_new.itemStyle = { normal: { color: "#ccc" } };
                    item_new.label = { normal: { show: false } };
                    //如果处于搜索状态,则disable状态的品牌不可点击
                    item_new.disable = true;
                } else {
                    item_new.itemStyle = { normal: { color: "#ff0000" } };
                    item_new.label = { normal: { show: true } };
                    item_new.disable = false;
                }
                nodes_new.push(item_new);
            });
            //重置关系图，突出显示含有关键字的品牌节点
            $scope.canvasDom.setOption({
                series: [{
                    data: nodes_new
                }]
            });
        }
        return false;
    };
    $scope.clearSearch = function () {
        //若搜索字符不为空,则清空并还原关系图
        if ($scope.searchName) {
            $scope.searchName = "";
            $scope.canvasDom.setOption({
                series: [{
                    data: $scope.origin_data.nodes
                }]
            });
        }
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#brandRelation")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http: $http,
            url: "/brandRelation",
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var webkitDep = res.data.data;
                webkitDep = $.newWebkitDep(webkitDep);
                $scope.origin_data = webkitDep;
                var option = {
                    legend: {
                        data: webkitDep.categories.map(function (item) {
                            return item.name;
                        }),
                        itemWidth: 14,
                        bottom: 20
                    },
                    color: color_formats, //业态颜色
                    series: [{
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
                        top: -10,
                        draggable: true, //可拖动
                        roam: true, //可缩放
                        symbolSize: 8,
                        edgeSymbol: ['circle', 'arrow'],
                        edgeSymbolSize: [0, 5],
                        data: webkitDep.nodes.map(function (node, idx) {
                            node.id = idx;
                            return node;
                        }),
                        categories: webkitDep.categories,
                        force: {
                            edgeLength: 30,
                            repulsion: 30,
                            gravity: 1.3 - $scope.canvasDom.getWidth() / 600
                        },
                        edges: webkitDep.links
                    }]
                };
                $scope.canvasDom.hideLoading();
                $scope.canvasDom.setOption(option);
                /*添加点击事件*/
                $scope.canvasDom.on("click", function (params) {
                    //所选为不为node或当前处于“品牌搜索状态”且所选品牌为不可用状态,不作响应
                    if (params.dataType !== "node" || params.data.disable) return false;
                    /*所选品牌数据*/
                    var params_data = params.data;
                    /*获取品牌链*/
                    $.chooseMainBrand($scope.origin_data, params.data.nodeId, [0, 4], function (webkitDep_new, chains_arr) {
                        /*设置cookie,打开二级品牌关系图页面*/
                        /**/
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
                        /*设置缓存*/
                        $.setCookie("brandChain", JSON.stringify(webkitDep_new), 1000 * 60);
                        $.setCookie("brandChainList", JSON.stringify(chains_arr), 1000 * 60);
                        location.href = "/html/brandRelationSecond?nodeId=" + params_data.nodeId + "&brandName=" + params_data.name + "&brandCode=" + params_data.brand_code;
                    });
                });
            }
        });
    });
});

/*品牌数据统计*/
app.controller("brandDataStatistics", function ($scope, $http) {
    "use strict";

    $scope.list = [];
    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/brandDataStatistics",
        modal: modal,
        callback: function callback(res) {
            var data = res.data.data;
            $scope.list = data;
        }
    });
});

/*引流排行*/
app.controller("drainageRank", function ($scope, $http) {
    "use strict";

    $scope.option = {
        tooltip: {
            trigger: "axis"
        },
        xAxis: {
            type: "category",
            data: []
        },
        yAxis: {
            name: "(次)",
            splitLine: {
                show: false
            }
        },
        series: {
            type: "bar",
            name: "引流人次",
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
        $scope.canvasDom = echarts.init($("#drainageRank")[0]);
        $scope.canvasDom.showLoading();
        /*引流排行前十*/
        $.$http_post({
            http: $http,
            url: "/fifthDrainage",
            data: { limit_num: 10 },
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.name_cn || item.name_cen || '无';
                });
                $scope.option.series.data = data.map(function (item) {
                    return item.num || 0;
                });
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*获客排行*/
app.controller("guestRank", function ($scope, $http) {
    "use strict";

    $scope.option = {
        tooltip: {
            trigger: "axis"
        },
        xAxis: {
            type: "category",
            data: []
        },
        yAxis: {
            name: "(次)",
            splitLine: {
                show: false
            }
        },
        series: {
            type: "bar",
            name: "获客人次",
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
        $scope.canvasDom = echarts.init($("#guestRank")[0]);
        $scope.canvasDom.showLoading();
        /*引流排行前十*/
        $.$http_post({
            http: $http,
            url: "/fifthGuest",
            data: { limit_num: 10 },
            canvasDom: $scope.canvasDom,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.option.xAxis.data = data.map(function (item) {
                    return item.name_cn || item.name_cen;
                });
                $scope.option.series.data = data.map(function (item) {
                    return item.num || 0;
                });
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

$(function () {
    $(".brand-relation .search .btn").on("click", function () {
        $(this).parent().prev().removeClass("hide-mine").prev().removeClass("hide");
        $(this).removeClass("btn-normal");
    });
    //搜索框隐藏(已弃用)
    //$(".brandRelation .search .input-group").on("click", function (e) {
    //    //阻止冒泡
    //    return e.stopPropagation?e.stopPropagation():e.cancelBubble=true;
    //});
    //$("body").on("click", function () {
    //    $(".brandRelation .search .btn").parent().prev().addClass("hide-mine").prev().addClass("hide");
    //    $(".brandRelation .search .btn").addClass("btn-normal");
    //});
});