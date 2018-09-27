let app = angular.module("app",[]);

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
app.controller("controllerList",function($scope,$http){
    "use strict";
    /*初始化下拉菜单*/
    $scope.retailList = $.getJsonStatic("retailList");
    $scope.sexList = $.getJsonStatic("sexList");
    $scope.ageList = $.getJsonStatic("ageList");
    $scope.areaList = $.getJsonStatic("areaList");
    /*业态详情(下属品牌均价及区分属性)*/
    $scope.retailDetails = $.getJsonStatic("typeList");
    /*初始化model*/
    $scope.name= "";
    $scope.retail= "";
    $scope.sex= "";
    $scope.age= "";
    $scope.avPrice= "";
    $scope.distinct= "";
    $scope.area= "";
    $scope.state= 1; //是否为可搜索状态
    $scope.nameChange = false;
    $scope.pageIndex = 1; //默认第一页

    /*ng-repeat命令渲染完毕*/
    $scope.renderRepeatEnd = function () {
        $(".btn-group.init").initDropDownMenu();
    };
    $scope.search = function (isBtnSearch) {
        if($scope.state !== 1) return false;  //品牌名未发生改变,当前状态为 '不可搜索'
        else $scope.state = 0;  //重置当前状态为 '不可搜索'
        let modal = $.showLoading();
        $.$http_post({
            http:$http,
            url:"/screenBrandList",
            data:{
                name:$scope.name,
                retail:$scope.retail,
                sex:$scope.sex,
                age:$scope.age,
                price:$scope.avPrice,
                distinct:$scope.distinct,
                area:$scope.area,
                pageIndex:$scope.pageIndex
            },
            modal:modal,
            callback(res){
                let data = res.data.data;
                $scope.total = data.total;
                $scope.retailResult = data.retail;
                /*用户是否只是请求新的一页*/
                if(!isBtnSearch) $scope.page(data.total);
                /*加上品牌均价及区分属性*/
                data.list.map(item=>{
                    /*有code*/
                    if(item.c_brand_code){
                        let retail = item.c_brand_code.substr(0,2),
                            price = item.c_brand_code.substr(5,1),
                            distinct = item.c_brand_code.substr(6,2),
                            retailDetails = $scope.retailDetails[retail];
                        let dt_item = retailDetails.distinction.filter(item=>{
                                return item.value === distinct;
                            }),
                            pc_item = retailDetails["av-price"].filter(item=>{
                                return item.value == price;
                            });
                        /*添加品牌区分属性*/
                        item.distinct = dt_item[0]?dt_item[0].name:"未知";
                        /*添加品牌均价*/
                        item.avPrice = pc_item[0]?pc_item[0].name:"未知";
                        item.href=`/html/brandDetails?nodeId=${item.nodeId}&brandCode=${item.brand_code}&c_brand_code=${item.c_brand_code}`;
                    }else {
                        /*添加品牌区分属性*/
                        item.distinct ="未知";
                        /*添加品牌均价*/
                        item.avPrice = "未知";
                        item.href=`#`;
                    }
                });
                $scope.list = data.list;
            }
        });
    };
    $scope.page = (total) => {
        let page = $('#box').paging({
            initPageNo: 1, // 初始页码
            totalPages: Math.ceil(total/10), //总页数
            slideSpeed: 600, // 动画效果速度,单位毫秒
            jump: true, //是否支持跳转
            callback: function(page) {
                // 当前页面  不作响应
                if($scope.pageIndex != page){
                    $scope.pageIndex = page;
                    $scope.state =1;
                    $scope.search(1);
                }
            }
        });
    };
    $scope.chooseType = function (retail) {
        var obj = retail || $scope.retail;
        /*清除业态时同时清空其联动属性----品牌均价及区分属性*/
        if( !obj ) {
            $scope.avPriceList = [];
            $scope.distinction = [];
        }else{
            $scope.avPriceList = $scope.retailDetails[obj]["av-price"];
            $scope.distinction = $scope.retailDetails[obj]["distinction"];
        }
        /*清空联动属性*/
        $scope.avPrice= "";
        $scope.distinct= "";
        $(".btn-group.init.price .text-container").text("");
        $(".btn-group.init.distinct .text-container").text("");
        $scope.search();
    };
    $scope.search();
});