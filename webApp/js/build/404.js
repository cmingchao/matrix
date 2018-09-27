"use strict";

var app = angular.module("app", []);

app.controller("page", function ($scope, $http, $interval) {
    "use strict";

    $scope.timeLeft = 3; //3秒后返回上一页
    $interval(function () {
        //跳转到上一页
        if ($scope.timeLeft === 0) {
            history.back();
        } else {
            $scope.timeLeft -= 1;
        }
    }, 1000);
});

$(function () {
    $("#content").height(window.innerHeight);
});