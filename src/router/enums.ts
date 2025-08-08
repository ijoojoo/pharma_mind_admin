// 完整版菜单比较多，将 rank 抽离出来，在此方便维护
// 完整版菜单比较多，将 rank 抽离出来，在此方便维护

const home = 0, // 平台规定只有 home 路由的 rank 才能为 0 ，所以后端在返回 rank 的时候需要从非 0 开始
  chatai = 101,
  vueflow = 102,
  ganttastic = 103,
  components = 104,
  able = 105,
  table = 106,
  form = 107,
  list = 108,
  result = 109,
  error = 1010,
  frame = 1011,
  nested = 1012,
  permission = 1013,
  system = 1014,
  monitor = 1015,
  tabs = 1016,
  about = 1017,
  codemirror = 1018,
  markdown = 1019,
  editor = 1020,
  flowchart = 1021,
  formdesign = 1022,
  board = 1023,
  ppt = 1024,
  mind = 1025,
  guide = 1026,
  menuoverflow = 1027;

export {
  home,
  chatai,
  vueflow,
  ganttastic,
  components,
  able,
  table,
  form,
  list,
  result,
  error,
  frame,
  nested,
  permission,
  system,
  monitor,
  tabs,
  about,
  codemirror,
  markdown,
  editor,
  flowchart,
  formdesign,
  board,
  ppt,
  mind,
  guide,
  menuoverflow
};

export enum MenuRankEnum {
  // 首页
  HOME = 0,

  // BI分析中心
  BI_ANALYSIS = 1,

  // 运营管理中心 (我们将所有主数据管理都归于此大类下)
  OPERATIONS_MANAGEMENT = 10,
  PRODUCT_MANAGEMENT = 11,
  STORE_MANAGEMENT = 12,
  EMPLOYEE_MANAGEMENT = 13,
  MEMBER_MANAGEMENT = 14,

  // AI策略中心
  AI_STRATEGY = 20,

  // KPI考核中心
  KPI_ASSESSMENT = 30,

  // 系统管理 (通常将系统管理放在最后)
  SYSTEM_MANAGEMENT = 90,
  USER_MANAGEMENT = 91,
  ROLE_MANAGEMENT = 92,
  ENTERPRISE_ACCOUNT = 93
}
