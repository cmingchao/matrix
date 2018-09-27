let app = angular.module("app",[]);

/*login*/
app.controller("login",function($scope,$http){
    "use strict";
    //勾选记住用户选项
    if($.getCookie("rememberUser")){
        $("#remember-user")[0].checked = true;
        $scope.username = $.getCookie("username") || "";
    }else{
        $scope.username = "";
    }
    $scope.password = "";
    $scope.keyPress = ($event)=>{
        /*回车登录*/
        if($event.keyCode === 13){
            $scope.login();
        }
    };
    $scope.login = ()=>{
        let isValid = $.isValid([
            {
                name:"用户名",
                value:$scope.username,
                except:[{name:"necessary"}]
            },
            {
                name:"密码",
                value:$scope.password,
                except:[{name:"necessary"}]
            }
        ]);
        //验证失败,不作响应
        if(!isValid) return false;
        //加载弹窗
        let modal = $.showLoading();
        /*记住用户名*/
        if($("#remember-user")[0].checked){
            $.setCookie("rememberUser",true,365);
            $.setCookie("username",$scope.username,365);
        }
        /*不记住用户名*/
        else{
            $.setCookie("rememberUser","",365);
            /*存储一个会话cookie*/
            $.setCookie("username",$scope.username);
        }
        $.$http_post({
            http:$http,
            url:"/login",
            data:{
                username:$scope.username,
                password:$scope.password
            },
            modal:modal,
            callback(res){
                location.href = "/html/index";
            }
        });
    };
});
$(function () {
    $("body").css("height",window.innerHeight);
    if(window.innerWidth > 767){
        $("body").css("background-image",'url("../image/login/bg.jpg")');
    }
});