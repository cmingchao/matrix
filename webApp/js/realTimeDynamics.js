let app = angular.module("app",[]);

app.controller("list",function($scope,$http){
    "use strict";
    $scope.list = [];
    let modal = $.showLoading();
    $.$http_post({
        http:$http,
        url:"/realTimeDynamics",
        data:{
            pageIndex:1,
            pageItems:100
        },
        modal:modal,
        callback(res){
            let data = res.data.data;
            $scope.list = data;
        }
    });
});