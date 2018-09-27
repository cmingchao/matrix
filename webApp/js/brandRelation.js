let app = angular.module("app",[]);

/*关联图*/
app.controller("brandRelation",function($scope,$http){
    "use strict";
    //根据品牌名称搜索
    $scope.searchName = "";
    $scope.searchBrand = ()=>{
        //数据已获取
        if($scope.origin_data && $scope.searchName){
            var nodes_new = [];
            $scope.origin_data.nodes.forEach(item=>{
                let item_new = JSON.parse(JSON.stringify(item)),
                    upper_name = item_new.name.toUpperCase(),
                    upper_name_s = $scope.searchName.toUpperCase();
                //只要有匹配字符,则选中
                if(upper_name.match(upper_name_s) === null){
                    item_new.itemStyle = {normal: {color: "#ccc"}};
                    item_new.label = {normal:{show:false}};
                    //如果处于搜索状态,则disable状态的品牌不可点击
                    item_new.disable = true;
                }else{
                    item_new.itemStyle = {normal: {color: "#ff0000"}};
                    item_new.label = {normal:{show:true}};
                    item_new.disable = false;
                }
                nodes_new.push(item_new);
            });
            //重置关系图，突出显示含有关键字的品牌节点
            $scope.canvasDom.setOption({
                series:[
                    {
                        data:nodes_new
                    }
                ]
            });
        }
        return false;
    };
    $scope.clearSearch = ()=>{
        //若搜索字符不为空,则清空并还原关系图
        if($scope.searchName){
            $scope.searchName = "";
            $scope.canvasDom.setOption({
                series:[
                    {
                        data:$scope.origin_data.nodes
                    }
                ]
            });
        }
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#brandRelation")[0]);
        $scope.canvasDom.showLoading();
        $.$http_post({
            http:$http,
            url:"/brandRelation",
            canvasDom:$scope.canvasDom,
            callback(res){
                var webkitDep = res.data.data;
                webkitDep = $.newWebkitDep(webkitDep);
                $scope.origin_data =  Object.assign({},webkitDep);
                var option = {
                    legend:{
                        data:$scope.origin_data.categories.map(item=>item.name),
                        itemWidth:14,
                        bottom:20
                    },
                    color:color_formats,//业态颜色
                    series: [{
                        type: 'graph',
                        layout: 'force',
                        animation: false,
                        opacity:1,
                        label: {
                            normal: {
                                position: 'right',
                                formatter: '{b}'
                            }
                        },
                        lineStyle:{
                            normal:{
                                color:'target',
                                // curveness: 0.5,
                                opacity: 0.2
                            }
                        },
                        top:-10,
                        draggable: true, //可拖动
                        roam:true, //可缩放
                        focusNodeAdjacency:true, //是否在鼠标移到节点上的时候突出显示节点以及节点的边和邻接节点,默认false
                        symbolSize:8,
                        edgeSymbol: ['circle', 'arrow'],
                        edgeSymbolSize:[0,5],
                        data: $scope.origin_data.nodes.map(function (node, idx) {
                            node.id = idx;
                            return node;
                        }),
                        categories: $scope.origin_data.categories,
                        force: {
                            edgeLength: [80,100],
                            repulsion: 30,
                            gravity: 1.2-$scope.canvasDom.getWidth()/600
                        },
                        edges: $scope.origin_data.links.slice(0,200)
                    }]
                };
                $scope.canvasDom.hideLoading();
                $scope.canvasDom.setOption(option);

                /*添加点击事件*/
                $scope.canvasDom.on("click", function (params) {
                    // console.log(params);
                    //所选为不为node或当前处于“品牌搜索状态”且所选品牌为不可用状态,不作响应
                    if(params.dataType !== "node" || params.data.disable) return false;
                    /*所选品牌数据*/
                    let params_data = params.data;
                    /*获取品牌链*/
                    $.chooseMainBrand($scope.origin_data,params.data.nodeId,[0,4], function (webkitDep_new,chains_arr) {
                        /*设置cookie,打开二级品牌关系图页面*/
                        /**/
                        chains_arr.map(chain=>{
                            console.log(chain);
                            let node_new = JSON.parse(JSON.stringify(webkitDep_new.nodes));
                            node_new.map(web_nodes=>{
                                /*初始化为不显示*/
                                web_nodes.show = false;
                                web_nodes.itemStyle = {normal:{opacity:0}};
                                chain.nodes.map(cha_nodes=>{
                                    /*该链中的品牌显示*/
                                    if(cha_nodes.nodeId === web_nodes.nodeId){
                                        web_nodes.itemStyle.normal.opacity = 1;
                                        web_nodes.show = true;
                                    }
                                });
                            });
                            chain.nodes = node_new;
                        });
                        /*设置缓存*/
                        $.setCookie("brandChain",JSON.stringify(webkitDep_new),1000*60);
                        $.setCookie("brandChainList",JSON.stringify(chains_arr),1000*60);
                        // console.log(params_data);
                        /*跳转*/
                        location.href="/html/brandRelationSecond?nodeId="+params_data.nodeId+"&brandName="+params_data.name+"&c_brand_code="+params_data.brand_code+"&brandCode="+params_data.code;
                    });
                });
            }
        });
    });
});

/*品牌链分析*/
app.controller("brandDataStatistics",function($scope,$http){
    "use strict";
    $scope.list = [];
    $scope.n=3;/*品牌链的段数，默认初始为3*/
    $scope.brandChainAnalysis=n=>{
        $scope.n=n;
        let modal = $.showLoading();
        $.$http_post({
            http:$http,
            url:"/brandDataStatistics",
            data:{
                n:$scope.n,
            },
            modal:modal,
            callback(res){
                let brandChain = res.data.data;
                brandChain.map(item=>{
                    item.brand_link=item.brand_link.replace(/,/g," - ");
                });
                $scope.list = brandChain;
            }
        });
    };
    $scope.brandChainAnalysis(3);/*页面加载就调用一次*/
});

/*推荐排行*/
app.controller("drainageRank",function($scope,$http){
    "use strict";
    $scope.option = {
        grid:{
            bottom:80
        },
        tooltip: {
            trigger: "axis"
        },
        xAxis: {
            type: "category",
            axisLabel:{
                interval:0,
                rotate:-15
            },
            data: []
        },
        yAxis: {
            name: "(次)",
            splitLine: {
                show: false
            }
        },
        series:{
            type: "bar",
            name:"推荐次数",
            barWidth: 6,
            itemStyle: {
                normal: {
                    color: "#8C7EEC",
                    barBorderRadius:[5,5,0,0]
                }
            },
            data: []
        }
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#drainageRank")[0]);
        $scope.canvasDom.showLoading();
        /*引流排行前十*/
        $.$http_post({
            http:$http,
            url:"/fifthDrainage",
            data:{limit_num:10},
            canvasDom:$scope.canvasDom,
            callback: function (res) {
                let data = res.data.data;
                $scope.option.xAxis.data = data.map(item=>item.name_cn || item.name_cen || '无');
                $scope.option.series.data = data.map(item=>item.num || 0);
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });
});

/*核销排行*/
app.controller("guestRank",function($scope,$http){
    "use strict";
    $scope.option = {
        grid:{
            bottom:80
        },
        tooltip: {
            trigger: "axis"
        },
        xAxis: {
            type: "category",
            axisLabel:{
                interval:0,
                rotate:-15
            },
            data: []
        },
        yAxis: {
            name: "(次)",
            splitLine: {
                show: false
            }
        },
        series:  {
            type: "bar",
            name:"核销次数",
            barWidth: 6,
            itemStyle: {
                normal: {
                    color: "#FCDC85",
                    barBorderRadius:[5,5,0,0]
                }
            },
            data: []
        }
    };
    $(function () {
        $scope.canvasDom = echarts.init($("#guestRank")[0]);
        $scope.canvasDom.showLoading();
        /*引流排行前十*/
        $.$http_post({
            http:$http,
            url:"/fifthGuest",
            data:{limit_num:10},
            canvasDom:$scope.canvasDom,
            callback: function (res) {
                let data = res.data.data;
                $scope.option.xAxis.data = data.map(item=>item.name_cn || item.name_cen);
                $scope.option.series.data = data.map(item=>item.num || 0);
                $scope.canvasDom.setOption($scope.option);
            }
        });
    });

});

$(function () {
    $(".brand-relation .search .btn").on("click", function () {
        $(this).parent().prev().removeClass("hide-mine").prev().removeClass("hide");
        $(this).removeClass("btn-normal");
    });

    //搜索框隐藏(已弃用)
    //$(".brandRelation .search .input-group").on("click", function (e) {
    //    //阻止冒泡
    //    return e.stopPropagation?e.stopPropagation():e.cancelBubble=true;
    //});
    //$("body").on("click", function () {
    //    $(".brandRelation .search .btn").parent().prev().addClass("hide-mine").prev().addClass("hide");
    //    $(".brandRelation .search .btn").addClass("btn-normal");
    //});
});