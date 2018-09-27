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

/*addBrand*/
app.controller("addBrand", function ($scope, $http) {
    "use strict";

    $scope.brandName = "";
    /*默认选择第一个*/
    $scope.retail = "10";
    $scope.sex = "1";
    $scope.age = "01";
    $scope.avPrice = "1";
    $scope.distinct = "01";
    $scope.area = "1";
    /*初始化下拉菜单*/
    $scope.retailList = $.getJsonStatic("retailList");
    $scope.sexList = $.getJsonStatic("sexList");
    $scope.ageList = $.getJsonStatic("ageList");
    $scope.areaList = $.getJsonStatic("areaList");
    /*业态详情(下属品牌均价及区分属性)*/
    $scope.retailDetails = $.getJsonStatic("typeList");
    /*ng-repeat命令渲染完毕*/
    $scope.renderRepeatEnd = function () {
        $(".btn-group.init").initDropDownMenu();
    };
    /*添加品牌*/
    $scope.addBrand = function () {
        var brandcode = '';
        /*品牌名不为空*/
        if ($scope.brandName) {
            brandcode += $scope.retail;
            brandcode += $scope.sex;
            brandcode += $scope.age;
            brandcode += $scope.avPrice;
            brandcode += $scope.distinct;
            brandcode += $scope.area;
            var modal = $.showLoading();
            $.$http_post({
                http: $http,
                url: "/addBrand",
                data: {
                    brand_code: brandcode,
                    brand_retail: $scope.retail,
                    brand_name_cn: $scope.brandName,
                    brand_name_en: $scope.brand_name_en //该系统目前暂无英文名?
                },
                modal: modal,
                callback: function callback(res) {
                    $.tipsModal({
                        title: "提示",
                        content: res.data.errmsg
                    });
                }
            });
        }
        /*未填入品牌名*/
        else {
                $.tipsModal({
                    title: "提示",
                    content: "请填写品牌名!"
                });
                return false;
            }
    };
    /*返回上一页*/
    $scope.back = function () {
        history.back();
    };
    //选择业态
    $scope.chooseType = function (retail) {
        var obj = retail || $scope.retail;
        $http.get("/data-static/typeList.json").then(function (res) {
            var data = res.data;
            $scope.avPriceList = data[obj]["av-price"];
            $scope.distinction = data[obj]["distinction"];
            /*设置联动属性的文字内容*/
            $(".btn-group.init.price .text-container").text(data[obj]["av-price"][0].name + "元");
            $(".btn-group.init.distinct .text-container").text(data[obj]["distinction"][0].name);
            /*默认选择第一个*/
            $scope.avPrice = "1";
            $scope.distinct = "01";
        }, function (err) {
            $.tipsModal({
                title: "获取数据失败!",
                content: "失败原因: " + err
            });
        });
    };
    //默认选中业态: 10
    $scope.chooseType(10);
});