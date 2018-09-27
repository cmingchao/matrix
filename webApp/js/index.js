let app = angular.module("app",[]);

/*customerSale*/
app.controller("customerSale",function($scope,$http){
    "use strict";
    let modal = $.showLoading();
    $.$http_post({
        http:$http,
        url:"/customerAndSales",
        modal:modal,
        callback(res){
            $scope.data = res.data.data;

        }
    });
});

/*realtimeRecommend实时推荐*/
app.controller("realTimeRecommend",function($scope,$http){
    "use strict";
    let modal = $.showLoading();
    $.$http_post({
        http:$http,
        url:"/realTimeRecommend",
        modal:modal,
        callback(res){
            $scope.data = res.data.data;
        }
    });
});
/*realTimeVerificate 实时核销*/
app.controller("realTimeVerificate",function($scope,$http){
    "use strict";
    let modal = $.showLoading();
    $.$http_post({
        http:$http,
        url:"/realTimeVerificate",
        modal:modal,
        callback(res){
            $scope.data = res.data.data;
        }
    });
});

/*realtimeDynamics 实时动态*/
app.controller("realTimeDynamics",function($scope,$http){
    "use strict";
    $scope.list = [];
    let modal = $.showLoading();
    $.$http_post({
        http:$http,
        url:"/realTimeDynamics",
        modal:modal,
        callback(res){
            let data = res.data.data;
            $scope.list = data;
        }
    });
});

/*touchRate 核销率*/
app.controller("touchRate",function($scope,$http){
    "use strict";
    $scope.option = {
        tooltip:{
            trigger:"axis"
        },
        grid:{
            left:"15%"
        },
        xAxis:{
            axisLabel:{
                interval:0,
                rotate:-15
            },
            data:['周一','周二','周三','周四','周五','周六','周日']
        },
        yAxis:{
            name:"比例(%)",
            splitLine:{
                show:false
            }
        },
        series:[{
            type:"bar",
            name:"核销率",
            barWidth:5,
            itemStyle:{
                normal:{
                    color:"#9A5BEA",
                    barBorderRadius:[5,5,0,0]
                }
            },
            data:[]
        }]
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#touch-amount")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http:$http,
            url:"/touchRate",
            canvasDom:$scope.canvasDom,
            callback(res){
                // console.log(res);
                let data = res.data.data;
                $scope.option.series[0].data = data;
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*verificateNumbersAndtotalSales核销数和总销售额*/
app.controller("verificateNumbersAndtotalSales",function($scope,$http){
    "use strict";
    $scope.option = {
        grid:{
            left:"15%",
            right:'15%'
        },
        legend:{
            left:"right",
            data:['核销数','总销售额'],
            itemWidth:9,
            itemHeight:9
        },
        tooltip:{
            trigger:"axis"
        },
        xAxis:{
            boundaryGap: false,
            axisLabel:{
                interval:0,
                rotate:-15
            },
            data:['周一','周二','周三','周四','周五','周六','周日']
        },
        yAxis:[
            {
                name:'核销数(次)',
                splitLine:{
                    show:false
                }
            },
            {
                name:'总销售额(万元)',
                splitLine:{
                    show:false
                }
            }
        ],
        color:['#5DBDBC','#FAAF66'],
        series:[
            {
                type:"line",
                name:"核销数",
                smooth:true,
                symbol:"circle",
                areaStyle:{
                  normal:{}
                },
                data:[]
            },
            {
                type:"line",
                name:"总销售额",
                symbol:"circle",
                smooth:true,
                yAxisIndex:1,
                areaStyle:{
                    normal:{}
                },
                data:[]
            }
        ]
    };
    /*获取数据*/
    $(()=>{
        $scope.canvasDom = echarts.init($("#touch-transmutation")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http:$http,
            url:"/verificateNumbersAndtotalSales",
            canvasDom:$scope.canvasDom,
            callback(res){
                let data = res.data.data;
                $scope.option.series[0].data = data.data_new_v;
                $scope.option.series[1].data = data.data_new_s;
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});