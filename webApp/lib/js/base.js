const server_api = "/api",
    server_html = "/html",
    color_formats = ["#10D5EB", "#50F7A7", "#4D576D", "#E80400", "#FF5F2B", "#FAAF66", "#c47016", "#4857EF", "#488FEF", "#6BB8F3", "#0FBBC5", "#47E336", "#CAD642", "#E6BC48"];
$.extend({
    /*设置页面框架宽高*/
    setPageSize: function () {
        var window_width = window.innerWidth,
            window_height = window.innerHeight,
            menu_width = $("#menu-bar").width(),
            /*屏幕宽度小于768,不显示菜单栏*/
            width = window_width < 768 ? "100%" : window_width - menu_width;

        $("#content,#header").width(width);
        $("#content>#container").height(window_height - 90);
        $("#page").height(window_height);
    },
    /*模态窗*/
    tipsModal: function tipsModal(_ref) {
        var title = _ref.title,
            content = _ref.content,
            _ref$confirm_text = _ref.confirm_text,
            confirm_text = _ref$confirm_text === undefined ? '确认' : _ref$confirm_text,
            confirm_callback = _ref.confirm_callback,
            cancel_callback = _ref.cancel_callback,
            cancel_text = _ref.cancel_text,
            showBtn = _ref.showBtn === undefined ? true : _ref.showBtn;

        //页面已存在提示窗,不允许重复调用
        if ($(".pop-shadow").length > 0) $(".pop-shadow").remove();

        //dom结构
        var tips = "<div class=\"pop-shadow\"><div class=\"tips-pop\">\n            <p class=\"tips-title\">" + title + "</p>\n            <div class=\"tips-content\">\n            <div class=\"tips-text\"><p>" + content + "</div>\n            <div class=\"tips-button\">";

        if (showBtn) tips += "<div class=\"tips-btn confirm\">" + confirm_text + "</div>";
        //用户指定了合法的取消按钮文字内容,则显示取消按钮
        if (cancel_text) {
            tips += "<div class=\"tips-btn cancel\">" + cancel_text + "</div></div></div></div></div>";
        } else {
            tips += "</div></div></div></div>";
        }

        //加入页面
        $("body").append(tips);

        function confirmClick() {
            //确认有回调函数,执行回调
            if (confirm_callback && Object.prototype.toString.call(confirm_callback) === '[object Function]') {
                confirm_callback();
            }
            //移除弹窗
            $(".pop-shadow").remove();
        }

        function cancelClick() {
            //取消有回调函数,执行回调
            if (cancel_callback && Object.prototype.toString.call(cancel_callback) === '[object Function]') {
                cancel_callback();
            }
            //移除弹窗
            $(".pop-shadow").remove();
        }

        //点击确认按钮执行回调(如有)并移除弹窗
        $(".tips-pop .confirm").click(confirmClick);
        //点击取消按钮移除提示窗
        $(".tips-pop .cancel").click(cancelClick);

        return {
            confirmClick: confirmClick,
            cancelClick: cancelClick
        };
    },
    /*退出登录*/
    logout: function logout() {
        var that = this,
            modal = that.showLoading();
        $.ajax({
            url: server_api + "/logout",
            type: "post",
            success: function (res) {
                modal.cancelClick();
                if (res.errcode) {
                    return res.errcode === -1 ?
                        that.loginExpired() :
                        that.requestError(res.errmsg);
                }
                //退出登录成功
                else {
                    that.tipsModal({
                        title: "提示",
                        content: "退出成功!",
                        confirm_callback: function () {
                            location.href = server_html + "/login";
                        }
                    });
                }
            },
            error: function (err) {
                modal.cancelClick();
                that.requestError(err);
            }
        });
    },
    /*加载弹窗*/
    showLoading: function showLoading() {
        return this.tipsModal({
            title: "提示",
            content: "<div><img src='../../image/loading.gif'></div><div>Loading...</div>",
            showBtn: false
        });
    },
    /*请求发生错误*/
    requestError: function requestError(err) {
        this.tipsModal({
            title: "提示",
            content: "<div>" + err ? err : '请求失败!' + "</div>"
        });
    },
    /*登录已过期*/
    loginExpired: function loginExpired(interval, inter) {
        this.tipsModal({
            title: "请求失败!",
            content: "登录已过期,请重新登录!",
            confirm_callback: function confirm_callback() {
                location.href = server_html + "/";
            }
        });
        return interval ? interval.cancel(inter) : null;
    },
    /*获取url中的参数*/
    getUrlParams: function getUrlParams(url) {
        var search = url.search.substr(1).split("&"),
            params = {};
        for (var i = 0; i < search.length; i++) {
            var arr = search[i].split("=");
            params[decodeURI(arr[0])] = decodeURI(arr[1]);
        }
        return params;
    },
    /*品牌链----品牌是否已存在在该条链中*/
    isExist: function isExist(webkitDep_new, node, source, recommend, chainNode, chainLink) {
        /*nodes中是否已存在该品牌节点*/
        var isExist = webkitDep_new.nodes.filter(function (item) {
                return item.nodeId === node.nodeId;
            }),
            new_id;
        /*该品牌节点不存在于nodes中*/
        if (!isExist.length) {
            /*
             * 重置node并将其添加到nodes
             * */
            webkitDep_new.nodes.push({
                nodeId: node.nodeId,
                name: node.name,
                value: node.value,
                brand_code: node.brand_code,
                code: node.code,
                category: node.category,
                composite:node.composite
            });
            /*
             * 品牌链nodes分组
             * */
            chainNode.push({
                nodeId: node.nodeId,
                name: node.name,
                value: node.value,
                brand_code: node.brand_code,
                code: node.code,
                category: node.category,
                composite:node.composite
            });
            /*品牌新id*/
            new_id = webkitDep_new.nodes.length - 1;
            /*
             * 品牌链links分组
             * */
            chainLink.push({
                source: source,
                target: new_id,
                recommend: recommend
            });
            //webkitDep_new.links.push({source:source,target:new_id,recommend:recommend});
        } else {
            //该品牌已存在,找出其现在的新id
            webkitDep_new.nodes.filter(function (item, index) {
                if (item.nodeId === node.nodeId) {
                    //webkitDep_new.links.push({source:source,target:index,recommend:recommend});
                    new_id = index;
                }
            });
        }
        webkitDep_new.links.push({source: source, target: new_id, recommend: recommend});
        return new_id;
    },
    /*品牌链----寻找下一个关联品牌*/
    find_next: function find_next(ori_data, webkitDep_new, start_id, chainLength, new_id_p, chainNode, chainLink) {
        /*筛选出当前寻址品牌推荐的品牌 */
        var ori_links = ori_data.links,
            nodes_l = ori_data.nodes.length,
            child_nodes = ori_links.filter(function (item) {
                return item.target < nodes_l && item.source == start_id;
            }),
            node,
            the_one;
        /*按推荐指数从高到低排序*/
        child_nodes = child_nodes.sort(function (a, b) {
            return b.recommend - a.recommend;
        });
        /*
         * 如果当前链已超过规定品牌数或该品牌无推荐品牌,停止向下寻找
         * */
        if (chainLength > 0 && child_nodes.length > 0) {
            var find_id, recommend;
            the_one = child_nodes[0];
            recommend = the_one.recommend;
            node = ori_data.nodes[the_one.target];
            /*nodes中是否已存在该品牌节点*/
            find_id = this.isExist(webkitDep_new, node, new_id_p, recommend, chainNode, chainLink);
            this.find_next(ori_data, webkitDep_new, the_one.target, --chainLength, find_id, chainNode, chainLink);
        } else {
            return false;
        }
    },
    /*品牌链----选择主品牌*/
    /*
     * params data : 原始数据
     * params params : 选择品牌id
     * params chain_length : 截取最大品牌链数量
     * params chain_start : 品牌链开始位置
     * params callback : 回调函数
     * */
    chooseMainBrand: function chooseMainBrand(data, params, chain_length, callback) {
        var ori_data = data,
            ori_links = ori_data.links,
            nodes_l = ori_data.nodes.length,
            choose_nodeId = params;
        var choose_id = -1,
            choose_name = "";
        /*获取品牌index及品牌名称*/
        for (var k = 0; k < nodes_l; k++) {
            "use strict";
            var item = ori_data.nodes[k];
            if (item.nodeId === +choose_nodeId) {
                choose_id = k;
                choose_name = item.name;
                break;
            }
        }
        if (choose_id === -1 || !choose_name) {
            this.tipsModal({
                title: "提示",
                content: "品牌未找到!"
            });
            return false;
        }
        /*
         *筛选出当前选择品牌推荐的子品牌
         * */
        var child_nodes = ori_links.filter(function (item) {
            return item.target < nodes_l && item.source == choose_id;
        });

        /*
         * 按推荐指数从高到低排序
         * */
        child_nodes = child_nodes.sort(function (a, b) {
            return b.recommend - a.recommend;
        });
        /*
         * 取前五
         * */
        (!chain_length.length) ? chain_length = [] : ""; //添加默认值
        var child_fifth = child_nodes.slice(chain_length[0] || 0, chain_length[1] || 5),
            node0 = ori_data.nodes[choose_id],
            chains_arr = [];

        //初始化新数据
        var webkitDep_new = {
            categories: ori_data.categories,
            links: [],
            nodes: [{
                nodeId: node0.nodeId,
                name: node0.name,
                value: node0.value,
                brand_code: node0.brand_code,
                code: node0.code,
                category: node0.category,
                composite:node0.composite
            }]
        };
        /*
         * 寻找推荐链
         * */
        for (var i = 0; i < child_fifth.length; i++) {
            var start_id = child_fifth[i].target, //当前寻址id
                recommend = child_fifth[i].recommend,
                node = ori_data.nodes[start_id],
                find_id,
                chainLink = [], ///*品牌链分组links*/
                chan = 4; //单链长度默认为5

            /*初始化chainNode*/
            var chainNode = [{  ///*品牌链分组nodes*/
                nodeId: node0.nodeId,
                name: node0.name,
                value: node0.value,
                brand_code: node0.brand_code,
                code: node0.code,
                category: node0.category,
                composite:node0.composite
            }];
            /*node是否已存在*/
            find_id = $.isExist(webkitDep_new, node, 0, recommend, chainNode, chainLink);
            /* 向下寻找推荐品牌*/
            this.find_next(ori_data, webkitDep_new, start_id, chan, find_id, chainNode, chainLink);
            /*品牌链大于1(即不只有主品牌)*/
            if (chainNode.length > 1) {
                chains_arr.push({
                    categories: ori_data.categories,
                    links: chainLink,
                    nodes: chainNode
                });
            }
        }
        /*调用回调函数*/
        callback(webkitDep_new, chains_arr);
    },
    /*初始化bootstrap的下拉菜单组件,添加输入功能*/
    initDropDownMenu: function initDropDownMenu() {
        //对bootstrap的输入框组件添加功能
        $(".btn-group .dropdown-menu>li").click(function () {
            var value = $(this).attr("data-value"),
                text = $(this).text(),
                inputGroup = $(this).parentsUntil(".btn-group").parent();

            inputGroup.find(".text-container").text(text);
            inputGroup.find(".hidden").val(value).change();
        });
    },
    /*bootstrap的下拉菜单组件,添加清除功能*/
    bindClearDropDownMenu: function bindClearDropDownMenu() {
        $(".btn-group .clear").click(function () {
            $(this).parent().find(".text-container").text("");
            $(this).parent().find(".hidden").val("").change();
        });
        /*清除联动属性*/
        $(".btn-group.retail .clear").click(function () {
            $(".btn-group.init .text-container").text("");
        });
    },
    /*
     * params c_name:string cookie name
     * params  value:string cookie value
     * params  expiredays:time(ms) cookie expire time
     * */
    setCookie: function setCookie(c_name, value, expiretimes) {
        /*支持localStorage*/
        if (localStorage) {
            localStorage.setItem(c_name, value);
        }
        /*不支持localStorage,使用cookie*/
        else {
            var exdate = new Date();
            exdate.setTime(exdate.getTime() + expiretimes);
            document.cookie = c_name + "=" + escape(value) +
                ((expiretimes == null) ? "" : ";expires=" + exdate.toGMTString());
        }
    },
    /*
     * params c_name:string
     * */
    getCookie: function getCookie(c_name) {
        /*支持localStorage*/
        var str = "";
        if (localStorage) {
            str = unescape(localStorage.getItem(c_name));
            return str === "null" ? "" : str;
        }
        /*不支持localStorage,使用cookie*/
        else {
            if (document.cookie.length > 0) {
                var c_start = document.cookie.indexOf(c_name + "=");
                if (c_start != -1) {
                    c_start = c_start + c_name.length + 1;
                    var c_end = document.cookie.indexOf(";", c_start);
                    if (c_end == -1) c_end = document.cookie.length;
                    str = unescape(document.cookie.substring(c_start, c_end));
                    return str === "null" ? "" : str;
                }
            }
        }
        return "";
    },
    /*
     * params arr:[]
     * */
    getMin: function getMin(arr) {
        if (Object.prototype.toString.call(arr) !== "[object Array]") return false;
        return arr.sort(function (a, b) {
            return a - b;
        })[0];
    },
    /*
     * params arr:[]
     * */
    getMax: function getMax(arr) {
        if (Object.prototype.toString.call(arr) !== "[object Array]") return false;
        return arr.sort(function (a, b) {
            return b - a;
        })[0];
    },
    /*
     * params validList:[
     *       {name:"",value:"",except:[{name:"",value:""}
     *   ]}]
     * */
    isValid: function isValid(validList) {
        var rt = true;
        for (var k = 0; k < validList.length; k++) {
            var inputName = validList[k].name,
                inputValue = validList[k].value,
                except = validList[k].except;
            //参数非法,返回验证失败
            if (!except || except.length <= 0) return false;
            //验证条件
            for (var i = 0; i < except.length; i++) {
                var validName = except[i].name,
                    exceptValue = except[i].value;
                switch (validName) {
                    /*验证数据是否非空*/
                    case "necessary" : {
                        rt = inputValue !== undefined && inputValue !== null && inputValue !== "";
                    }
                        break;
                    /*验证正则表达式*/
                    case "exp" : {
                        rt = inputValue.match(exceptValue) !== null;
                    }
                        break;
                    /*验证数据类型是否是指定类型*/
                    case "type" : {
                        rt = Object.prototype.toString.call(inputName) !== "[object " + validName + "]";
                    }
                        break;
                    /*验证数据是否在指定范围*/
                    case "range" : {
                        rt = (+inputValue && +inputValue >= this.getMin(exceptValue) &&
                            +inputValue <= this.getMax(exceptValue));
                    }
                        break;
                    default : {
                        rt = inputValue !== undefined && inputValue !== null && inputValue !== "";
                    }
                }
                /*输入非法,提示并退出循环*/
                if (!rt) {
                    this.tipsModal({
                        title: "输入非法!",
                        content: "请输入正确的" + inputName
                    });
                    return rt;
                }
            }
        }
        return rt;
    },
    /*获取本地json文件*/
    getJsonStatic: function getJsonStatic(name) {
        var resText = null;
        $.ajax({
            type: "get",
            async: false,
            url: "/data-static/" + name + ".json",
            success: function (res) {
                resText = res;
            },
            error: function (err) {
                resText = new Error("获取失败!");
            }
        });
        return resText;
    },
    /*模拟echarts提示框组件*/
    echartsTooltip: function echartsTooltip(params) {
        var axis_name = params[0].name || "",
            str = axis_name;
        for (var i = 0; i < params.length; i++) {
            /*参数值做处理*/
            var value = (function () {
                    if (params[i].value) {
                        if (params[i].value.length && params[i].value.length === 2) {
                            return params[i].value[1];
                        } else return params[i].value;
                    } else return 0;
                }()),
                //*是否显示百分号*/
                is_percent = (params[i].seriesName.match("比例") ||
                    params[i].seriesName.match("占比") ||
                    params[i].seriesName.match("指数") ||
                    params[i].seriesName.match("率")) ? "%" : "";

            str += "<br /><span class='echarts-tooltip-dotted' style='background-color: " + (params[i].color || '#000') + "'>" +
                "</span>" + (params[i].seriesName || '无') + " : " + value + is_percent;
        }
        return str;
    },
    /*angular $http.post*/
    $http_post: function $http_post(params) {
        var that = this;
        params.http.post(server_api + params.url, params.data).then(
            res => {
                /*如有提示弹窗,关闭*/
                if (params.modal) params.modal.cancelClick();
                "use strict";
                //服务器返回失败
                if (res.data.errcode) {
                    return res.data.errcode === -1 ?
                        that.loginExpired() :
                        that.requestError(res.data.errmsg);
                } else {
                    params.callback(res);
                    if (params.canvasDom) params.canvasDom.hideLoading();
                }
            },
            err => {
                "use strict";
                /*如有提示弹窗,关闭*/
                if (params.modal) params.modal.cancelClick();
                else if (params.canvasDom) params.canvasDom.hideLoading();
                /*显示请求失败弹窗*/
                that.requestError();
            }
        );
    },
    /*获取品牌编码所代表属性名称*/
    getNameOfList: function getRetail(c_brand_code, json_name, pos) {
        "use strict";
        let name = '未知';
        if (c_brand_code) {
            let code = c_brand_code.substr(pos[0], pos[1]);
            /*获取属性名称(同步)*/
            $.getJsonStatic(json_name).map(item => {
                if (item.value == code) {
                    name = item.name;
                }
            });
        }
        return name;
    },
    /*获取关联属性*/
    getNameOfSecondary: function getNameOfSecondary(c_brand_code) {
        "use strict";
        let name_price = "未知",
            name_distinct = "未知";
        if (c_brand_code) {
            let retail_code = c_brand_code.substr(0, 2),//品牌业态
                code_price = c_brand_code.substr(5, 1), //品牌均价
                code_distinct = c_brand_code.substr(6, 2), //品牌区分属性
                typeList = $.getJsonStatic("typeList");
            /*品牌均价*/
            typeList[retail_code]["av-price"].map(item => {
                if (item.value == code_price) {
                    name_price = item.name;
                }
            });
            /*品牌区分属性*/
            typeList[retail_code]["distinction"].map(item => {
                if (item.value == code_distinct) {
                    name_distinct = item.name;
                }
            });
        }
        return [name_price, name_distinct];
    },
    /*重新计算业态*/
    newWebkitDep: function newWebkitDep(webkitDep) {
        var nodes = webkitDep.nodes,
            retails = webkitDep.categories,
            rt = [],
            index = 0, //*新业态索引*/
            new_nd = [], //new nodes
            new_rt = []; //new retail
        for (var i = 0; i < retails.length; i++) {
            rt[i] = {id: i, new_id: -2};
            /*默认不存在该业态*/
            for (var k = 0; k < nodes.length; k++) {
                /*复制node*/
                if (!new_nd[k]) new_nd[k] = JSON.parse(JSON.stringify(nodes[k]));

                /*存在该业态*/
                if (nodes[k].category === i) {
                    if (rt[i].new_id === -2) {
                        rt[i].new_id = index;
                        index += 1;
                    }
                    new_nd[k].category = rt[i].new_id;
                }
            }
        }
        rt.forEach(function (item) {
            if (item.new_id >= 0) {
                new_rt.push({name: retails[item.id].name});
            }
        });
        return {
            categories: new_rt,
            nodes: new_nd,
            links: webkitDep.links
        };
    },
    /*菜单栏打开箭头向下，收起箭头向右*/
    arrowIcon(el) {
        let $div = $(el).find(".panel-collapse.collapse"),
            $img = $div.prev().find("a[role='button']").find("img"),
            $otherImg = $(el).siblings().find(".panel-collapse.collapse").prev().find("a[role='button']").find("img");
        if (!$div.hasClass("in")) {
            $img.css("transform", "rotate(90deg)");
            $otherImg.css("transform", "rotate(0deg)");
        } else {
            $img.css("transform", "rotate(0deg)");
        }
    }
});

$.fn.extend({
    //对bootstrap的输入框组件添加功能
    initDropDownMenu: function initDropDownMenu() {
        this.find("li").click(function () {
            var value = $(this).attr("data-value"),
                text = $(this).text(),
                inputGroup = $(this).parentsUntil(".btn-group").parent();

            inputGroup.find(".text-container").text(text);
            inputGroup.find(".hidden").val(value).change();
        });
    }
});


//打开当前菜单栏
$("#menu-bar .nav .current-page .collapse").addClass("in");

/*需在页面完成加载时初始化的内容*/
$(function () {
    window.onresize = function () {
        $.setPageSize();
    };
    $.setPageSize();

    /*初始化下拉菜单位置*/
    $(".btn-group .dropdown-menu").each(function () {
        var bt_l = $(this).parent().find(".btn")[0].offsetLeft,
            bt_t = $(this).parent().find(".btn")[0].offsetTop;
        $(this).css("left", bt_l);
        $(this).siblings(".clear").css({"left": bt_l + 140, "top": bt_t});
    });
    $(".btn-group .clear").click(function () {
        $(this).parent().find(".text-container").text("");
        $(this).parent().find(".hidden").val("").change();
    });
    /*初始化bootstrap的下拉菜单组件,添加输入功能*/
    $.initDropDownMenu();
    /*input-group组件清空功能*/
    $.bindClearDropDownMenu();
    /*返回按钮*/
    $("#map .back").on("click", function () {
        "use strict";
        history.back();
    });
    /*显示个人中心下拉菜单*/
    $("#header .admin,#header-xs .admin").mouseenter(function () {
        var list = $(this).find(".admin-list li"),
            height = 0;
        for (var i = 0; i < list.length; i++) {
            height += list[i].offsetHeight;
        }
        $(this).addClass("active").find(".admin-list").css({"height": height + "px"});
        /*待本轮事件循环完成时绑定隐藏下拉菜单事件*/
        /*已弃用*/
        //setTimeout(function () {
        //    $("#header .admin,#header-xs .admin").click(function bodyClick(e) {
        //        var parents = $(e.target).parentsUntil("#header");
        //        /*阻止冒泡*/
        //        if($(parents).hasClass("admin")) return ;
        //        /*隐藏下拉菜单*/
        //        $("#header .admin-list").css({"height":"0"});
        //        /*待动画完成后移除class---active*/
        //        setTimeout(function () {
        //            $("#header .admin").removeClass("active");
        //        },110);
        //        /*移除点击事件*/
        //        $("body").unbind("click",bodyClick);
        //    });
        //},0);
    });
    $("#header .admin,#header-xs .admin").mouseleave(function () {
        $(this).find(".admin-list").css({"height": 0});
        setTimeout(function () {
            $("#header .admin").removeClass("active");
        }, 110);
    });
});