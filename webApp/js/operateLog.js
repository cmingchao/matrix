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
/*controllerList*/
app.controller("controllerList",function($scope,$http){
    "use strict";
    $scope.operateUser = "";  /*操作人员*/
    $scope.date = ""; /*日期*/
    $scope.state= 1; //是否为可搜索状态,1为可搜索，0为不可搜索
    $scope.pageIndex= 1; //默认第一页
    /*初始化下拉菜单*/
    $scope.operateUserList = [];
    /*ng-repeat命令渲染完毕*/
    $scope.renderRepeatEnd = function () {
        $(".btn-group").initDropDownMenu();
    };
    let modal = $.showLoading();
    $.$http_post({
        http:$http,
        url:"/operateUser",
        data:{},
        modal:modal,
        callback(res){
            var data = res.data.data;
            $scope.operateUserList = data;
            $scope.search();
        }
    });

    $scope.search = function (isBtnSearch) {
        // console.log($scope.date);
        if($scope.state !== 1) return false;  //品牌名未发生改变,当前状态为 '不可搜索'
        else $scope.state = 0;  //重置当前状态为 '不可搜索'
        let modal = $.showLoading();
        $.$http_post({
            http:$http,
            url:"/operateLog",
            data:{
                operateUser:+$scope.operateUser,
                date:$scope.date,
                pageIndex:$scope.pageIndex
            },
            modal:modal,
            callback(res){
                var data = res.data.data;
                $scope.dataTotal = data.dataTotal;/*数据总条数*/
                /*用户是否只是请求新的一页，为true表示只是请求新的一页*/
                if(!isBtnSearch) $scope.page(data.dataTotal);
                data.list.map(item=>{
                    item.opt_date=item.opt_time.substr(0,10);
                    item.opt_time=item.opt_time.substr(11);
                });
                $scope.list = data.list;
            }
        });
    };
    $scope.page = (total) => {
        let page = $('#box').paging({
            initPageNo: 1, // 初始页码
            totalPages: Math.ceil(total/10), //总页数
            slideSpeed: 600, // 缓动速度。单位毫秒
            jump: true, //是否支持跳转
            callback: function(page) {
                // 回调函数
                if($scope.pageIndex != page){
                    $scope.pageIndex = page;
                    $scope.state= 1;
                    $scope.search(1);
                }
            }
        });
    };
});