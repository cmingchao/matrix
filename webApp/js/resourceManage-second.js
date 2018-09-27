let app = angular.module("app", []);
/*获取传过来的id*/
const resource_id = $.getUrlParams(location)["resource_id"];
/*userManageSecond*/
app.controller("resourceManageSecond", function ($scope, $http,$window) {
    "use strict";
    $scope.resourceName = '';
    $scope.resourceCode = "";
    $scope.resourceUrl = "";
    $scope.logoImg = "";
    $scope.selectedName = 0;
    $scope.url="/addResource";
    /*初始化父亲资源下拉列表*/
    let modal = $.showLoading();
    /*获取管理员信息*/
    $.$http_post({
        http: $http,
        url: "/getParentResourceList",
        data: {},
        modal: modal,
        callback(res){
            let data = res.data.data;
            $scope.parentResourceList =data;
        }
    });
    /*修改信息*/
    if (resource_id) {
        $("#map span").text("修改资源");
        $scope.url="/updateAuthResource";
        let modal = $.showLoading();
        /*获取管理员信息*/
        $.$http_post({
            http: $http,
            url: "/getResourceInfo",
            data: {
                resource_id: resource_id
            },
            modal: modal,
            callback(res){
                let data = res.data.data[0] || {};
                $scope.resourceName = data.auth_name || '';
                $scope.resourceCode = data.auth_code || '';
                $scope.resourceUrl = data.auth_url || '';
                $scope.logoImg = data.logo_id || '';
                $scope.selectedName = data.parent_id || 0;
            }
        });
    }
    $scope.addResource = () => {
        /*是否输入资源名*/
        if (!$scope.resourceName) {
            $.tipsModal({
                title: "提示",
                content: "请输入资源名!"
            });
            return false;
        }
        /*是否输入资源编码*/
        if (!$scope.resourceCode) {
            $.tipsModal({
                title: "提示",
                content: "请输入资源编码!"
            });
            return false;
        }else {
            $.tipsModal({
                title: "提示",
                content: $scope.url==="/addResource"?`是否添加${$scope.resourceName}该资源?`:`是否要修改${$scope.resourceName}该资源信息?`,
                cancel_text:'取消',
                confirm_callback(){
                    let modal = $.showLoading();
                    $.$http_post({
                        http: $http,
                        url: $scope.url,
                        data: {
                            resourceName: $scope.resourceName,
                            resourceCode: $scope.resourceCode,
                            resourceUrl: $scope.resourceUrl || '',
                            logoImg: $scope.logoImg || '',
                            selectedName: $scope.selectedName,
                            resource_id:resource_id
                        },
                        modal: modal,
                        callback(res){
                            $.tipsModal({
                                title: "提示",
                                content: $scope.url==="/addResource"?"新增资源成功!":"修改资源成功",
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