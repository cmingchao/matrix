(function($, window, document) {
    // 定义构造函数
    function Paging(el, options) {
        this.el = el;
        this.options = {
            pageNo: options.initPageNo || 1, // 初始页码
            totalPages: options.totalPages || 1, //总页数
            totalCount: options.totalCount || '', // 条目总数
            slideSpeed: options.slideSpeed || 0, // 缓动速度
            jump: options.jump || false, // 支持跳转
            liWidth:options.liWidth || 34,
            callback: options.callback || function() {}, // 回调函数
            callback_prev: options.callback_prev, // 上一页回调函数
            callback_next: options.callback_next // 下一页回调函数
        };
        this.init();
    }
    // 给实例对象添加公共属性和方法
    Paging.prototype = {
        constructor: Paging,
        init: function() {
            this.createDom();
            this.bindEvents();
        },
        createDom: function() {
            var that = this,
                ulDom = '',
                jumpDom = '',
                content = '',
                liWidth = this.options.liWidth, // li的宽度
                totalPages = that.options.totalPages, // 总页数
                wrapLength = 0;
            totalPages > 5 ? wrapLength = 5 * liWidth : wrapLength = totalPages * liWidth;
            for (var i = 1; i <= that.options.totalPages; i++) {
                i != 1 ? ulDom += '<li>' + i + '</li>' : ulDom += '<li class="sel-page">' + i + '</li>';
            }
            that.options.jump ? jumpDom = '<input type="text" placeholder='+totalPages+' class="jump-text jumpText">' : jumpDom = '';
            content = '<button class="turnPage prePage">&nbsp;</button>' +
                '<div class="pageWrap" style="width:' + wrapLength + 'px">' +
                '<ul class="pageSelect" style="transition:all ' + that.options.slideSpeed + 'ms">' +
                ulDom +
                '</ul></div>' +
                '<button class="turnPage nextPage">&nbsp;</button>' +
                jumpDom;
            that.el.html(content);
        },
        bindEvents: function() {
            var that = this,
                pageSelect = this.el.find('.pageSelect'), // ul
                lis = pageSelect.children(), // li的集合
                liWidth = this.options.liWidth, // li的宽度
                totalPages = that.options.totalPages, // 总页数
                pageIndex = that.options.pageNo, // 当前选择的页码
                distance = 0, // ul移动距离
                prePage = this.el.find('.prePage'),
                nextPage = this.el.find('.nextPage'),
                firstPage = this.el.find('.firstPage'),
                lastPage = this.el.find('.lastPage'),
                jumpBtn = this.el.find('.jumpBtn'),
                jumpText = this.el.find('.jumpText');

            prePage.on('click', function() {
                pageIndex--;
                if (pageIndex < 1) {
                    console.log(pageIndex,"in");
                    $.tipsModal({
                        title:"提示",
                        content:"已经是第一页了!"
                    });
                    pageIndex = 1;
                }
                handles(pageIndex);
            });

            nextPage.on('click', function() {
                pageIndex++;
                if (pageIndex > lis.length) {
                    $.tipsModal({
                        title:"提示",
                        content:"已经是最后一页了!"
                    });
                    pageIndex = lis.length;
                }
                handles(pageIndex);
            });

            jumpText.on('change', function() {
                var jumpNum = parseInt(jumpText.val().replace(/\D/g, ''));
                if (jumpNum && jumpNum >= 1 && jumpNum <= totalPages) {
                    pageIndex = jumpNum;
                    handles(pageIndex);
                    jumpText.val(jumpNum);
                }else{
                    $.tipsModal({
                        title:"提示",
                        content:"输入页码非法,请重新输入!"
                    });
                }
            });

            lis.on('click', function() {
                pageIndex = $(this).index() + 1;
                handles(pageIndex);
            });

            function handles(pageIndex) {
                lis.removeClass('sel-page').eq(pageIndex - 1).addClass('sel-page');
                if (totalPages <= 5) {
                    that.options.callback(pageIndex);
                    return false;
                }
                if (pageIndex >= 3 && pageIndex <= totalPages - 2) distance = (pageIndex - 3) * liWidth;
                if (pageIndex == 2 || pageIndex == 1) distance = 0;
                if (pageIndex > totalPages - 2) distance = (totalPages - 5) * liWidth;
                pageSelect.css('transform', 'translateX(' + (-distance) + 'px)');
                pageIndex == 1 ? firstPage.attr('disabled', true) : firstPage.attr('disabled', false);
                pageIndex == 1 ? prePage.attr('disabled', true) : prePage.attr('disabled', false);
                pageIndex == totalPages ? lastPage.attr('disabled', true) : lastPage.attr('disabled', false);
                pageIndex == totalPages ? nextPage.attr('disabled', true) : nextPage.attr('disabled', false);
                that.options.callback(pageIndex);
            }

            handles(that.options.pageNo); // 初始化页码位置
        }
    };
    $.fn.paging = function(options) {
        return new Paging($(this), options);
    }
})(jQuery, window, document);