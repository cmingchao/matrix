let app = angular.module("app",[]);

/*addUser*/
app.controller("addUser",function($scope,$http,$filter){
    "use strict";
    $scope.name = "";
    $scope.phone = "";
    $scope.sex = "";
    $scope.birthDate = "";
    /*初始化下拉菜单*/
    $scope.sexList = $.getJsonStatic("sex");
    $scope.marriageList = $.getJsonStatic("marriage");
    $scope.addUser = ()=>{
        let isValid = $.isValid([
            {
                name:"用户名",
                value:$scope.name,
                except:[{name:"necessary"}]
            },
            {
                name:"电话",
                value:$scope.phone,
                except: [{ name: "exp",value:/^1[34578]{1}[0-9]{9}$/ }]
            },
            {
                name:"性别",
                value:$scope.sex,
                except:[{name:"necessary"}]
            },
            {
                name:"出生年月",
                value:$scope.birthDate,
                except:[{name:"necessary"}]
            },
            {
                name:"婚姻状况",
                value:$scope.marriage,
                except:[{name:"necessary"}]
            }
        ]);
        /*验证通过*/
        if(isValid){
            let modal = $.showLoading();
            $.$http_post({
                http:$http,
                url:"/addUser",
                data:{
                    name:$scope.name,
                    phone:$scope.phone,
                    sex:$scope.sex,
                    birthDate:$scope.birthDate,
                    marriage:$scope.marriage
                },
                modal:modal,
                callback(res){
                    $.tipsModal({
                        title:"提示",
                        content:res.data.errmsg,
                        confirm_callback(){
                            history.back()
                        }
                    });
                }
            });
        }
    };
    /*取消添加返回上一页*/
    $scope.back = ()=>{
        history.back();
    };
    /*出生年月-日期选择器*/
    $scope.chooseBirth=()=>{
        $(".form_datetime").datetimepicker({
            format: "yyyy-mm-dd",
            autoclose: true,
            todayBtn: true,
            todayHighlight: true,
            showMeridian: true,
            pickerPosition: "bottom-left",
            language: 'zh-CN',//中文，需要引用zh-CN.js包
            startView: 2,//月视图，0、1、2、3、4，对应分、时、日、月、年
            minView: 2,//日期时间选择器所能够提供的最精确的时间选择视图
            startDate:"1900-01-01",
            endDate:new  Date()
        });
    };
    $scope.chooseBirth();
});