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
/*conditionSec*/
app.controller("controllerList", function ($scope, $http) {
    "use strict";

    $scope.rfm = $.getUrlParams(location)["userType"] - 1;
    $scope.type_r = $.getUrlParams(location)["r"] || -1;
    $scope.type_f = $.getUrlParams(location)["f"] || -1;
    $scope.type_m = $.getUrlParams(location)["m"] || -1;
    $scope.r_list = $.getJsonStatic("r"); //单位:天
    $scope.f_list = $.getJsonStatic("f"); //单位:次
    $scope.m_list = $.getJsonStatic("m"); //单位:万元
    $scope.sexList = $.getJsonStatic("sex");
    $scope.rfmList = $.getJsonStatic("userGroup"); //rfm列表
    $scope.name = "";
    $scope.sex = "";
    $scope.state = 1; //是否为可搜索状态
    $scope.pageIndex = 1; //默认第一页
    /*ng-repeat命令渲染完毕*/
    $scope.renderRepeatEnd = function () {
        $(".btn-group.init").initDropDownMenu();
    };
    /*
    * params total :数据总量
    * params divide_page :是否分页
    * */
    $scope.page = function (total, divide_page) {
        var page = $('#box').paging({
            initPageNo: 1, // 初始页码
            totalPages: Math.ceil(total / (divide_page === false ? total : 10)), //总页数
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
    $scope.screenUser = function (isBtnSearch) {
        /*如果用户未选择rfm值,响应为search值*/
        if ($scope.rfm < 0 || $scope.rfm === "") return $scope.search();
        var modal = $.showLoading(),
            v_r = $scope.type_r,
            v_f = $scope.type_f,
            v_m = $scope.type_m;
        $.$http_post({
            http: $http,
            url: "/userGroupAnalysis",
            modal: modal,
            data: {
                type_r: $scope.r_list[v_r].value,
                type_f: $scope.f_list[v_f].value,
                type_m: $scope.m_list[v_m].value
            },
            callback: function callback(res) {
                var data_ori = res.data.data,
                    data = res.data.data[$scope.rfm];
                /*设置cookie*/
                $.setCookie("userGroup", JSON.stringify(data_ori), 365);

                /*如果存在sex筛选条件*/
                if ($scope.sex) {
                    data.data = data.data.filter(function (item) {
                        return item.sex === +$scope.sex;
                    });
                }
                /*如果存在用户名筛选条件*/
                if ($scope.name) {
                    data.data = data.data.filter(function (item) {
                        var name_u = item.name.toUpperCase(),
                            name_s = $scope.name.toUpperCase();
                        return name_u.match(name_s);
                    });
                }
                data.data.map(function (item) {
                    var sex = $scope.sexList.filter(function (item_s) {
                        return item_s.value === item.sex;
                    });
                    /*性别转换*/
                    item.sex = sex[0].name;
                });
                /*满足筛选条件的总人数*/
                $scope.total = data.data.length;
                /*用户是否只是请求新的一页*/
                if (!isBtnSearch) $scope.page(data.data.length, false);
                $scope.list = data.data;
            }
        });
    };
    $scope.search = function (isBtnSearch) {
        if ($scope.state !== 1) return false; //品牌名未发生改变,当前状态为 '不可搜索'
        else $scope.state = 0; //重置当前状态为 '不可搜索'
        /*如果有rfm筛选条件,rfm筛选优先*/
        if ($scope.rfm >= 0 && $scope.rfm !== "") {
            return $scope.screenUser();
        }
        var modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/screenUserList",
            data: {
                name: $scope.name,
                sex: $scope.sex,
                pageIndex: $scope.pageIndex
            },
            modal: modal,
            callback: function callback(res) {
                var data = res.data.data;
                $scope.total = data.total;
                /*用户是否只是请求新的一页*/
                if (!isBtnSearch) $scope.page(data.total);
                data.list.map(function (item) {
                    var sex = $scope.sexList.filter(function (item_s) {
                        return item_s.value === item.sex;
                    });
                    /*性别转换*/
                    item.sex = sex[0].name;
                });
                $scope.list = data.list;
            }
        });
    };
    /*如有rfm参数,则已有本地cookie*/
    if ($scope.type_r < 0 && $scope.type_f < 0 && $scope.type_m < 0) {
        /*设置默认值*/
        $scope.type_r = 3;
        $scope.type_f = 3;
        $scope.type_m = 3;
    } else if ($scope.rfm >= 0 && $scope.type_r >= 0 && $scope.type_f >= 0 && $scope.type_m >= 0) {
        $(".btn-group.rfm .text-container").text($scope.rfmList[$scope.rfm].name);
    }
    $scope.search();
});