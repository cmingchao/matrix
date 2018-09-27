let app = angular.module("app", []);

/*conditionSec*/
app.controller("controllerList", function ($scope, $http, $window) {
    "use strict";
    $scope.pageIndex = 1; //默认第一页
    $scope.role_id = '';/*角色id*/
    $scope.search = function (isBtnSearch) {
        let modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/roleManageList",
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
    /*删除某一角色类型*/
    $scope.doDelete = obj => {
        $.tipsModal({
            title: "提示",
            content: "是否删除该角色类型?",
            cancel_text:'取消',
            confirm_callback(){
                let modal = $.showLoading();
                $.$http_post({
                    http: $http,
                    url: "/deleteRole",
                    data: {
                        role_id: obj.id,
                        role_name:obj.role_name
                    },
                    modal: modal,
                    callback(res){
                        $.tipsModal({
                            title: "提示",
                            content: "删除该角色类型成功!",
                            confirm_callback(){
                                $window.location.reload();
                            }
                        });
                    }
                })
            }
        });
    };
    /*分配资源*/
    $scope.distributeResource = obj => {
        // console.log(obj);
        $scope.role_id = obj.id;
        $scope.userName = obj.role_name;
        let modal = $.showLoading();
        $.$http_post({
            http: $http,
            url: "/getResourceList",
            data: {
                role_id:$scope.role_id
            },
            modal: modal,
            callback(res){
                let data = res.data.data;
                data.list.map(item=>{
                    item.state=false;
                    if(item.id===2||item.id===8||item.id===13){
                        item.disabled=true;
                    }
                });
                data.hasAuthList.map(item=>{
                    data.list.map(item2=>{
                        if(item2.id===item.id){
                            item2.state=true;
                        }
                    })
                });
                $scope.resourceList = data.list;
            }
        })
    };
    /*联动*/
    $scope.selectCheckBox=()=>{
        let arr= $scope.resourceList;
        arr.map((item)=>{
            if(arr[1].state||arr[2].state||arr[3].state||arr[4].state||arr[5].state) arr[0].state=true;
            else arr[0].state=false;

            if(arr[7].state||arr[8].state||arr[8].state)  arr[6].state=true;
            else arr[6].state=false;

            if(arr[12].state||arr[13].state||arr[14].state) arr[11].state=true;
            else arr[11].state=false;
        })
    };
    $scope.mySubmit = () => {
        $.tipsModal({
            title: "提示",
            content: "是否更改该角色所拥有的权限?",
            cancel_text:'取消',
            confirm_callback(){
                let arr=[];
                $scope.resourceList.map(item => {
                    if (item.state) {
                        arr.push(item);
                    }
                });
                if (!arr.length) {
                    $.requestError("请至少选择一个资源");
                    return false;
                } else {
                    let modal = $.showLoading();
                    console.log(arr);
                    $.$http_post({
                        http: $http,
                        url: "/updateResource",
                        data: {
                            role_id: $scope.role_id,
                            arr
                        },
                        modal: modal,
                        callback(res){
                            $.tipsModal({
                                title: "提示",
                                content: "分配资源成功!",
                                confirm_callback(){
                                    $window.location.reload();
                                }
                            });
                        }
                    });
                }
            }});
    };
    $scope.myCancel=()=>{
        $scope.role_id='';
    }

});