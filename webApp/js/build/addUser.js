"use strict";

var app = angular.module("app", []);

/*addUser*/
app.controller("addUser", function ($scope, $http, $filter) {
    "use strict";

    $scope.name = "";
    $scope.phone = "";
    $scope.sex = "";
    $scope.year = "";
    $scope.month = "";
    $scope.date = "";
    /*初始化下拉菜单*/
    $scope.sexList = $.getJsonStatic("sex");
    $scope.marriageList = $.getJsonStatic("marriage");
    $scope.addUser = function () {
        var isValid = $.isValid([{
            name: "用户名",
            value: $scope.name,
            except: [{ name: "necessary" }]
        }, {
            name: "电话",
            value: $scope.phone,
            except: [{ name: "exp", value: /^1[34578]{1}[0-9]{9}$/ }]
        }, {
            name: "性别",
            value: $scope.sex,
            except: [{ name: "necessary" }]
        }, {
            name: "年份",
            value: $scope.year,
            except: [{ name: "range", value: [1900, 2100] }]
        }, {
            name: "月份",
            value: $scope.month,
            except: [{ name: "range", value: [1, 12] }]
        }, {
            name: "日期",
            value: $scope.date,
            except: [{ name: "range", value: [1, 31] }]
        }, {
            name: "婚姻状况",
            value: $scope.marriage,
            except: [{ name: "necessary" }]
        }]);
        /*验证通过*/
        if (isValid) {
            var modal = $.showLoading();
            $.$http_post({
                http: $http,
                url: "/addUser",
                data: {
                    name: $scope.name,
                    phone: $scope.phone,
                    sex: $scope.sex,
                    year: $scope.year,
                    month: $scope.month > 9 ? $scope.month : "0" + $scope.month,
                    date: $scope.date > 9 ? $scope.date : "0" + $scope.date,
                    marriage: $scope.marriage
                },
                modal: modal,
                callback: function callback(res) {
                    $.tipsModal({
                        title: "提示",
                        content: res.data.errmsg
                    });
                }
            });
        }
    };
    /*取消添加返回上一页*/
    $scope.back = function () {
        history.back();
    };
});