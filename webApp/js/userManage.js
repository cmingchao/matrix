let app = angular.module("app", []);

/*conditionSec*/
app.controller("controllerList", function ($scope, $http, $window) {
    "use strict";
    $scope.pageIndex = 1; //默认第一页
    /*用户列表*/
    $scope.userManageList = [];
    /*角色id*/
    $scope.role_id = '';
    $scope.search = function (isBtnSearch) {
        let modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/userManageList",
            data: {
                pageIndex: $scope.pageIndex
            },
            modal: modal,
            callback(res){
                let data = res.data.data;
                /*用户是否只是请求新的一页*/
                if (!isBtnSearch) $scope.page(data.dataTotal);
                $scope.list = data.list;
            }
        });
    };
    $scope.search();
    $scope.page = (total) => {
        let page = $('#box').paging({
            initPageNo: 1, // 初始页码
            totalPages: Math.ceil(total / 10), //总页数
            slideSpeed: 600, // 动画效果速度,单位毫秒
            jump: true, //是否支持跳转
            callback: function (page) {
                // 当前页面  不作响应
                if ($scope.pageIndex !== page) {
                    $scope.pageIndex = page;
                    $scope.state = 1;
                    $scope.search(1);
                }
            }
        });
    };
    /*删除管理员信息*/
    $scope.doDelete = obj => {
        $.tipsModal({
            title: "提示",
            content: "是否删除该管理员?",
            cancel_text: '取消',
            confirm_callback(){
                let modal = $.showLoading();
                $.$http_post({
                    http: $http,
                    url: "/deleteManagerInfo",
                    data: {
                        user_id: obj.user_id,
                        user_name:obj.account
                    },
                    modal: modal,
                    callback(res){
                        $.tipsModal({
                            title: "提示",
                            content: "删除管理员信息成功!",
                            confirm_callback(){
                                $window.location.reload();
                            }
                        });
                    }
                })
            }
        });
    };
    /*分配角色*/
    $scope.distributeRole = obj => {
        console.log(obj);
        $scope.user_id = obj.user_id;
        $scope.userName = obj.account;
        let modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/getUserRoleList",
            data: {},
            modal: modal,
            callback(res){
                let data = res.data.data;
                data.map(item => {
                    if(item.id==obj.role_id){
                        item.status = true;
                        $scope.role_id = obj.role_id;
                    }else {
                        item.status = false;
                    }
                });
                $scope.roleList = data;
            }
        })
    };
    $scope.radioSelect = (role_id) => {
        $scope.role_id = role_id;
    };
    $scope.mySubmit = () => {
        if (!$scope.role_id) {
            $.requestError("请选择一个角色");
            return false;
        } else {
            let modal = $.showLoading();
            $.$http_post({
                http: $http,
                url: "/updateUserRole",
                data: {
                    user_id: $scope.user_id,
                    role_id: $scope.role_id,
                },
                modal: modal,
                callback(res){
                    $.tipsModal({
                        title: "提示",
                        content: "更新用户角色成功!",
                        confirm_callback(){
                            $window.location.reload();
                        }
                    });
                }
            });
        }
    };
    $scope.myCancel=()=>{
        $scope.role_id = '';
    }
});