/*菜单结构*/
exports.getMenu = () => {
    let menus = {
        index: {
            id:1,
            name: "首页",
            interface: "/html/index",
            chosen: false,
            children: false
        },
        brandLib: {
            id:2,
            name: "品牌库",
            chosen: false,
            children: {
                brandLib: {
                    id:3,
                    name: "品牌库",
                    chosen: false,
                    interface: "/html/brandLib"
                },
                brandRelation: {
                    id:4,
                    name: "品牌关联图",
                    chosen: false,
                    interface: "/html/brandRelation"
                },
                brandList: {
                    id:5,
                    name: "品牌列表",
                    chosen: false,
                    interface: "/html/brandList"
                },
                brandSale: {
                    id:6,
                    name: "品牌销量统计",
                    chosen: false,
                    interface: "/html/brandSale"
                },
                /*新增推荐设置*/
                recommendSet: {
                    id:7,
                    name: "推荐设置",
                    chosen: false,
                    interface: "/html/recommendSet"
                }
            }
        },
        userLib: {
            id:8,
            name: "用户库",
            chosen: false,
            children: {
                userLib: {
                    id:9,
                    name: "用户库",
                    chosen: false,
                    interface: "/html/userLib"
                },
                userAnalysis: {
                    id:10,
                    name: "用户RFM分析",
                    chosen: false,
                    interface: "/html/userAnalysis"
                },
                userList: {
                    id:11,
                    name: "用户列表",
                    chosen: false,
                    interface: "/html/userList"
                }
            }
        },
        operateLog: {
            id:12,
            name:"操作日志",
            interface: "/html/operateLog",
            chosen: false,
            children: false
        },
        systemManage: {
            id:13,
            name: "系统管理",
            chosen: false,
            children: {
                userManage: {
                    id:14,
                    name: "用户管理",
                    chosen: false,
                    interface: "/html/userManage"
                },
                resourceManage: {
                    id:15,
                    name: "资源管理",
                    chosen: false,
                    interface: "/html/resourceManage"
                },
                roleManage: {
                    id:16,
                    name: "角色管理",
                    chosen: false,
                    interface: "/html/roleManage"
                }
            }
        }
    };

    return menus;
};
