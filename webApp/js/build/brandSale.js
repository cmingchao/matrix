"use strict";

var app = angular.module("app", []);

/*ng-repeat渲染完成*/
app.directive('repeatFinish', function () {
    return {
        link: function link(scope, element, attr) {
            if (scope.$last == true) {
                scope.$eval(attr.repeatFinish);
            }
        }
    };
});
/*controllerList*/
app.controller("controllerList", function ($scope, $http) {
    "use strict";

    $scope.name = ""; /*品牌名称*/
    $scope.retail = ""; /*业态*/
    $scope.avPrice = ""; /*品牌均价*/
    $scope.distinct = ""; /*区分属性*/
    $scope.area = ""; /*区域*/
    $scope.state = 1; //是否为可搜索状态,1为可搜索，0为不可搜索
    $scope.pageIndex = 1; //默认第一页
    /*初始化下拉菜单*/
    $scope.retailList = $.getJsonStatic("retailList");
    $scope.areaList = $.getJsonStatic("areaList");
    /*业态详情(下属品牌均价及区分属性)*/
    $scope.retailDetails = $.getJsonStatic("typeList");
    /*ng-repeat命令渲染完毕*/
    $scope.renderRepeatEnd = function () {
        $(".btn-group.init").initDropDownMenu();
    };
    $scope.search = function (isBtnSearch) {
        if ($scope.state !== 1) return false; //品牌名未发生改变,当前状态为 '不可搜索'
        else $scope.state = 0; //重置当前状态为 '不可搜索'
        var modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/screenBrandSale",
            data: {
                name: $scope.name,
                retail: $scope.retail,
                price: $scope.avPrice,
                distinct: $scope.distinct,
                area: $scope.area,
                pageIndex: $scope.pageIndex
            },
            modal: modal,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.brandTotal = data.brandTotal; /*数据总条数-即品牌总个数*/
                $scope.saleTotal = data.saleTotal; /*总销售额*/
                /*用户是否只是请求新的一页，为true表示只是请求新的一页*/
                if (!isBtnSearch) $scope.page(data.brandTotal);
                /*加上品牌业态及区分属性*/
                data.list.map(function (item) {
                    if (item.code) {
                        var retail = item.code.substr(0, 2),
                            distinct = item.code.substr(6, 2),
                            retailDetails = $scope.retailDetails[retail];
                        var dt_item = retailDetails.distinction.filter(function (item) {
                            return item.value === distinct;
                        }),
                            pc_item = $scope.retailList.filter(function (item) {
                            return item.value == retail;
                        });
                        /*添加品牌区分属性*/
                        item.distinct = dt_item[0] ? dt_item[0].name : "未知";
                        /*添加品牌均价*/
                        item.retail = pc_item[0] ? pc_item[0].name : "未知";
                    } else {
                        /*添加品牌区分属性*/
                        item.distinct = "未知";
                        /*添加品牌均价*/
                        item.retail = "未知";
                    }
                });
                $scope.list = data.list;
            }
        });
    };
    $scope.page = function (total) {
        var page = $('#box').paging({
            initPageNo: 1, // 初始页码
            totalPages: Math.ceil(total / 10), //总页数
            slideSpeed: 600, // 缓动速度。单位毫秒
            jump: true, //是否支持跳转
            callback: function callback(page) {
                // 回调函数
                if ($scope.pageIndex != page) {
                    $scope.pageIndex = page;
                    $scope.state = 1;
                    $scope.search(1);
                }
            }
        });
    };
    $scope.chooseType = function (retail) {
        var obj = retail || $scope.retail;
        /*清除业态时同时清空其联动属性----品牌均价及区分属性*/
        if (!obj) {
            $scope.avPriceList = [];
            $scope.distinction = [];
        } else {
            $scope.avPriceList = $scope.retailDetails[obj]["av-price"];
            $scope.distinction = $scope.retailDetails[obj]["distinction"];
        }
        /*清空联动属性*/
        $scope.avPrice = "";
        $scope.distinct = "";
        $(".btn-group.init.price .text-container").text("");
        $(".btn-group.init.distinct .text-container").text("");
        $scope.search();
    };
    $scope.search();
});