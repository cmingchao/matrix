let app = angular.module("app", []);
/*init recommendSet*/
app.controller("recommendSet", function ($scope, $http, $window) {
    "use strict";
    /*主打推荐品牌列表*/
    $scope.mainRecommendBrandList = [];
    // 置顶推荐基本信息
    $scope.topBrandInfo = {};
    /*置顶推荐品牌编码*/
    $scope.brandCode = '';
    //设置主打推荐时被勾选中的品牌
    $scope.checkedData = [];
    $scope.list = [];
    /*初始化获取推荐品牌*/
    $scope.init_request = (flag = 1) => { /*flag表示是否请求主打推荐，1表示是*/
        let modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/getRecommendBrand",
            modal: modal,
            callback(res) {
                let data = res.data.data;
                /*type=1表示置顶推荐，type=2表示主打推荐*/
                data.map(item => {
                    if (item.type === 1) {
                        $scope.brandCode = item.brand_code;
                    }
                });
                if (flag) {
                    data.map(item => {
                        if (item.type === 2) {
                            item.brandName = item.brand_name_cn || item.brand_name_en || '未知';
                            $scope.mainRecommendBrandList.push(item);
                        }
                    });
                }
                /*根据brandCode获取置顶推荐品牌基本信息*/
                $.$http_post({
                    http: $http,
                    url: "/topBrandBasicInfo",
                    data: {brandCode: $scope.brandCode},
                    modal: modal,
                    callback(res) {
                        let data = res.data.data[0] || {};
                        data.brandName = data.name_cn || data.name_en || "未知";
                        if (data.c_brand_code) {
                            data.retail = $.getNameOfList(data.c_brand_code, "retailList", [0, 2]);
                            data.sex = $.getNameOfList(data.c_brand_code, "sexList", [2, 1]);
                            data.age = $.getNameOfList(data.c_brand_code, "ageList", [3, 2]);
                            data.area = $.getNameOfList(data.c_brand_code, "areaList", [8, 1]);
                            /*联动属性*/
                            data.avPrice = $.getNameOfSecondary(data.c_brand_code)[0];
                            data.distinct = $.getNameOfSecondary(data.c_brand_code)[1];
                        } else {
                            data.retail = '未知';
                            data.sex = '未知';
                            data.age = '未知';
                            data.area = '未知';
                            /*联动属性*/
                            data.avPrice = '未知';
                            data.distinct = '未知';
                        }
                        $scope.topBrandInfo = data;
                    }
                });
            }
        });
    };
    /*弹出模态框，获取品牌*/
    $scope.getBrand = (flag) => {
        $scope.name = "";
        $scope.retail = "";
        $scope.state = 1; //是否为可搜索状态,1为可搜索，0为不可搜索
        $scope.pageIndex = 1; //默认第一页
        $scope.checkedData = [];
        $scope.list = [];
        /*初始化下拉菜单*/
        $scope.retailList = $.getJsonStatic("retailList");
        $scope.retailDetails = $.getJsonStatic("typeList");
        $scope.search = function (isBtnSearch) {
            if ($scope.state !== 1) return false;  //品牌名未发生改变,当前状态为 '不可搜索'
            else $scope.state = 0;  //重置当前状态为 '不可搜索'
            $scope.brandCode = '';
            let modal = $.showLoading();
            $.$http_post({
                http: $http,
                url: "/getBrand",
                data: {
                    name: $scope.name,
                    retail: $scope.retail,
                    pageIndex: $scope.pageIndex
                },
                modal: modal,
                callback(res) {
                    let data = res.data.data;
                    /*数据总条数-即品牌总个数*/
                    $scope.brandTotal = data.brandTotal;
                    /*用户是否只是请求新的一页，为true表示只是请求新的一页*/
                    // if(!isBtnSearch) $scope.page(data.brandTotal);
                    /*加上品牌业态及区分属性*/
                    data.list.map(item => {
                        item.state = false;
                        if (item.c_brand_code) {
                            /*获取业态类型*/
                            let retail = Number(item.c_brand_code.substr(0, 2)),
                                yt_item = $scope.retailList.filter(item => {
                                    return item.value === retail
                                });
                            item.retail = yt_item[0] ? yt_item[0].name : "未知";
                        } else {
                            item.retail = "未知";
                        }
                    });
                    $scope.list = data.list;
                    let list_1 = [...data.list];
                    $scope.list_1 = list_1;
                    let list_2 = [...data.list].map(item => {
                        $scope.mainRecommendBrandList.map((item2) => {
                            if (item2.brand_code === item.brand_code) {
                                item.state = true;
                                $scope.checkedData.push(item)
                            }
                        });
                        return item;
                    });
                    $scope.list_2 = list_2;

                }
            });
        };
        $scope.search();
    };
    /*    $scope.page = (total) => {
                let page = $('#box').paging({
                    initPageNo: 1, // 初始页码
                    totalPages: Math.ceil(total / 10), //总页数
                    slideSpeed: 600, // 缓动速度。单位毫秒
                    jump: true, //是否支持跳转
                    callback: function (page) {
                        // 回调函数
                        if ($scope.pageIndex != page) {
                            $scope.pageIndex = page;
                            $scope.state = 1;
                            $scope.search(1);
                        }
                    }
                });
            };*/
    $(() => {
        $scope.init_request();
    });
    $scope.radioChange = (brand_code) => {
        $scope.brandCode = brand_code;
    };
    /*设置置顶推荐*/
    $scope.mySubmit = () => {
        if(!$scope.brandCode){
            let modal = $.showLoading();
            $.$http_post({
                http: $http,
                url: "/setTopRecommend",
                data: {
                    brand_code: '',
                },
                modal: modal,
                callback(res) {
                    $("#myModal-1").modal('hide');
                    $scope.init_request(0);
                }
            });
            return false;
        }
        $scope.list_1.map(item => {
            if (item.brand_code === $scope.brandCode) {
                let modal = $.showLoading();
                $.$http_post({
                    http: $http,
                    url: "/setTopRecommend",
                    data: {
                        brand_code: item.brand_code,
                        retail: item.c_brand_code ? item.c_brand_code.substr(0, 2) : 0,
                        brand_name_cn: item.name_cn,
                        brand_name_en: item.name_en
                    },
                    modal: modal,
                    callback(res) {
                        $("#myModal-1").modal('hide');
                        $scope.init_request(0);
                    }
                });
            }
        })
    };
    // $scope.selectAll = false;
    // $scope.changeSeletAll = () => {
    //     $scope.checkedData = [];
    //     $scope.list_2.map(item => {
    //         if ($scope.selectAll) {
    //             item.state = true;
    //             $scope.checkedData.push(item)
    //         } else {
    //             item.state = false;
    //             $scope.checkedData = [];
    //         }
    //     })
    // };
    $scope.checkBoxChange = (obj) => {
        $scope.checkedData = [];
        $scope.list.map((item) => {
            if (obj.brand_code == item.brand_code) {
                item.state = obj.state;
            }
            // !item.state && ($scope.selectAll = false);
            item.state && ($scope.checkedData.push(item));
        });
    };
    /*设置主打推荐*/
    $scope.addAll = function () {
        if ($scope.checkedData.length > 15) {
            $.requestError("最多只能选择15个品牌");
            return false;
        } else {
            let modal = $.showLoading();
            $.$http_post({
                http: $http,
                url: "/setMainRecommend",
                data: {
                    arr: $scope.checkedData
                },
                modal: modal,
                callback(res) {
                    $("#myModal-2").modal('hide');
                    location.reload();
                }
            });
        }
    };
    $scope.filterBrand = () => {
        if (!$scope.name && !$scope.retail) {
            return $scope.list_2 = $scope.list;
        }
        let arr = $scope.list.filter(item => {
            let a = false;
            if (!$scope.retail) {
                a = (item.name_cn && item.name_cn.includes($scope.name) ||
                    item.name_en && item.name_en.includes($scope.name));
            } else if (!$scope.name) {
                a = (item.c_brand_code && item.c_brand_code.substr(0, 2) == $scope.retail);
            } else {
                a = (item.name_cn && item.name_cn.includes($scope.name) ||
                    item.name_en && item.name_en.includes($scope.name)) &&
                    (item.c_brand_code && item.c_brand_code.substr(0, 2) == $scope.retail);
            }
            return !!a;
        });
        $scope.list_2 = arr;
    };
    $scope.chooseType = function () {
        let obj = $scope.retail;
        /*清除业态时同时清空其联动属性----品牌均价及区分属性*/
        if (!obj) {
            $scope.avPriceList = [];
            $scope.distinction = [];
        }
        else {
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
    /*当模态框对用户可见时触发*/
    $('#myModal-1,#myModal-2').on('shown.bs.modal', function () {
        /*初始化下拉菜单位置*/
        $(".btn-group .dropdown-menu").each(function () {
            var bt_l = $(this).parent().find(".btn")[0].offsetLeft,
                bt_t = $(this).parent().find(".btn")[0].offsetTop;
            $(this).css("left", bt_l);
            $(this).siblings(".clear").css({"left": bt_l + 140, "top": bt_t});
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

