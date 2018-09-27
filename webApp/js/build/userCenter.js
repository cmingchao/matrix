"use strict";

var app = angular.module("app", []);

/*userCenter*/
app.controller("userCenter", function ($scope, $http) {
    "use strict";

    $scope.username_confirm = $.getCookie("username");
    $scope.username = $.getCookie("username");
    $scope.username_edit = 0;
    $scope.password_origin = "";
    $scope.password_new = "";
    $scope.password_again = "";
    /*用户名编辑文字及箭头状态*/
    $scope.toggle_username = function () {
        $scope.username_edit = !$scope.username_edit;
        var panel = $(".username .edit-panel");
        if ($scope.username_edit) {
            $(".username .edit .img").css({ "transform": "rotate(90deg)", "top": "1px" });
            panel.height(panel[0].scrollHeight);
        } else {
            $(".username .edit .img").css({ "transform": "rotate(-90deg)", "top": "-1px" });
            panel.height(0);
        }
    };
    /*密码编辑文字及箭头状态*/
    $scope.toggle_password = function () {
        $scope.password_edit = !$scope.password_edit;
        var panel = $(".password .edit-panel");
        if ($scope.password_edit) {
            $(".password .edit .img").css({ "transform": "rotate(90deg)", "top": "1px" });
            panel.height(panel[0].scrollHeight);
        } else {
            $(".password .edit .img").css({ "transform": "rotate(-90deg)", "top": "-1px" });
            panel.height(0);
        }
    };
    /*更新用户名*/
    $scope.update_username = function () {
        if (!$scope.username) {
            $.tipsModal({
                title: "提示",
                content: "请输入用户名!"
            });
        } else {
            var modal = $.showLoading();
            $.$http_post({
                http: $http,
                url: "/updateUsername",
                data: {
                    username: $scope.username
                },
                modal: modal,
                callback: function callback(res) {
                    $.tipsModal({
                        title: "提示",
                        content: res.data.errmsg
                    });
                    $.setCookie("username", $scope.username, 365);
                    $scope.username_confirm = $.getCookie("username");
                    /*重置header的用户名*/
                    $("#header .admin .username").text($scope.username);
                    /*重置菜单的用户名*/
                    $("#menu-bar .userCenter .username > a").text($scope.username);
                }
            });
        }
    };
    /*更新密码*/
    $scope.update_password = function () {
        /*是否输入密码*/
        if (!$scope.password_origin) {
            $.tipsModal({
                title: "提示",
                content: "请输入密码!"
            });
            return false;
        }
        /*是否输入新密码*/
        if (!$scope.password_new) {
            $.tipsModal({
                title: "提示",
                content: "请输入新密码!"
            });
            return false;
        }
        /*两次密码是否相同*/
        if ($scope.password_new !== $scope.password_again) {
            $.tipsModal({
                title: "提示",
                content: "两次输入密码不一致!"
            });
            return false;
        }
        /*验证密码是否合法*/
        var exp = /^[0-9]{6}$/,
            isValid = $scope.password_new.match(exp);
        /*密码非法*/
        if (!isValid) {
            $.tipsModal({
                title: "提示",
                content: "输入密码不合法,请按提示输入密码!"
            });
        } else {
            var modal = $.showLoading();
            $http.post(server_api + "/updatePassword", {
                password: $scope.password_origin,
                pass_new: $scope.password_new,
                pass_again: $scope.password_again
            }).then(function (res) {
                if (res.data.errcode) {
                    return res.data.errcode === -1 ? $.loginExpired() : $.requestError(res.data.errmsg);
                }
                //请求成功
                else {
                        $.tipsModal({
                            title: "提示",
                            content: "修改密码成功!"
                        });
                    }
            }, function (err) {
                modal.cancelClick();
                $.requestError();
            });
        }
    };
});