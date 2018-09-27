let app = angular.module("app",[]);
/*conditionSec*/
app.controller("controllerList",function($scope,$http){
    "use strict";
    $scope.sexList = $.getJsonStatic("sex");
    $scope.name= "";
    $scope.sex= "";
    $scope.state= 1; //是否为可搜索状态
    $scope.pageIndex = 1;  //默认第一页
    /*
    * params total :数据总量
    * params divide_page :是否分页
    * */
    $scope.page = (total,divide_page) => {
        let page = $('#box').paging({
            initPageNo: 1, // 初始页码
            totalPages: Math.ceil(total/(divide_page===false?total:20)), //总页数
            slideSpeed: 600, // 缓动速度。单位毫秒
            jump: true, //是否支持跳转
            callback: function(page) {
                // 回调函数
                if($scope.pageIndex != page){
                    $scope.pageIndex = page;
                    $scope.state = 1;
                    $scope.search(1);
                }
            }
        });
    };
    $scope.search = function (isBtnSearch) {
        if($scope.state !== 1) return false;  //品牌名未发生改变,当前状态为 '不可搜索'
        else $scope.state = 0;  //重置当前状态为 '不可搜索'
        let modal = $.showLoading();
        $.$http_post({
            http:$http,
            url:"/screenUserList",
            data:{
                name:$scope.name,
                sex:$scope.sex,
                pageIndex:$scope.pageIndex
            },
            modal:modal,
            callback(res){
                var data = res.data.data;
                $scope.total = data.total;
                /*用户是否只是请求新的一页*/
                if(!isBtnSearch) $scope.page(data.total);
                data.list.map(item=>{
                    let sex = $scope.sexList.filter(item_s=>{
                        return item_s.value === item.sex;
                    });
                    /*性别转换*/
                    item.sex = sex[0].name;
                });
                $scope.list = data.list;
            }
        });
    };
    $scope.search();
});