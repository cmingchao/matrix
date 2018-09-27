"use strict";

var app = angular.module("app", []);
"use strict";
/*品牌链相关参数*/
var chainIndex = $.getUrlParams(location)["chainsIndex"] || -1,
    brandCode = $.getUrlParams(location)["brandCode"] || 0,
    brandName = $.getUrlParams(location)["brandName"] || 0,
    nodeId = $.getUrlParams(location)["nodeId"] || 0;
/*如无,则进入页面操作非法*/
if (!(+chainIndex + 1) || !brandCode || !nodeId || !brandName) {
    $.tipsModal({
        title: "提示",
        content: "未获取到品牌链相关数据,请确认操作是否合法,页面将可能显示异常!"
    });
}

/*关联图*/
app.controller("brandRelation", function ($scope, $http) {
    "use strict";

    $scope.chainIndex = chainIndex;
    /*当前所选品牌链*/
    $scope.webkitDep = $.newWebkitDep(JSON.parse($.getCookie("brandChainList"))[$scope.chainIndex]);

    $(function () {
        $scope.canvasDom = echarts.init($("#brandRelation")[0]);
        $scope.canvasDom.showLoading();
        var webkitDep = $scope.webkitDep;
        //重置category数组
        var option = {
            legend: {
                data: webkitDep.categories,
                itemWidth: 14,
                bottom: 20
            },
            color: color_formats,
            series: [{
                type: 'graph',
                layout: 'force',
                animation: false,
                opacity: 1,
                label: {
                    normal: {
                        show: true,
                        position: 'right',
                        formatter: '{b}'
                    }
                },
                top: -10,
                draggable: true,
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [0, 5],
                data: webkitDep.nodes.map(function (node, idx) {
                    node.id = idx;
                    //选中品牌放大
                    if (!idx) {
                        node.symbolSize = 20;
                    }
                    return node;
                }),
                categories: webkitDep.categories,
                force: {
                    edgeLength: 50,
                    repulsion: 500,
                    gravity: 1.2 - $scope.canvasDom.getWidth() / 600
                },
                edges: webkitDep.links
            }]
        };
        $scope.canvasDom.hideLoading();
        $scope.canvasDom.setOption(option);
    });
});

/*品牌链潜客统计*/
app.controller("brandChain", function ($scope, $http) {
    "use strict";
    /*当前所选品牌链*/

    var index = chainIndex,
        webkitDep = JSON.parse($.getCookie("brandChainList"))[index],
        links = webkitDep.links,
        nodes = webkitDep.nodes,
        category = webkitDep.categories,
        brands = [];
    for (var i = 0; i < links.length; i++) {
        var node_id = links[i].target,
            recommend = links[i].recommend * 100;
        /*是该链中的品牌*/
        if (nodes[node_id].show) {
            var node = {
                name: nodes[node_id].name,
                recommend: recommend,
                brand_code: nodes[node_id].brand_code,
                retail: category[nodes[node_id].category].name,
                exponent: 0
            };
            brands.push(node);
        }
    }
    $scope.nodeList = brands;
});

/*主品牌信息*/
app.controller("mainBrand", function ($scope, $http) {
    "use strict";

    $scope.brandCode = brandCode;
    $scope.brandName = brandName;
    $scope.nodeId = nodeId;
    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/brandDetailsBasicInfo",
        data: { brandCode: $scope.brandCode },
        modal: modal,
        callback: function callback(res) {
            var data = res.data.data[0] || {};
            $scope.brandName = data.name || "未知";
            $scope.composite = data.composite || "暂无";
            $scope.retail = $.getNameOfList(brandCode, "retailList", [0, 2]);
            $scope.sex = $.getNameOfList(brandCode, "sexList", [2, 1]);
            $scope.age = $.getNameOfList(brandCode, "ageList", [3, 2]);
            $scope.area = $.getNameOfList(brandCode, "areaList", [8, 1]);
            /*联动属性*/
            $scope.avPrice = $.getNameOfSecondary(brandCode)[0];
            $scope.distinct = $.getNameOfSecondary(brandCode)[1];
        }
    });
});

/*关联品牌*/
app.controller("customer", function ($scope, $http) {
    "use strict";
    /*当前所选品牌链*/

    var chainList_ori = JSON.parse($.getCookie("brandChainList"))[chainIndex],
        brands = [];
    /*品牌*/
    for (var i = 0; i < chainList_ori.nodes.length; i++) {
        var item = chainList_ori.nodes[i];
        if (item.show) brands.push(item);
    }
    $scope.list = brands;
    /*获取品牌潜客*/
    var modal = $.showLoading();
    for (var _i = 0; _i < brands.length; _i++) {
        /**/
        (function (i) {
            $.$http_post({
                http: $http,
                url: "/potentialCustomer",
                data: { brands: [brands[i].name] },
                modal: modal,
                callback: function callback(res) {
                    var data = res.data.data;
                    $scope.list[i].potentialCustomer = data || 0;
                }
            });
        })(_i);
    }
});

/*标签潜客统计*/
app.controller("labelCustomer", function ($scope, $http) {
    "use strict";

    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        data: { brand_code: brandCode },
        url: "/labelPotentialCustomer",
        modal: modal,
        callback: function callback(res) {
            var data = res.data.data || {};
            $scope.retail = { name: $.getNameOfList(brandCode, "retailList", [0, 2]), value: data.retail || 0 };
            $scope.sex = { name: $.getNameOfList(brandCode, "sexList", [2, 1]), value: data.sex || 0 };
            $scope.age = { name: $.getNameOfList(brandCode, "ageList", [3, 2]), value: data.age || 0 };
            $scope.area = { name: $.getNameOfList(brandCode, "areaList", [8, 1]), value: data.area || 0 };
            /*联动属性*/
            $scope.avPrice = { name: $.getNameOfSecondary(brandCode)[0], value: data.price || 0 };
            $scope.distinct = { name: $.getNameOfSecondary(brandCode)[1], value: data.distinct || 0 };
            $scope.total = data.total || 0;
        }
    });
});

$(function () {
    var cusTotal = $(".label-customer .customer-total"),
        pv_height = cusTotal.prev().height(),
        window_width = window.innerWidth;
    if (window_width >= 768) {
        cusTotal.height(pv_height);
    }
});