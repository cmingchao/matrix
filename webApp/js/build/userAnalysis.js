"use strict";

var app = angular.module("app", []);

app.directive("user", function () {
    "use strict";

    return {
        template: "<div class=\"item col col-lg-3 col-sm-3 col-xs-6\" >\n                    <div class=\"type\" ng-bind=\"item.type || '\u65E0'\"></div>\n                    <div class=\"type-details\">\n                        <p ng-bind=\"item.name ||'\u65E0'\"></p>\n                        <p ng-bind=\"item.RFM || '\u65E0'\"></p>\n                    </div>\n                    <div class=\"img\"><img src=\"{{item.src}}\" alt=\"{{item.name}}\"></div>\n                    <div class=\"value\"><span>{{item.value}}</span>\u4EBA</div>\n                    <div class=\"view color-pomo\"><a href=\"/html/userGroup?userType={{item.id}}&r={{type_r}}&f={{type_f}}&m={{type_m}}\">\u67E5\u770B</a></div>\n                </div>",
        restrict: "E",
        replace: true
    };
});

/*RFMDetails*/
app.controller("container", function ($scope, $http) {
    "use strict";

    $scope.groupList = [];
    $http.get("../../data-static/userGroup.json").then(function (res) {
        var data = res.data;
        $scope.groupList = data;
    });
    /*初始化*/
    $scope.r_list = $.getJsonStatic("r"); //单位:天
    $scope.f_list = $.getJsonStatic("f"); //单位:次
    $scope.m_list = $.getJsonStatic("m"); //单位:万元
    $scope.type_r = 3;
    $scope.type_f = 3;
    $scope.type_m = 3;
    $scope.screenUser = function () {
        var modal = $.showLoading(),
            v_r = $scope.type_r,
            v_f = $scope.type_f,
            v_m = $scope.type_m;
        $.$http_post({
            http: $http,
            url: "/userGroupAnalysis",
            modal: modal,
            data: {
                type_r: $scope.r_list[v_r].value,
                type_f: $scope.f_list[v_f].value,
                type_m: $scope.m_list[v_m].value
            },
            callback: function callback(res) {
                var data = res.data.data;
                /*设置cookie*/
                $.setCookie("userGroup", JSON.stringify(data), 365);
                $scope.groupList.map(function (item, index) {
                    item.value = data[index].data.length;
                });
            }
        });
    };
    $scope.screenUser();
});

$(function () {
    var camera = void 0; //相机
    var renderer = void 0; //渲染器
    var scene = void 0; //场景
    var controls = void 0; //控制器
    var loader = new THREE.FontLoader(); //新建字体对象
    var canvasDom2 = document.getElementById("userRFM"); //canvas元素节点
    var canvasDom2Width = canvasDom2.offsetWidth;
    var canvasDom2Height = canvasDom2.offsetHeight;
    var arr = []; //存放小几何体
    var x1 = 45,
        x2 = 55;
    $(function () {
        //RFM图
        init();
        animation();
    });

    //RFM图
    //        左边模型
    function init() {
        //设置渲染器
        renderer = new THREE.WebGLRenderer({
            canvas: canvasDom2,
            antialias: true, //是否开启反锯齿
            alpha: true, //是否可以设置背景色透明
            shadowMapEnabled: true //渲染器渲染阴影
        });
        renderer.setSize(canvasDom2Width, canvasDom2Height); // 设置渲染器的大小
        renderer.setClearColor(0x000000, 0); //设置canvas背景色和透明度,颜色为16进制

        //设置场景,场景是所有物体的容器
        scene = new THREE.Scene();

        //设置相机
        camera = new THREE.OrthographicCamera(canvasDom2Width / -2, canvasDom2Width / 2, canvasDom2Height / 2, canvasDom2Height / -2, 1, 1000); //正投影相机(远近高低比例都相同), 参数分别为左、右、上、下、近、远平面距离相机中心点的垂直距离
        camera.position.set(250, 250, 250); //设置相机的位置,坐标为x,y,z
        //            设置相机的上方向
        camera.up.set(0, 1, 0); //camera的坐标系，y轴向上，即右手坐标系
        camera.lookAt(scene.position); //设置镜头的中心点(0,0,0),camera面向的位置
        scene.add(camera); // 追加相机到场景

        //设置光源
        //            环境光
        var light = new THREE.AmbientLight(0xFFFFFF); //设置环境光(明暗程度相同)，接受一个16进制的颜色值作为参数
        scene.add(light); // 追加光源到场景

        //设置物体
        var axes = new THREE.AxisHelper(100); //坐标轴
        scene.add(axes);

        //箭头
        var arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(250, 0, 0), new THREE.Vector3(-250, 0, 0), 500, 0x666666); //箭头x轴
        scene.add(arrowHelper);
        arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 250, 0), new THREE.Vector3(0, -180, 0), 430, 0x666666); //y轴
        scene.add(arrowHelper);
        arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 250), new THREE.Vector3(0, 0, -250), 500, 0x666666); //z轴
        scene.add(arrowHelper);

        //绘制坐标轴的文字
        loader.load('../lib/js/FZYaoTi_Regular.js', function (font) {
            var text_style = { //文字样式设置
                font: font, //字体，默认是'helvetiker'，需对应引用的字体文件
                size: 16, //字号大小，一般为大写字母的高度
                height: 1, //文字的厚度
                weight: 'normal', //值为'normal'或'bold'，表示是否加粗
                style: 'normal', //值为'normal'或'italics'，表示是否斜体
                curveSegments: 12, //弧线分段数，使得文字的曲线更加光滑
                bevelThickness: 0.1, //倒角厚度
                bevelSize: 0.1, //倒角宽度
                bevelEnabled: true //布尔值，是否使用倒角，意为在边缘处斜切
            };
            function drawText(x, y, z, text) {
                var color = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0x333333;
                //xyz坐标，文字,颜色
                var textGeo = new THREE.TextGeometry(text, text_style); //文字，文字样式
                var textMaterial = new THREE.MeshPhongMaterial({ color: color });
                var mesh = new THREE.Mesh(textGeo, textMaterial);
                mesh.position.set(x, y, z);
                scene.add(mesh);
            }
            drawText(250, -10, 0, "R↑");
            drawText(-280, -10, 0, "R↓");
            drawText(-10, 250, 0, "M↑");
            drawText(-10, -200, 0, "M↓");
            drawText(-10, 0, 270, "F↑");
            drawText(-10, 0, -250, "F↓");
            drawText(-x1 - 110, x1 + 50, -x2, "A", 0xFAAF66);
            drawText(x1 + 100, x1 + 50, -x2, "B", 0xFAAF66);
            drawText(x1 + 100, x1 + 50, x2, "C", 0xFAAF66);
            drawText(-x1 - 110, x1 + 50, x2, "D", 0xFAAF66);
            drawText(-x1 - 120, -x1 - 50, -x2, "①", 0xFAAF66);
            drawText(x1 + 100, -x1 - 50, -x2, "②", 0xFAAF66);
            drawText(x1 + 100, -x1 - 50, x2, "③", 0xFAAF66);
            drawText(-x1 - 120, -x1 - 50, x2, "④", 0xFAAF66);
        });

        //绘制小长方体
        for (var i = 0; i < 8; i++) {
            var boxGeometry = new THREE.BoxGeometry(80, 100, 80);
            var material = new THREE.MeshLambertMaterial({ color: 0x5dbdbc, opacity: 0.75, transparent: true });
            var smallCuboid = new THREE.Mesh(boxGeometry, material);
            smallCuboid.userData.uId = i + 1;
            smallCuboid.rotation.x = Math.PI / 2;
            arr.push(smallCuboid);
            scene.add(smallCuboid);
            //                边框
            var edges = new THREE.EdgesHelper(smallCuboid, 0x4B9998); //设置边框，可以旋转
            smallCuboid.add(edges);
            //                线段
            var lineGeometry = new THREE.Geometry();
            var lineMaterial = new THREE.LineBasicMaterial({ color: 0xFAAF66 });
            switch (i + 1) {
                case 1:
                    smallCuboid.position.set(-x1, x1, -x2); //设置位置坐标x,y,z
                    var p1 = new THREE.Vector3(-x1, x1, -x2);
                    var p2 = new THREE.Vector3(-x1 - 100, x1 + 50, -x2);
                    lineGeometry.vertices.push(p1);
                    lineGeometry.vertices.push(p2);
                    var line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);
                    break;
                case 2:
                    smallCuboid.position.set(x1, x1, -x2);
                    var p1 = new THREE.Vector3(x1, x1, -x2);
                    var p2 = new THREE.Vector3(x1 + 100, x1 + 50, -x2);
                    lineGeometry.vertices.push(p1);
                    lineGeometry.vertices.push(p2);
                    var line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);
                    break;
                case 3:
                    smallCuboid.position.set(x1, x1, x2);
                    var p1 = new THREE.Vector3(x1, x1, x2);
                    var p2 = new THREE.Vector3(x1 + 100, x1 + 50, x2);
                    lineGeometry.vertices.push(p1);
                    lineGeometry.vertices.push(p2);
                    var line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);
                    break;
                case 4:
                    smallCuboid.position.set(-x1, x1, x2);
                    var p1 = new THREE.Vector3(-x1, x1, x2);
                    var p2 = new THREE.Vector3(-x1 - 100, x1 + 50, x2);
                    lineGeometry.vertices.push(p1);
                    lineGeometry.vertices.push(p2);
                    var line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);
                    break;
                case 5:
                    smallCuboid.position.set(-x1, -x1, -x2);
                    var p1 = new THREE.Vector3(-x1, -x1, -x2);
                    var p2 = new THREE.Vector3(-x1 - 100, -x1 - 50, -x2);
                    lineGeometry.vertices.push(p1);
                    lineGeometry.vertices.push(p2);
                    var line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);
                    break;
                case 6:
                    smallCuboid.position.set(x1, -x1, -x2);
                    var p1 = new THREE.Vector3(x1, -x1, -x2);
                    var p2 = new THREE.Vector3(x1 + 100, -x1 - 50, -x2);
                    lineGeometry.vertices.push(p1);
                    lineGeometry.vertices.push(p2);
                    var line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);
                    break;
                case 7:
                    smallCuboid.position.set(x1, -x1, x2);
                    var p1 = new THREE.Vector3(x1, -x1, x2);
                    var p2 = new THREE.Vector3(x1 + 100, -x1 - 50, x2);
                    lineGeometry.vertices.push(p1);
                    lineGeometry.vertices.push(p2);
                    var line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);
                    break;
                case 8:
                    smallCuboid.position.set(-x1, -x1, x2);
                    var p1 = new THREE.Vector3(-x1, -x1, x2);
                    var p2 = new THREE.Vector3(-x1 - 100, -x1 - 50, x2);
                    lineGeometry.vertices.push(p1);
                    lineGeometry.vertices.push(p2);
                    var line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);
                    break;
                default:
            }
        }
        //控制
        controls = new THREE.OrbitControls(camera, renderer.domElement); //鼠标控制旋转
    }

    //渲染
    function animation() {
        renderer.render(scene, camera); //将场景绘制到浏览器中,如果我们改变了物体的位置或者颜色之类的属性，就必须重新调用render()函数
        controls.update();
        requestAnimationFrame(animation); //渲染循环,反复执行animation()
    }

    //        事件
    canvasDom2.addEventListener('click', onDocumentClick, false);
    function onDocumentClick(event, u_Id) {
        var uId = 0;
        event.preventDefault();
        if (event.target.tagName === "CANVAS") {
            var mouse = new THREE.Vector3((event.clientX - event.target.getBoundingClientRect().left) / event.target.offsetWidth * 2 - 1, -((event.clientY - event.target.getBoundingClientRect().top) / event.target.offsetHeight) * 2 + 1, 0.5);
            var raycaster = new THREE.Raycaster(); //新建一个Raycaster对象,获取场景里面的物体,更方便的使用鼠标来操作3D场景。
            raycaster.setFromCamera(mouse, camera); //从相机发射一条射线，经过鼠标点击位置
            var intersects = raycaster.intersectObjects(arr); //计算射线相机到的对象，可能有多个对象，因此返回的是一个数组，按离相机远近排列
            if (intersects.length > 0) {
                var currObj = intersects[0].object; /*当前点击方块*/
                uId = currObj.userData.uId;
            }
        } else {
            uId = u_Id;
        }
        for (var i = 0; i < arr.length; i++) {
            if (uId === arr[i].userData.uId) {
                arr[i].material.color.setHex(0xacdcdc);
                arr[i].children[0].material.color.setHex(0x5dbdbc);
            } else {
                arr[i].material.color.setHex(0x5dbdbc);
                arr[i].children[0].material.color.setHex(0x4B9998);
            }
        }
        var r = $("#r").val(),
            f = $("#f").val(),
            m = $("#f").val();
        if (uId) {
            location.href = "/html/userGroup?userType=" + uId + "&r=" + r + "&f=" + f + "&m=" + m;
        }
    }
    //刻度
    var scale = function scale(ele, marginL, minW) {
        for (var _len = arguments.length, words = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
            words[_key - 3] = arguments[_key];
        }

        for (var i = 0; i < 6; i++) {
            var div_ele = "<div class=\"scale\" style=\"left: " + i * 20 + "%\">\n                                    <b data-index=\"" + i + "\" class=\"" + (i === 3 ? 'active' : '') + "\" style=\"margin-left: " + marginL + "px;min-width: " + minW + "px;\">" + words[i] + "</b>\n                                </div>";
            $(ele).append($(div_ele));
        }
    };
    scale($(".rangeBox:eq(0)"), -15, 30, "3天", "5天", "一周", "两周", "三周", "五周");
    scale($(".rangeBox:eq(1)"), -25, 50, "1次/月", "2次/月", "3次/月", "4次/月", "5次/月", "6次/月");
    scale($(".rangeBox:eq(2)"), -15, 30, "0.1万", "0.3万", "0.7万", "1万", "3万", "5万");
});
function myChange(e) {
    var currenVal = +e.value;
    var dataType = $(e).attr("data-type");
    var bList = $(e).siblings(".scale").find("b");
    for (var i = 0; i < bList.length; i++) {
        if (Number($(bList[i]).attr("data-index")) === currenVal) {
            $(bList[i]).addClass("active");
        } else {
            $(bList[i]).removeClass("active");
        }
    }
}