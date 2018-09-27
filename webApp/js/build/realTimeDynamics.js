"use strict";

var app = angular.module("app", []);

app.controller("list", function ($scope, $http) {
    "use strict";

    $scope.list = [];
    var modal = $.showLoading();
    $.$http_post({
        http: $http,
        url: "/realTimeDynamics",
        data: {
            pageIndex: 1,
            list: [0, 1, 2] /*近三天数据*/
        },
        modal: modal,
        callback: function callback(res) {
            var data = res.data.data;
            $scope.list = data;
        }
    });
});