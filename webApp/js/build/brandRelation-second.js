"use strict";

var app = angular.module("app", []);

/*品牌链相关参数*/
var brandCode = $.getUrlParams(location)["brandCode"] || 0,
    nodeId = $.getUrlParams(location)["nodeId"] || 0,
    origin_data = JSON.parse($.getCookie("brandChain")),
    //品牌链原始数据
chainList = JSON.parse($.getCookie("brandChainList")); //当前品牌链
/*如无,则进入页面操作非法*/
if (!brandCode || !nodeId || !origin_data || !chainList) {
    $.tipsModal({
        title: "提示",
        content: "未获取到品牌链相关数据,请确认操作是否合法,页面将可能显示异常!"
    });
}

/*关联图*/
app.controller("brandRelation", function ($scope, $http) {
    "use strict";

    $scope.origin_data = origin_data; //品牌链原始数据
    $scope.chainList = chainList; //当前品牌链
    $scope.brand_code = brandCode; //主品牌

    $(function () {
        $scope.canvasDom = echarts.init($("#brandRelation")[0]);
        $scope.canvasDom.showLoading();
        /*第二级品牌链*/
        var webkitDep = $.newWebkitDep($scope.origin_data);
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
    $scope.chainsClick = function (idx) {
        var locationSearch = location.search;
        location.href = "/html/brandRelationThird" + locationSearch + "&chainsIndex=" + idx;
    };
});

/*customer*/
app.controller("brandChainCustomer", function ($scope, $http) {
    "use strict";

    $scope.chainList = chainList;
    var modal = $.showLoading();
    for (var i = 0; i < $scope.chainList.length; i++) {
        /**/
        (function (i) {
            /*品牌链上的品牌*/
            var brands = function () {
                var arr = [];
                for (var k = 0; k < $scope.chainList[i].nodes.length; k++) {
                    var item = $scope.chainList[i].nodes[k];
                    if (item.show) {
                        //arr.push(item.code); /*说是用品牌名判断  -_-||*/
                        arr.push(item.name);
                    }
                }
                return arr;
            }(i);
            $.$http_post({
                http: $http,
                url: "/potentialCustomer",
                data: { brands: brands },
                modal: modal,
                callback: function callback(res) {
                    var data = res.data.data;
                    $scope.chainList[i].potentialCustomer = data || 0;
                }
            });
        })(i);
    }
});

/*mainBrand*/
app.controller("mainBrand", function ($scope, $http) {
    "use strict";

    $scope.brandCode = brandCode;
    $scope.nodeId = nodeId; //主品牌
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

/*brandChain*/
app.controller("brandChain", function ($scope, $http) {
    "use strict";

    $scope.chainList = JSON.parse($.getCookie("brandChainList"));
});