let app = angular.module("app", []);
/*获取传过来的user_id*/
const user_id = $.getUrlParams(location)["user_id"];
/*userManageSecond*/
app.controller("userManageSecond", function ($scope, $http,$window) {
    "use strict";
    $scope.userName = '';
    $scope.password_first = "";
    $scope.password_second = "";
    $scope.phone = "";
    $scope.url="/addManager";
    /*修改管理员信息*/
    if (user_id) {
        $("#map span").text("修改管理员");
        $scope.url="/updateManager";
        let modal = $.showLoading();
        /*获取管理员信息*/
        $.$http_post({
            http: $http,
            url: "/getManagerInfo",
            data: {
                user_id: user_id
            },
            modal: modal,
            callback(res){
                let data = res.data.data[0] || {};
                $scope.userName = data.account;
                $scope.phone = data.phone || '';
            }
        });
    }
    $scope.confirm = () => {
        /*是否输入用户名*/
        if (!$scope.userName) {
            $.tipsModal({
                title: "提示",
                content: "请输入用户名!"
            });
            return false;
        }
        if(!user_id || (user_id&&($scope.password_first || $scope.password_second))){
            /*是否输入密码*/
            if (!$scope.password_first) {
                $.tipsModal({
                    title: "提示",
                    content: "请输入密码!"
                });
                return false;
            }
            if (!$scope.password_second) {
                $.tipsModal({
                    title: "提示",
                    content: "请再次输入密码!"
                });
                return false;
            }
            /*两次密码是否相同*/
            if ($scope.password_first !== $scope.password_second) {
                $.tipsModal({
                    title: "提示",
                    content: "两次输入的密码不一致!"
                });
                return false;
            }
            /*验证密码是否合法*/
            let exp = /^[0-9]{6}$/,
                isValid = $scope.password_second.match(exp);
            /*密码非法*/
            if (!isValid) {
                $.tipsModal({
                    title: "提示",
                    content: "输入密码不合法,请输入六位数字密码!"
                });
                return false;
            }
        }

        /*是否输入手机号*/
        if (!$scope.phone) {
            $.tipsModal({
                title: "提示",
                content: "请输入手机号!"
            });
            return false;
        }
        /*验证手机号是否合法*/
        let exp2 = /^[1][3,4,5,7,8][0-9]{9}$/,
            isValid2 = $scope.phone.match(exp2);
        /*手机号非法*/
        if (!isValid2) {
            $.tipsModal({
                title: "提示",
                content: "输入号码不合法,请输入11位有效号码!"
            });
            return false;
        } else {
            $.tipsModal({
                title: "提示",
                content: !user_id?`是否添加${$scope.userName}该管理员?`:`是否要修改${$scope.userName}该管理员信息`,
                cancel_text:'取消',
                confirm_callback(){
                    let modal = $.showLoading();
                    $.$http_post({
                        http: $http,
                        url: $scope.url,
                        data: {
                            userName: $scope.userName,
                            password: $scope.password_second,
                            phone: $scope.phone,
                            user_id:!user_id?0:user_id,
                        },
                        modal: modal,
                        callback(res){
                            $.tipsModal({
                                title: "提示",
                                content: !user_id?"添加管理员信息成功!":"修改管理员信息成功",
                                confirm_callback(){
                                    history.back();
                                }
                            });
                        }
                    })
                }});
        }
    };
    /*取消添加返回上一页*/
    $scope.back = () => {
        history.back();
    };
});