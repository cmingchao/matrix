let app = angular.module("app", []);
/*获取传过来的user_id*/
const role_id = $.getUrlParams(location)["role_id"];
/*userManageSecond*/
app.controller("roleManageSecond", function ($scope, $http,$window) {
    "use strict";
    $scope.roleName = '';
    $scope.roleCode = "";
    $scope.url="/addRole";
    /*修改角色*/
    if (role_id) {
        $("#map span").text("修改角色");
        $scope.url="/updateRole";
        let modal = $.showLoading();
        /*获取信息*/
        $.$http_post({
            http: $http,
            url: "/getRoleInfo",
            data: {
                role_id
            },
            modal: modal,
            callback(res){
                let data = res.data.data[0] || {};
                $scope.roleName = data.role_name || '';
                $scope.roleCode = data.role_code || '';
            }
        });
    }
    $scope.addRole = () => {
        /*是否输入角色名*/
        if (!$scope.roleName) {
            $.tipsModal({
                title: "提示",
                content: "请输入角色名!"
            });
            return false;
        }
        /*是否输入角色编码*/
        if (!$scope.roleCode) {
            $.tipsModal({
                title: "提示",
                content: "请输入角色编码!"
            });
            return false;
        }else {
            $.tipsModal({
                title: "提示",
                content: $scope.url==="/addRole"?`是否要添加${$scope.roleName}该角色类型?`:`是否要修改${$scope.roleName}该角色类型信息?`,
                cancel_text:'取消',
                confirm_callback(){
                    let modal = $.showLoading();
                    $.$http_post({
                        http: $http,
                        url: $scope.url,
                        data: {
                            roleName: $scope.roleName,
                            roleCode: $scope.roleCode,
                            role_id
                        },
                        modal: modal,
                        callback(res){
                            console.log($scope.url);
                            $.tipsModal({
                                title: "提示",
                                content: $scope.url==="/addRole"?"添加角色类型成功!":"修改角色类型成功!",
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