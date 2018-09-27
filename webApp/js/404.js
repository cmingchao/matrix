let app = angular.module("app",[]);

app.controller("page",($scope,$http,$interval)=>{
    "use strict";
    $scope.timeLeft = 3;  //3秒后返回上一页
    $interval(()=>{
        //跳转到上一页
        if($scope.timeLeft === 0){
            history.back();
        }else{
            $scope.timeLeft -= 1;
        }
    },1000);
});

$(function () {
   $("#content").height(window.innerHeight);
});