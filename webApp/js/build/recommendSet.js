"use strict";

var app = angular.module("app", []);
/*init recommendSet*/
app.controller("recommendSet", function ($scope, $http) {
    "use strict";

    $scope.mainRecommend_brand = []; /*主打推荐品牌列表*/
    // $scope.retailList = $.getJsonStatic("retailList");
    $scope.retailList = null;

    var a = null;
    /*初始化请求，当设置成功也会调用该函数*/
    $scope.init_request = function () {
        var modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/recommendSet",
            modal: modal,
            callback: function callback(res) {
                // console.log(res);
                var data = res.data.data;
                /*type=1表示置顶推荐，type=2表示主打推荐*/
                data.map(function (item) {
                    if (item.type === 1) $scope.brandCode = item.cloud_brand_code;
                });
                data.map(function (item) {
                    if (item.type === 2 && (item.brand_name_cn || item.brand_name_en)) {
                        item.brandName = item.brand_name_cn || item.brand_name_en || '未知';
                        $scope.mainRecommend_brand.push(item);
                    }
                });
                /*根据brandCode获取置顶推荐品牌详情*/
                $.$http_post({
                    http: $http,
                    url: "/brandDetailsBasicInfo",
                    data: { brandCode: $scope.brandCode },
                    modal: modal,
                    callback: function callback(res) {
                        // console.log(res);
                        var data = res.data.data[0] || {};
                        $scope.brandName = data.name || "无";
                        $scope.composite = data.composite || "暂无";
                        $scope.retail = $.getNameOfList($scope.brandCode, "retailList", [0, 2]);
                        $scope.sex = $.getNameOfList($scope.brandCode, "sexList", [2, 1]);
                        $scope.age = $.getNameOfList($scope.brandCode, "ageList", [3, 2]);
                        $scope.area = $.getNameOfList($scope.brandCode, "areaList", [8, 1]);
                        /*联动属性*/
                        $scope.avPrice = $.getNameOfSecondary($scope.brandCode)[0];
                        $scope.distinct = $.getNameOfSecondary($scope.brandCode)[1];
                    }
                });
            }
        });
    };
    /*点击设置弹出模态框，加载数据*/
    $scope.showModal = function () {
        $scope.name = "";
        $scope.retail = "";
        $scope.avPrice = ""; /*品牌均价*/
        $scope.distinct = ""; /*区分属性*/
        $scope.area = ""; /*区域*/
        $scope.state = 1; //是否为可搜索状态,1为可搜索，0为不可搜索
        $scope.pageIndex = 1; //默认第一页
        /*初始化下拉菜单*/
        // $scope.retailList = $.getJsonStatic("retailList");
        a = $.getJsonStatic("retailList");
        $scope.retailList = a;
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
                url: "/topRecommend",
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
                    /*用户是否只是请求新的一页*/
                    // if(!isBtnSearch) $scope.page(data.brandTotal);
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
    };
    $(function () {
        $scope.init_request();
    });
    /*设置置顶推荐*/
    $scope.setTopRecommend = function () {
        $("#myModal-1").modal('show');
        // if($("#myModal-1").length) alert(1);
        $scope.showModal();
    };
    /*设置主打推荐*/
    $scope.setMainRecommend = function () {
        $("#myModal-2").modal('show');
    };

    /*当模态框对用户可见时触发*/
    $('#myModal-1,#myModal-2').on('shown.bs.modal', function () {
        /*初始化下拉菜单位置*/
        $(".btn-group .dropdown-menu").each(function () {
            var bt_l = $(this).parent().find(".btn")[0].offsetLeft,
                bt_t = $(this).parent().find(".btn")[0].offsetTop;
            $(this).css("left", bt_l);
            $(this).siblings(".clear").css({ "left": bt_l + 140, "top": bt_t });
        });
        $(".btn-group .clear").click(function () {
            $(this).parent().find(".text-container").text("");
            $(this).parent().find(".hidden").val("").change();
        });
        /*初始化bootstrap的下拉菜单组件,添加输入功能*/
        $.initDropDownMenu();
        /*input-group组件清空功能*/
        $.bindClearDropDownMenu();
    });
});
/*topRecommend*/