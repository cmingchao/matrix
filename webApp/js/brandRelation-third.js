const app = angular.module("app",[]);
"use strict";
/*品牌链相关参数*/
const chainIndex = $.getUrlParams(location)["chainsIndex"] || -1,
      brandCode = $.getUrlParams(location)["brandCode"] || 0,
      c_brand_code = $.getUrlParams(location)["c_brand_code"]==='0'?0:$.getUrlParams(location)["c_brand_code"],
      brandName = $.getUrlParams(location)["brandName"] || 0,
      nodeId = $.getUrlParams(location)["nodeId"] || 0;
/*如无,则进入页面操作非法*/
if(!(+chainIndex + 1) || !c_brand_code || !nodeId || !brandName){
    $.tipsModal({
        title:"提示",
        content:"未获取到品牌链相关数据,请确认操作是否合法,页面将可能显示异常!"
    });
}

/*关联图*/
app.controller("brandRelation",function($scope,$http){
    "use strict";
    $scope.chainIndex = chainIndex;
    /*当前所选品牌链*/
    $scope.webkitDep = $.newWebkitDep(JSON.parse($.getCookie("brandChainList"))[$scope.chainIndex]);

    $(function () {
        $scope.canvasDom = echarts.init($("#brandRelation")[0]);
        $scope.canvasDom.showLoading();
        var webkitDep = $scope.webkitDep;
        //重置category数组
        var option = {
            legend:{
                data:webkitDep.categories,
                itemWidth:14,
                bottom:20
            },
            color:color_formats,
            series: [{
                type: 'graph',
                layout: 'force',
                animation: false,
                opacity:1,
                label: {
                    normal: {
                        show:true,
                        position: 'right',
                        formatter: '{b}'
                    }
                },
                top:-10,
                draggable: true,
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize:[0,5],
                data: webkitDep.nodes.map(function (node, idx) {
                    node.id = idx;
                    //选中品牌放大
                    if(!idx){
                        node.symbolSize = 20;
                    }
                    return node;
                }),
                categories: webkitDep.categories,
                force: {
                    edgeLength: 50,
                    repulsion: 500,
                    gravity: 1.2-$scope.canvasDom.getWidth()/600
                },
                edges: webkitDep.links
            }]
        };
        $scope.canvasDom.hideLoading();
        $scope.canvasDom.setOption(option);
    });
});

/*品牌链潜客统计*/
app.controller("brandChain",function($scope,$http){
    "use strict";
    /*当前所选品牌链*/
    let index = chainIndex,
        webkitDep = JSON.parse($.getCookie("brandChainList"))[index],
        links = webkitDep.links,
        nodes = webkitDep.nodes,
        category = webkitDep.categories,
        brands = [];
    for(let i=0;i<links.length;i++){
        let node_id = links[i].target,
            recommend = links[i].recommend*100;
        /*是该链中的品牌*/
        if(nodes[node_id].show){
            let node = {
                name:nodes[node_id].name,
                recommend:recommend.toFixed(2),
                c_brand_code:nodes[node_id].c_brand_code,
                retail:category[nodes[node_id].category].name,
                exponent:0,
                composite:nodes[node_id].composite
            };
            brands.push(node);
        }
    }
    $scope.nodeList = brands;
});

/*主品牌信息*/
app.controller("mainBrand",function($scope,$http){
    "use strict";
    $scope.brandCode = brandCode;
    $scope.brandName = brandName;
    $scope.c_brand_code = c_brand_code;
    $scope.nodeId = nodeId;
    let modal = $.showLoading();
    $.$http_post({
        http:$http,
        url:"/brandDetailsBasicInfo",
        data:{brandCode:$scope.brandCode},
        modal:modal,
        callback(res){
            let data = res.data.data[0] || {};
            $scope.composite = data.composite || "暂无";
            $scope.retail = $.getNameOfList(c_brand_code,"retailList",[0,2]);
            $scope.sex = $.getNameOfList(c_brand_code,"sexList",[2,1]);
            $scope.age = $.getNameOfList(c_brand_code,"ageList",[3,2]);
            $scope.area = $.getNameOfList(c_brand_code,"areaList",[8,1]);
            /*联动属性*/
            $scope.avPrice = $.getNameOfSecondary(c_brand_code)[0];
            $scope.distinct = $.getNameOfSecondary(c_brand_code)[1];
        }
    });
});

/*关联品牌*/
app.controller("customer",function($scope,$http){
    "use strict";
    /*当前所选品牌链*/
    let chainList_ori = JSON.parse($.getCookie("brandChainList"))[chainIndex],
        brands = [];
    /*品牌*/
    for(let i=0;i<chainList_ori.nodes.length;i++){
        let item = chainList_ori.nodes[i];
        if(item.show) brands.push(item);
    }
    $scope.list = brands;
    /*获取品牌潜客*/
    let modal = $.showLoading();
    for(let i=0;i<brands.length;i++){
        /**/
        (function (i) {
            $.$http_post({
                http:$http,
                url:"/potentialCustomer",
                data:{brands:[brands[i].name]},
                modal:modal,
                callback: function (res){
                    let data = res.data.data;
                    $scope.list[i].potentialCustomer = data || 0;
                }
            })
        }(i));
    }
});

/*标签潜客统计*/
app.controller("labelCustomer",function($scope,$http){
    "use strict";
    let modal = $.showLoading();
    $.$http_post({
        http: $http,
        data: {brand_code: c_brand_code},
        url: "/labelPotentialCustomer",
        modal: modal,
        callback(res){
            let data = res.data.data || {};
            $scope.retail = {name: $.getNameOfList(c_brand_code, "retailList", [0, 2]), value: data.retail || 0};
            $scope.sex = {name: $.getNameOfList(c_brand_code, "sexList", [2, 1]), value: data.sex || 0};
            $scope.age = {name: $.getNameOfList(c_brand_code, "ageList", [3, 2]), value: data.age || 0};
            $scope.area = {name: $.getNameOfList(c_brand_code, "areaList", [8, 1]), value: data.area || 0};
            /*联动属性*/
            $scope.avPrice = {name:$.getNameOfSecondary(c_brand_code)[0],value:data.price || 0};
            $scope.distinct = {name:$.getNameOfSecondary(c_brand_code)[1],value:data.distinct || 0};
            $scope.total = data.total || 0;
        }
    });
});


$(function () {
    let cusTotal = $(".label-customer .customer-total"),
        pv_height = cusTotal.prev().height(),
        window_width = window.innerWidth;
    if (window_width >= 768) {
        cusTotal.height(pv_height);
    }
});