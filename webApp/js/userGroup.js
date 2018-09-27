let app = angular.module("app", []);
let RFM_type = +$.getUrlParams(location)["userType"] - 1,
    r = $.getUrlParams(location)["r"] || -1,
    f = $.getUrlParams(location)["f"] || -1,
    m = $.getUrlParams(location)["m"] || -1;
if (RFM_type < 0 || r < 0 || f < 0 || m < 0) {
    $.tipsModal({
        title: "提示",
        content: "未获取到相关参数,请确认操作是否合法,页面将可能显示异常!"
    });
}
/*userRFMGroup*/
app.controller("userRFMGroup", function ($scope, $http, $timeout) {
    "use strict";
    let user = JSON.parse($.getCookie("userGroup"))[RFM_type].data;
    let user_new = user.filter(item => item.phone);
    $scope.RFM_type = RFM_type;
    $scope.pageIndex = 1;
    $scope.list = [];
    $scope.sexList = $.getJsonStatic("sex");
    $scope.marriageList = $.getJsonStatic("marriage");
    user_new.map(item => {
        if (item.sex == 0) item.sex = '女';
        else if (item.sex == 1) item.sex = '男';
        else item.sex = '未知';

        if (item.marriage == 0) item.marriage = '未婚';
        else if (item.marriage == 1) item.marriage = '已婚';
        else if (item.marriage == 2) item.marriage = '未知';
        else item.marriage = '未知';
    });

    $scope.search = isBtnSearch => {
        $scope.list = [];
        /*用户是否只是请求新的一页，为true表示只是请求新的一页*/
        if (!isBtnSearch) $scope.page(user_new.length);
        let list = user_new.slice(($scope.pageIndex - 1) * 10, ($scope.pageIndex) * 10);
        $scope.list = list;
        if (!$scope.$$phase || !$scope.$root.$$phase) $scope.$apply();
    };

    $scope.page = (total) => {
        let page = $('#box').paging({
            initPageNo: 1, // 初始页码
            totalPages: Math.ceil(total / 10), //总页数
            slideSpeed: 600, // 缓动速度。单位毫秒
            jump: true, //是否支持跳转
            callback: function (page) {
                // 回调函数
                if ($scope.pageIndex != page) {
                    $scope.pageIndex = page;
                    $scope.state = 1;
                    $scope.search(1);
                }
            }
        });
    };
    $scope.search();

    $http.get("../../data-static/userGroup.json")
        .then(
            res => {
                let data = res.data;
                let userType = data.filter(item => {
                    return item.id === +$scope.RFM_type + 1;
                })[0];
                $scope.RFM_type_name = userType ? userType.name : "无";
                $scope.RFM = userType ? userType.RFM : "无";
                let arr= $scope.RFM.split(" ");
                $scope.personTotal = user.length;
                $scope.r_value =arr[0]=='R↑'?'小于'+$.getJsonStatic("r")[r].name:'大于'+$.getJsonStatic("r")[r].name+'(含)';//单位:天
                $scope.f_value = arr[1]=='F↑'?'大于'+$.getJsonStatic("f")[f].name+'(含)':'小于'+$.getJsonStatic("f")[f].name;//单位:次
                $scope.m_value =arr[2]=='M↑'? '大于'+$.getJsonStatic("m")[m].name+'(含)':'小于'+$.getJsonStatic("m")[m].name;//单位:万元
            }
        );
    $scope.myBack = () => {
        history.back();
        // location.href = `/html/userAnalysis?r=${r}&f=${f}&m=${m}`;
    }
});

/*consume*/
app.controller("consume", function ($scope, $http) {
    "use strict";
    $scope.option = {
        tooltip: {
            trigger: "axis"
        },
        xAxis: {
            type: "category",
            data: []
        },
        yAxis: {},
        series: [
            {
                type: "bar",
                name: "趋势指数",
                barWidth: 5,
                data: [],
                itemStyle: {
                    normal: {
                        color: "#8C7EEC",
                        barBorderRadius: [5, 5, 0, 0]
                    }
                }
            }
        ]
    };
    $(function () {
        let user = JSON.parse($.getCookie("userGroup"))[RFM_type].data,
            /*业态分类*/
            arr = [
                {"name": "餐食", "value": 10, "num": 0},
                {"name": "轻餐", "value": 11, "num": 0},
                {"name": "服装", "value": 12, "num": 0},
                {"name": "化妆品", "value": 13, "num": 0},
                {"name": "亲子类", "value": 14, "num": 0},
                {"name": "娱乐休闲类", "value": 15, "num": 0},
                {"name": "皮具", "value": 16, "num": 0},
                {"name": "内衣", "value": 17, "num": 0},
                {"name": "数码", "value": 18, "num": 0},
                {"name": "饰品", "value": 19, "num": 0},
                {"name": "生活用品", "value": 20, "num": 0},
                {"name": "珠宝手表", "value": 21, "num": 0},
                {"name": "个人护理", "value": 22, "num": 0},
                {"name": "定义类", "value": 23, "num": 0}
            ];
        user.map(item => {
            switch (item.retail_code) {
                case 10:
                    arr[0].num += 1;
                    break;
                case 11:
                    arr[1].num += 1;
                    break;
                case 12:
                    arr[2].num += 1;
                    break;
                case 13:
                    arr[3].num += 1;
                    break;
                case 14:
                    arr[4].num += 1;
                    break;
                case 15:
                    arr[5].num += 1;
                    break;
                case 16:
                    arr[6].num += 1;
                    break;
                case 17:
                    arr[7].num += 1;
                    break;
                case 18:
                    arr[8].num += 1;
                    break;
                case 19:
                    arr[9].num += 1;
                    break;
                case 20:
                    arr[10].num += 1;
                    break;
                case 21:
                    arr[11].num += 1;
                    break;
                case 22:
                    arr[12].num += 1;
                    break;
                case 23:
                    arr[13].num += 1;
                    break;
                default:
            }
        });
        let new_arr = arr.sort((a, b) => b.num - a.num).slice(0, 4);
        $scope.canvasDom = echarts.init($("#consume")[0]);
        $scope.canvasDom.showLoading();
        $scope.option.xAxis.data = new_arr.map(item => item.name || '');
        $scope.option.series[0].data = new_arr.map(item => item.num || 0);
        $scope.canvasDom.setOption($scope.option);
        $scope.canvasDom.hideLoading();
    });
});

/*sex*/
app.controller("sex", function ($scope, $http) {
    "use strict";
    let user = JSON.parse($.getCookie("userGroup"))[RFM_type].data,
        male = 0, female = 0, unknow = 0;
    /*性别分类*/
    user.map(item => {
        switch (item.sex) {
            case 0 :
                female += 1;
                break;
            case 1 :
                male += 1;
                break;
            default :
                unknow += 1;
                break;
        }
    });
    $scope.option = {
        tooltip: {
            trigger: "item",
            formatter:`{b}：{c}({d}%)`
        },
        legend: {
            data: ["男", "女", "未知"],
            itemWidth: 14,
            left: "right"
        },
        color: ['#61BFBE', '#8C7EEC', '#FAAF66'],
        series: [
            {
                type: "pie",
                data: [
                    {name: "男", value: male},
                    {name: "女", value: female},
                    {name: "未知", value: unknow}
                ],
                labelLine: {
                    normal: {
                        show: false
                    }
                },
                label: {
                    normal: {
                        show: false
                    }
                },
                radius: ["55%", "75%"]
            }
        ]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#sex")[0]);
        $scope.canvasDom.showLoading();
        $scope.canvasDom.setOption($scope.option);
        $scope.canvasDom.hideLoading();
    });
});

/*age*/
app.controller("age", function ($scope, $http) {
    "use strict";
    let user = JSON.parse($.getCookie("userGroup"))[RFM_type].data;
    /*性别分类*/
    let user_total = 0,
        user_type = [{}, {}, {}, {}, {}, {}],
        index = 1;
    /*用户总数*/
    user.map(item => {
        user_total += 1;
        /*除10分类*/
        item.age_range = Math.floor(item.age / 10);
    });
    let smaller_20 = 0,
        bigger_60 = 0;
    /*20岁以下*/
    user.map(item => {
        if (item.age_range < 2) {
            smaller_20 += 1;
        } else {
            return false;
        }
    });
    user_type[0] = {
        amount: smaller_20,
        percent: (smaller_20 / user_total * 100).toFixed(2),
        name: "20岁以下"
    };
    /*60岁及以上*/
    user.map(item => {
        if (item.age_range >= 6) {
            bigger_60 += 1;
        } else {
            return false;
        }
    });
    user_type[5] = {
        amount: bigger_60,
        percent: (bigger_60 / user_total * 100).toFixed(2),
        name: "60岁及以上"
    };
    for (let i = 2; i < 6; i++) {
        let amount = 0,
            isExist = user.filter(item => {
                return item.age_range === i;
            });
        if (isExist.length) {
            /*如果有记录*/
            amount = 1;
        }
        user_type[index] = {
            amount: amount,
            percent: (amount / user_total * 100).toFixed(2),
            name: (index + 1) + "0岁-" + (index + 2) + "0岁"
        };
        index += 1;
    }
    $scope.option = {
        tooltip: {
            trigger: "axis",
            formatter: params => {
                return $.echartsTooltip(params);
            }
        },
        xAxis: {
            type: "category",
            axisLabel: {
                rotate: -15
            },
            splitLine: {
                show: false
            },
            data: user_type.map(item => item.name)
        },
        yAxis: [
            {
                name: "(人数)",
                splitLine: {
                    show: false
                }
            },
            {
                name: '(比例)',
                splitLine: {
                    show: false
                }
            }
        ],
        series: [
            {
                type: "bar",
                name: "人数",
                barWidth: 6,
                data: user_type.map(item => item.amount),
                itemStyle: {
                    normal: {
                        color: "#5DBDBC",
                        barBorderRadius: [5, 5, 0, 0]
                    }
                }
            },
            {
                type: "line",
                name: "比例",
                yAxisIndex: 1,
                max: 100,
                data: user_type.map(item => item.percent),
                itemStyle: {
                    normal: {
                        color: "#8C7EEC"
                    }
                }
            }
        ]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#age")[0]);
        $scope.canvasDom.showLoading();
        $scope.canvasDom.setOption($scope.option);
        $scope.canvasDom.hideLoading();
    });
});

/*marriage*/
app.controller("marriage", function ($scope, $http) {
    "use strict";
    let user = JSON.parse($.getCookie("userGroup"))[RFM_type].data,
        unMarriage = 0,
        marriaged = 0,
        unknow = 0;
    user.map(item => {
        switch (item.marriage) {
            case 0 :
                unMarriage += 1;
                break;
            case 1 :
                marriaged += 1;
                break;
            default :
                unknow += 1;
                break;
        }
    });
    $scope.unMarriage = unMarriage;
    $scope.marriaged = marriaged;
    $scope.unknow = unknow;
    $scope.option = {
        tooltip: {
            trigger: "item",
            formatter:`{b}：{c}({d}%)`
        },
        legend: {
            data: ["未婚", "已婚", "未知"],
            itemWidth: 14,
            left: "right"
        },
        series: [
            {
                type: "pie",
                data: [
                    {name: "未婚", value: $scope.unMarriage, itemStyle: {normal: {color: "#5DBDBC"}}},
                    {name: "已婚", value: $scope.marriaged, itemStyle: {normal: {color: "#8C7EEC"}}},
                    {name: "未知", value: $scope.unknow, itemStyle: {normal: {color: "#FAAF66"}}}
                ],
                labelLine: {
                    normal: {
                        show: false
                    }
                },
                label: {
                    normal: {
                        show: false
                    }
                },
                radius: ["55%", "75%"]
            }
        ]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#marriage")[0]);
        $scope.canvasDom.showLoading();
        $scope.canvasDom.setOption($scope.option);
        $scope.canvasDom.hideLoading();
    });
});